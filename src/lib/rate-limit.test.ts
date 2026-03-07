import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createLruRateLimiter } from "@/lib/rate-limit";

// Force production mode so the LRU logic (not the dev no-op) is exercised.
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createLruRateLimiter", () => {
  it("allows up to the limit", async () => {
    const limiter = createLruRateLimiter();
    const limit = 3;
    const windowMs = 60_000;

    for (let i = 1; i <= limit; i++) {
      const result = await limiter.check("test-key-allow", limit, windowMs);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(limit - i);
    }
  });

  it("blocks the limit+1 request", async () => {
    const limiter = createLruRateLimiter();
    const limit = 3;
    const windowMs = 60_000;

    for (let i = 0; i < limit; i++) {
      await limiter.check("test-key-block", limit, windowMs);
    }

    const result = await limiter.check("test-key-block", limit, windowMs);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("different keys are independent", async () => {
    const limiter = createLruRateLimiter();
    const limit = 2;
    const windowMs = 60_000;

    // Exhaust key-a
    await limiter.check("key-a", limit, windowMs);
    await limiter.check("key-a", limit, windowMs);
    const resultA = await limiter.check("key-a", limit, windowMs);
    expect(resultA.allowed).toBe(false);

    // key-b should still be fresh
    const resultB = await limiter.check("key-b", limit, windowMs);
    expect(resultB.allowed).toBe(true);
  });

  it("resetAt is in the future", async () => {
    const limiter = createLruRateLimiter();
    const before = Date.now();
    const result = await limiter.check("test-key-reset", 5, 60_000);
    expect(result.resetAt.getTime()).toBeGreaterThan(before);
  });
});
