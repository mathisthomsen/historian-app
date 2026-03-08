import { expect, test } from "@playwright/test";

import { resetRateLimits } from "./helpers/db";

// Clear cookies, localStorage, and rate-limit counters before each test.
test.beforeEach(async ({ context, page }) => {
  await resetRateLimits();
  await context.clearCookies();
  // Clear localStorage to prevent theme or other persisted state from leaking
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

test.describe("TC-01: Root redirect", () => {
  test("/ redirects to /de", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/de/);
  });
});

// NOTE (Epic 1.3): /de now redirects to /de/auth/login.
// Auth layout renders LocaleSwitcher + ThemeToggle — shell tests now target /de/auth/login.

test.describe("TC-02: German locale auth page", () => {
  test("/de/auth/login renders in German with Evidoxa branding", async ({ page }) => {
    await page.goto("/de/auth/login");
    await expect(page.getByText("Evidoxa", { exact: true })).toBeVisible();
    // Login form fields confirm German locale
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(page.getByLabel("Passwort", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();
  });
});

test.describe("TC-03: English locale auth page", () => {
  test("/en/auth/login renders in English", async ({ page }) => {
    await page.goto("/en/auth/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});

test.describe("TC-04: Language switcher DE → EN", () => {
  test("clicking EN on auth page navigates to /en and changes text", async ({ page }) => {
    await page.goto("/de/auth/login");
    await page.getByRole("button", { name: /^EN$/i }).first().click();
    await expect(page).toHaveURL(/\/en/);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("switching to EN sets NEXT_LOCALE cookie", async ({ page, context }) => {
    await page.goto("/de/auth/login");
    await page.getByRole("button", { name: /^EN$/i }).first().click();
    await page.waitForURL(/\/en/);

    const cookies = await context.cookies();
    const localeCookie = cookies.find((c) => c.name === "NEXT_LOCALE");
    expect(localeCookie?.value).toBe("en");
  });
});

test.describe("TC-05: Language switcher EN → DE", () => {
  test("clicking DE from EN auth page navigates back to /de", async ({ page }) => {
    await page.goto("/en/auth/login");
    await page.getByRole("button", { name: /^DE$/i }).first().click();
    await expect(page).toHaveURL(/\/de/);
    await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();
  });
});

test.describe("TC-07: Component showcase", () => {
  test("/de/dev/showcase renders without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/de/dev/showcase");
    await expect(page.getByText("Komponentenübersicht")).toBeVisible();

    // Check all sections exist — use exact heading matches
    await expect(page.getByRole("heading", { name: "Schaltflächen" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Eingabefelder" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Abzeichen" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Karten", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dialoge" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Registerkarten" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tabellen" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Skelette" })).toBeVisible();

    // Table with 5 rows
    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(5);

    // Filter out React dev-mode hydration warnings (not functional errors)
    const fatalErrors = errors.filter(
      (e) => !e.includes("Warning") && !e.includes("hydration") && !e.includes("did not match"),
    );
    expect(fatalErrors).toHaveLength(0);
  });
});

test.describe("TC-08: Dialog", () => {
  test("dialog opens and closes in showcase", async ({ page }) => {
    await page.goto("/de/dev/showcase");
    await page.getByRole("button", { name: "Open Dialog" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Dialog Title")).toBeVisible();

    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});

test.describe("TC-09: Dark mode toggle", () => {
  test("theme toggle applies/removes dark class on html", async ({ page }) => {
    await page.goto("/de/auth/login");

    const html = page.locator("html");
    const initialClass = await html.getAttribute("class");

    await page.getByTestId("theme-toggle").click();
    await page.waitForTimeout(100);

    const afterClass = await html.getAttribute("class");
    expect(afterClass).not.toBe(initialClass);
  });
});

test.describe("TC-11: Sidebar collapse", () => {
  test("sidebar is visible on dashboard after login", async ({ page }) => {
    // Login with seeded demo account
    await page.goto("/de/auth/login");
    await page.getByLabel("E-Mail").fill("admin@evidoxa.dev");
    await page.getByLabel("Passwort", { exact: true }).fill("Demo1234!");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.waitForURL(/\/de\/dashboard/, { timeout: 15_000 });

    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    const initialWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(initialWidth).toBeGreaterThan(100);

    await page.getByTestId("sidebar-toggle").click();
    await page.waitForTimeout(300);

    const collapsedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(collapsedWidth).toBeLessThan(initialWidth);
  });
});

test.describe("TC-13: 404 page", () => {
  test("non-existent route shows 404 page", async ({ page }) => {
    await page.goto("/de/this-route-does-not-exist-xyz");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("Seite nicht gefunden")).toBeVisible();
  });
});

test.describe("TC-14: Tabs", () => {
  test("tab switching shows correct content", async ({ page }) => {
    await page.goto("/de/dev/showcase");

    await expect(page.getByText("Content of tab one.")).toBeVisible();
    await expect(page.getByText("Content of tab two.")).not.toBeVisible();

    await page.getByRole("tab", { name: "Tab Two" }).click();
    await expect(page.getByText("Content of tab two.")).toBeVisible();
    await expect(page.getByText("Content of tab one.")).not.toBeVisible();
  });
});
