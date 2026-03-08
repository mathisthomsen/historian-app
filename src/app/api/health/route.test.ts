import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks — must be declared before imports that use them
const mockPing = vi.fn<() => Promise<number>>();
const mockGetLatestMigration = vi.fn<() => Promise<string | null>>();
const mockRedisPing = vi.fn<() => Promise<string>>();
const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();

vi.mock("@/lib/db", () => ({
  ping: mockPing,
  getLatestMigration: mockGetLatestMigration,
}));

vi.mock("@/lib/redis", () => ({
  redis: { ping: mockRedisPing },
}));

vi.mock("@/lib/cache", () => ({
  cache: { get: mockCacheGet, set: mockCacheSet },
}));

// Import AFTER mocks are registered
const { GET } = await import("./route");

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: no cached value
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
    process.env.DATABASE_URL = "postgresql://secret-user:secret-pass@host/db";
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("returns status: ok when DB and Redis are both reachable", async () => {
    mockPing.mockResolvedValue(42);
    mockGetLatestMigration.mockResolvedValue("20260307121802_init");
    mockRedisPing.mockResolvedValue("PONG");

    const response = await GET();

    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    const db = body.db as Record<string, unknown>;
    expect(db.status).toBe("ok");
    const redis = body.redis as Record<string, unknown>;
    expect(redis.status).toBe("ok");
  });

  it("returns status: degraded when Redis fails but DB is ok", async () => {
    mockPing.mockResolvedValue(10);
    mockGetLatestMigration.mockResolvedValue("20260307121802_init");
    mockRedisPing.mockRejectedValue(new Error("Redis unavailable"));

    const response = await GET();

    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe("degraded");
    const redis = body.redis as Record<string, unknown>;
    expect(redis.status).toBe("error");
    const db = body.db as Record<string, unknown>;
    expect(db.status).toBe("ok");
  });

  it("returns status: degraded when DB fails but Redis is ok", async () => {
    mockPing.mockRejectedValue(new Error("DB down"));
    mockRedisPing.mockResolvedValue("PONG");

    const response = await GET();

    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe("degraded");
    const db = body.db as Record<string, unknown>;
    expect(db.status).toBe("error");
    const redis = body.redis as Record<string, unknown>;
    expect(redis.status).toBe("ok");
  });

  it("returns status: error when both DB and Redis fail", async () => {
    mockPing.mockRejectedValue(new Error("DB down"));
    mockRedisPing.mockRejectedValue(new Error("Redis down"));

    const response = await GET();

    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe("error");
  });

  it("response includes timestamp as ISO 8601 string", async () => {
    mockPing.mockResolvedValue(5);
    mockGetLatestMigration.mockResolvedValue("20260307121802_init");
    mockRedisPing.mockResolvedValue("PONG");

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    expect(typeof body.timestamp).toBe("string");
    expect(body.timestamp as string).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("response includes redis.latencyMs as a number", async () => {
    mockPing.mockResolvedValue(5);
    mockGetLatestMigration.mockResolvedValue("20260307121802_init");
    mockRedisPing.mockResolvedValue("PONG");

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    const redis = body.redis as Record<string, unknown>;
    expect(typeof redis.latencyMs).toBe("number");
    expect(redis.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("sets Cache-Control: no-store header", async () => {
    mockPing.mockResolvedValue(5);
    mockGetLatestMigration.mockResolvedValue("20260307121802_init");
    mockRedisPing.mockResolvedValue("PONG");

    const response = await GET();

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("response body does not contain DATABASE_URL value", async () => {
    mockPing.mockResolvedValue(10);
    mockGetLatestMigration.mockResolvedValue("20260307121802_init");
    mockRedisPing.mockResolvedValue("PONG");

    const response = await GET();
    const text = await response.text();

    expect(text).not.toContain("secret-pass");
    expect(text).not.toContain("secret-user");
  });

  it("returns cached response when cache hit", async () => {
    const cached = {
      status: "ok",
      version: "0.1.0",
      db: { status: "ok", latencyMs: 5, migration: "init" },
      redis: { status: "ok", latencyMs: 3 },
      timestamp: "2026-01-01T00:00:00.000Z",
    };
    mockCacheGet.mockResolvedValue(cached);

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(cached);
    // Should NOT call DB or Redis ping when cache hits
    expect(mockPing).not.toHaveBeenCalled();
    expect(mockRedisPing).not.toHaveBeenCalled();
  });
});
