import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

// The generic redis-interaction tests below assert on bare "cache:..." keys —
// that is production's key shape (dev and CI are required to set
// CACHE_NAMESPACE; see the "cache key namespace" describe for that guard
// itself). requireNamespace() gates on VERCEL_ENV, not NODE_ENV (a `next
// start` production build on a laptop is not a real deployment — see
// deployment-env.ts), so pin VERCEL_ENV to "production" for this file rather
// than NODE_ENV, then restore it afterwards — vitest can reuse this worker
// process for other test files.
const ORIGINAL_VERCEL_ENV = process.env["VERCEL_ENV"];
process.env["VERCEL_ENV"] = "production";
afterAll(() => {
  if (ORIGINAL_VERCEL_ENV === undefined) delete process.env["VERCEL_ENV"];
  else process.env["VERCEL_ENV"] = ORIGINAL_VERCEL_ENV;
});

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
  const ORIGINAL_NAMESPACE = process.env["CACHE_NAMESPACE"];

  afterEach(() => {
    if (ORIGINAL_NAMESPACE === undefined) delete process.env["CACHE_NAMESPACE"];
    else process.env["CACHE_NAMESPACE"] = ORIGINAL_NAMESPACE;
    // Each test below sets VERCEL_ENV explicitly; restore the file-level pin
    // (see top of file) rather than whatever a given test left behind.
    process.env["VERCEL_ENV"] = "production";
    vi.resetModules();
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

  // Local development and production share one Upstash instance (measured —
  // .env.local and `vercel env pull --environment=production` resolve to the
  // same host). Cache keys are built from a fixed seed project id, so an
  // unnamespaced local cache write lands in production's key space (#124).
  it("throws from requireNamespace() outside production when CACHE_NAMESPACE is unset", async () => {
    delete process.env["CACHE_NAMESPACE"];
    delete process.env["VERCEL_ENV"];
    vi.resetModules();
    const { requireNamespace } = await import("@/lib/cache");
    expect(() => requireNamespace()).toThrow(/CACHE_NAMESPACE/);
  });

  it("treats an empty namespace as unset outside production, rather than producing a double colon", async () => {
    process.env["CACHE_NAMESPACE"] = "";
    delete process.env["VERCEL_ENV"];
    vi.resetModules();
    const { requireNamespace } = await import("@/lib/cache");
    expect(() => requireNamespace()).toThrow(/CACHE_NAMESPACE/);
  });

  it("degrades to a logged cache miss, rather than throwing out, when the public API hits the missing namespace", async () => {
    vi.resetAllMocks();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    delete process.env["CACHE_NAMESPACE"];
    delete process.env["VERCEL_ENV"];
    vi.resetModules();
    const { cache: unnamespaced } = await import("@/lib/cache");
    const result = await unnamespaced.get("person-list:seed-project-demo:1:25");
    expect(result).toBeNull();
    expect(mockGet).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "[cache] get failed",
      expect.objectContaining({ error: expect.any(Error) }),
    );
    errorSpy.mockRestore();
  });

  it("returns the bare key in production when CACHE_NAMESPACE is unset — production is its own key space", async () => {
    vi.resetAllMocks();
    delete process.env["CACHE_NAMESPACE"];
    process.env["VERCEL_ENV"] = "production";
    vi.resetModules();
    const { cache: unnamespaced, requireNamespace } = await import("@/lib/cache");
    expect(() => requireNamespace()).not.toThrow();
    mockGet.mockResolvedValue(null);
    await unnamespaced.get("person-list:seed-project-demo:1:25");
    expect(mockGet).toHaveBeenCalledWith("cache:person-list:seed-project-demo:1:25");
  });
});
