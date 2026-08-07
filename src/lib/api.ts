import type { ProjectRole } from "@prisma/client";
import { NextResponse } from "next/server";
import type { z } from "zod";

import { prisma } from "./db";

/**
 * Shared helpers for API route handlers.
 *
 * Every data route repeated the same five blocks: the 401 guard, the
 * `Cache-Control: no-store` literal, the `Invalid JSON` try/catch, the Zod
 * validation payload, and the project-membership check (audit X-H-a). Centralising
 * them keeps the wire format identical while removing ~300 duplicated lines and
 * giving one place to evolve the error contract (audit A-H4).
 */

const NO_STORE = { "Cache-Control": "no-store" };

/** JSON response that is never cached. Use instead of `NextResponse.json`. */
export function json<T>(
  data: T,
  init?: { status?: number; headers?: Record<string, string> },
): NextResponse {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: { ...NO_STORE, ...init?.headers },
  });
}

/**
 * Error response in the shape every route already emits: `{ error, ...extra }`.
 * `extra` carries the per-case fields (`count`, `details`, `filter_url`, …).
 */
export function jsonError(
  status: number,
  error: string,
  extra?: Record<string, unknown>,
): NextResponse {
  return json({ error, ...extra }, { status });
}

export const unauthorized = (): NextResponse => jsonError(401, "Unauthorized");
export const forbidden = (): NextResponse => jsonError(403, "Forbidden");
export const notFoundError = (error = "Not found"): NextResponse => jsonError(404, error);

/**
 * Reads and JSON-parses a request body.
 *
 * Returns a discriminated union rather than throwing so callers keep a flat
 * control flow: `if (!parsed.ok) return parsed.response;`
 */
export async function parseJsonBody(
  request: Request,
): Promise<{ ok: true; data: unknown } | { ok: false; response: NextResponse }> {
  try {
    return { ok: true, data: (await request.json()) as unknown };
  } catch {
    return { ok: false, response: jsonError(400, "Invalid JSON") };
  }
}

/**
 * Validates `body` against `schema`, emitting the standard 400 payload
 * (`{ error: "Validation failed", details: flatten() }`) on failure.
 */
export function validateBody<S extends z.ZodTypeAny>(
  schema: S,
  body: unknown,
): { ok: true; data: z.infer<S> } | { ok: false; response: NextResponse } {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError(400, "Validation failed", { details: parsed.error.flatten() }),
    };
  }
  return { ok: true, data: parsed.data as z.infer<S> };
}

/**
 * True when `userId` belongs to `projectId`.
 *
 * `roles` narrows to write-capable membership. Omitting it checks read access.
 * Call this before any cache lookup — serving a cached response ahead of the
 * check is exactly how the C1 IDOR leaked cross-tenant data.
 */
export async function requireProjectMembership(
  userId: string,
  projectId: string,
  roles?: ProjectRole[],
): Promise<boolean> {
  const membership = await prisma.userProject.findFirst({
    where: {
      user_id: userId,
      project_id: projectId,
      ...(roles ? { role: { in: roles } } : {}),
    },
    select: { id: true },
  });
  return membership !== null;
}

/** Roles allowed to mutate project data. */
export const WRITE_ROLES: ProjectRole[] = ["OWNER", "EDITOR"];
