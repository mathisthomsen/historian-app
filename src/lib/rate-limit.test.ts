import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mock — must be before any import that resolves the rate-limit module
const mockLimit = vi.fn();
const MockRatelimit = vi.fn().mockImplementation(() => ({ limit: mockLimit }));
(MockRatelimit as unknown as Record<string, unknown>).slidingWindow = vi
  .fn()
  .mockReturnValue("sliding:window");

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: MockRatelimit,
}));

// Also mock redis so tests don't need real credentials
vi.mock("@/lib/redis", () => ({
  redis: {},
}));

// rate-limit-key.ts is deliberately not mocked (see its own test file), so
// createRedisRateLimiter().check() calls the real rateLimitPrefix() below.
// Most of this file exercises the limiter itself, not the namespace guard —
// pin VERCEL_ENV to "production" so those tests don't need RATELIMIT_NAMESPACE.
// rateLimitPrefix() gates on VERCEL_ENV, not NODE_ENV (a `next start`
// production build on a laptop is not a real deployment — see
// deployment-env.ts). "rate-limit key namespace" overrides this per test;
// restore afterwards since vitest can reuse this worker process for other
// test files.
const ORIGINAL_VERCEL_ENV = process.env["VERCEL_ENV"];
process.env["VERCEL_ENV"] = "production";
afterAll(() => {
  if (ORIGINAL_VERCEL_ENV === undefined) delete process.env["VERCEL_ENV"];
  else process.env["VERCEL_ENV"] = ORIGINAL_VERCEL_ENV;
});

const { checkRateLimit, createRedisRateLimiter } = await import("@/lib/rate-limit");

describe("createRedisRateLimiter — allowed", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (MockRatelimit as unknown as Record<string, unknown>).slidingWindow = vi
      .fn()
      .mockReturnValue("sliding:window");
    MockRatelimit.mockImplementation(() => ({ limit: mockLimit }));
  });

  it("returns allowed: true when limiter succeeds", async () => {
    mockLimit.mockResolvedValue({ success: true, remaining: 4, reset: Date.now() + 60_000 });
    const limiter = createRedisRateLimiter();
    const result = await limiter.check("test-key", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("returns allowed: false when limiter denies", async () => {
    mockLimit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60_000 });
    const limiter = createRedisRateLimiter();
    const result = await limiter.check("test-key", 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("fails closed when limiter throws, flagging the result as degraded", async () => {
    // Auth routes are the only callers: failing open would silently remove
    // brute-force protection exactly while Redis is down (audit S-M2).
    mockLimit.mockRejectedValue(new Error("Redis unavailable"));
    const limiter = createRedisRateLimiter();
    const result = await limiter.check("test-key", 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.degraded).toBe(true);
  });

  it("marks successful checks as not degraded", async () => {
    mockLimit.mockResolvedValue({ success: true, remaining: 4, reset: Date.now() + 60_000 });
    const limiter = createRedisRateLimiter();
    const result = await limiter.check("test-key", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.degraded).toBe(false);
  });

  it("resetAt is a Date", async () => {
    const resetMs = Date.now() + 900_000;
    mockLimit.mockResolvedValue({ success: true, remaining: 3, reset: resetMs });
    const limiter = createRedisRateLimiter();
    const result = await limiter.check("test-key", 5, 900_000);
    expect(result.resetAt).toBeInstanceOf(Date);
    expect(result.resetAt.getTime()).toBe(resetMs);
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (MockRatelimit as unknown as Record<string, unknown>).slidingWindow = vi
      .fn()
      .mockReturnValue("sliding:window");
    MockRatelimit.mockImplementation(() => ({ limit: mockLimit }));
  });

  it("returns null when request is allowed", async () => {
    mockLimit.mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 3_600_000 });
    const result = await checkRateLimit("register:ip", 10, 3_600_000);
    expect(result).toBeNull();
  });

  it("returns 429 NextResponse when denied", async () => {
    mockLimit.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60_000,
    });
    const response = await checkRateLimit("register:ip", 10, 3_600_000);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);
    const body = (await response!.json()) as {
      error: { code: string; details: { retryAfter: number } };
    };
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(typeof body.error.details.retryAfter).toBe("number");
  });

  it("returns 503 (not 429) when the limiter itself is unavailable", async () => {
    mockLimit.mockRejectedValue(new Error("Redis unavailable"));
    const response = await checkRateLimit("register:ip", 10, 3_600_000);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(503);
    const body = (await response!.json()) as { error: { code: string } };
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(response!.headers.get("Retry-After")).toBeTruthy();
  });

  it("429 response includes Retry-After header", async () => {
    mockLimit.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60_000,
    });
    const response = await checkRateLimit("login:ip:email", 5, 900_000);
    expect(response!.headers.get("Retry-After")).toBeTruthy();
    expect(response!.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response!.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });
});

describe("msToDuration (via limiter call args)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const slidingWindow = vi.fn().mockReturnValue("window");
    (MockRatelimit as unknown as Record<string, unknown>).slidingWindow = slidingWindow;
    MockRatelimit.mockImplementation(() => ({ limit: mockLimit }));
    mockLimit.mockResolvedValue({ success: true, remaining: 1, reset: Date.now() + 1_000 });
  });

  it("converts 3_600_000ms → '1 h'", async () => {
    const limiter = createRedisRateLimiter();
    await limiter.check("k", 5, 3_600_000);
    const sw = (MockRatelimit as unknown as Record<string, unknown>).slidingWindow as ReturnType<
      typeof vi.fn
    >;
    expect(sw).toHaveBeenCalledWith(5, "1 h");
  });

  it("converts 900_000ms → '15 m'", async () => {
    const limiter = createRedisRateLimiter();
    await limiter.check("k", 5, 900_000);
    const sw = (MockRatelimit as unknown as Record<string, unknown>).slidingWindow as ReturnType<
      typeof vi.fn
    >;
    expect(sw).toHaveBeenCalledWith(5, "15 m");
  });
});

describe("rate-limit key namespace", () => {
  const ORIGINAL = process.env["RATELIMIT_NAMESPACE"];

  beforeEach(() => {
    vi.resetAllMocks();
    (MockRatelimit as unknown as Record<string, unknown>).slidingWindow = vi
      .fn()
      .mockReturnValue("window");
    MockRatelimit.mockImplementation(() => ({ limit: mockLimit }));
    mockLimit.mockResolvedValue({ success: true, remaining: 1, reset: Date.now() + 1_000 });
  });

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env["RATELIMIT_NAMESPACE"];
    else process.env["RATELIMIT_NAMESPACE"] = ORIGINAL;
    // Tests below override VERCEL_ENV; restore the file-level pin (see top).
    process.env["VERCEL_ENV"] = "production";
  });

  it("writes under the bare prefix when no namespace is configured — production is its own key space", async () => {
    delete process.env["RATELIMIT_NAMESPACE"];
    await createRedisRateLimiter().check("k", 5, 60_000);
    expect(MockRatelimit).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: "@upstash/ratelimit" }),
    );
  });

  // Without this, a CI run and production share bucket keys on the one Upstash
  // instance — which is what let the E2E reset clear production's buckets.
  it("writes under a namespaced prefix when RATELIMIT_NAMESPACE is set", async () => {
    process.env["RATELIMIT_NAMESPACE"] = "ci-42-1";
    await createRedisRateLimiter().check("k", 5, 60_000);
    expect(MockRatelimit).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: "@upstash/ratelimit:ci-42-1" }),
    );
  });

  // Local development shares the same Upstash instance as production (#124):
  // outside production, an unset namespace must not silently build a prefix
  // at all. createRedisRateLimiter() already fails CLOSED on any error (it is
  // the only posture safe for an auth route), so the guard shows up here as a
  // degraded 503-shaped result, not a thrown error escaping `.check()`.
  it("fails closed, rather than throwing out, when RATELIMIT_NAMESPACE is unset outside production", async () => {
    delete process.env["RATELIMIT_NAMESPACE"];
    delete process.env["VERCEL_ENV"];
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await createRedisRateLimiter().check("k", 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.degraded).toBe(true);
    expect(MockRatelimit).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "[rate-limit] limiter unavailable, failing closed",
      expect.objectContaining({ error: expect.any(Error) }),
    );
    errorSpy.mockRestore();
  });
});
