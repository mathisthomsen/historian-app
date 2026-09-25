import { request as apiRequest, expect, test, type Page } from "@playwright/test";

import { resetRateLimits } from "./helpers/db";

// Shares the seeded admin's login/sign-out state across tests in this file —
// same reasoning as e2e/auth.spec.ts's serial mode.
test.describe.configure({ mode: "serial" });

const BASE_URL = "http://localhost:3000";
const SEED_EMAIL = "admin@evidoxa.dev";
const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Demo1234!";

// Helper: login with the seeded admin account (matches e2e/auth.spec.ts).
async function loginAsAdmin(page: Page) {
  await page.goto("/de/auth/login");
  await page.getByLabel("E-Mail").fill(SEED_EMAIL);
  await page.getByLabel("Passwort", { exact: true }).fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/de\/dashboard/, { timeout: 15_000 });
}

// Clear cookies, localStorage, and rate-limit counters before each test so
// sequential login attempts never exhaust the sliding-window budget.
test.beforeEach(async ({ context, page }) => {
  await resetRateLimits();
  await context.clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

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
});
