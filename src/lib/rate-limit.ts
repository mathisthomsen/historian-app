import { Ratelimit } from "@upstash/ratelimit";
import type { NextResponse } from "next/server";

import { rateLimitPrefix } from "./rate-limit-key";
import { redis } from "./redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  /**
   * True when the limiter could not reach Redis and therefore denied the
   * request without actually counting it. Callers can distinguish "you hit the
   * limit" (429) from "we cannot enforce the limit right now" (503).
   */
  degraded: boolean;
}

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

/** Converts milliseconds to the Upstash Duration string format. */
function msToDuration(
  ms: number,
): `${number} ms` | `${number} s` | `${number} m` | `${number} h` | `${number} d` {
  if (ms % 86_400_000 === 0) return `${ms / 86_400_000} d`;
  if (ms % 3_600_000 === 0) return `${ms / 3_600_000} h`;
  if (ms % 60_000 === 0) return `${ms / 60_000} m`;
  if (ms % 1_000 === 0) return `${ms / 1_000} s`;
  return `${ms} ms`;
}

/**
 * Redis-backed sliding-window rate limiter via Upstash.
 *
 * `check()` itself always reports an unreachable Redis as `allowed: false,
 * degraded: true`; what to do about it is the caller's decision. The auth
 * routes go through `checkRateLimit`, which FAILS CLOSED (503): failing open
 * there silently removes brute-force and account-enumeration protection — the
 * exact window an attacker wants (audit S-M2). The project export (#139, D6)
 * calls `check()` directly and fails OPEN, because its limit only guards cost
 * and the membership check is its security boundary. Redis health is surfaced
 * via /api/health.
 */
export function createRedisRateLimiter(): RateLimiter {
  return {
    async check(key, limit, windowMs): Promise<RateLimitResult> {
      try {
        const limiter = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(limit, msToDuration(windowMs)),
          prefix: rateLimitPrefix(),
        });
        const { success, remaining, reset, reason } = await limiter.limit(key);
        // On a slow Redis the SDK does not throw: after its own timeout (5 s by
        // default) it resolves `success: true` with `reason: "timeout"` and has
        // counted nothing. Passing that through would fail OPEN for every
        // caller, so it is a degraded result like any other outage (#164).
        if (reason === "timeout") {
          console.error("[rate-limit] limiter timed out, failing closed", { key });
          return {
            allowed: false,
            remaining: 0,
            resetAt: new Date(Date.now() + 60_000),
            degraded: true,
          };
        }
        return { allowed: success, remaining, resetAt: new Date(reset), degraded: false };
      } catch (error) {
        console.error("[rate-limit] limiter unavailable, failing closed", { key, error });
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(Date.now() + 60_000),
          degraded: true,
        };
      }
    },
  };
}

export const rateLimiter: RateLimiter = createRedisRateLimiter();

export interface ClaimResult {
  /** True when this call took the claim; false when it was already held. */
  claimed: boolean;
  /** True when Redis could not be asked. The claim is then not taken. */
  degraded: boolean;
}

/**
 * At most once per `ttlMs` for `key`, strictly: a `SET NX PX` in the rate-limit
 * namespace. The sliding-window limiter cannot do this for a limit of 1, because
 * it rounds the previous window's single use down to 0 right after a window
 * boundary (`math.floor` in `@upstash/ratelimit`'s script, measured on 2.0.8),
 * which would let a second use through minutes after the first (#164).
 *
 * Fails closed: an error or a reply slower than `timeoutMs` claims nothing.
 */
export async function claimOnce(
  key: string,
  ttlMs: number,
  timeoutMs = 5_000,
): Promise<ClaimResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timedOut = new Promise<"timeout">((resolve) => {
      timer = setTimeout(() => resolve("timeout"), timeoutMs);
    });
    const reply = await Promise.race([
      redis.set(`${rateLimitPrefix()}:once:${key}`, "1", { nx: true, px: ttlMs }),
      timedOut,
    ]);
    if (reply === "timeout") {
      console.error("[rate-limit] claim timed out, failing closed", { key });
      return { claimed: false, degraded: true };
    }
    return { claimed: reply === "OK", degraded: false };
  } catch (error) {
    console.error("[rate-limit] claim unavailable, failing closed", { key, error });
    return { claimed: false, degraded: true };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/**
 * Drop-in helper for API routes. Returns a 429 NextResponse if rate limited,
 * or null if the request is allowed. Identical signature to Epic 1.3 shim.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const { NextResponse } = await import("next/server");
  const result = await rateLimiter.check(key, limit, windowMs);
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
    // Degraded means we never counted this request — it is our outage, not the
    // caller's fault, so report 503 rather than a misleading "too many requests".
    if (result.degraded) {
      return NextResponse.json(
        { error: { code: "SERVICE_UNAVAILABLE", details: { retryAfter } } },
        {
          status: 503,
          headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" },
        },
      );
    }
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", details: { retryAfter } } },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetAt.toISOString(),
          "Cache-Control": "no-store",
        },
      },
    );
  }
  return null;
}
