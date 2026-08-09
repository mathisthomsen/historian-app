import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mock for redis module — must be declared before the cache import
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockDel = vi.fn();
const mockScan = vi.fn();

vi.mock("@/lib/redis", () => ({
  redis: {
    get: mockGet,
    set: mockSet,
    del: mockDel,
    scan: mockScan,
  },
}));

// Import AFTER mocks are registered
const { cache } = await import("@/lib/cache");

describe("cache.get", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns null on cache miss", async () => {
    mockGet.mockResolvedValue(null);
    const result = await cache.get("missing-key");
    expect(result).toBeNull();
    expect(mockGet).toHaveBeenCalledWith("cache:missing-key");
  });

  it("returns typed value on cache hit", async () => {
    mockGet.mockResolvedValue({ foo: 1 });
    const result = await cache.get<{ foo: number }>("hit-key");
    expect(result).toEqual({ foo: 1 });
    expect(mockGet).toHaveBeenCalledWith("cache:hit-key");
  });

  it("returns null when redis throws (fail silent)", async () => {
    mockGet.mockRejectedValue(new Error("Redis unavailable"));
    const result = await cache.get("error-key");
    expect(result).toBeNull();
  });
});

describe("cache.set", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls redis.set with cache: prefix and ex option", async () => {
    mockSet.mockResolvedValue("OK");
    await cache.set("my-key", { data: true }, 60);
    expect(mockSet).toHaveBeenCalledWith("cache:my-key", { data: true }, { ex: 60 });
  });

  it("is silent when redis throws", async () => {
    mockSet.mockRejectedValue(new Error("Redis down"));
    await expect(cache.set("key", "value", 30)).resolves.toBeUndefined();
  });
});

describe("cache.del", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calls redis.del with cache: prefix", async () => {
    mockDel.mockResolvedValue(1);
    await cache.del("delete-me");
    expect(mockDel).toHaveBeenCalledWith("cache:delete-me");
  });

  it("is silent when redis throws", async () => {
    mockDel.mockRejectedValue(new Error("Redis down"));
    await expect(cache.del("key")).resolves.toBeUndefined();
  });
});

describe("cache.invalidateByPrefix", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("scans and deletes matching keys", async () => {
    // Single page result (cursor "0" means done)
    mockScan.mockResolvedValue(["0", ["cache:project:abc:key1", "cache:project:abc:key2"]]);
    mockDel.mockResolvedValue(2);

    await cache.invalidateByPrefix("project:abc:");

    expect(mockScan).toHaveBeenCalledWith("0", {
      match: "cache:project:abc:*",
      count: 100,
    });
    expect(mockDel).toHaveBeenCalledWith("cache:project:abc:key1", "cache:project:abc:key2");
  });

  it("iterates when scan returns non-zero cursor", async () => {
    mockScan
      .mockResolvedValueOnce(["42", ["cache:p:k1"]])
      .mockResolvedValueOnce(["0", ["cache:p:k2"]]);
    mockDel.mockResolvedValue(1);

    await cache.invalidateByPrefix("p:");

    expect(mockScan).toHaveBeenCalledTimes(2);
    expect(mockDel).toHaveBeenCalledTimes(2);
  });

  it("skips del when scan returns no keys", async () => {
    mockScan.mockResolvedValue(["0", []]);
    await cache.invalidateByPrefix("empty:");
    expect(mockDel).not.toHaveBeenCalled();
  });

  it("is silent when redis throws", async () => {
    mockScan.mockRejectedValue(new Error("Redis down"));
    await expect(cache.invalidateByPrefix("any:")).resolves.toBeUndefined();
  });
});

describe("cache key namespace", () => {
  const ORIGINAL = process.env["CACHE_NAMESPACE"];

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env["CACHE_NAMESPACE"];
    else process.env["CACHE_NAMESPACE"] = ORIGINAL;
    vi.resetModules();
  });

  it("leaves keys unchanged when CACHE_NAMESPACE is unset, as in dev and production", async () => {
    vi.resetAllMocks();
    delete process.env["CACHE_NAMESPACE"];
    vi.resetModules();
    const { cache: unnamespaced } = await import("@/lib/cache");
    mockGet.mockResolvedValue(null);
    await unnamespaced.get("person-list:seed-project-demo:1:25");
    expect(mockGet).toHaveBeenCalledWith("cache:person-list:seed-project-demo:1:25");
  });

  // Cache keys are built from the seed project id, which is fixed. Two CI runs
  // less than the 60s TTL apart would otherwise serve run N's cached rows
  // against run N+1's database — each run now has a fresh Neon branch but they
  // still share one Upstash instance.
  it("scopes keys to the namespace when CACHE_NAMESPACE is set", async () => {
    vi.resetAllMocks();
    process.env["CACHE_NAMESPACE"] = "ci-42-1";
    vi.resetModules();
    const { cache: namespaced } = await import("@/lib/cache");
    mockGet.mockResolvedValue(null);
    await namespaced.get("person-list:seed-project-demo:1:25");
    expect(mockGet).toHaveBeenCalledWith("cache:ci-42-1:person-list:seed-project-demo:1:25");
  });

  it("applies the namespace to writes as well as reads", async () => {
    vi.resetAllMocks();
    process.env["CACHE_NAMESPACE"] = "ci-42-1";
    vi.resetModules();
    const { cache: namespaced } = await import("@/lib/cache");
    await namespaced.set("k", { v: 1 }, 60);
    expect(mockSet).toHaveBeenCalledWith("cache:ci-42-1:k", { v: 1 }, { ex: 60 });
  });
});
