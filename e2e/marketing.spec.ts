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

  test("pins the highlight stage and advances it as the page is scrolled", async ({ page }) => {
    // The stage only turns on at 64rem with motion allowed; below that the four
    // spreads stack and there is nothing to advance.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/de");

    const stage = page.locator("#highlights");
    await expect(stage).toHaveAttribute("data-enhanced", "true");

    const steps = stage.getByRole("navigation").getByRole("link");
    await expect(steps).toHaveCount(4);
    // aria-current, not opacity: it is a discrete value that settles with the
    // IntersectionObserver callback rather than mid-transition, so asserting on
    // it does not race the cross-fade.
    await expect(steps.nth(0)).toHaveAttribute("aria-current", "true");

    // Click the step link rather than scrolling to the sentinel: a sentinel is
    // a full viewport tall, so scrollIntoViewIfNeeded can settle anywhere
    // inside it (measured: it overshot past the end of the stage entirely).
    // Following the anchor puts the sentinel's top at the viewport top, which
    // is both deterministic and what a visitor actually does.
    await steps.nth(2).click();
    await expect(steps.nth(2)).toHaveAttribute("aria-current", "true");
    await expect(steps.nth(0)).not.toHaveAttribute("aria-current", "true");
    await expect(stage.locator('[data-slot="stage-panel"][data-active="true"]')).toContainText(
      "Quelle",
    );
  });

  test("reaches the fourth highlight, which the rail's paddles used to gate", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/de");
    const stage = page.locator("#highlights");
    const steps = stage.getByRole("navigation").getByRole("link");
    await steps.nth(3).click();
    await expect(steps.nth(3)).toHaveAttribute("aria-current", "true");
    // The rail's fourth panel used to be the one visitors never reached. Assert
    // it is genuinely on screen, not merely marked current.
    await expect(stage.locator('[data-slot="stage-panel"][data-active="true"]')).toContainText(
      "Alles kann mit allem verbunden sein.",
    );
  });

  test("stacks the highlights as readable spreads on a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/de");
    const stage = page.locator("#highlights");
    // No pinned stage on a phone: every panel is in normal flow and visible,
    // and there is no step navigation to get lost in.
    await expect(stage).toHaveAttribute("data-enhanced", "false");
    await expect(stage.getByRole("navigation")).toHaveCount(0);
    const panels = stage.locator('[data-slot="stage-panel"]');
    await expect(panels).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(panels.nth(i)).toBeVisible();
    }
  });

  test("keeps the highlights stacked when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/de");
    await expect(page.locator("#highlights")).toHaveAttribute("data-enhanced", "false");
  });

  test("the open-development band fills both columns on a desktop viewport", async ({ page }) => {
    // The band used to leave roughly 40% of the viewport empty to the right,
    // which read as content that had failed to load rather than as whitespace.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/de");
    const ledger = page.locator('.editorial-grid [data-slot="specimen"]').last();
    await ledger.scrollIntoViewIfNeeded();
    const box = await ledger.boundingBox();
    expect(box).not.toBeNull();
    // Its left edge sits past the horizontal midpoint: it is genuinely in the
    // second column, not stacked underneath the prose.
    expect(box!.x).toBeGreaterThan(1440 / 2 - 100);
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

test.describe("marketing landing page — no JS (F2)", () => {
  // Regression guard for F2: the only prior protection for the .js reveal
  // gate was a regex over globals.css (Reveal.test.tsx), which tests the
  // stylesheet's text, not what a browser actually computes. A visitor with
  // JS disabled never gets the `.js` class added, so every `.reveal` must
  // stay at its unhidden, opacity: 1 default.
  test.use({ javaScriptEnabled: false });

  test("reveals are all visible without JavaScript", async ({ page }) => {
    await page.goto("/de");
    const reveals = page.locator(".reveal");
    const count = await reveals.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(reveals.nth(i)).toHaveCSS("opacity", "1");
    }
  });

  test("the highlight stage falls back to four readable spreads", async ({ page }) => {
    // data-enhanced can only become "true" inside a mount effect, so with no
    // JS the server's value survives and the CSS lays the panels out in normal
    // flow. Without this the panels would be stacked in one grid cell at
    // opacity 0, i.e. a blank band.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/de");
    const stage = page.locator("#highlights");
    await expect(stage).toHaveAttribute("data-enhanced", "false");
    const panels = stage.locator('[data-slot="stage-panel"]');
    await expect(panels).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expect(panels.nth(i)).toHaveCSS("opacity", "1");
    }
  });
});
