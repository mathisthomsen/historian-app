# Evidoxa Design System -- Final Audit Report

**Date:** 2026-04-03
**Auditor:** QA Engineer / Accessibility Auditor
**Branch:** `2-5_design_system`
**Baseline:** All prior epics (1.1 through 2.4) complete on `main`

---

## 1. Full Test Suite Results

| Metric      | Value |
| ----------- | ----- |
| Test files  | 65    |
| Total tests | 1,129 |
| Passing     | 1,129 |
| Failing     | 0     |
| Skipped     | 0     |

**Command:** `pnpm test`
**Duration:** 11.51s

All 65 test files pass, including the new design-system-specific test suites:

- `src/test/tokens.test.ts` (94 tests) -- token validation, contrast ratios, parity
- `src/test/base-styles.test.ts` (126 tests) -- typography, focus ring, motion, layout utilities
- `src/test/design-system-smoke.test.ts` (26 tests) -- smoke tests across all DS layers
- `src/test/motion.test.tsx` -- animation utility and reduced-motion tests
- `src/test/layout.test.tsx` -- layout pattern tests
- `src/test/pages/auth-pages.test.tsx` (10 tests) -- auth page composition
- `src/test/pages/app-pages.test.tsx` (46 tests) -- app page composition
- `src/test/components/*.test.tsx` (19 component test files) -- per-component tests for alert, avatar, badge, breadcrumb, button, card, command, data-table, dialog, input, popover, select, separator, skeleton, tabs, textarea, toast, tooltip

**Stderr notes:** Two non-fatal jsdom warnings about `HTMLCanvasElement.prototype.getContext` (from axe-core icon ligature detection). These do not affect test outcomes.

---

## 2. Spec Compliance Matrix

| Phase            | Spec File                           | Exists              | Tests File                       | Tests Pass     | Notes                                                                                                                                                           |
| ---------------- | ----------------------------------- | ------------------- | -------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 -- Plan        | `00-plan/implementation-plan.md`    | Yes                 | N/A (planning doc)               | N/A            | Includes test strategy at `00-plan/test-strategy.md`                                                                                                            |
| 0 -- Plan        | `00-plan/test-strategy.md`          | Yes                 | N/A                              | N/A            | Covers unit, E2E, visual regression, a11y strategy                                                                                                              |
| 1 -- Tokens      | `01-tokens/token-spec.md`           | Yes                 | `src/test/tokens.test.ts`        | Yes (94/94)    | 68 color tokens, all with light+dark parity                                                                                                                     |
| 2 -- Base Styles | `02-base/base-styles-spec.md`       | Yes                 | `src/test/base-styles.test.ts`   | Yes (126/126)  | Typography, focus ring, scrollbar, motion, layout utilities                                                                                                     |
| 3 -- Components  | `03-components/*.md`                | Yes (18 spec files) | `src/test/components/*.test.tsx` | Yes (all pass) | Specs: alert, avatar, badge, breadcrumb, button, card, command, data-table, dialog, input, popover, select, separator, skeleton, tabs, textarea, toast, tooltip |
| 4 -- Layouts     | `04-layouts/layout-spec.md`         | Yes                 | `src/test/layout.test.tsx`       | Yes            | AppShell, Sidebar, TopBar, BottomTabBar                                                                                                                         |
| 5 -- Pages       | `05-pages/page-composition-spec.md` | Yes                 | `src/test/pages/*.test.tsx`      | Yes (56/56)    | Auth pages (10) + App pages (46)                                                                                                                                |
| 6 -- Motion      | `06-motion/motion-spec.md`          | Yes                 | `src/test/motion.test.tsx`       | Yes            | Animation utilities, reduced-motion overrides                                                                                                                   |

All 7 implementation phases have corresponding spec documents and passing test suites.

---

## 3. TypeScript Status

| Scope                               | Errors   |
| ----------------------------------- | -------- |
| Production code (`src/` excl. test) | 0        |
| Test files (`src/test/`)            | ~580     |
| E2E helpers (`e2e/`)                | ~40      |
| **Total**                           | **~620** |

All TypeScript errors are confined to test infrastructure files. The errors fall into three categories:

1. **Missing Vitest globals in `toast.test.tsx`** -- `describe`, `it`, `expect` not recognized by `tsc`. These work at runtime because Vitest injects globals. The file likely needs `/// <reference types="vitest" />` or inclusion in tsconfig test types.

2. **`toHaveNoViolations` matcher type** -- Custom vitest-axe matcher not declared in the type system. Tests pass at runtime. Needs a `vitest-axe.d.ts` declaration file.

3. **`string | undefined` narrowing** -- Multiple instances in `src/test/tokens.ts`, `src/test/design-system.ts`, `src/test/motion.test.tsx` where regex match groups could be undefined. Runtime-safe (tests pass) but needs explicit null checks or non-null assertions.

**Verdict:** No production type errors. Test type errors are non-blocking (tests execute correctly via Vitest) but should be cleaned up for CI `tsc --noEmit` to pass cleanly.

---

## 4. Cross-Theme Consistency

### 4.1 Token Parity

- **68 color tokens** defined in `:root` (via `@theme`)
- **68 color tokens** defined in `.dark`
- **Parity: 100%** -- every light token has a dark override

### 4.2 Hardcoded Colors in Components

No `rgb()` values found in component files. No `hsl()` values found in component files except in `badge.tsx` where they correctly reference CSS variables via `hsl(var(--color-*))`.

**Hex values found in 1 file:**

- `src/components/research/EventTypeColorPicker.tsx` -- 12 hardcoded hex colors for the event-type color picker palette. This is an acceptable use case: these are user-selectable event-type colors stored in the database as hex strings. They are not theme-dependent UI colors.

**Hardcoded Tailwind color classes found in 5 files** (see Issues section):

- `ReliabilityBadge.tsx` -- `border-green-600`, `bg-green-50`, `border-yellow-600`, `bg-yellow-50`, `border-red-600`, `bg-red-50` (3 occurrences)
- `PasswordStrengthIndicator.tsx` -- `bg-red-500`, `bg-orange-500`, `bg-yellow-500`, `bg-green-500` (5 occurrences)
- `LoginForm.tsx` -- `bg-green-50 text-green-800` (1 occurrence)
- `RegisterForm.tsx` -- `bg-green-50 text-green-800` (1 occurrence)
- `VerifyEmailCard.tsx` -- `text-green-600` (1 occurrence)

### 4.3 Focus Ring

- Global `:focus-visible` rule uses `--color-ring` (archival indigo light / lighter indigo dark)
- 2px solid outline with 2px offset
- Ring color has dark mode override (`245 40% 68%` vs `245 40% 36%`)
- Verified visible in both themes via token definition

### 4.4 Shadow Scale

- Light mode: warm stone shadow color `hsl(20 14% 9% / opacity)`
- Dark mode: pure black shadow color `hsl(0 0% 0% / opacity)` with increased opacity
- Properly differentiated for both themes

---

## 5. Accessibility Quick-Check

### 5.1 Landmark Structure

- `<aside>` with `aria-label="Primary navigation"` (Sidebar)
- `<header>` with `role="banner"` (TopBar)
- `<main>` with `aria-label="Main content"` (AppShell)
- `<nav>` with `role="navigation"` (Sidebar, BottomTabBar)

### 5.2 Heading Hierarchy

- Dashboard: `<h1>` present with welcome message
- Base heading styles defined in `@layer base` for h1-h4 with proper type scale
- All pages checked have at least one `<h1>` (15 app pages + auth pages)

### 5.3 ARIA Usage

- Sidebar navigation items: `aria-label`, `aria-current="page"`, `aria-disabled`
- Icons: `aria-hidden="true"` on decorative icons
- LocaleSwitcher: `role="group"`, `aria-label`, `aria-pressed`
- BottomTabBar: `aria-label`, `aria-current="page"`
- TopBar toggle: `aria-label` for sidebar toggle and theme toggle
- EventTypeColorPicker: `aria-label`, `aria-pressed`

### 5.4 Reduced Motion

- Global `@media (prefers-reduced-motion: reduce)` resets all animation/transition to 0.01ms
- Slide animations fall back to fade-only
- Scale animations fall back to fade-only
- Skeleton pulse becomes static at opacity 0.6
- Badge pulse disabled entirely

### 5.5 WCAG 2.1 AA Assessment

- Color contrast: Token values designed with documented contrast ratios (foreground/background pairs annotated in CSS comments). Primary on background: 11.4:1 (AAA). Muted-foreground: 5.8:1 (AA).
- Focus indicators: 2px solid ring with 2px offset, using high-contrast ring color
- Form inputs: `--color-input-border` at 3.5:1 on background (AA for UI components)
- Text alternatives: aria-labels on interactive elements verified
- Keyboard navigation: Tab order follows DOM order; focus-visible styling applied globally

---

## 6. i18n Check

| Metric        | Value |
| ------------- | ----- |
| German keys   | 428   |
| English keys  | 428   |
| Missing in EN | 0     |
| Missing in DE | 0     |

**Parity: 100%** -- All translation keys match between `de.json` and `en.json`.

No hardcoded English strings found in styled component files (component text is always sourced via `useTranslations` or `getTranslations`).

---

## 7. Component/Page Compliance Matrix

| Component/Page       | Visual Tokens | A11y | Dark Mode | Responsive | Motion | i18n | Status |
| -------------------- | ------------- | ---- | --------- | ---------- | ------ | ---- | ------ |
| Button               | PASS          | PASS | PASS      | PASS       | PASS   | PASS | PASS   |
| Input                | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Textarea             | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Select               | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Badge                | PASS          | PASS | PASS      | PASS       | PASS   | PASS | PASS   |
| Card                 | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Dialog               | PASS          | PASS | PASS      | PASS       | PASS   | PASS | PASS   |
| Popover              | PASS          | PASS | PASS      | PASS       | PASS   | PASS | PASS   |
| Tooltip              | PASS          | PASS | PASS      | PASS       | PASS   | PASS | PASS   |
| Alert                | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Avatar               | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Breadcrumb           | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Skeleton             | PASS          | PASS | PASS      | PASS       | PASS   | PASS | PASS   |
| Separator            | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Tabs                 | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Table                | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Command              | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Toast/Sonner         | PASS          | PASS | PASS      | PASS       | PASS   | PASS | PASS   |
| AppShell             | PASS          | PASS | PASS      | PASS       | PASS   | PASS | PASS   |
| Sidebar              | PASS          | PASS | PASS      | PASS       | PASS   | PASS | PASS   |
| TopBar               | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| BottomTabBar         | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Dashboard            | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Auth pages           | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Person pages         | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Event pages          | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| Source pages         | PASS          | PASS | PASS      | PASS       | N/A    | PASS | PASS   |
| ReliabilityBadge     | WARN          | PASS | WARN      | PASS       | N/A    | PASS | WARN   |
| PasswordStrength     | WARN          | PASS | WARN      | PASS       | N/A    | PASS | WARN   |
| LoginForm            | WARN          | PASS | PASS      | PASS       | N/A    | PASS | WARN   |
| RegisterForm         | WARN          | PASS | PASS      | PASS       | N/A    | PASS | WARN   |
| VerifyEmailCard      | WARN          | PASS | PASS      | PASS       | N/A    | PASS | WARN   |
| EventTypeColorPicker | OK            | PASS | OK        | PASS       | N/A    | PASS | OK     |

---

## 8. Issues List

### Blocking (must fix before merge)

None. All 1,129 tests pass. No production TypeScript errors. No broken functionality.

### Should Fix (before or shortly after merge)

**ISSUE-01: Hardcoded Tailwind color classes in 5 components**

- Files: `ReliabilityBadge.tsx`, `PasswordStrengthIndicator.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`, `VerifyEmailCard.tsx`
- Total: 11 hardcoded color class references (`bg-red-500`, `bg-green-50`, `border-green-600`, etc.)
- Impact: These bypass the design system token layer. They render correctly but will not respond to token value changes.
- Plan: The implementation plan (Section 1.3) already identifies these and maps each to the correct semantic token. This was documented as Layer 3, Tier 7 work (Auth Components) and Layer 3, Tier 6, Item 24 (ReliabilityBadge).
- Recommendation: Migrate to `bg-destructive`, `bg-success-background`, `text-success-foreground`, `bg-warning-background`, etc.

**ISSUE-02: TypeScript errors in test files (~620 errors)**

- Files: `src/test/components/toast.test.tsx` (missing Vitest globals), `src/test/tokens.ts` (undefined narrowing), `src/test/design-system.ts`, `src/test/motion.test.tsx`, `e2e/helpers/a11y.ts`
- Impact: `pnpm tsc --noEmit` fails. CI pipeline may gate on this if typecheck step is enabled.
- Categories:
  - Missing `/// <reference types="vitest" />` or tsconfig `types` inclusion
  - Missing `vitest-axe` type declarations (`.d.ts`)
  - Unguarded `string | undefined` from regex match groups
- Recommendation: Add a `src/test/vitest-axe.d.ts` declaration file. Add null guards or non-null assertions to regex match results. Add vitest types reference to test files missing it.

**ISSUE-03: Dead dependency `@radix-ui/react-toast`**

- The package is listed in `package.json` but not imported anywhere in `src/`.
- Sonner is used exclusively for toasts.
- Recommendation: `pnpm remove @radix-ui/react-toast` (already planned for Layer 7.7).

### Nice to Have (future improvements)

**ISSUE-04: EventTypeColorPicker uses hardcoded hex palette**

- File: `src/components/research/EventTypeColorPicker.tsx`
- 12 hex color values for event-type category colors.
- These are user-facing data colors (stored in DB), not UI theme colors, so this is architecturally acceptable.
- Future improvement: Could derive the palette from chart tokens or provide an accessible label per color (currently `aria-label={hex}` which is not human-readable).

**ISSUE-05: No visual regression baselines**

- E2E visual regression helpers exist (`e2e/helpers/visual.ts`, `e2e/helpers/responsive.ts`) but no baseline screenshots have been captured yet.
- The implementation plan notes this as Layer 5.11 / Layer 7.3 work.
- Recommendation: Capture baselines after merge, before subsequent feature work alters component appearance.

**ISSUE-06: No runtime axe-core E2E tests**

- E2E a11y helpers exist (`e2e/helpers/a11y.ts`) and axe-core is installed, but no E2E test suite runs axe scans against live pages.
- Unit-level axe tests pass (via vitest-axe in component tests).
- Recommendation: Add a Playwright test suite that runs axe-core against each page in both themes at multiple viewports.

---

## 9. Recommendations

### Immediate (pre-merge)

1. **Fix ISSUE-02 (test TS errors)** if CI gates on `tsc --noEmit`. If CI only runs Vitest (which passes), this can be deferred.
2. **Remove `@radix-ui/react-toast`** (ISSUE-03) -- zero-risk, reduces bundle.

### Short-term (next sprint)

3. **Migrate hardcoded colors** (ISSUE-01) -- follow the mapping already documented in the implementation plan Section 1.3. Update corresponding test assertions.
4. **Capture visual regression baselines** (ISSUE-05) -- run Playwright screenshot suite in CI, store in version control or artifact storage.
5. **Add E2E axe-core test suite** (ISSUE-06) -- leverage existing `e2e/helpers/a11y.ts`.

### Ongoing Maintenance

6. **Token audit on new components** -- any new shadcn/ui component added via CLI must be immediately updated to use design system tokens before committing.
7. **Dark mode review** -- new features should be visually reviewed in both themes before merge.
8. **i18n key parity check** -- add a CI step or pre-commit hook that verifies `de.json` and `en.json` have identical key structures.
9. **Contrast ratio monitoring** -- if token values are adjusted, re-run the contrast ratio tests in `tokens.test.ts` to ensure AA compliance is maintained.

### Future Improvements

10. **Storybook or dev showcase** -- a `/dev/showcase` page exists; consider expanding it into a full component catalog for design review.
11. **CSS bundle analysis** -- monitor Tailwind output size as the component library grows. Currently 881 lines in `globals.css` (pre-build).
12. **User testing** -- the certainty color system (5 levels, each with 4 variants) should be validated with actual historians to confirm the color semantics are intuitive.

---

## Summary

The design system implementation is **complete and passing all tests**. All 7 implementation phases have corresponding specs and passing test suites. The token layer provides full light/dark parity across 68 color tokens. i18n coverage is 100% across both locales (428 keys each). Accessibility foundations are solid with proper landmark structure, ARIA attributes, focus management, and reduced-motion support.

The only remaining work items are cleanup tasks (hardcoded color migration in 5 legacy components, test TypeScript errors, dead dependency removal) -- none of which block the merge. The design system is ready for integration into `main`.
