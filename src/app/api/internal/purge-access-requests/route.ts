import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { purgeExpired } from "@/lib/access-retention";

// Never cache, never prerender: this is a mutation behind a secret.
export const dynamic = "force-dynamic";

const BEARER = /^Bearer (.*)$/;

/** SHA-256 turns any input into 32 bytes, so `timingSafeEqual` never sees unequal lengths. */
function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/**
 * Constant-time check of the presented bearer token against `PURGE_SECRET`.
 *
 * Both sides are hashed first: `timingSafeEqual` throws on buffers of different
 * length (a wrong-length token would be a 500, and a length oracle). An unset
 * or empty secret never matches — otherwise a missing header, which also
 * presents as the empty string, would be authorised on an unconfigured
 * deployment.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env["PURGE_SECRET"];
  if (!secret) return false;
  const match = BEARER.exec(request.headers.get("authorization") ?? "");
  if (!match) return false;
  return timingSafeEqual(digest(match[1] ?? ""), digest(secret));
}

/**
 * Physical deletion of expired access requests and invites (#29 §4.6). Called
 * hourly by `.github/workflows/purge-access-requests.yml`. Expiry is enforced
 * at read time regardless; this only reclaims rows. Idempotent. The response
 * carries counts only, so the workflow log holds no PII.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return new NextResponse(null, { status: 401 });
  }
  try {
    const deleted = await purgeExpired();
    return NextResponse.json({ deleted });
  } catch (error) {
    // Name only: a Prisma error message can echo row data. Status 500 fails
    // the workflow run, which is the point.
    console.error("[purge-access-requests] purge failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return new NextResponse(null, { status: 500 });
  }
}

export function GET(): NextResponse {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
