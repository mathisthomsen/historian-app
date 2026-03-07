import { LRUCache } from "lru-cache";
import { NextResponse } from "next/server";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

export function createLruRateLimiter(): RateLimiter {
  // In non-production environments the in-process LRU shim is disabled so
  // that E2E test suites (which reuse the dev server) don't exhaust limits.
  // Production uses this shim only until Redis is added in Epic 1.4.
  if (process.env.NODE_ENV !== "production") {
    return {
      async check(_key: string, limit: number, _windowMs: number): Promise<RateLimitResult> {
        return { allowed: true, remaining: limit, resetAt: new Date(Date.now() + _windowMs) };
      },
    };
  }

  // LRU cache keyed by "key:windowStart", values are hit counts
  const cache = new LRUCache<string, number>({ max: 10_000 });

  return {
    async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
      const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
      const cacheKey = `${key}:${windowStart}`;
      const current = (cache.get(cacheKey) ?? 0) + 1;
      cache.set(cacheKey, current, { ttl: windowMs });
      const resetAt = new Date(windowStart + windowMs);
      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetAt,
      };
    },
  };
}

export const rateLimiter: RateLimiter = createLruRateLimiter();

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const result = await rateLimiter.check(key, limit, windowMs);
  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "auth.errors.rateLimited",
        retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
      },
      { status: 429 },
    );
  }
  return null;
}
