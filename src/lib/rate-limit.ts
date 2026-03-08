import { Ratelimit } from "@upstash/ratelimit";
import type { NextResponse } from "next/server";

import { redis } from "./redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
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
 * Fails open: if Redis is unavailable the request is allowed through.
 */
export function createRedisRateLimiter(): RateLimiter {
  return {
    async check(key, limit, windowMs): Promise<RateLimitResult> {
      try {
        const limiter = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(limit, msToDuration(windowMs)),
          prefix: "@upstash/ratelimit",
        });
        const { success, remaining, reset } = await limiter.limit(key);
        return { allowed: success, remaining, resetAt: new Date(reset) };
      } catch {
        // Fail open: Redis unavailability is monitored via /api/health
        return { allowed: true, remaining: -1, resetAt: new Date() };
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
    return NextResponse.json(
      { error: "auth.errors.rateLimited", retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetAt.toISOString(),
        },
      },
    );
  }
  return null;
}
