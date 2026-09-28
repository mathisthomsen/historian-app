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

  it("does not revoke on an exact millisecond tie, so a login in the same instant survives its own logout", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockResolvedValue(2000);
    expect(await isSessionRevoked("u1", 2000)).toBe(false);
  });

  it("distinguishes a session created and signed out within the same second, because both values are millisecond-precision", async () => {
    // Both truncate to the same unix *second* (1700000000) — at
    // second-precision this would be an exact tie, and the tie favours the
    // session (see the test above), so a session created and revoked within
    // the same second would survive for its full 30-day lifetime. At
    // millisecond precision they are 456ms apart and the strict `<` resolves
    // correctly.
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    const authTimeMs = 1_700_000_000_123;
    const floorMs = 1_700_000_000_579;
    get.mockResolvedValue(floorMs);
    expect(await isSessionRevoked("u1", authTimeMs)).toBe(true);
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

  it("fails open and logs when issuedAtMs is absent, because the probe showed authTime is always present", async () => {
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
