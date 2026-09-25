import { Redis } from "@upstash/redis";

import { sessionRevocationKey } from "./session-revocation-key";

/** Equal to `authConfig.session.maxAge`: past it, no token issued before the floor can still be valid. */
const TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Own client, env read inside the function.
 *
 * This module is imported by `auth.config.ts`, which runs in Edge middleware.
 * `src/lib/env.ts` and `src/lib/redis.ts` both touch `process.env` at module
 * scope; a throw there takes middleware down for every request, which is a
 * worse outcome than the defect this module exists to fix — and is not a
 * fail-open one. Nothing here runs at import time.
 */
function client(): Redis | null {
  const url = process.env["KV_REST_API_URL"] ?? process.env["UPSTASH_REDIS_REST_URL"];
  const token = process.env["KV_REST_API_TOKEN"] ?? process.env["UPSTASH_REDIS_REST_TOKEN"];
  if (!url || !token) return null;
  try {
    return new Redis({ url, token });
  } catch (error) {
    console.error("[session-revocation] could not construct Redis client", { error });
    return null;
  }
}

/** Invalidate every session for `userId` issued before `atSeconds` (unix seconds). */
export async function revokeSessionsBefore(userId: string, atSeconds: number): Promise<void> {
  const redis = client();
  if (!redis) {
    console.error("[session-revocation] Redis unavailable; sign-out did not revoke", { userId });
    return;
  }
  try {
    await redis.set(sessionRevocationKey(userId), atSeconds, { ex: TTL_SECONDS });
  } catch (error) {
    console.error("[session-revocation] failed to write revocation floor", { userId, error });
  }
}

/** True when this token was issued before the user's revocation floor. Fails open. */
export async function isSessionRevoked(userId: string, iat: number | undefined): Promise<boolean> {
  if (typeof iat !== "number" || !Number.isFinite(iat)) {
    // next-auth issues `iat` on every token (measured 2026-09-24). Its absence
    // means an assumption has broken; be loud rather than silently permissive.
    console.error("[session-revocation] token has no usable iat; failing open", { userId, iat });
    return false;
  }
  const redis = client();
  if (!redis) return false;
  try {
    const floor = await redis.get<number | string>(sessionRevocationKey(userId));
    if (floor === null || floor === undefined) return false;
    return iat < Number(floor);
  } catch (error) {
    console.error("[session-revocation] floor unreadable; failing open", { userId, error });
    return false;
  }
}
