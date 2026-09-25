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
