import { beforeEach, describe, expect, it, vi } from "vitest";

const isSessionRevoked = vi.fn();
vi.mock("@/lib/session-revocation", () => ({
  isSessionRevoked,
  revokeSessionsBefore: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

async function runSession(revoked: boolean) {
  isSessionRevoked.mockResolvedValue(revoked);
  const { authConfig } = await import("@/auth.config");
  const session = { user: { id: "", email: "a@b.c", name: null, role: "USER" }, expires: "" };
  const token = { id: "u1", role: "USER", iat: 1000 };
  return authConfig.callbacks!.session!({ session, token } as never);
}

describe("authConfig.session", () => {
  it("returns a populated session when the token is not revoked", async () => {
    const result = await runSession(false);
    expect(result.user?.id).toBe("u1");
  });

  it("strips user when the token is revoked, so every guard treats it as anonymous", async () => {
    const result = await runSession(true);
    expect(result.user).toBeUndefined();
  });

  it("compares against authTime, not the re-encoded iat, so revocation survives the unconditional re-sign", async () => {
    // authTime is the original sign-in instant, sitting behind the
    // revocation floor. iat has since been overwritten by a later re-encode
    // (next-auth does this on every session read) and now sits ahead of the
    // floor. A comparison against iat would call this session live; it must
    // not be — this is the exact escape GHSA-h32c-m6mx-pmw6 describes.
    isSessionRevoked.mockImplementation((_userId: string, issued?: number) =>
      Promise.resolve(issued === 1000),
    );
    const { authConfig } = await import("@/auth.config");
    const session = { user: { id: "", email: "a@b.c", name: null, role: "USER" }, expires: "" };
    const token = { id: "u1", role: "USER", authTime: 1000, iat: 5000 };
    const result = await authConfig.callbacks!.session!({ session, token } as never);
    expect(isSessionRevoked).toHaveBeenCalledWith("u1", 1000);
    expect(result.user).toBeUndefined();
  });

  it("falls back to iat for a legacy token minted before authTime existed", async () => {
    isSessionRevoked.mockResolvedValue(false);
    const { authConfig } = await import("@/auth.config");
    const session = { user: { id: "", email: "a@b.c", name: null, role: "USER" }, expires: "" };
    const token = { id: "u1", role: "USER", iat: 1000 };
    await authConfig.callbacks!.session!({ session, token } as never);
    expect(isSessionRevoked).toHaveBeenCalledWith("u1", 1000);
  });

  it("does not query revocation for a token without an id", async () => {
    const { authConfig } = await import("@/auth.config");
    const session = { user: { id: "", email: "a@b.c", name: null, role: "USER" }, expires: "" };
    const token = { role: "USER", iat: 1000 };
    await authConfig.callbacks!.session!({ session, token } as never);
    expect(isSessionRevoked).not.toHaveBeenCalled();
  });
});

describe("authConfig.jwt", () => {
  it("stamps authTime only at sign-in, when user is present", async () => {
    const { authConfig } = await import("@/auth.config");
    const before = Math.floor(Date.now() / 1000);
    const token = (await authConfig.callbacks!.jwt!({
      token: {},
      user: { id: "u1", role: "USER" },
    } as never)) as { authTime?: number };
    expect(token.authTime).toBeGreaterThanOrEqual(before);
  });

  it("does not restamp authTime on an ordinary re-encode, when user is absent", async () => {
    const { authConfig } = await import("@/auth.config");
    const token = (await authConfig.callbacks!.jwt!({
      token: { id: "u1", role: "USER", authTime: 1000 },
      user: undefined,
    } as never)) as { authTime?: number };
    expect(token.authTime).toBe(1000);
  });
});

describe("authConfig.authorized", () => {
  async function run(pathname: string, loggedIn: boolean) {
    const { authConfig } = await import("@/auth.config");
    const request = { nextUrl: new URL(`https://evidoxa.test${pathname}`) };
    return authConfig.callbacks!.authorized!({
      auth: loggedIn ? ({ user: { id: "u1" } } as never) : null,
      request: request as never,
    });
  }

  it("lets a public path through", async () => {
    expect(await run("/de/changelog", false)).toBe(true);
  });

  it("lets an authenticated request through", async () => {
    expect(await run("/de/dashboard", true)).toBe(true);
  });

  it("redirects an anonymous page request to the locale-correct login", async () => {
    const result = await run("/de/dashboard", false);
    expect(result).toBeInstanceOf(Response);
    const res = result as Response;
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/de/auth/login");
  });

  it("preserves a non-default locale in the redirect", async () => {
    const res = (await run("/en/dashboard", false)) as Response;
    expect(res.headers.get("location")).toContain("/en/auth/login");
  });

  it("answers an anonymous API request with 401, never a redirect", async () => {
    const res = (await run("/api/persons", false)) as Response;
    expect(res.status).toBe(401);
    expect(res.headers.get("location")).toBeNull();
  });
});
