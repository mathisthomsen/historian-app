/**
 * Playwright visual regression helpers.
 *
 * Screenshot names follow the convention: {page-slug}-{viewport-width}.png
 * Dark mode screenshots append "-dark" before the extension.
 *
 * Baselines are stored in e2e/visual/baselines/{browser}/{theme}/ and are
 * git-tracked. Run `pnpm test:e2e:visual:update` to regenerate.
 */

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Viewport presets
// ---------------------------------------------------------------------------

export const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
  desktopSm: { width: 1024, height: 768 },
  desktopWide: { width: 1536, height: 864 },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;

// ---------------------------------------------------------------------------
// Screenshot options
// ---------------------------------------------------------------------------

export interface ScreenshotOptions {
  /** Maximum number of pixels allowed to differ. Default: 100 */
  maxDiffPixels?: number;
  /** Per-pixel color threshold (0–1). Default: 0.2 */
  threshold?: number;
}

const DEFAULT_SCREENSHOT_OPTIONS: Required<ScreenshotOptions> = {
  maxDiffPixels: 100,
  threshold: 0.2,
};

// ---------------------------------------------------------------------------
// Component screenshot
// ---------------------------------------------------------------------------

/**
 * Take a screenshot of a specific element identified by CSS selector.
 * The element is waited for before screenshotting.
 *
 * @param page    - Playwright Page
 * @param selector - CSS selector for the element to capture
 * @param name    - Screenshot base name (no extension). Will become `{name}.png`.
 * @param options - Optional diff thresholds
 */
export async function screenshotComponent(
  page: Page,
  selector: string,
  name: string,
  options: ScreenshotOptions = {},
): Promise<void> {
  const el = page.locator(selector).first();
  await el.waitFor({ state: "visible" });

  const opts = { ...DEFAULT_SCREENSHOT_OPTIONS, ...options };

  await expect(el).toHaveScreenshot(`${name}.png`, {
    maxDiffPixels: opts.maxDiffPixels,
    threshold: opts.threshold,
    animations: "disabled",
  });
}

// ---------------------------------------------------------------------------
// Full-page screenshot
// ---------------------------------------------------------------------------

/**
 * Take a full-page screenshot with a consistent viewport and frozen animations.
 *
 * @param page    - Playwright Page
 * @param name    - Screenshot base name (no extension). Will become `{name}.png`.
 * @param options - Optional diff thresholds
 */
export async function screenshotPage(
  page: Page,
  name: string,
  options: ScreenshotOptions = {},
): Promise<void> {
  const opts = { ...DEFAULT_SCREENSHOT_OPTIONS, ...options };

  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: true,
    maxDiffPixels: opts.maxDiffPixels,
    threshold: opts.threshold,
    animations: "disabled",
  });
}

// ---------------------------------------------------------------------------
// Theme helpers
// ---------------------------------------------------------------------------

/**
 * Activate dark mode on a page by adding the `.dark` class to `<html>`.
 * Should be called after navigation so the DOM is available.
 */
export async function enableDarkMode(page: Page): Promise<void> {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
  });
}

/**
 * Deactivate dark mode on a page.
 */
export async function disableDarkMode(page: Page): Promise<void> {
  await page.emulateMedia({ colorScheme: "light" });
  await page.evaluate(() => {
    document.documentElement.classList.remove("dark");
  });
}

/**
 * Screenshot a page in both light and dark mode.
 * Names the screenshots `{name}-light.png` and `{name}-dark.png`.
 *
 * @param page    - Playwright Page (should already be on the target URL)
 * @param name    - Base name for screenshots (no theme suffix, no extension)
 * @param options - Optional diff thresholds
 */
export async function screenshotBothThemes(
  page: Page,
  name: string,
  options: ScreenshotOptions = {},
): Promise<void> {
  const opts = { ...DEFAULT_SCREENSHOT_OPTIONS, ...options };

  // Light mode (default)
  await disableDarkMode(page);
  await expect(page).toHaveScreenshot(`${name}-light.png`, {
    fullPage: true,
    maxDiffPixels: opts.maxDiffPixels,
    threshold: opts.threshold,
    animations: "disabled",
  });

  // Dark mode
  await enableDarkMode(page);
  await expect(page).toHaveScreenshot(`${name}-dark.png`, {
    fullPage: true,
    maxDiffPixels: opts.maxDiffPixels,
    threshold: opts.threshold,
    animations: "disabled",
  });

  // Reset to light
  await disableDarkMode(page);
}

// ---------------------------------------------------------------------------
// Viewport iteration helpers
// ---------------------------------------------------------------------------

/**
 * Run a callback at each of the standard viewports.
 * The viewport is set before calling the callback and restored afterward.
 *
 * @param page      - Playwright Page
 * @param viewports - Subset of VIEWPORTS keys to iterate. Defaults to all.
 * @param fn        - Async callback receiving the page and current viewport name
 */
export async function forEachViewport(
  page: Page,
  viewports: ViewportName[],
  fn: (page: Page, viewport: ViewportName) => Promise<void>,
): Promise<void> {
  for (const key of viewports) {
    await page.setViewportSize(VIEWPORTS[key]);
    await fn(page, key);
  }
}
