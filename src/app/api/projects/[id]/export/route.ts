import { NextResponse, type NextRequest } from "next/server";

import { json, jsonError, notFoundError, requireProjectMembership, unauthorized } from "@/lib/api";
import { requireUser } from "@/lib/auth-guard";
import { getLatestMigration, prisma } from "@/lib/db";
import {
  EXPORT_ROW_CAP,
  accessStillHolds,
  buildExport,
  exportFilename,
  serializeExport,
} from "@/lib/export/project-export";
import { rateLimiter } from "@/lib/rate-limit";

import pkg from "../../../../../../package.json";

/**
 * GET /api/projects/[id]/export — everything the project holds, as one JSON
 * file (#139; spec `docs/specs/pre-alpha-project-export`, §3).
 *
 * Order matters and is the security argument: session, rate limit, membership,
 * and only then a read of project data. Every refusal of the membership step
 * (no such project, not a member, soft-deleted) is the same 404, byte for byte.
 */

/** Serialising and streaming a large project can outlive the platform default. */
export const maxDuration = 60;

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60_000;
const CHUNK_BYTES = 64 * 1024;

type RouteContext = { params: Promise<{ id: string }> };

/** A bare 5xx: no body, so no failure detail, query text or row content can leak. */
function serverError(): NextResponse {
  return new NextResponse(null, { status: 500, headers: { "Cache-Control": "no-store" } });
}

/** The finished bytes as a stream. All of them exist before the first one is sent (D7). */
function streamOf(bytes: Uint8Array): ReadableStream<Uint8Array> {
  let offset = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.byteLength) {
        controller.close();
        return;
      }
      const end = Math.min(offset + CHUNK_BYTES, bytes.byteLength);
      controller.enqueue(bytes.subarray(offset, end));
      offset = end;
    },
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  // 1. Session. The middleware answers anonymous /api/* first, but its matcher
  // skips dotted paths (P6), so this is not redundant.
  const user = await requireUser();
  if (!user) return unauthorized();

  const { id: projectId } = await context.params;

  // 2. Rate limit. Called directly rather than through `checkRateLimit`, which
  // fails closed for the auth routes. The limit guards cost, the membership
  // check below is the security boundary, so an unreachable limiter degrades
  // open (D6): proceed, and say so once.
  const limit = await rateLimiter.check(`export:${user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (limit.degraded) {
    console.warn("[export] rate limiter unavailable, proceeding", {
      userId: user.id,
      projectId,
    });
  } else if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000);
    return json(
      { error: { code: "RATE_LIMITED", details: { retryAfter } } },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  // 3. Membership (any role, VIEWER included) and a live project. One 404 for
  // every refusal, and nothing about the project is read before it passes (X3).
  if (!(await requireProjectMembership(user.id, projectId))) return notFoundError();
  const live = await prisma.project.findFirst({
    where: { id: projectId, deleted_at: null },
    select: { id: true },
  });
  if (!live) return notFoundError();

  try {
    const schemaMigration = await getLatestMigration().catch(() => null);
    const exportedAt = new Date();

    // 4. One snapshot: every read sees the same moment (X4). `buildExport` gets
    // the callback's own `tx`; a read through `prisma` would leave the snapshot.
    // The checks above ran outside it, so they are repeated as its first read.
    const result = await prisma.$transaction(
      async (tx) => {
        if (!(await accessStillHolds(tx, user.id, projectId)))
          return { kind: "not_found" } as const;
        return buildExport(tx, projectId, { exportedAt, appVersion: pkg.version, schemaMigration });
      },
      { isolationLevel: "RepeatableRead", timeout: 20_000 },
    );

    if (result.kind === "not_found") return notFoundError();
    if (result.kind === "too_large") {
      return jsonError(413, "EXPORT_TOO_LARGE", {
        message:
          `This project holds more than ${EXPORT_ROW_CAP.toLocaleString("en-US")} rows, ` +
          "which is more than a single export can carry. Please contact the operator.",
        details: { limit: EXPORT_ROW_CAP },
      });
    }

    // 5. Serialise everything first, so a failure is a 5xx and cannot follow a
    // `200`; then stream the finished bytes with an exact Content-Length (D7).
    const bytes = serializeExport(result.document);

    // 6. Ids and counts only.
    console.info("[export]", { userId: user.id, projectId, rows: result.document.counts });

    return new Response(streamOf(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFilename(result.document.project.name, exportedAt)}"`,
        "Cache-Control": "no-store",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (error) {
    // Name and ids only: the message of a Prisma or serialisation error can
    // carry query text or row content.
    console.error("[export] failed", {
      userId: user.id,
      projectId,
      error: error instanceof Error ? error.name : "unknown",
    });
    return serverError();
  }
}
