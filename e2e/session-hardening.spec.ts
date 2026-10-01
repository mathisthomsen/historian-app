import { request as apiRequest, expect, test } from "@playwright/test";

import { loginAsAdmin, resetAuthState } from "./helpers/auth";

// Shares the seeded admin's login/sign-out state across tests in this file —
// same reasoning as e2e/auth.spec.ts's serial mode.
test.describe.configure({ mode: "serial" });

const BASE_URL = "http://localhost:3000";

test.beforeEach(resetAuthState);

// ---------------------------------------------------------------------------
// Anonymous access to protected routes
// ---------------------------------------------------------------------------
test.describe("Anonymous access to protected routes", () => {
  test("anonymous request to a protected route gets a real HTTP redirect", async ({ request }) => {
    const res = await request.get("/de/dashboard", { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toContain("/de/auth/login");
  });

  test("anonymous API request gets 401, not a redirect", async ({ request }) => {
    const res = await request.get("/api/persons", { maxRedirects: 0 });
    expect(res.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Session replay after sign-out — automates GHSA-h32c-m6mx-pmw6.
//
// A session cookie captured before sign-out must be refused afterwards. The
// replay is issued from a *fresh* APIRequestContext (via apiRequest.newContext,
// not the `page`'s own context) carrying only that captured cookie — the
// signed-out browser context's already-cleared jar cannot be what makes this
// pass.
// ---------------------------------------------------------------------------
test.describe("Session replay guard", () => {
  test("a session cookie captured before sign-out is refused after sign-out", async ({
    page,
    context,
  }) => {
    await loginAsAdmin(page);

    const cookiesAfterLogin = await context.cookies();
    const sessionCookie = cookiesAfterLogin.find((cookie) =>
      /^(__Secure-)?(authjs|next-auth)\.session-token$/.test(cookie.name),
    );
    if (!sessionCookie) {
      throw new Error(
        "session-hardening: no session cookie present after login — cannot exercise the replay guard",
      );
    }

    // Control: prove the captured cookie is a live, working credential before
    // sign-out. Without this, a 401 after sign-out would be equally
    // consistent with the cookie never having worked at all — the same
    // vacuous-assertion trap TC-AUTH-13 (e2e/auth.spec.ts) documents.
    const preSignOut = await apiRequest.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Cookie: `${sessionCookie.name}=${sessionCookie.value}` },
    });
    try {
      const res = await preSignOut.get("/api/persons");
      expect(res.status()).toBe(200);
    } finally {
      await preSignOut.dispose();
    }

    // Synchronise on the sign-out request itself, not the navigation it
    // triggers (same reasoning as TC-AUTH-13 in e2e/auth.spec.ts).
    const signOut = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/auth/signout" &&
        response.request().method() === "POST",
      { timeout: 10_000 },
    );
    await page.getByRole("button", { name: "Abmelden" }).click();
    await signOut;

    const replay = await apiRequest.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Cookie: `${sessionCookie.name}=${sessionCookie.value}` },
    });
    try {
      const res = await replay.get("/api/persons");
      expect(res.status()).toBe(401);
    } finally {
      await replay.dispose();
    }
  });

  // The test above proves the replay is refused at least once — but it reads
  // the response and throws the context away, so it cannot see what next-auth
  // put in that response's Set-Cookie header. This is the escape from
  // GHSA-h32c-m6mx-pmw6 that all six per-task reviews missed: the session
  // action re-signs the JWT on *every* read, unconditionally, even for a
  // request it is about to refuse — so the 401 above still ships a freshly
  // stamped cookie. A client that honours Set-Cookie (this test uses
  // `storageState` so the context's own jar does) would carry that cookie
  // into its next request and be admitted.
  //
  // Fixed by comparing revocation against `authTime` (stamped once, at
  // sign-in) instead of `iat` (overwritten by every re-encode) — see
  // `src/auth.config.ts`. Do not weaken this to a single request: a single
  // 401 does not distinguish "revoked" from "revoked, and about to un-revoke
  // itself".
  test("a captured cookie stays refused across repeated requests from a client that persists Set-Cookie", async ({
    page,
    context,
  }) => {
    await loginAsAdmin(page);

    const cookiesAfterLogin = await context.cookies();
    const sessionCookie = cookiesAfterLogin.find((cookie) =>
      /^(__Secure-)?(authjs|next-auth)\.session-token$/.test(cookie.name),
    );
    if (!sessionCookie) {
      throw new Error(
        "session-hardening: no session cookie present after login — cannot exercise the replay guard",
      );
    }

    const signOut = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/auth/signout" &&
        response.request().method() === "POST",
      { timeout: 10_000 },
    );
    await page.getByRole("button", { name: "Abmelden" }).click();
    await signOut;

    // storageState (not extraHTTPHeaders) seeds this context's own cookie
    // jar, so a Set-Cookie on the first response is stored and sent on the
    // second request — exactly what a browser, a proxy, or `curl -c/-b` does.
    const persistent = await apiRequest.newContext({
      baseURL: BASE_URL,
      storageState: {
        cookies: [
          {
            name: sessionCookie.name,
            value: sessionCookie.value,
            domain: sessionCookie.domain,
            path: sessionCookie.path,
            expires: sessionCookie.expires,
            httpOnly: sessionCookie.httpOnly,
            secure: sessionCookie.secure,
            sameSite: sessionCookie.sameSite,
          },
        ],
        origins: [],
      },
    });
    try {
      const first = await persistent.get("/api/persons");
      expect(first.status()).toBe(401);

      const second = await persistent.get("/api/persons");
      expect(second.status()).toBe(401);
    } finally {
      await persistent.dispose();
    }
  });

  // -------------------------------------------------------------------------
  // The page path, which is what #27 actually describes.
  //
  // The two tests above exercise `/api/persons`. #27's symptom was a *page*:
  // `/de/dashboard` rendered with authenticated chrome ("Willkommen, Evidoxa
  // Admin!" and a working sign-out button) after logout had already navigated
  // away. Pages and API routes take different branches of `authorized()` — a
  // 307 redirect versus a 401 body — and the page additionally has its own
  // `requireUserOrRedirect()`. Proving the API branch says nothing about the
  // branch the reported symptom came from.
  //
  // This test is deliberately self-validating. It replays the captured cookie
  // *before* signing out and requires a 200 first. Without that, a cookie that
  // was never valid, a wrong cookie name, or a replay context that silently
  // sends nothing would all produce the same "refused" result and the test
  // would pass while asserting nothing.
  // -------------------------------------------------------------------------
  test("a captured cookie cannot render the protected page after sign-out (#27)", async ({
    page,
    context,
  }) => {
    await loginAsAdmin(page);

    const sessionCookie = (await context.cookies()).find((cookie) =>
      /^(__Secure-)?(authjs|next-auth)\.session-token$/.test(cookie.name),
    );
    if (!sessionCookie) {
      throw new Error(
        "session-hardening: no session cookie present after login — cannot exercise the replay guard",
      );
    }

    const replayContext = async () =>
      apiRequest.newContext({
        baseURL: BASE_URL,
        storageState: {
          cookies: [
            {
              name: sessionCookie.name,
              value: sessionCookie.value,
              domain: sessionCookie.domain,
              path: sessionCookie.path,
              expires: sessionCookie.expires,
              httpOnly: sessionCookie.httpOnly,
              secure: sessionCookie.secure,
              sameSite: sessionCookie.sameSite,
            },
          ],
          origins: [],
        },
      });

    // Non-vacuity: while the session is live, this exact replay reaches the page.
    const beforeSignOut = await replayContext();
    try {
      const live = await beforeSignOut.get("/de/dashboard", { maxRedirects: 0 });
      expect(
        live.status(),
        "replayed cookie should reach the dashboard while the session is live — " +
          "if this is not 200, the rest of this test proves nothing",
      ).toBe(200);
    } finally {
      await beforeSignOut.dispose();
    }

    const signOut = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/auth/signout" &&
        response.request().method() === "POST",
      { timeout: 10_000 },
    );
    await page.getByRole("button", { name: "Abmelden" }).click();
    await signOut;

    // Twice, from a jar that persists Set-Cookie: `@auth/core` re-signs the
    // token on every session read and `handleAuth` appends that Set-Cookie to
    // every response, so a single request cannot show whether the cookie was
    // refreshed back into validity. This is the mechanism recorded on #27.
    const afterSignOut = await replayContext();
    try {
      for (const attempt of [1, 2]) {
        const res = await afterSignOut.get("/de/dashboard", { maxRedirects: 0 });
        expect(res.status(), `replay attempt ${attempt} after sign-out`).toBe(307);
        expect(res.headers()["location"], `replay attempt ${attempt} after sign-out`).toContain(
          "/de/auth/login",
        );
      }
    } finally {
      await afterSignOut.dispose();
    }
  });
});
