import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const set = vi.fn();
const expireMock = vi.fn();
const evalMock = vi.fn();
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(() => ({ get, set, expire: expireMock, eval: evalMock })),
}));

const ENV = { ...process.env };
beforeEach(() => {
  vi.clearAllMocks();
  process.env["KV_REST_API_URL"] = "https://example.upstash.io";
  process.env["KV_REST_API_TOKEN"] = "token";
  // This file is about revocation logic, not about the namespace guard added
  // for #124 (see session-revocation-key.test.ts for that) — so pin a
  // namespace here to keep `sessionRevocationKey` from throwing outside
  // production. That guard's un-namespaced/non-production case is exercised
  // separately below.
  process.env["CACHE_NAMESPACE"] = "test-ns";
});
afterEach(() => {
  process.env = { ...ENV };
  vi.unstubAllEnvs();
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

  it("refreshes the floor's TTL to 31 days (maxAge plus a day of margin) on a revoked hit", async () => {
    // Every rejected request still returns a re-encoded cookie with a fresh
    // `exp`, so a client that keeps polling with a revoked token keeps that
    // token alive indefinitely. Without refreshing the floor's own TTL on
    // each revoked hit, the floor could lapse before the token's own `exp`
    // stops moving, and the next request after that would authenticate
    // successfully.
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockResolvedValue(2000);
    expect(await isSessionRevoked("u1", 1999)).toBe(true);
    expect(expireMock).toHaveBeenCalledWith(
      "session:revoked-before:test-ns:u1",
      30 * 24 * 60 * 60 + 24 * 60 * 60,
    );
  });

  it("keeps the floor's TTL strictly greater than session maxAge, so it cannot be tidied back to exactly maxAge", async () => {
    // FIX 2 (PR #128 round 2): the EXPIRE/SET-EX below completes inside the
    // `session` callback, before Auth.js re-encodes the response and stamps
    // the cookie's new `exp`. If that encode crosses a second boundary, a
    // TTL of exactly maxAge lets the cookie outlive the Redis key, and in
    // that window an otherwise-revoked token is admitted. Any margin closes
    // it; this test only pins that the margin exists, not its exact size.
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockResolvedValue(2000);
    await isSessionRevoked("u1", 1999);
    const ttlUsed = expireMock.mock.calls[0]?.[1] as number;
    expect(ttlUsed).toBeGreaterThan(30 * 24 * 60 * 60);
  });

  it("does not touch the floor's TTL on a non-revoked hit", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockResolvedValue(2000);
    expect(await isSessionRevoked("u1", 2001)).toBe(false);
    expect(expireMock).not.toHaveBeenCalled();
  });

  it("still reports revoked when the TTL refresh itself fails, because a failed refresh must not change the answer", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockResolvedValue(2000);
    expireMock.mockRejectedValue(new Error("upstash down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await isSessionRevoked("u1", 1999)).toBe(true);
    spy.mockRestore();
  });

  it("fails open when CACHE_NAMESPACE is unset outside production, even though sessionRevocationKey itself throws (#124)", async () => {
    delete process.env["CACHE_NAMESPACE"];
    vi.stubEnv("NODE_ENV", "development");
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await isSessionRevoked("u1", 1999)).toBe(false);
    expect(get).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("revokeSessionsBefore", () => {
  it("raises the floor atomically via a Lua script, with a 30-day TTL, instead of an unconditional SET", async () => {
    // Two near-simultaneous revocations (a sign-out and a password reset) can
    // land out of order; an unconditional SET would let the later write lower
    // the floor and re-admit sessions issued between the two instants. GET-
    // then-SET from application code would still race between the two calls'
    // GETs. A Lua script is a single atomic step on the server, so there is
    // no such window — this test only pins the wiring (script, key, args);
    // the atomicity itself is Redis's guarantee, not something a mocked
    // client can exercise.
    const { revokeSessionsBefore } = await import("@/lib/session-revocation");
    await revokeSessionsBefore("u1", 1234);
    expect(set).not.toHaveBeenCalled();
    expect(evalMock).toHaveBeenCalledOnce();
    const [script, keys, args] = evalMock.mock.calls[0] as [string, string[], unknown[]];
    expect(script).toContain('redis.call("GET"');
    expect(script).toContain('redis.call("SET"');
    expect(keys).toEqual(["session:revoked-before:test-ns:u1"]);
    expect(args).toEqual([1234, 30 * 24 * 60 * 60 + 24 * 60 * 60]);
  });

  it("does not throw when Redis is unavailable", async () => {
    const { revokeSessionsBefore } = await import("@/lib/session-revocation");
    evalMock.mockRejectedValue(new Error("upstash down"));
    await expect(revokeSessionsBefore("u1", 1234)).resolves.toBeUndefined();
  });

  it("fails open (does not throw out) when CACHE_NAMESPACE is unset outside production, even though sessionRevocationKey itself throws (#124)", async () => {
    // sessionRevocationKey() refuses to build an un-namespaced key outside
    // production. This runs inside the Edge session callback, so that throw
    // must be contained here — never left to reach auth.config.ts or
    // middleware.
    delete process.env["CACHE_NAMESPACE"];
    vi.stubEnv("NODE_ENV", "development");
    const { revokeSessionsBefore } = await import("@/lib/session-revocation");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(revokeSessionsBefore("u1", 1234)).resolves.toBeUndefined();
    expect(evalMock).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
