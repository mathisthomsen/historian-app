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
 * Fails CLOSED: if Redis is unavailable the request is denied. Every caller is
 * an auth route, where failing open silently removes brute-force and
 * account-enumeration protection — the exact window an attacker wants (audit
 * S-M2). Redis health is surfaced via /api/health.
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
        const { success, remaining, reset } = await limiter.limit(key);
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
