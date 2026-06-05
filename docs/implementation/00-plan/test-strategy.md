# Evidoxa Design System -- Test Strategy

**Date:** 2026-04-02
**Author:** Staff Frontend Engineer (Technical Lead)
**Branch:** `2-5_design_system`
**Status:** Ready for execution
**Upstream:** `implementation-plan.md`, `docs/design-system/04-design-system/tokens.md`

---

## Table of Contents

1. [Visual Regression Testing](#1-visual-regression-testing)
2. [Accessibility Testing](#2-accessibility-testing)
3. [CSS Token Testing](#3-css-token-testing)
4. [Component Testing](#4-component-testing)
5. [Responsive Testing](#5-responsive-testing)
6. [Motion Testing](#6-motion-testing)
7. [Test Naming Convention](#7-test-naming-convention)
8. [CI Integration](#8-ci-integration)
9. [What NOT to Test](#9-what-not-to-test)

---

## 1. Visual Regression Testing

### Approach

Use Playwright's built-in `toHaveScreenshot()` API to capture and compare full-page and component-level screenshots. Baselines are captured once after the design system is fully applied (end of Layer 5), then compared on every subsequent change.

### Directory Structure

```
e2e/
  visual/
    baselines/           # Git-tracked golden screenshots (per-platform)
      chromium/
        light/
          auth-login-1280.png
          persons-list-1280.png
          persons-detail-1280.png
          ...
        dark/
          auth-login-1280.png
          ...
      firefox/
        light/
        dark/
    visual-regression.spec.ts    # Main visual regression test file
```

### Screenshot Naming Convention

```
{page-slug}-{viewport-width}.png
```

Examples:

- `auth-login-1280.png`
- `persons-list-768.png`
- `events-detail-dark-1280.png`
- `dashboard-320.png`

### Multi-Theme Strategy

Every visual regression test runs twice: once with the default theme (light) and once with `.dark` class forced on `<html>`. This is accomplished by a test fixture:

```typescript
// e2e/helpers/visual.ts
import { test as base } from "@playwright/test";

type ThemeFixture = { theme: "light" | "dark" };

export const test = base.extend<ThemeFixture>({
  theme: ["light", { option: true }],
});

// Usage in spec:
for (const theme of ["light", "dark"] as const) {
  test.describe(`Theme: ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      if (theme === "dark") {
        await page.emulateMedia({ colorScheme: "dark" });
        await page.evaluate(() => document.documentElement.classList.add("dark"));
      }
    });
    // ... screenshot tests
  });
}
```

### Multi-Viewport Strategy

Each page is screenshotted at four viewports:

- 320px (mobile)
- 768px (tablet)
- 1024px (desktop, sidebar transition breakpoint)
- 1280px (desktop, two-column detail layout breakpoint)

### Baseline Update Workflow

1. Run `pnpm test:e2e:visual --update-snapshots` to regenerate baselines.
2. Review all changed screenshots in the PR diff (GitHub renders PNG diffs).
3. Commit updated baselines with the message `chore: update visual regression baselines`.
4. Never auto-update in CI -- baselines are manually curated.

### Threshold Configuration

```typescript
// In playwright.config.ts or per-assertion
expect(page).toHaveScreenshot("page-name-1280.png", {
  maxDiffPixels: 100, // Allow minor anti-aliasing differences
  threshold: 0.2, // Per-pixel color difference threshold (0-1)
  animations: "disabled", // Freeze all CSS animations for deterministic captures
});
```

### Pages to Screenshot

| Category       | Pages                                                    | Count                                                   |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| Auth           | login, register, verify, forgot-password, reset-password | 5                                                       |
| App (lists)    | dashboard, persons, events, sources, relations           | 5                                                       |
| App (detail)   | persons/[id], events/[id], sources/[id]                  | 3                                                       |
| App (forms)    | persons/new, events/new, sources/new                     | 3                                                       |
| App (settings) | settings/event-types, settings/relation-types            | 2                                                       |
| Error states   | not-found, error                                         | 2                                                       |
| **Total**      |                                                          | **20 pages x 4 viewports x 2 themes = 160 screenshots** |

---

## 2. Accessibility Testing

### 2.1 E2E Accessibility (Playwright + @axe-core/playwright)

Every page route is tested with axe-core in both themes. This catches real-browser rendering issues that component-level tests miss (z-index stacking, inherited styles, etc.).

**Helper file:**

```typescript
// e2e/helpers/a11y.ts
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export async function checkA11y(
  page: Page,
  options?: {
    excludeRules?: string[];
    includeRules?: string[];
  },
) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .exclude(".sonner-toast") // Sonner manages its own a11y
    .analyze();

  expect(results.violations).toEqual([]);
}
```

**Test file structure:**

```
e2e/
  design-system/
    a11y.spec.ts               # Full-page axe scans
    a11y-components.spec.ts    # Component-focused axe scans (modals, popovers)
```

**Test scope per layer:**

| Layer   | A11y Test Scope                                            |
| ------- | ---------------------------------------------------------- |
| Layer 2 | Base styles: focus ring visibility, color contrast on body |
| Layer 3 | Each component in isolation (via dev/showcase page)        |
| Layer 4 | AppShell with sidebar open/collapsed, breadcrumb nav       |
| Layer 5 | Every page route, both themes, logged-in state             |
| Layer 7 | Full regression: all pages, all viewports, all themes      |

### 2.2 Component Accessibility (Vitest + vitest-axe)

For fast feedback during development, component-level a11y checks run in Vitest using `vitest-axe`.

**Setup:**

```typescript
// src/test/axe-setup.ts
import "vitest-axe/extend-expect";
```

Add to `src/test/setup.ts`:

```typescript
import "./axe-setup";
```

**Usage in component tests:**

```typescript
import { axe } from "vitest-axe";
import { renderWithProviders } from "@/test/render";
import { Button } from "@/components/ui/button";

describe("Button a11y", () => {
  it("has no axe violations in default variant", async () => {
    const { container } = renderWithProviders(
      <Button>Click me</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no axe violations in icon-only variant", async () => {
    const { container } = renderWithProviders(
      <Button size="icon" aria-label="Close">X</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 2.3 WCAG Ruleset

All tests use the WCAG 2.1 AA ruleset as the baseline. Specific rules enabled:

| Rule Category   | axe Tags                    | What It Catches                                               |
| --------------- | --------------------------- | ------------------------------------------------------------- |
| Color contrast  | `wcag2aa`, `color-contrast` | Text/background ratios below 4.5:1 (normal) or 3:1 (large/UI) |
| Keyboard        | `wcag2a`, `keyboard`        | Missing focus management, tab order issues                    |
| ARIA            | `wcag2a`, `aria`            | Invalid ARIA attributes, missing roles                        |
| Name/role/value | `wcag2a`                    | Missing accessible names on interactive elements              |
| Structure       | `wcag2a`                    | Missing landmarks, heading hierarchy issues                   |

---

## 3. CSS Token Testing

### 3.1 Token Validation Utility

A custom utility parses `src/styles/globals.css` and validates the token system.

**File:** `src/test/tokens.ts`

```typescript
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const GLOBALS_CSS_PATH = resolve(process.cwd(), "src/styles/globals.css");

interface TokenDefinition {
  name: string;
  value: string;
  selector: string; // ":root" or ".dark"
}

/**
 * Parse all CSS custom property definitions from globals.css.
 * Returns separate maps for :root (@theme) and .dark scopes.
 */
export function parseTokens(): {
  light: Map<string, string>;
  dark: Map<string, string>;
} {
  const css = readFileSync(GLOBALS_CSS_PATH, "utf-8");
  // Parse @theme block for light mode tokens
  // Parse .dark block for dark mode overrides
  // Return maps of variable-name -> value
  // Implementation: regex-based extraction of --{name}: {value};
}

/**
 * Compute WCAG contrast ratio between two HSL color channel strings.
 * Input format: "245 40% 36%" (no hsl() wrapper).
 */
export function contrastRatio(foregroundHSL: string, backgroundHSL: string): number {
  // Convert HSL channels to sRGB
  // Compute relative luminance per WCAG formula
  // Return (L1 + 0.05) / (L2 + 0.05)
}

/**
 * Verify a specific contrast pair meets the required threshold.
 */
export function meetsContrast(fg: string, bg: string, threshold: 3 | 4.5 | 7): boolean {
  return contrastRatio(fg, bg) >= threshold;
}
```

### 3.2 Token Test File

**File:** `src/styles/__tests__/tokens.test.ts`

Tests are organized by token category:

```typescript
describe("Design System Tokens", () => {
  describe("Surface hierarchy", () => {
    it("foreground on background meets AAA (7:1) in light mode");
    it("foreground on background meets AAA (7:1) in dark mode");
    it("card-foreground on card meets AA (4.5:1) in both modes");
    it("popover-foreground on popover meets AA (4.5:1) in both modes");
  });

  describe("Brand colors", () => {
    it("primary-foreground on primary meets AAA in light mode");
    it("primary-foreground on primary meets AAA in dark mode");
    it("primary on background meets AA in both modes");
  });

  describe("Muted foreground", () => {
    it("muted-foreground on background meets AA (4.5:1) in light mode");
    it("muted-foreground on background meets AA (4.5:1) in dark mode");
    it("muted-foreground on muted meets AA (4.5:1) in light mode");
    it("muted-foreground on muted meets AA (4.5:1) in dark mode");
  });

  describe("Semantic colors", () => {
    for (const semantic of ["destructive", "success", "warning", "info"]) {
      it(`${semantic}-foreground on ${semantic}-background meets AA in light`);
      it(`${semantic}-foreground on ${semantic}-background meets AA in dark`);
      it(`${semantic} on background meets 3:1 for UI components in light`);
      it(`${semantic} on background meets 3:1 for UI components in dark`);
    }
  });

  describe("Certainty colors", () => {
    for (const level of ["certain", "probable", "possible", "unknown", "unevidenced"]) {
      it(`certainty-${level} on background meets 3:1 UI contrast in light`);
      it(`certainty-${level} on background meets 3:1 UI contrast in dark`);
      it(`certainty-${level}-foreground on certainty-${level}-background meets AA in light`);
      it(`certainty-${level}-foreground on certainty-${level}-background meets AA in dark`);
    }
  });

  describe("Input borders", () => {
    it("input-border on background meets 3:1 in light mode");
    it("input-border on background meets 3:1 in dark mode");
  });

  describe("Focus ring", () => {
    it("ring on background meets 3:1 in light mode");
    it("ring on background meets 3:1 in dark mode");
  });

  describe("Token completeness", () => {
    it("every light mode token has a dark mode override where expected");
    it("no undefined var() references in globals.css");
  });
});
```

### 3.3 Approach for :root vs .dark

The `parseTokens()` utility extracts tokens from both scopes:

- Light mode tokens: defined in the `@theme {}` block (Tailwind v4 convention).
- Dark mode tokens: defined in the `.dark {}` block.

For contrast calculations, the test pairs the appropriate foreground from one scope with the background from the same scope. No cross-scope pairing is tested (light foreground on dark background is never a real usage).

---

## 4. Component Testing

### 4.1 Scope

Design system component tests focus **exclusively** on design-system concerns. They do not duplicate existing behavior tests (form submission, API calls, navigation).

| Concern              | What to Test                                                              | Framework                    |
| -------------------- | ------------------------------------------------------------------------- | ---------------------------- |
| Token usage          | Component renders with expected CSS classes referencing tokens            | Vitest + RTL                 |
| ARIA compliance      | Correct roles, labels, states, keyboard interaction                       | Vitest + vitest-axe          |
| Keyboard navigation  | Tab order, Enter/Space activation, Arrow key navigation within groups     | Vitest + user-event          |
| Visual states        | Hover, focus, active, disabled, loading, error -- correct classes applied | Vitest + RTL                 |
| Theme switching      | Component renders without errors in both light and dark theme             | Vitest + RTL (ThemeProvider) |
| Variant completeness | All CVA variants render without error                                     | Vitest + RTL                 |

### 4.2 Test File Structure

Design system tests live alongside their component files:

```
src/components/ui/
  button.tsx
  button.test.tsx          # Existing tests (form behavior, clicks)
  button.ds.test.tsx       # NEW: design system tests (tokens, a11y, variants)
```

The `.ds.test.tsx` suffix distinguishes design system tests from behavior tests. This allows running them separately:

```bash
# Run only design system tests
pnpm vitest run --reporter=verbose "**/*.ds.test.tsx"
```

### 4.3 Test Template

Every `.ds.test.tsx` file follows this structure:

```typescript
import { axe } from "vitest-axe";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "@/test/render";
import { Button } from "./button";

describe("Button — Design System", () => {
  describe("Variants", () => {
    it.each([
      "default", "destructive", "outline", "secondary", "ghost", "link"
    ])("renders %s variant without error", (variant) => {
      renderWithProviders(
        <Button variant={variant as any}>Label</Button>
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has no axe violations", async () => {
      const { container } = renderWithProviders(
        <Button>Click me</Button>
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it("icon-only button requires aria-label", async () => {
      const { container } = renderWithProviders(
        <Button size="icon" aria-label="Close">X</Button>
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("Keyboard", () => {
    it("is focusable via Tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Button>Label</Button>);
      await user.tab();
      expect(screen.getByRole("button")).toHaveFocus();
    });
  });

  describe("States", () => {
    it("applies disabled styling", () => {
      renderWithProviders(<Button disabled>Label</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });
});
```

### 4.4 Components Requiring Design System Tests

| Component         | Key DS Tests                                                           |
| ----------------- | ---------------------------------------------------------------------- |
| Button            | All 6 variants, all 4 sizes, icon-only a11y, loading state a11y        |
| Input             | Default state, error state (`aria-invalid`), disabled state, a11y      |
| Textarea (new)    | Transcription variant with `dir="auto"`, resize-y, a11y                |
| Select (new)      | Keyboard navigation, `aria-expanded`, option selection                 |
| Checkbox          | Checked, unchecked, indeterminate states; `aria-checked` values        |
| Badge             | All variants including new semantic and certainty variants             |
| Card              | No shadow in rendered output, border presence                          |
| Dialog            | Focus trap, Escape to close, Cancel button initial focus (AlertDialog) |
| Tabs              | Active tab ARIA, keyboard arrow navigation between triggers            |
| CertaintySelector | `role="radiogroup"`, per-level ARIA, keyboard arrows                   |
| DataTable         | Checkbox a11y, sort header a11y, empty state                           |
| Sidebar           | Collapsed `aria-label` on items, keyboard navigation                   |
| Toast/Sonner      | Live region announcement                                               |
| Tooltip           | Keyboard trigger (focus shows tooltip), `role="tooltip"`               |

---

## 5. Responsive Testing

### 5.1 Viewport Presets

```typescript
// e2e/helpers/responsive.ts
export const VIEWPORTS = {
  mobile: { width: 320, height: 568 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  desktopXL: { width: 1280, height: 800 },
  desktopWide: { width: 1536, height: 864 },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;
```

### 5.2 Test Approach

Responsive tests verify layout behavior at breakpoint boundaries, not pixel-perfect rendering (that is the visual regression tests' job).

**Test file:** `e2e/design-system/responsive.spec.ts`

| Breakpoint | What to Verify                                                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 320px      | Sidebar hidden (overlay only); bottom tab bar visible; DataTable rendered as card stack; form fields single-column; breadcrumb replaced by back arrow |
| 768px      | Sidebar overlay; bottom tab bar visible; DataTable shows priority columns only; two-column form field pairs                                           |
| 1024px     | Sidebar persistent (expanded or collapsed); no bottom tab bar; full DataTable columns; entity detail single-column                                    |
| 1280px     | Entity detail two-column layout (AttributesCard 45% + Tabs 55%); sticky AttributesCard                                                                |

### 5.3 German Locale Verification

At each viewport, a subset of tests runs in the German locale to verify no text truncation occurs:

```typescript
test("German sidebar labels do not truncate at 1024px", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/de/dashboard");
  // Verify no element within sidebar has CSS text-overflow: ellipsis active
  const truncated = await page.$$eval(
    "aside[aria-label] a span, aside[aria-label] span span",
    (els) =>
      els.filter((el) => {
        const style = window.getComputedStyle(el);
        return style.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth;
      }).length,
  );
  expect(truncated).toBe(0);
});
```

---

## 6. Motion Testing

### 6.1 Prefers-Reduced-Motion Testing

Playwright can emulate `prefers-reduced-motion: reduce`:

```typescript
test("reduced motion disables spatial animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/de/dashboard");

  // Verify no element has animation-duration > 0.01ms
  const hasLongAnimation = await page.evaluate(() => {
    const all = document.querySelectorAll("*");
    for (const el of all) {
      const style = window.getComputedStyle(el);
      const duration = parseFloat(style.animationDuration);
      if (duration > 0.02) return true; // > 0.01ms (our reset value)
    }
    return false;
  });
  expect(hasLongAnimation).toBe(false);
});
```

### 6.2 Duration Token Validation

Verify that motion tokens resolve to expected values:

```typescript
test("duration tokens resolve correctly", async ({ page }) => {
  await page.goto("/de/dashboard");
  const durations = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      fast: style.getPropertyValue("--duration-fast").trim(),
      normal: style.getPropertyValue("--duration-normal").trim(),
      slow: style.getPropertyValue("--duration-slow").trim(),
      deliberate: style.getPropertyValue("--duration-deliberate").trim(),
    };
  });
  expect(durations.fast).toBe("100ms");
  expect(durations.normal).toBe("200ms");
  expect(durations.slow).toBe("300ms");
  expect(durations.deliberate).toBe("500ms");
});
```

### 6.3 Theme Switch Transition

```typescript
test("theme switch transitions colors smoothly", async ({ page }) => {
  await page.goto("/de/dashboard");
  const body = page.locator("body");

  // Check that body has transition-property including background-color
  const transitionProp = await body.evaluate((el) => getComputedStyle(el).transitionProperty);
  expect(transitionProp).toContain("background-color");
});
```

### 6.4 Skeleton Pulse Under Reduced Motion

```typescript
test("skeleton is static under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/de/persons"); // triggers loading state briefly
  // If skeleton is visible, verify it has opacity: 0.6 and no animation
  const skeleton = page.locator("[data-testid^='skeleton']").first();
  if (await skeleton.isVisible()) {
    const style = await skeleton.evaluate((el) => {
      const s = getComputedStyle(el);
      return { animation: s.animationName, opacity: s.opacity };
    });
    expect(style.animation).toBe("none");
    expect(parseFloat(style.opacity)).toBeCloseTo(0.6, 1);
  }
});
```

---

## 7. Test Naming Convention

### 7.1 File Naming

| Test Type                     | Pattern                     | Example                                |
| ----------------------------- | --------------------------- | -------------------------------------- |
| Component behavior (existing) | `{component}.test.tsx`      | `button.test.tsx`                      |
| Component design system       | `{component}.ds.test.tsx`   | `button.ds.test.tsx`                   |
| CSS token validation          | `tokens.test.ts`            | `src/styles/__tests__/tokens.test.ts`  |
| E2E visual regression         | `visual-regression.spec.ts` | `e2e/visual/visual-regression.spec.ts` |
| E2E accessibility             | `a11y.spec.ts`              | `e2e/design-system/a11y.spec.ts`       |
| E2E responsive                | `responsive.spec.ts`        | `e2e/design-system/responsive.spec.ts` |
| E2E motion                    | `motion.spec.ts`            | `e2e/design-system/motion.spec.ts`     |
| E2E layout                    | `layout.spec.ts`            | `e2e/design-system/layout.spec.ts`     |

### 7.2 Test Description Naming

Use a consistent `describe > it` hierarchy:

```
describe("{Component} -- Design System")
  describe("Variants")
    it("renders {variant} variant without error")
  describe("Accessibility")
    it("has no axe violations in {state}")
    it("{interactive-element} has accessible name")
  describe("Keyboard")
    it("is focusable via Tab")
    it("{key} triggers {action}")
  describe("States")
    it("applies {state} styling")
  describe("Theme")
    it("renders in dark mode without error")
```

For E2E:

```
describe("Accessibility -- {page-group}")
  it("DS-A11Y-{NN}: {page} has no axe violations in {theme} mode")

describe("Visual Regression -- {page-group}")
  it("DS-VR-{NN}: {page} matches baseline at {width}px in {theme} mode")

describe("Responsive -- {breakpoint}")
  it("DS-RSP-{NN}: {component/behavior} at {width}px")

describe("Motion")
  it("DS-MOT-{NN}: {description}")
```

### 7.3 Test ID Prefixes

| Prefix     | Meaning                                |
| ---------- | -------------------------------------- |
| `DS-TOK-`  | Token validation tests                 |
| `DS-A11Y-` | Accessibility tests (E2E)              |
| `DS-VR-`   | Visual regression tests                |
| `DS-RSP-`  | Responsive layout tests                |
| `DS-MOT-`  | Motion and animation tests             |
| `DS-CMP-`  | Component design system tests (Vitest) |

---

## 8. CI Integration

### 8.1 Current CI Pipeline

The existing `.github/workflows/ci.yml` runs:

1. `lint` (parallel)
2. `typecheck` (parallel)
3. `unit-tests` (parallel)
4. `build-test-deploy` (sequential: build, seed, E2E, deploy)

### 8.2 Design System CI Additions

The design system tests slot into the existing pipeline without adding new jobs:

**Unit test job (`unit-tests`):** Already runs `pnpm test` which executes all Vitest tests. The new `*.ds.test.tsx` and `tokens.test.ts` files are automatically included. No configuration change needed.

**E2E test job (`build-test-deploy`):** Already runs `pnpm test:e2e` which executes all Playwright tests in `e2e/`. The new `e2e/design-system/*.spec.ts` files are automatically included.

**New: Visual regression comparison step.** Add after the E2E test step:

```yaml
# In build-test-deploy job, after "Run E2E tests"
- name: Run visual regression tests
  run: pnpm exec playwright test e2e/visual/ --reporter=list
  continue-on-error: true # Visual diffs are informational, not blocking

- name: Upload visual diff artifacts
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: visual-regression-diffs
    path: test-results/
    retention-days: 7
```

**Decision: Visual regression tests are non-blocking in CI.** They produce artifacts for human review but do not fail the build. This prevents flaky font-rendering differences between CI Ubuntu and local macOS from blocking PRs.

### 8.3 Package.json Script Additions

```json
{
  "scripts": {
    "test:ds": "vitest run --reporter=verbose \"**/*.ds.test.tsx\" \"**/tokens.test.ts\"",
    "test:e2e:a11y": "playwright test e2e/design-system/a11y.spec.ts",
    "test:e2e:visual": "playwright test e2e/visual/",
    "test:e2e:visual:update": "playwright test e2e/visual/ --update-snapshots"
  }
}
```

These are convenience scripts for local development. CI runs the full suite.

---

## 9. What NOT to Test

### 9.1 Existing Behavior Tests

The following are already covered by the existing 99+ unit tests and 64+ E2E tests. Design system tests must not duplicate them:

| Already Tested                                | Where                                             |
| --------------------------------------------- | ------------------------------------------------- |
| Form submission (create/edit entities)        | `PersonForm.test.tsx`, `EventForm.test.tsx`, etc. |
| API route responses                           | `route.test.ts` files                             |
| Authentication flow (login, register, verify) | `e2e/auth.spec.ts`                                |
| Navigation between pages                      | `e2e/smoke.spec.ts`                               |
| i18n locale switching                         | Existing component tests                          |
| Database operations (CRUD)                    | Server action tests                               |
| Rate limiting behavior                        | `rate-limit.test.ts`                              |
| Error boundary rendering                      | `error.test.tsx`                                  |

### 9.2 Tailwind Class Existence

Do not test that specific Tailwind classes are present in rendered output. Tailwind classes are an implementation detail. Instead, test the computed effect:

**Bad:**

```typescript
expect(button).toHaveClass("bg-primary");
```

**Good:**

```typescript
// Test via axe-core that contrast is sufficient
expect(await axe(container)).toHaveNoViolations();
// Test via role/state that the component is accessible
expect(screen.getByRole("button")).toBeEnabled();
```

Exception: test files for components that use hardcoded color classes (like `ReliabilityBadge.test.tsx`) will need their assertions updated when the component migrates to tokens. This is a migration task, not a new test concern.

### 9.3 Third-Party Component Internals

Do not test the internal behavior of Radix UI primitives (Dialog focus trap implementation, Popover positioning logic, etc.). These are tested by the Radix UI project. Design system tests verify only the token application and accessible name/role layer that Evidoxa adds on top.

### 9.4 Server-Side Rendering Details

Do not test SSR behavior of styled components. The design system is a client-side CSS concern. SSR tests (if any) remain in the existing test suite.

### 9.5 Exact Pixel Values

Do not assert on computed pixel values of rendered elements in jsdom. jsdom does not implement CSS layout. Pixel-level verification is done through Playwright visual regression tests only.

### 9.6 Cross-Browser Rendering Differences

Visual regression baselines are per-browser (chromium/, firefox/). Do not write tests that assert identical rendering between browsers. Each browser has its own baseline.
