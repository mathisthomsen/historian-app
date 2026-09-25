import type { BrowserContext, Page } from "@playwright/test";

import { resetRateLimits } from "./db";

/** Shared across every auth-flow E2E file that logs in as the seeded admin. */
export const SEED_EMAIL = "admin@evidoxa.dev";
export const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Demo1234!";

/** Log in with the seeded admin account and wait for the dashboard to load. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/de/auth/login");
  await page.getByLabel("E-Mail").fill(SEED_EMAIL);
  await page.getByLabel("Passwort", { exact: true }).fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/de\/dashboard/, { timeout: 15_000 });
}

/**
 * Clear cookies, localStorage, and rate-limit counters before each test so
 * sequential login attempts never exhaust the sliding-window budget. Intended
 * for `test.beforeEach(resetAuthState)`.
 */
export async function resetAuthState({
  context,
  page,
}: {
  context: BrowserContext;
  page: Page;
}): Promise<void> {
  await resetRateLimits();
  await context.clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
}
