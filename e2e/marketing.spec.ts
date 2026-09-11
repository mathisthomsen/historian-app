import { expect, test } from "@playwright/test";

test.describe("marketing landing page", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("renders the landing page at /de instead of redirecting to login", async ({ page }) => {
    await page.goto("/de");
    await expect(page).toHaveURL(/\/de$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("renders the English landing page", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("advances the rail with the next paddle and announces position", async ({ page }) => {
    await page.goto("/de");
    const next = page.getByRole("button", { name: "Weiter" });
    await expect(page.getByRole("button", { name: "Zurück" })).toBeDisabled();
    await next.click();
    // Scoped to #highlights: the root layout's Sonner <Toaster> also renders
    // an aria-live="polite" region page-wide, which makes the unscoped
    // selector a strict-mode violation (two matches) — this is not #61.
    await expect(page.locator('#highlights [aria-live="polite"]')).toContainText("2");
  });

  test("reaches the fourth panel and disables the next paddle there", async ({ page }) => {
    await page.goto("/de");
    const next = page.getByRole("button", { name: "Weiter" });
    await next.click();
    await next.click();
    await next.click();
    await expect(next).toBeDisabled();
  });

  test("hero CTA goes to registration", async ({ page }) => {
    await page.goto("/de");
    await page.getByRole("link", { name: "Konto erstellen" }).first().click();
    await expect(page).toHaveURL(/\/de\/auth\/register$/);
  });

  test("footer legal links resolve", async ({ page }) => {
    await page.goto("/de");
    for (const [name, path] of [
      ["Impressum", "/de/impressum"],
      ["Datenschutz", "/de/datenschutz"],
    ] as const) {
      await page.goto("/de");
      await page.getByRole("link", { name }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }
  });

  test("changelog lists at least one release", async ({ page }) => {
    await page.goto("/de/changelog");
    await expect(page.getByText(/0\.1\.0/)).toBeVisible();
  });

  test("respects reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/de");
    const reveal = page.locator(".reveal").first();
    await expect(reveal).toHaveCSS("opacity", "1");
  });

  test("page does not scroll horizontally at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/de");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});
