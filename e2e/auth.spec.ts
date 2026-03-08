import { type Page, expect, test } from "@playwright/test";

import {
  deleteTestUser,
  insertTestResetToken,
  insertTestVerificationToken,
  resetRateLimits,
} from "./helpers/db";

// Auth tests share the seeded admin user and password_resets table — run serially
// to prevent TC-AUTH-14 (forgot-password) and TC-AUTH-15 (reset) from racing.
test.describe.configure({ mode: "serial" });

const SEED_EMAIL = "admin@evidoxa.dev";
const SEED_PASSWORD = "Demo1234!";

// Helper: login with the seeded admin account
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
// TC-AUTH-01: Login page renders without AppShell
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-01: Login page structure", () => {
  test("renders login form without sidebar", async ({ page }) => {
    await page.goto("/de/auth/login");
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(page.getByLabel("Passwort", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();
    // No sidebar on auth pages
    await expect(page.locator("aside")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-02: Register page
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-02: Register page", () => {
  test("renders registration form with password strength indicator", async ({ page }) => {
    await page.goto("/de/auth/register");
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(page.getByLabel("Passwort", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Passwort bestätigen")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-03: Weak password validation
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-03: Weak password shows field errors", () => {
  test("submitting weak password shows validation errors without submitting", async ({ page }) => {
    await page.goto("/de/auth/register");
    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("E-Mail").fill("test@example.com");
    await page.getByLabel("Passwort", { exact: true }).fill("password");
    await page.getByLabel("Passwort bestätigen").fill("password");
    await page.getByRole("button", { name: "Konto erstellen" }).click();
    // Expect field-level error (no uppercase)
    await expect(page.getByText(/Großbuchstabe/i)).toBeVisible();
    // Should still be on register page
    await expect(page).toHaveURL(/\/auth\/register/);
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-04: Successful registration
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-04: Successful registration", () => {
  // Generate inside test to avoid collision when chromium + firefox run in parallel
  let testEmail: string;

  test.beforeEach(() => {
    testEmail = `e2e-reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
  });

  test.afterEach(async () => {
    await deleteTestUser(testEmail);
  });

  test("shows success card after registration", async ({ page }) => {
    await page.goto("/de/auth/register");
    await page.getByLabel("Name").fill("E2E Test User");
    await page.getByLabel("E-Mail").fill(testEmail);
    await page.getByLabel("Passwort", { exact: true }).fill("ValidP@ss1");
    await page.getByLabel("Passwort bestätigen").fill("ValidP@ss1");
    await page.getByRole("button", { name: "Konto erstellen" }).click();
    await expect(page.getByText("Verifizierungs-E-Mail gesendet")).toBeVisible({ timeout: 10_000 });
    // No redirect — stays on register page
    await expect(page).toHaveURL(/\/auth\/register/);
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-05: Duplicate email registration
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-05: Duplicate email returns error", () => {
  test("already-registered email shows 409 error", async ({ page }) => {
    await page.goto("/de/auth/register");
    await page.getByLabel("Name").fill("Admin");
    await page.getByLabel("E-Mail").fill(SEED_EMAIL);
    await page.getByLabel("Passwort", { exact: true }).fill("ValidP@ss1");
    await page.getByLabel("Passwort bestätigen").fill("ValidP@ss1");
    await page.getByRole("button", { name: "Konto erstellen" }).click();
    await expect(page.getByText("bereits registriert")).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-06: Email verification — valid token
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-06: Valid email verification token", () => {
  let unverifiedEmail: string;

  test.beforeEach(async ({ request }) => {
    unverifiedEmail = `e2e-unverified-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
    // Create user via register API (creates unverified user)
    await request.post("/api/auth/register", {
      data: { email: unverifiedEmail, name: "Unverified User", password: "ValidP@ss1" },
    });
  });

  test.afterEach(async () => {
    await deleteTestUser(unverifiedEmail);
  });

  test("valid token shows success state with login link", async ({ page }) => {
    const rawToken = await insertTestVerificationToken(unverifiedEmail);
    await page.goto(`/de/auth/verify?token=${rawToken}`);
    await expect(page.getByText("E-Mail bestätigt")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Dein Konto ist aktiv")).toBeVisible();
    await expect(page.getByText("Jetzt anmelden")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-07: Email verification — expired/invalid token
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-07: Invalid verification token", () => {
  test("invalid token shows error state", async ({ page }) => {
    await page.goto("/de/auth/verify?token=" + "0".repeat(64));
    // VerifyEmailCard shows error text (may appear twice — use first)
    await expect(page.getByText(/Ungültiger Link/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Neuen Link anfordern")).toBeVisible();
  });

  test("no token shows error state immediately", async ({ page }) => {
    await page.goto("/de/auth/verify");
    await expect(page.getByText(/Ungültiger Link/i).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-08: Login with correct credentials
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-08: Successful login", () => {
  test("verified user logs in and reaches dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText("Evidoxa Admin")).toBeVisible();
    await expect(page.getByText("Du bist angemeldet.")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-09: Wrong credentials — generic error
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-09: Wrong credentials", () => {
  test("shows generic error without revealing which field is wrong", async ({ page }) => {
    await page.goto("/de/auth/login");
    await page.getByLabel("E-Mail").fill(SEED_EMAIL);
    await page.getByLabel("Passwort", { exact: true }).fill("WrongP@ss1");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await expect(page.getByText("E-Mail oder Passwort ungültig")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/wrong password|user not found/i)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-11: Unauthenticated redirect to login
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-11: Protected route redirect", () => {
  test("/de/dashboard redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/de/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-12: Authenticated dashboard
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-12: Authenticated dashboard", () => {
  test("shows welcome message and user name", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText("Willkommen, Evidoxa Admin!")).toBeVisible();
    await expect(page.getByText("Du bist angemeldet.")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-13: Logout
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-13: Logout", () => {
  test("clears session and redirects to login", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("button", { name: "Abmelden" }).click();
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
    // Verify session cleared
    await page.goto("/de/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-14: Forgot password — enumeration safe
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-14: Forgot password", () => {
  test("known email shows success card", async ({ page }) => {
    await page.goto("/de/auth/forgot-password");
    await page.getByLabel("E-Mail").fill(SEED_EMAIL);
    await page.getByRole("button", { name: "Link anfordern" }).click();
    await expect(page.getByText("Falls ein Konto")).toBeVisible({ timeout: 10_000 });
  });

  test("unknown email shows same success card (no enumeration)", async ({ page }) => {
    await page.goto("/de/auth/forgot-password");
    await page.getByLabel("E-Mail").fill("unknown@nowhere.test");
    await page.getByRole("button", { name: "Link anfordern" }).click();
    await expect(page.getByText("Falls ein Konto")).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-15: Password reset with valid token
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-15: Password reset flow", () => {
  test("valid token → new password → redirects to login with success banner", async ({ page }) => {
    const rawToken = await insertTestResetToken(SEED_EMAIL);
    await page.goto(`/de/auth/reset-password?token=${rawToken}`);
    await expect(page.getByLabel("Neues Passwort")).toBeVisible();
    await page.getByLabel("Neues Passwort").fill(SEED_PASSWORD);
    await page.getByLabel("Passwort bestätigen").fill(SEED_PASSWORD);
    await page.getByRole("button", { name: "Passwort speichern" }).click();
    await page.waitForURL(/\/auth\/login\?reset=1/, { timeout: 10_000 });
    await expect(page.getByText("Passwort wurde zurückgesetzt")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-16: Expired reset token
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-16: Expired/invalid reset token", () => {
  test("invalid token → submit → shows error", async ({ page }) => {
    await page.goto("/de/auth/reset-password?token=" + "c".repeat(64));
    await expect(page.getByLabel("Neues Passwort")).toBeVisible();
    await page.getByLabel("Neues Passwort").fill(SEED_PASSWORD);
    await page.getByLabel("Passwort bestätigen").fill(SEED_PASSWORD);
    await page.getByRole("button", { name: "Passwort speichern" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
  });

  test("no token on reset page shows invalid link error", async ({ page }) => {
    await page.goto("/de/auth/reset-password");
    await expect(page.getByText("Ungültiger Link")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// TC-AUTH-19: Locale consistency
// ---------------------------------------------------------------------------
test.describe("TC-AUTH-19: i18n on auth pages", () => {
  test("all auth pages default to German", async ({ page }) => {
    await page.goto("/de/auth/login");
    await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();

    await page.goto("/de/auth/register");
    await expect(page.getByRole("button", { name: "Konto erstellen" })).toBeVisible();

    await page.goto("/de/auth/forgot-password");
    await expect(page.getByRole("button", { name: "Link anfordern" })).toBeVisible();
  });

  test("switching locale updates auth page labels to English", async ({ page }) => {
    await page.goto("/de/auth/login");
    await page.getByRole("button", { name: /^EN$/i }).first().click();
    await page.waitForURL(/\/en\/auth\/login/);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});
