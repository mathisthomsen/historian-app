import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

  it("passes undefined to isSessionRevoked when a token somehow has no authTime, rather than falling back to the moving iat", async () => {
    // This should not happen in practice — the `jwt` callback backfills
    // `authTime` for every legacy token before `session` ever runs — but the
    // old `?? iat` fallback was exactly this escape (GHSA-h32c-m6mx-pmw6), so
    // guard against it coming back. `isSessionRevoked` already fails open on
    // `undefined`.
    isSessionRevoked.mockResolvedValue(false);
    const { authConfig } = await import("@/auth.config");
    const session = { user: { id: "", email: "a@b.c", name: null, role: "USER" }, expires: "" };
    const token = { id: "u1", role: "USER", iat: 9000 };
    await authConfig.callbacks!.session!({ session, token } as never);
    expect(isSessionRevoked).toHaveBeenCalledWith("u1", undefined);
  });

  it("revokes a legacy token once authTime is derived from its original iat, even after iat has moved forward on re-encode", async () => {
    // Reproduces GHSA-h32c-m6mx-pmw6 end to end: a pre-deploy token has only
    // `iat`. The `jwt` callback backfills `authTime` from that `iat` on its
    // first post-deploy decode; a later re-encode (modeled here by mutating
    // `iat` on the same token object, exactly as `@auth/core` does on
    // Set-Cookie) must not disturb the frozen `authTime`. `session` must
    // compare the frozen value, not the moved one — with the old `?? iat`
    // fallback this test fails because it calls `isSessionRevoked` with the
    // moved value (9000), which the mock below treats as not revoked.
    const { authConfig } = await import("@/auth.config");
    const legacyToken = (await authConfig.callbacks!.jwt!({
      token: { id: "u1", role: "USER", iat: 1000 },
      user: undefined,
    } as never)) as { authTime?: number; iat?: number };
    expect(legacyToken.authTime).toBe(1_000_000); // 1000s captured once, in ms

    // Simulate the re-encode @auth/core performs on the way out: `iat` moves
    // forward, `authTime` is an ordinary token field and is carried through.
    legacyToken.iat = 9000;

    isSessionRevoked.mockImplementation((_userId: string, issued?: number) =>
      Promise.resolve(issued === 1_000_000),
    );
    const session = { user: { id: "", email: "a@b.c", name: null, role: "USER" }, expires: "" };
    const result = await authConfig.callbacks!.session!({ session, token: legacyToken } as never);
    expect(isSessionRevoked).toHaveBeenCalledWith("u1", 1_000_000);
    expect(result.user).toBeUndefined();
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
  it("stamps authTime in milliseconds only at sign-in, when user is present", async () => {
    const { authConfig } = await import("@/auth.config");
    const before = Date.now();
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

  it("backfills authTime from iat (converted to ms) for a legacy token that has neither", async () => {
    const { authConfig } = await import("@/auth.config");
    const token = (await authConfig.callbacks!.jwt!({
      token: { id: "u1", role: "USER", iat: 42 },
      user: undefined,
    } as never)) as { authTime?: number };
    expect(token.authTime).toBe(42_000);
  });

  it("backfills authTime from Date.now() for a token with neither authTime nor a usable iat", async () => {
    const { authConfig } = await import("@/auth.config");
    const before = Date.now();
    const token = (await authConfig.callbacks!.jwt!({
      token: { id: "u1", role: "USER" },
      user: undefined,
    } as never)) as { authTime?: number };
    expect(token.authTime).toBeGreaterThanOrEqual(before);
  });
});

/**
 * The ground truth for "which top-level segments are the authenticated app"
 * is the filesystem, not a hand-maintained list in `authorized()` — so a
 * route added under src/app/[locale]/(app)/ and forgotten in the gated-
 * prefix list is left ungated at the edge instead of silently passing CI.
 * (Same pattern as src/test/pages/marketing-seo.test.ts for robots.ts.)
 */
function protectedAppSegments(): string[] {
  const testFileDir = path.dirname(fileURLToPath(import.meta.url));
  const appDir = path.resolve(testFileDir, "app/[locale]/(app)");
  return readdirSync(appDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

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

  it("lets an unknown path through so Next's catch-all route can 404 it (#128, TC-13)", async () => {
    // This is the regression: a deny-list gates only known protected
    // prefixes, so anything not on that list — including a path that does
    // not exist at all — must fall through as `true` rather than redirect
    // to login. An allow-list got this backwards and sent anonymous 404s to
    // the login page instead.
    expect(await run("/de/this-route-does-not-exist-xyz", false)).toBe(true);
  });

  it("lets an unsupported locale through so [locale]/layout.tsx can 404 it, instead of redirecting to login (#127, #128 round 2)", async () => {
    // The old regex stripped ANY two-letter segment, not just a supported
    // one: `/fr/dashboard` became `/dashboard`, matched the `dashboard`
    // gated prefix, and redirected to `/fr/auth/login` — the same class of
    // regression TC-13 above fixed, in a narrower form the directory-
    // enumeration guard below cannot see (it only probes `/de/<segment>`).
    // Without that redirect, [locale]/layout.tsx rejects `fr` (it is not in
    // routing.locales) and Next renders its 404 instead.
    expect(await run("/fr/dashboard", false)).toBe(true);
  });

  describe("invite-gated registration routes (#29, I9)", () => {
    const OPENED = ["/api/access-request", "/api/internal/purge-access-requests"];
    // Near-misses of the two opened paths. Each must stay behind the anonymous
    // 401 — a prefix-shaped allow (`startsWith`) would open every one of them.
    const NOT_OPENED = [
      "/api/access-requests/x",
      "/api/access-request/x",
      "/api/access-requests",
      "/api/internal/purge-access-requests/x",
      "/api/internal/x",
    ];

    it.each(OPENED)("lets an anonymous request through to %s", async (pathname) => {
      expect(await run(pathname, false)).toBe(true);
    });

    it.each(OPENED)(
      "lets an anonymous request through to %s under a locale prefix",
      async (pathname) => {
        // The match is on the locale-stripped pathname, like /api/health.
        expect(await run(`/de${pathname}`, false)).toBe(true);
      },
    );

    it.each(NOT_OPENED)(
      "answers anonymous %s with 401 JSON, never a redirect",
      async (pathname) => {
        const res = (await run(pathname, false)) as Response;
        expect(res).toBeInstanceOf(Response);
        expect(res.status).toBe(401);
        expect(res.headers.get("location")).toBeNull();
        expect(await res.json()).toEqual({ error: "UNAUTHORIZED" });
      },
    );

    it("lets a signed-in request to /api/admin/... through (the route does its own DB role check)", async () => {
      expect(await run("/api/admin/access-requests/x", true)).toBe(true);
    });

    it("answers an anonymous /api/admin/... request with 401", async () => {
      const res = (await run("/api/admin/access-requests/x", false)) as Response;
      expect(res.status).toBe(401);
    });

    it("redirects an anonymous /de/admin page to the German login", async () => {
      const res = (await run("/de/admin/access-requests/x", false)) as Response;
      expect(res).toBeInstanceOf(Response);
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/de/auth/login");
    });

    it("keeps the locale when redirecting an anonymous /en/admin page", async () => {
      const res = (await run("/en/admin/access-requests/x", false)) as Response;
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/en/auth/login");
    });

    it("lets a signed-in request to an /admin page through", async () => {
      expect(await run("/de/admin/access-requests/x", true)).toBe(true);
    });
  });

  it("gates every directory that actually exists under (app), not a hand-maintained copy of the list", async () => {
    const segments = protectedAppSegments();
    // Guard against the directory scan itself silently finding nothing — an
    // empty list would make the loop below pass vacuously.
    expect(segments.length).toBeGreaterThan(0);

    for (const segment of segments) {
      const result = await run(`/de/${segment}`, false);
      expect(result, `expected /de/${segment} to redirect an anonymous visitor`).toBeInstanceOf(
        Response,
      );
      expect((result as Response).status).toBe(307);
    }
  });
});
