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

/**
 * Invalidate every session for `userId` issued before `atMs` (epoch
 * milliseconds).
 *
 * Milliseconds, not seconds: the comparison in `isSessionRevoked` is strict
 * (`<`), deliberately, so that a login in the same second as a logout does
 * not revoke itself. At second precision that strictness instead lets a
 * session created and signed out within the same second survive for its
 * full lifetime — `authTime === floor` ties, and the tie favours the
 * session. Millisecond precision makes that window a millisecond instead of
 * a second.
 */
export async function revokeSessionsBefore(userId: string, atMs: number): Promise<void> {
  const redis = client();
  if (!redis) {
    console.error("[session-revocation] Redis unavailable; sign-out did not revoke", { userId });
    return;
  }
  try {
    await redis.set(sessionRevocationKey(userId), atMs, { ex: TTL_SECONDS });
  } catch (error) {
    console.error("[session-revocation] failed to write revocation floor", { userId, error });
  }
}

/**
 * True when this token was issued (`issuedAtMs`, epoch milliseconds — the
 * token's `authTime`, see `auth.config.ts`) before the user's revocation
 * floor. Fails open.
 */
export async function isSessionRevoked(
  userId: string,
  issuedAtMs: number | undefined,
): Promise<boolean> {
  if (typeof issuedAtMs !== "number" || !Number.isFinite(issuedAtMs)) {
    // `auth.config.ts`'s `jwt` callback stamps `authTime` on every token,
    // sign-in or legacy backfill (measured 2026-09-24). Its absence means an
    // assumption has broken; be loud rather than silently permissive.
    console.error("[session-revocation] token has no usable authTime; failing open", {
      userId,
      issuedAtMs,
    });
    return false;
  }
  const redis = client();
  if (!redis) return false;
  try {
    const key = sessionRevocationKey(userId);
    const floor = await redis.get<number | string>(key);
    if (floor === null || floor === undefined) return false;
    const revoked = issuedAtMs < Number(floor);
    if (revoked) {
      // Every rejected request still comes back with a re-encoded cookie
      // carrying a fresh `exp` (next-auth re-signs on every read), so a
      // client that keeps presenting a revoked token keeps that token's own
      // expiry alive indefinitely. Without this, the floor's own 30-day TTL
      // would eventually lapse while the token is still being polled, and
      // the next request after that would authenticate successfully. Refresh
      // the floor's TTL on every revoked hit so it outlives the token for as
      // long as anyone keeps presenting it; only once they stop for the full
      // TTL does the token's own `exp` stop moving too and expire naturally.
      //
      // Inside the same try/catch as the read above: a failed refresh must
      // not change the answer we already have, so it is swallowed the same
      // way — never let this throw, never let it flip `revoked` to `false`.
      try {
        await redis.expire(key, TTL_SECONDS);
      } catch (error) {
        console.error("[session-revocation] failed to refresh floor TTL", { userId, error });
      }
    }
    return revoked;
  } catch (error) {
    console.error("[session-revocation] floor unreadable; failing open", { userId, error });
    return false;
  }
}
