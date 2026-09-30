import { Redis } from "@upstash/redis";

import { sessionRevocationKey } from "./session-revocation-key";

/** `authConfig.session.maxAge`: the cookie lifetime the revocation floor's TTL must outlive. */
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * Margin the floor's TTL keeps beyond `SESSION_MAX_AGE_SECONDS`.
 *
 * The `EXPIRE`/`SET ... EX` calls below complete inside the `session`
 * callback, *before* Auth.js re-encodes the response and stamps the cookie's
 * new `exp`. If that encode crosses a second boundary, the cookie's expiry
 * ends up a moment later than the Redis key's — and in that end-of-life
 * window the floor has already vanished, so an otherwise-revoked token is
 * admitted (and its floor-refresh logic re-arms the same gap on every poll
 * after that). A day of margin makes that boundary-crossing race
 * unreachable in practice and costs nothing: the floor is a single Redis
 * key, and a day of extra TTL on it is not a meaningful resource. Do not
 * "simplify" this back to exactly `SESSION_MAX_AGE_SECONDS` — that is the
 * defect this constant fixes.
 */
const TTL_MARGIN_SECONDS = 24 * 60 * 60;

const TTL_SECONDS = SESSION_MAX_AGE_SECONDS + TTL_MARGIN_SECONDS;

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
 * Only raise the floor, never lower it, and refresh its TTL when it is
 * raised. GET-then-SET from application code would race: two near-
 * simultaneous revocations (a sign-out and a password reset for the same
 * user) can have their GETs interleave before either SET lands, so the
 * later-landing SET can still win with the smaller value. A Lua script runs
 * as a single atomic step on the Redis server, so there is no window between
 * the read and the write for a second call to land in.
 */
const RAISE_FLOOR_SCRIPT = `
local current = redis.call("GET", KEYS[1])
if current == false or tonumber(ARGV[1]) > tonumber(current) then
  redis.call("SET", KEYS[1], ARGV[1], "EX", ARGV[2])
end
return 1
`;

/**
 * Invalidate every session for `userId` issued before `atMs` (epoch
 * milliseconds) — but only if `atMs` is newer than any floor already
 * recorded. Two near-simultaneous revocations (a sign-out and a password
 * reset) can otherwise land out of order and the later write would lower the
 * floor, re-admitting sessions issued between the two instants.
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
    await redis.eval(RAISE_FLOOR_SCRIPT, [sessionRevocationKey(userId)], [atMs, TTL_SECONDS]);
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
