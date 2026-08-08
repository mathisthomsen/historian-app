# Evidoxa Design System -- Implementation Plan

**Date:** 2026-04-02
**Author:** Staff Frontend Engineer (Technical Lead)
**Branch:** `2-5_design_system`
**Status:** Ready for execution
**Upstream:** All documents in `docs/design-system/` (00-discovery through 04-design-system)

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Implementation Sequence](#2-implementation-sequence)
3. [Component Implementation Order](#3-component-implementation-order)
4. [Migration Strategy](#4-migration-strategy)
5. [Risk Register](#5-risk-register)
6. [Dependencies to Install](#6-dependencies-to-install)

---

## 1. Current State Assessment

### 1.1 Token Migration Status (globals.css)

The `src/styles/globals.css` file has already been **fully rewritten** to implement the design system token layer. This is substantial progress. Specifically:

**Completed:**

- `@theme` block contains all color tokens for light mode: surface hierarchy (background, card, popover), brand colors (primary archival indigo `245 40% 36%`, secondary, muted, accent verdigris), border/input tokens (including separate `--color-input-border` at higher contrast), semantic colors (destructive, success, warning, info -- all four-variant families), all five certainty color families (certain/probable/possible/unknown/unevidenced, each with base/foreground/background/border), sidebar tokens, chart colors, and extended surface aliases.
- `.dark {}` block contains complete dark mode overrides for all of the above.
- Typography scale tokens: `--text-xs` through `--text-4xl`, `--leading-*`, `--tracking-*`.
- Border radius scale: `--radius-none` through `--radius-full`.
- Shadow scale: `--shadow-sm`, `--shadow-md`, `--shadow-lg` with warm stone color in light mode, pure black in dark mode.
- Layout tokens: `--sidebar-width-open`, `--sidebar-width-collapsed`, `--topbar-height`, `--content-max-width`.
- Motion tokens: duration scale (`--duration-instant` through `--duration-deliberate`), easing functions (`--ease-enter`, `--ease-exit`, `--ease-move`, `--ease-spring`, plus aliases).
- `@layer base`: border color reset, body styling with theme-switch transition, global `:focus-visible` ring, scrollbar styling, `prefers-reduced-motion` global reset.
- `@layer utilities`: animation utilities (fade, slide, scale, skeleton-pulse, badge-pulse) with full `prefers-reduced-motion` overrides; typography utilities (`.text-body`, `.text-body-large`, `.text-body-small`, `.text-caption`, `.text-overline`, `.text-mono`, `.text-label`); certainty badge utilities (`.certainty-certain` through `.certainty-unevidenced`); layout utilities (`.page-container`, `.sidebar-inset`, `.sidebar-inset-collapsed`, `.topbar-inset`).

**Remaining token work (Layer 1 delta):**

- None. The token layer is complete as specified. Any adjustments will come from accessibility audit fixes applied during Layer 2.

### 1.2 Component Gap Analysis

The shadcn/ui components in `src/components/ui/` **still use the original default shadcn class strings**. They have not been updated to reference the new tokens. The token values have changed (e.g., `--color-primary` changed from near-black `240 5.9% 10%` to archival indigo `245 40% 36%`), so the components now render with the new brand colors automatically through CSS variable indirection. However, the class patterns themselves need updates:

| Component     | File               | Key Issues                                                                                                                                                                                 |
| ------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`      | `button.tsx`       | `ring-offset-background` (old pattern); outline variant uses `border-input` not `border-border`; no `active:scale-[0.98]`; sm size is `h-9` not `h-8` per spec                             |
| `Input`       | `input.tsx`        | Uses `border-input` (maps to `--color-input`, same as border); should use `border-input-border` for higher contrast; has `shadow-sm` which is removed per spec; height is `h-9` not `h-10` |
| `Badge`       | `badge.tsx`        | Only 4 variants (default/secondary/destructive/outline); needs success, warning, info, and all certainty variants                                                                          |
| `Card`        | `card.tsx`         | Uses `shadow` (Tailwind default); should use no shadow per brand spec (borders only) or `shadow-sm` at most; uses `rounded-xl` which matches spec                                          |
| `Skeleton`    | `skeleton.tsx`     | Uses `bg-primary/10` and `animate-pulse`; should use token-based `animate-skeleton-pulse` utility                                                                                          |
| `Dialog`      | `dialog.tsx`       | Needs animation classes updated to use new `animate-in`/`animate-out` utilities                                                                                                            |
| `AlertDialog` | `alert-dialog.tsx` | Same animation update needed                                                                                                                                                               |
| `Popover`     | `popover.tsx`      | Same animation update needed                                                                                                                                                               |
| `Tooltip`     | `tooltip.tsx`      | Same animation update needed                                                                                                                                                               |
| `Command`     | `command.tsx`      | Needs token-aligned styling                                                                                                                                                                |
| `Tabs`        | `tabs.tsx`         | Active indicator needs `border-b-2 border-primary` per spec                                                                                                                                |
| `Table`       | `table.tsx`        | Header row needs `bg-muted/50` per spec                                                                                                                                                    |
| `Checkbox`    | `checkbox.tsx`     | Needs `border-input-border` for perceivability                                                                                                                                             |

**Missing shadcn/ui components (not yet installed):**

- `Textarea` -- used as raw `<textarea>` in PersonForm, RelationFormDialog, SourceForm, EventForm
- `Select` -- native `<select>` used in PartialDateInput, RelationsDataTable
- `Switch` -- not yet needed but specified in component library
- `Breadcrumb` -- not yet implemented; specified in patterns

### 1.3 Hardcoded Color Usage (Must Migrate)

These files use raw Tailwind color classes instead of design tokens:

| File                                 | Hardcoded Classes                                                                                                                                              | Target Token                                                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PasswordStrengthIndicator.tsx`      | `bg-red-500`, `bg-orange-500`, `bg-yellow-500`, `bg-lime-500`, `bg-green-500`                                                                                  | `bg-destructive`, `bg-warning`, `bg-warning`, `bg-success/70`, `bg-success` (or a dedicated strength scale)                                                                                                                     |
| `ReliabilityBadge.tsx`               | `border-green-600 bg-green-50 text-green-700` (HIGH), `border-yellow-600 bg-yellow-50 text-yellow-700` (MEDIUM), `border-red-600 bg-red-50 text-red-700` (LOW) | `bg-success-background text-success-foreground border-success-border`, `bg-warning-background text-warning-foreground border-warning-border`, `bg-destructive-background text-destructive-foreground border-destructive-border` |
| `LoginForm.tsx`                      | `bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200`                                                                                             | `bg-success-background text-success-foreground`                                                                                                                                                                                 |
| `VerifyEmailCard.tsx`                | Similar green/red hardcoded states                                                                                                                             | Semantic tokens                                                                                                                                                                                                                 |
| `RegisterForm.tsx`                   | Green success state                                                                                                                                            | Semantic tokens                                                                                                                                                                                                                 |
| `PasswordStrengthIndicator.test.tsx` | Tests assert on hardcoded class names                                                                                                                          | Update assertions                                                                                                                                                                                                               |
| `ReliabilityBadge.test.tsx`          | Tests assert on hardcoded class names                                                                                                                          | Update assertions                                                                                                                                                                                                               |

### 1.4 Structural Issues to Address

1. **Sidebar uses `bg-background` instead of `bg-sidebar`** -- `sidebar.tsx` line 88 uses `bg-background`; should use the dedicated `--color-sidebar` token.
2. **TopBar uses `bg-background` instead of `bg-card`** -- `top-bar.tsx` line 21; spec says TopBar uses `bg-card`.
3. **AppShell inline style for sidebar offset** -- uses `style={{ paddingLeft: "14rem" }}`; should use CSS utility classes `.sidebar-inset` / `.sidebar-inset-collapsed`.
4. **No `<Textarea>` component** -- raw `<textarea>` with duplicated styles in 4+ form components.
5. **No `<Select>` component** -- native `<select>` used in PartialDateInput and RelationsDataTable.
6. **DataTable uses native `<input type="checkbox">`** -- should use shadcn `Checkbox`.
7. **Button-as-Link inconsistency** -- multiple `<Link>` elements with manually duplicated button styles instead of `<Button asChild>`.
8. **No heading hierarchy** -- all headings are `<h1>` with varying Tailwind sizes; needs semantic `<h2>`-`<h6>`.
9. **CertaintySelector uses `bg-primary`** for all active states -- should use per-certainty colors.
10. **`truncate` on sidebar nav labels** -- brand spec forbids truncation in German locale.

### 1.5 Test Infrastructure

| Area                  | Current State                                                               | Notes                                         |
| --------------------- | --------------------------------------------------------------------------- | --------------------------------------------- |
| Unit tests            | Vitest 3.0.7 + RTL 16.2.0 + jsdom 26.0.0                                    | 99+ unit tests passing                        |
| E2E tests             | Playwright 1.50.1, Chromium + Firefox                                       | 64+ E2E tests, `e2e/` directory               |
| Coverage              | V8 provider, 80% thresholds on lines/functions/branches/statements          | Configured in `vitest.config.ts`              |
| Test render helper    | `src/test/render.tsx` wraps in `NextIntlClientProvider` + `ThemeProvider`   | No CSS parsing; jsdom does not compute styles |
| Setup file            | `src/test/setup.ts` mocks `ResizeObserver` and `matchMedia`                 | Minimal                                       |
| CI                    | `.github/workflows/ci.yml`: lint, typecheck, unit tests, build, E2E, deploy | Sequential pipeline                           |
| Visual regression     | Not configured                                                              | No screenshot baselines                       |
| Accessibility testing | Not configured                                                              | No axe-core integration                       |

---

## 2. Implementation Sequence

### Layer 0: Test Infrastructure Setup

**Goal:** Establish all testing tooling before making any visual changes so every subsequent layer can be verified.

| Task                                           | Files to Create/Modify                       | Complexity | Risk |
| ---------------------------------------------- | -------------------------------------------- | ---------- | ---- |
| 0.1 Install test dependencies                  | `package.json`                               | S          | Low  |
| 0.2 Create CSS token validation utility        | `src/test/tokens.ts`                         | M          | Low  |
| 0.3 Create Vitest axe-core matcher setup       | `src/test/setup.ts`, `src/test/axe-setup.ts` | S          | Low  |
| 0.4 Create Playwright a11y helpers             | `e2e/helpers/a11y.ts`                        | M          | Low  |
| 0.5 Create Playwright visual regression config | `e2e/helpers/visual.ts`, `e2e/visual/` dir   | M          | Low  |
| 0.6 Create Playwright responsive helpers       | `e2e/helpers/responsive.ts`                  | S          | Low  |
| 0.7 Add `test:ds` script to package.json       | `package.json`                               | S          | Low  |
| 0.8 Update CI workflow for visual regression   | `.github/workflows/ci.yml`                   | S          | Low  |

**Dependencies:** None (Layer 0 has no upstream dependencies).

**Deliverables:**

- `src/test/tokens.ts` -- utility to parse `globals.css`, extract `var()` references, validate all tokens are defined, compute HSL contrast ratios.
- `src/test/axe-setup.ts` -- vitest-axe matcher configuration.
- `e2e/helpers/a11y.ts` -- `@axe-core/playwright` wrapper with standard ruleset and exclusions.
- `e2e/helpers/visual.ts` -- screenshot comparison helper with directory structure.
- `e2e/helpers/responsive.ts` -- viewport presets (320, 768, 1024, 1280, 1536).

---

### Layer 1: Design Tokens (Delta)

**Goal:** Apply accessibility audit fixes to token values. The token structure is complete; this layer addresses the FAIL/WARN items from the accessibility audit.

| Task                                                           | Files to Modify                       | Complexity | Risk                                                                       |
| -------------------------------------------------------------- | ------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| 1.1 Fix `--color-muted-foreground` light mode contrast         | `globals.css`                         | S          | Medium -- already applied (value is `26 10% 38%` per audit recommendation) |
| 1.2 Fix dark mode `--color-muted-foreground` on muted surfaces | `globals.css`                         | S          | Low                                                                        |
| 1.3 Verify `--color-certainty-unevidenced` light mode          | `globals.css`                         | S          | Low -- already set to `20 15% 40%` per audit                               |
| 1.4 Verify `--color-certainty-unevidenced` dark mode           | `globals.css`                         | S          | Low -- already set to `20 12% 56%` per audit                               |
| 1.5 Write token validation tests                               | `src/styles/__tests__/tokens.test.ts` | M          | Low                                                                        |

**Dependencies:** Layer 0 (token test utilities).

**Assessment:** Inspecting the current `globals.css`, the muted-foreground is already set to `26 10% 38%` (light) and `22 5% 55%` (dark), and unevidenced is `20 15% 40%` (light) and `20 12% 56%` (dark). These match the audit-recommended fixes. The dark muted-foreground may need a bump from `55%` to `58%` for the narrow muted-on-muted ratio (audit Section 1.2). This is the only remaining delta.

---

### Layer 2: Base Styles

**Goal:** Ensure global base styles (typography, focus rings, scrollbars, reduced-motion) are tested and any remaining gaps are filled.

| Task                                      | Files to Create/Modify                                                                       | Complexity | Risk |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- | ---------- | ---- |
| 2.1 Verify body baseline styles           | `globals.css` (already done), write tests                                                    | S          | Low  |
| 2.2 Verify focus ring consistency         | Write tests against `:focus-visible` rule                                                    | S          | Low  |
| 2.3 Verify scrollbar styling              | Write visual regression baseline                                                             | S          | Low  |
| 2.4 Verify `prefers-reduced-motion` reset | Write tests                                                                                  | S          | Low  |
| 2.5 Verify typography utility classes     | Write tests for `.text-body`, `.text-caption`, `.text-overline`, `.text-label`, `.text-mono` | S          | Low  |
| 2.6 Verify certainty badge utilities      | Write tests for `.certainty-certain` through `.certainty-unevidenced`                        | S          | Low  |
| 2.7 Verify layout utilities               | Write tests for `.page-container`, `.sidebar-inset`, `.topbar-inset`                         | S          | Low  |
| 2.8 Verify animation utilities            | Write tests for `animate-in`, `fade-in`, `slide-*`, `scale-*`                                | S          | Low  |

**Dependencies:** Layer 1 (token values must be finalized).

---

### Layer 3: Component Styles

**Goal:** Update every component in `src/components/ui/` and the custom components to use the design system tokens and patterns.

See [Section 3](#3-component-implementation-order) for the ordered list of all 27 components.

**Dependencies:** Layer 2 (base styles must be stable).

---

### Layer 4: Layout Patterns

**Goal:** Formalize the AppShell, page templates, and responsive behavior.

| Task                                                    | Files to Create/Modify                    | Complexity | Risk                                                         |
| ------------------------------------------------------- | ----------------------------------------- | ---------- | ------------------------------------------------------------ |
| 4.1 Migrate AppShell to CSS utility classes             | `src/components/shell/app-shell.tsx`      | M          | Medium -- inline style removal may affect existing E2E tests |
| 4.2 Update Sidebar to use `bg-sidebar` token            | `src/components/shell/sidebar.tsx`        | S          | Low                                                          |
| 4.3 Update TopBar to use `bg-card` token                | `src/components/shell/top-bar.tsx`        | S          | Low                                                          |
| 4.4 Remove `truncate` from sidebar nav labels           | `src/components/shell/sidebar.tsx`        | S          | Low                                                          |
| 4.5 Add active indicator (2px left border) to sidebar   | `src/components/shell/sidebar.tsx`        | M          | Low                                                          |
| 4.6 Add `aria-label` to collapsed sidebar items         | `src/components/shell/sidebar.tsx`        | S          | Low -- already has `aria-label`                              |
| 4.7 Create Breadcrumb component                         | `src/components/ui/breadcrumb.tsx`        | M          | Low                                                          |
| 4.8 Implement Bottom Tab Bar (mobile/tablet)            | `src/components/shell/bottom-tab-bar.tsx` | L          | Medium -- new component, responsive breakpoint logic         |
| 4.9 Add heading hierarchy (h1-h3) to all page templates | Multiple page files                       | M          | Low                                                          |
| 4.10 Verify page-container pattern across all routes    | Multiple page files                       | S          | Low                                                          |
| 4.11 Write layout E2E tests (responsive breakpoints)    | `e2e/design-system/layout.spec.ts`        | M          | Low                                                          |

**Dependencies:** Layer 3 (components must be styled correctly before layout composition).

---

### Layer 5: Page Compositions

**Goal:** Apply design system patterns to every page route. Verify token consistency end-to-end.

| Task                                                    | Files to Modify                | Complexity | Risk                          |
| ------------------------------------------------------- | ------------------------------ | ---------- | ----------------------------- |
| 5.1 Auth pages (login, register, verify, forgot, reset) | 5 page files + 5 components    | M          | Low -- isolated layout        |
| 5.2 Dashboard page                                      | `dashboard/page.tsx`           | M          | Low -- currently placeholder  |
| 5.3 Person pages (list, new, detail, edit)              | 4 page files + client wrappers | L          | Medium -- most complex entity |
| 5.4 Event pages (list, new, detail, edit)               | 4 page files + client wrappers | L          | Medium                        |
| 5.5 Source pages (list, new, detail, edit)              | 4 page files + client wrappers | L          | Medium                        |
| 5.6 Relations page                                      | 1 page file                    | M          | Low                           |
| 5.7 Settings pages (event-types, relation-types)        | 2 page files                   | M          | Low                           |
| 5.8 Loading skeletons                                   | 7 loading.tsx files            | S          | Low                           |
| 5.9 Error and not-found pages                           | 2 page files                   | S          | Low                           |
| 5.10 Dev showcase page                                  | 1 page file                    | S          | Low                           |
| 5.11 Full-page visual regression baselines              | `e2e/visual/`                  | L          | Low                           |

**Dependencies:** Layer 4 (layout patterns must be in place).

---

### Layer 6: Motion and Transitions

**Goal:** Apply motion tokens to all interactive elements and route transitions.

| Task                                                      | Files to Create/Modify                | Complexity | Risk                                                      |
| --------------------------------------------------------- | ------------------------------------- | ---------- | --------------------------------------------------------- |
| 6.1 Theme switch transition (already in base)             | Verify only                           | S          | Low                                                       |
| 6.2 Sidebar collapse/expand animation                     | `sidebar.tsx`, `app-shell.tsx`        | M          | Low -- transition-all already present, needs token values |
| 6.3 Dialog open/close animations                          | `dialog.tsx`, `alert-dialog.tsx`      | M          | Low                                                       |
| 6.4 Popover/tooltip animations                            | `popover.tsx`, `tooltip.tsx`          | M          | Low                                                       |
| 6.5 Toast (Sonner) animations                             | Root layout Toaster config            | S          | Low                                                       |
| 6.6 DataTable loading state opacity transition            | `DataTable.tsx`                       | S          | Low                                                       |
| 6.7 Page transition (route change fade)                   | `src/app/[locale]/(app)/template.tsx` | L          | Medium -- App Router template approach                    |
| 6.8 Hover state transitions (Button, Sidebar, Table rows) | Multiple components                   | S          | Low -- add `transition-colors` with duration token        |
| 6.9 `prefers-reduced-motion` verification                 | E2E test                              | M          | Low                                                       |
| 6.10 Write motion E2E tests                               | `e2e/design-system/motion.spec.ts`    | M          | Low                                                       |

**Dependencies:** Layer 5 (pages must be composed before testing motion).

---

### Layer 7: Final Verification and Cleanup

**Goal:** Full regression pass, accessibility audit, visual regression comparison, cleanup dead code.

| Task                                                       | Complexity | Risk |
| ---------------------------------------------------------- | ---------- | ---- |
| 7.1 Run full Vitest suite -- all existing + new tests      | S          | Low  |
| 7.2 Run full Playwright suite -- all existing + new tests  | S          | Low  |
| 7.3 Run visual regression comparison against baselines     | M          | Low  |
| 7.4 Run axe-core across all pages in both themes           | M          | Low  |
| 7.5 Run responsive tests at all 5 viewports                | M          | Low  |
| 7.6 Verify German locale -- no truncation in any component | S          | Low  |
| 7.7 Remove `@radix-ui/react-toast` (dead dependency)       | S          | Low  |
| 7.8 Remove any remaining hardcoded color classes           | S          | Low  |
| 7.9 Update `components.json` shadcn config if needed       | S          | Low  |
| 7.10 Update progress.md and testplan.md                    | S          | Low  |

**Dependencies:** All prior layers.

---

## 3. Component Implementation Order

Within Layer 3, components are ordered by dependency: primitives first (no internal component dependencies), then composites (depend on primitives), then complex (depend on multiple composites). Each entry references the design system `04-design-system/components.md` section number.

### Tier 1: Foundational Primitives (no internal dependencies)

| #   | Component     | DS Section | Files                             | Complexity | Key Changes                                                                                                                                              |
| --- | ------------- | ---------- | --------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Button**    | 1          | `src/components/ui/button.tsx`    | M          | Add `active:scale-[0.98]`; fix sm height to `h-8`; add loading state pattern; update outline variant to `border-border`; remove `ring-offset-background` |
| 2   | **Input**     | 2          | `src/components/ui/input.tsx`     | M          | Change `border-input` to `border-input-border`; remove `shadow-sm`; change height to `h-10`; add hover/error/readonly state classes                      |
| 3   | **Label**     | 2          | `src/components/ui/label.tsx`     | S          | Add `.text-label` utility class alignment                                                                                                                |
| 4   | **Separator** | 20         | `src/components/ui/separator.tsx` | S          | Verify uses `bg-border` token                                                                                                                            |
| 5   | **Avatar**    | 19         | `src/components/ui/avatar.tsx`    | S          | Verify `rounded-full` and fallback uses `bg-muted`                                                                                                       |
| 6   | **Skeleton**  | 21         | `src/components/ui/skeleton.tsx`  | S          | Switch from `animate-pulse bg-primary/10` to `animate-skeleton-pulse bg-muted`                                                                           |

### Tier 2: Form Primitives

| #   | Component          | DS Section | Files                            | Complexity | Key Changes                                                                                        |
| --- | ------------------ | ---------- | -------------------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| 7   | **Textarea** (NEW) | 3          | `src/components/ui/textarea.tsx` | M          | Create shadcn-style Textarea component; replace all raw `<textarea>` usages                        |
| 8   | **Select** (NEW)   | 4          | `src/components/ui/select.tsx`   | M          | Create or install shadcn Select; replace native `<select>` in PartialDateInput, RelationsDataTable |
| 9   | **Checkbox**       | 5          | `src/components/ui/checkbox.tsx` | S          | Update to `border-input-border`; verify focus ring                                                 |
| 10  | **Switch** (NEW)   | 6          | `src/components/ui/switch.tsx`   | S          | Install shadcn Switch component; apply tokens                                                      |

### Tier 3: Display Primitives

| #   | Component        | DS Section | Files                           | Complexity | Key Changes                                                                                                           |
| --- | ---------------- | ---------- | ------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| 11  | **Badge**        | 7          | `src/components/ui/badge.tsx`   | L          | Add success, warning, info, and 5 certainty variants; change border radius from `rounded-md` to `rounded-sm` per spec |
| 12  | **Tooltip**      | 11         | `src/components/ui/tooltip.tsx` | S          | Apply `bg-popover` token; add animation classes                                                                       |
| 13  | **Toast/Sonner** | 18         | Root layout Toaster config      | S          | Apply design tokens to Sonner theme prop                                                                              |

### Tier 4: Container Composites (depend on Tier 1-3)

| #   | Component        | DS Section | Files                                 | Complexity | Key Changes                                                                                       |
| --- | ---------------- | ---------- | ------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| 14  | **Card**         | 8          | `src/components/ui/card.tsx`          | S          | Remove `shadow`; verify `rounded-xl border bg-card`                                               |
| 15  | **Dialog**       | 9          | `src/components/ui/dialog.tsx`        | M          | Apply `animate-in scale-in fade-in` animation; apply `bg-popover` or `bg-card`; apply `shadow-lg` |
| 16  | **AlertDialog**  | 22         | `src/components/ui/alert-dialog.tsx`  | M          | Same animation treatment as Dialog; ensure Cancel gets initial focus                              |
| 17  | **Popover**      | 10         | `src/components/ui/popover.tsx`       | M          | Apply `animate-in slide-in-from-top fade-in`; `bg-popover shadow-md`                              |
| 18  | **DropdownMenu** | (implicit) | `src/components/ui/dropdown-menu.tsx` | M          | Token-align; prepare for user menu                                                                |

### Tier 5: Complex Composites (depend on Tier 4)

| #   | Component   | DS Section | Files                           | Complexity | Key Changes                                                                                                        |
| --- | ----------- | ---------- | ------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| 19  | **Tabs**    | 14         | `src/components/ui/tabs.tsx`    | M          | Active trigger: `border-b-2 border-primary text-foreground`; inactive: `text-muted-foreground`; CountBadge styling |
| 20  | **Table**   | (implicit) | `src/components/ui/table.tsx`   | M          | Header row `bg-muted/50`; row hover `hover:bg-accent/30`; verify border tokens                                     |
| 21  | **Command** | 12         | `src/components/ui/command.tsx` | M          | Apply popover tokens; ensure keyboard navigation accessible                                                        |

### Tier 6: Custom Domain Components (depend on Tier 1-5)

| #   | Component                     | DS Section   | Files                                                                 | Complexity | Key Changes                                                                                                                         |
| --- | ----------------------------- | ------------ | --------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 22  | **CertaintySelector**         | 24           | `src/components/research/CertaintySelector.tsx`                       | L          | Add per-certainty colors for active state; add icon shapes (filled/3-quarter/half/ring/dashed-ring); convert to `role="radiogroup"` |
| 23  | **PropertyEvidenceBadge**     | 23           | `src/components/relations/PropertyEvidenceBadge.tsx`                  | M          | Apply certainty badge utilities; implement claim-without-evidence warning pattern                                                   |
| 24  | **ReliabilityBadge**          | (7 variants) | `src/components/research/ReliabilityBadge.tsx`                        | S          | Replace hardcoded green/yellow/red with semantic success/warning/destructive tokens                                                 |
| 25  | **EntityCard/AttributesCard** | 25           | `PersonDetailCard.tsx`, `EventDetailCard.tsx`, `SourceDetailCard.tsx` | M          | Unify to consistent `<dl>/<dt>/<dd>` markup; apply `.text-overline` on `<dt>`; add certainty display on date fields                 |
| 26  | **Empty State**               | 27           | New: `src/components/ui/empty-state.tsx`                              | M          | Create reusable EmptyState component with icon, message, action button                                                              |
| 27  | **DataTable**                 | 13           | `src/components/research/DataTable.tsx`                               | L          | Replace native checkboxes with shadcn `Checkbox`; add row hover; add empty state; apply header row tokens; loading opacity state    |

### Tier 7: Auth Components (depend on Tier 1-3)

| #   | Component                     | Files                                               | Complexity | Key Changes                                                                                |
| --- | ----------------------------- | --------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| 28  | **PasswordStrengthIndicator** | `src/components/auth/PasswordStrengthIndicator.tsx` | M          | Replace hardcoded red/orange/yellow/lime/green with semantic tokens                        |
| 29  | **LoginForm**                 | `src/components/auth/LoginForm.tsx`                 | S          | Replace hardcoded green success state with `bg-success-background text-success-foreground` |
| 30  | **RegisterForm**              | `src/components/auth/RegisterForm.tsx`              | S          | Same success state fix                                                                     |
| 31  | **VerifyEmailCard**           | `src/components/auth/VerifyEmailCard.tsx`           | S          | Same success/error state fix                                                               |
| 32  | **ForgotPasswordForm**        | `src/components/auth/ForgotPasswordForm.tsx`        | S          | Verify token usage                                                                         |
| 33  | **ResetPasswordForm**         | `src/components/auth/ResetPasswordForm.tsx`         | S          | Verify token usage                                                                         |

---

## 4. Migration Strategy

### 4.1 Core Approach: CSS Variable Indirection

The design system uses CSS custom properties consumed by Tailwind v4 utility classes. Since shadcn/ui components already reference these variables (e.g., `bg-primary` resolves to `hsl(var(--color-primary))`), changing the token values in `globals.css` automatically flows to all components. This is already done.

The remaining work is updating the **class strings within components** to match the spec (e.g., changing `border-input` to `border-input-border`, removing stale `shadow-sm`, adding hover/animation classes).

### 4.2 Coexistence Plan

During the migration, both old and new patterns will coexist temporarily. The key guarantees:

1. **No visual breakage between layers.** Each layer is independently deployable. Partially migrated states are acceptable because the CSS variable values have already changed globally.
2. **Existing tests remain green.** Component class changes will require updating test assertions that match on specific class names (e.g., `ReliabilityBadge.test.tsx` checks for `border-green-600`). These test updates happen in the same PR as the component change.
3. **One component at a time.** Each component is migrated in its own commit within its layer's PR. This allows bisecting if regressions appear.

### 4.3 Feature Flags

No feature flags are needed. The design system migration is a visual change applied through CSS variables. The architecture is:

- Token values changed globally (already done).
- Component classes updated incrementally (Layer 3).
- No runtime branching required.

### 4.4 Rollback Plan

1. **Token rollback:** Revert `src/styles/globals.css` to the commit before the design system branch. All components instantly revert to the old zinc palette.
2. **Component rollback:** Each component is changed in its own commit. `git revert <commit>` rolls back a single component.
3. **Full rollback:** The entire design system work is on branch `2-5_design_system`. If the migration fails, the branch is abandoned and `main` is unaffected.

### 4.5 shadcn/ui Component Override Strategy

shadcn/ui components are source-installed (not npm packages). They live in `src/components/ui/` and are directly editable. The strategy:

1. **Modify in place.** Update the class strings in each component file.
2. **Do not re-install from shadcn CLI.** The CLI would overwrite customizations.
3. **For new components** (Textarea, Select, Switch, Breadcrumb): install via `pnpm dlx shadcn@latest add <component>`, then immediately apply design system tokens.
4. **Document customizations** in a comment block at the top of each modified file referencing the design system section (e.g., `/* DS: components.md Section 1 — Button */`).

---

## 5. Risk Register

### Risk 1: Existing E2E Tests Break Due to Color/Layout Changes (HIGH)

**Impact:** E2E tests that assert on visual state (element visibility, color-based selectors) may fail when token values change component appearance.

**Mitigation:**

- Run full E2E suite after Layer 1 (token finalization) to establish a baseline of any breakage from the token value change alone.
- Fix any broken E2E selectors before proceeding to Layer 3.
- E2E tests should not assert on CSS class names; if they do, update them to use `data-testid` or `role` selectors.

### Risk 2: Input Border Contrast Change Affects Form Validation Visual Patterns (MEDIUM)

**Impact:** Changing `border-input` to `border-input-border` (higher contrast) changes the visual appearance of every form input. Existing test screenshots (if any) will differ.

**Mitigation:**

- Apply the change in a single commit across all form components (Input, Textarea, Select, Checkbox).
- Verify all form validation error states still work (error border overrides normal border).
- Test in both themes.

### Risk 3: Sidebar Width Token Migration Breaks AppShell Layout (MEDIUM)

**Impact:** Replacing the inline `style={{ paddingLeft: "14rem" }}` in AppShell with CSS utility classes could cause a brief layout mismatch if the JS and CSS are not synchronized.

**Mitigation:**

- Implement the CSS utility class `.sidebar-inset` / `.sidebar-inset-collapsed` first.
- Update AppShell in a single atomic commit.
- Run E2E sidebar toggle tests immediately after.

### Risk 4: New shadcn Components (Textarea, Select) Introduce Bundle Size Increase (LOW)

**Impact:** Adding Textarea and Select components increases the client bundle slightly.

**Mitigation:**

- Textarea is a simple wrapper (~20 lines). Select uses Radix primitives already installed.
- Monitor bundle size with `next build` output.

### Risk 5: Dark Mode Contrast Edge Cases Not Caught by Automated Tests (MEDIUM)

**Impact:** Some dark mode text/background combinations may pass computed contrast checks but appear visually illegible on low-quality displays (e.g., dark warning-foreground on dark warning-background).

**Mitigation:**

- Visual regression screenshots captured in both light and dark mode at Layer 5.
- Manual review of all dark mode screenshots before merging.
- Axe-core checks run in both themes.

---

## 6. Dependencies to Install

### New Dev Dependencies

| Package                | Version   | Purpose                                            |
| ---------------------- | --------- | -------------------------------------------------- |
| `@axe-core/playwright` | `^4.10.0` | Playwright E2E accessibility testing               |
| `vitest-axe`           | `^1.0.0`  | Vitest axe-core matchers for component a11y tests  |
| `axe-core`             | `^4.10.0` | Core accessibility engine (peer dep of vitest-axe) |

### Install Command

```bash
pnpm add -D @axe-core/playwright vitest-axe axe-core
```

### shadcn/ui Components to Install

```bash
pnpm dlx shadcn@latest add textarea
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add switch
pnpm dlx shadcn@latest add breadcrumb
```

Note: After each `shadcn add`, immediately apply design system token customizations before committing.

### Packages to Remove (Layer 7)

| Package                 | Reason                                             |
| ----------------------- | -------------------------------------------------- |
| `@radix-ui/react-toast` | Dead code -- Sonner is used exclusively for toasts |

### No Framework Changes

The existing test frameworks (Vitest 3.0.7, Playwright 1.50.1) are retained. No version upgrades are proposed as part of this migration.
