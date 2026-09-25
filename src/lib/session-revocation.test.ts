import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const set = vi.fn();
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(() => ({ get, set })),
}));

const ENV = { ...process.env };
beforeEach(() => {
  vi.clearAllMocks();
  process.env["KV_REST_API_URL"] = "https://example.upstash.io";
  process.env["KV_REST_API_TOKEN"] = "token";
  delete process.env["CACHE_NAMESPACE"];
});
afterEach(() => {
  process.env = { ...ENV };
});

describe("isSessionRevoked", () => {
  it("is not revoked when no floor has been written", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockResolvedValue(null);
    expect(await isSessionRevoked("u1", 1000)).toBe(false);
  });

  it("is revoked when the token predates the floor", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockResolvedValue(2000);
    expect(await isSessionRevoked("u1", 1999)).toBe(true);
  });

  it("is not revoked when the token is newer than the floor", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockResolvedValue(2000);
    expect(await isSessionRevoked("u1", 2001)).toBe(false);
  });

  it("does not revoke on an exact tie, so a login in the same second survives its own logout", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockResolvedValue(2000);
    expect(await isSessionRevoked("u1", 2000)).toBe(false);
  });

  it("fails open when Redis throws", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockRejectedValue(new Error("upstash down"));
    expect(await isSessionRevoked("u1", 1)).toBe(false);
  });

  it("fails open when Redis is not configured", async () => {
    delete process.env["KV_REST_API_URL"];
    delete process.env["UPSTASH_REDIS_REST_URL"];
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    expect(await isSessionRevoked("u1", 1)).toBe(false);
  });

  it("fails open and logs when iat is absent, because the probe showed it is always present", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await isSessionRevoked("u1", undefined)).toBe(false);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("revokeSessionsBefore", () => {
  it("writes the floor with a 30-day TTL", async () => {
    const { revokeSessionsBefore } = await import("@/lib/session-revocation");
    await revokeSessionsBefore("u1", 1234);
    expect(set).toHaveBeenCalledWith("session:revoked-before:u1", 1234, { ex: 30 * 24 * 60 * 60 });
  });

  it("does not throw when Redis is unavailable", async () => {
    const { revokeSessionsBefore } = await import("@/lib/session-revocation");
    set.mockRejectedValue(new Error("upstash down"));
    await expect(revokeSessionsBefore("u1", 1234)).resolves.toBeUndefined();
  });
});
