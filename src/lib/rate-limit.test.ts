import { beforeEach, describe, expect, it, vi } from "vitest";

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

  it("fails open when limiter throws (allowed: true, remaining: -1)", async () => {
    mockLimit.mockRejectedValue(new Error("Redis unavailable"));
    const limiter = createRedisRateLimiter();
    const result = await limiter.check("test-key", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(-1);
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
    const body = (await response!.json()) as { error: string; retryAfter: number };
    expect(body.error).toBe("auth.errors.rateLimited");
    expect(typeof body.retryAfter).toBe("number");
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
