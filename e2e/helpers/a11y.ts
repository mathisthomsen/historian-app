/**
 * Playwright accessibility testing helpers.
 * Uses @axe-core/playwright with WCAG 2.1 AA ruleset as the project baseline.
 */

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import type { Result } from "axe-core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface A11yOptions {
  /** axe rule IDs to disable for this check (use sparingly, document reasons). */
  disabledRules?: string[];
  /** axe rule IDs to enable in addition to the default WCAG 2.1 AA set. */
  includedRules?: string[];
  /** CSS selectors to exclude from the axe scan. */
  excludeSelectors?: string[];
}

// ---------------------------------------------------------------------------
// Default exclusions (applied to every scan)
// ---------------------------------------------------------------------------

/**
 * Elements excluded from every axe scan.
 * These are third-party components that manage their own accessibility or
 * known false-positive sources that are validated manually.
 */
const DEFAULT_EXCLUDES = [
  ".sonner-toast", // Sonner manages its own live-region a11y
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Run an axe accessibility audit on the full page and assert there are no
 * violations at WCAG 2.1 AA level.
 *
 * Formats violations into a readable error message when the assertion fails.
 */
export async function checkPageA11y(page: Page, options: A11yOptions = {}): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]);

  for (const selector of DEFAULT_EXCLUDES) {
    builder = builder.exclude(selector);
  }

  for (const selector of options.excludeSelectors ?? []) {
    builder = builder.exclude(selector);
  }

  if (options.disabledRules && options.disabledRules.length > 0) {
    builder = builder.disableRules(options.disabledRules);
  }

  const results = await builder.analyze();

  if (results.violations.length > 0) {
    const message = formatViolations(results.violations);
    expect(results.violations, message).toHaveLength(0);
  }
}

/**
 * Run an axe accessibility audit scoped to a specific CSS selector and
 * assert there are no violations at WCAG 2.1 AA level.
 */
export async function checkComponentA11y(
  page: Page,
  selector: string,
  options: A11yOptions = {},
): Promise<void> {
  let builder = new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .include(selector);

  for (const excludeSelector of options.excludeSelectors ?? []) {
    builder = builder.exclude(excludeSelector);
  }

  if (options.disabledRules && options.disabledRules.length > 0) {
    builder = builder.disableRules(options.disabledRules);
  }

  const results = await builder.analyze();

  if (results.violations.length > 0) {
    const message = formatViolations(results.violations);
    expect(results.violations, message).toHaveLength(0);
  }
}

// ---------------------------------------------------------------------------
// Internal formatting
// ---------------------------------------------------------------------------

function formatViolations(violations: Result[]): string {
  const lines: string[] = [`Found ${violations.length} accessibility violation(s):`, ""];

  for (const v of violations) {
    lines.push(`[${v.id}] ${v.help} (impact: ${v.impact ?? "unknown"})`);
    lines.push(`  Reference: ${v.helpUrl}`);
    for (const node of v.nodes) {
      lines.push(`  Element: ${node.target.join(", ")}`);
      if (node.failureSummary) {
        lines.push(`  Fix: ${node.failureSummary.replace(/\n/g, "\n         ")}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}
