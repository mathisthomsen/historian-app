# Token Implementation Specification — Evidoxa Design System

**Date:** 2026-04-02
**Phase:** Implementation Phase 01 — Design Tokens
**Status:** Authoritative — use this document as the single source of truth for token implementation and token tests. Do not consult identity.md or tokens.md directly when writing code or tests; all values have been transcribed here.
**Upstream sources:**

- `docs/design-system/02-brand/identity.md` (Sections 2–8)
- `docs/design-system/04-design-system/tokens.md` (all sections)
- `src/styles/globals.css` (current implementation — also audited for drift in Section 3 of this spec)
- `src/test/tokens.ts` (test utility — defines `parseTokens`, `contrastRatio`, required-token arrays)

---

## Table of Contents

1. [Token Structure Rules](#1-token-structure-rules)
2. [Token Inventory Table](#2-token-inventory-table)
   - 2.1 Color — Surface Hierarchy
   - 2.2 Color — Brand
   - 2.3 Color — Borders and Inputs
   - 2.4 Color — Semantic: Destructive
   - 2.5 Color — Semantic: Success
   - 2.6 Color — Semantic: Warning
   - 2.7 Color — Semantic: Info
   - 2.8 Color — Certainty
   - 2.9 Color — Sidebar
   - 2.10 Color — Extended Surface Aliases
   - 2.11 Color — Chart Series
   - 2.12 Typography
   - 2.13 Border Radius
   - 2.14 Shadows
   - 2.15 Motion — Duration
   - 2.16 Motion — Easing
   - 2.17 Layout
3. [Deletion and Migration List](#3-deletion-and-migration-list)
4. [Acceptance Criteria Checklist](#4-acceptance-criteria-checklist)
5. [Token Dependency Map](#5-token-dependency-map)

---

## 1. Token Structure Rules

### 1.1 Where tokens live

All design token definitions live in the `@theme {}` block at the top of `src/styles/globals.css`, after the `@import "tailwindcss"` directive. This is the Tailwind v4 CSS-first configuration mechanism. Tailwind processes `@theme` at build time and emits the variables as `:root {}` rules, generating corresponding utility classes automatically.

Dark mode overrides live in the `.dark {}` block in the same file, immediately after the closing brace of `@theme`. The `.dark` class is applied to `<html>` by next-themes.

No token definitions may appear in component files, in `tailwind.config.js` (which does not exist in this project), or in any file other than `src/styles/globals.css`.

### 1.2 Naming convention

```
--{category}-{semantic-group}-{variant}
```

| Segment          | Allowed values                                                                                                                                                                                                                                                                                                                                                                                     | Examples                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `category`       | `color`, `font`, `radius`, `shadow`, `duration`, `ease`, `text`, `leading`, `tracking`                                                                                                                                                                                                                                                                                                             | `--color-primary`, `--radius-md` |
| `semantic-group` | Describes purpose, not visual value. For colors: `background`, `foreground`, `primary`, `muted`, `accent`, `border`, `input`, `input-border`, `ring`, `destructive`, `success`, `warning`, `info`, `certainty-certain`, `certainty-probable`, `certainty-possible`, `certainty-unknown`, `certainty-unevidenced`, `sidebar`, `chart-1` … `chart-5`, `surface`, `surface-raised`, `surface-overlay` | `--color-certainty-certain`      |
| `variant`        | `foreground`, `background`, `border` — omitted for the base value of a group                                                                                                                                                                                                                                                                                                                       | `--color-success-background`     |

The variant segment is omitted when the token itself is the base indicator color (e.g., `--color-success` is the text/icon color; `--color-success-background` is the soft fill).

### 1.3 Color format

All color tokens store **HSL channel values without the `hsl()` wrapper**:

```css
/* Correct: */
--color-primary: 245 40% 36%;

/* Wrong — never do this: */
--color-primary: hsl(245, 40%, 36%);
```

This is the shadcn/ui convention. It allows opacity modifiers:

```css
background-color: hsl(var(--color-primary) / 0.5);
/* Tailwind: bg-primary/50 */
```

The HSL notation in this document uses the format `H S% L%` where H is degrees (0–360), S and L are percentages. When written as token values in CSS, they are bare channel values: `245 40% 36%`.

### 1.4 Dark mode overrides

The `.dark {}` block redefines only those tokens whose values differ between light and dark mode. Non-color tokens (radius, spacing, duration, easing) are not redefined in `.dark` unless a special reason exists. Only color and shadow tokens have dark overrides.

The full list of tokens requiring dark overrides is the union of:

- All `--color-*` tokens (surface, brand, border, input, semantic, certainty, sidebar, surface aliases, chart)
- All `--shadow-*` tokens (shadow color shifts from warm stone to pure black in dark mode)

### 1.5 shadcn/ui required names

shadcn/ui components reference CSS custom properties through Tailwind utility classes. Tailwind v4 automatically namespaces `@theme` color variables: `--color-background` in `@theme` becomes `bg-background` as a Tailwind class (the `color-` prefix is stripped from the class name). This means the following token names are mandatory and must not be renamed:

| Required token name              | shadcn class that depends on it          |
| -------------------------------- | ---------------------------------------- |
| `--color-background`             | `bg-background`                          |
| `--color-foreground`             | `text-foreground`                        |
| `--color-card`                   | `bg-card`                                |
| `--color-card-foreground`        | `text-card-foreground`                   |
| `--color-popover`                | `bg-popover`                             |
| `--color-popover-foreground`     | `text-popover-foreground`                |
| `--color-primary`                | `bg-primary`, `text-primary`             |
| `--color-primary-foreground`     | `text-primary-foreground`                |
| `--color-secondary`              | `bg-secondary`                           |
| `--color-secondary-foreground`   | `text-secondary-foreground`              |
| `--color-muted`                  | `bg-muted`                               |
| `--color-muted-foreground`       | `text-muted-foreground`                  |
| `--color-accent`                 | `bg-accent`                              |
| `--color-accent-foreground`      | `text-accent-foreground`                 |
| `--color-destructive`            | `bg-destructive`, `text-destructive`     |
| `--color-destructive-foreground` | `text-destructive-foreground`            |
| `--color-border`                 | `border-border`                          |
| `--color-input`                  | used by shadcn Input for background fill |
| `--color-ring`                   | `ring-ring`, `focus-visible:ring-ring`   |
| `--radius`                       | `rounded-lg` (shadcn default radius)     |

### 1.6 Tailwind v4 utility class generation

Tokens in `@theme` with the `--color-` prefix generate `bg-*`, `text-*`, `border-*`, and `ring-*` utility classes automatically, with the `color-` prefix stripped. Tokens with `--radius-` generate `rounded-*` classes. Tokens with `--shadow-` generate `shadow-*` classes. Tokens with `--text-` generate `text-{size}` classes. Tokens with `--font-` generate `font-*` classes.

Tokens with `--duration-`, `--ease-`, `--leading-`, `--tracking-`, `--sidebar-*`, `--topbar-*`, and `--content-*` do not generate utility classes automatically; they are consumed via `var()` in CSS or `[var(--token-name)]` in Tailwind arbitrary-value syntax.

---

## 2. Token Inventory Table

For each token: name, light mode value, dark mode value, category, used-by components, and any contrast requirement.

The contrast requirement column states the WCAG threshold and the background token the foreground is measured against. A dash means no contrast requirement applies (the token is a surface background, not foreground text).

### 2.1 Color — Surface Hierarchy

Source: `identity.md` Section 2.7; `tokens.md` Section 3.1

| Token                        | Light Mode Value | Dark Mode Value | Category      | Used By                                        | Contrast Requirement                                |
| ---------------------------- | ---------------- | --------------- | ------------- | ---------------------------------------------- | --------------------------------------------------- |
| `--color-background`         | `36 25% 98.5%`   | `25 10% 4.5%`   | color-surface | Body, AppShell, all page layouts               | — (surface, not text)                               |
| `--color-foreground`         | `20 14% 9%`      | `30 10% 94%`    | color-surface | Body text, h1–h4, DataTable cells, form values | ≥7:1 on `--color-background` (AAA body text target) |
| `--color-card`               | `36 20% 99.5%`   | `25 9% 6.5%`    | color-surface | Card, DataTable, EntityCard, AttributesCard    | —                                                   |
| `--color-card-foreground`    | `20 14% 9%`      | `30 10% 94%`    | color-surface | Text inside Card components                    | ≥7:1 on `--color-card`                              |
| `--color-popover`            | `0 0% 100%`      | `24 8% 9%`      | color-surface | Popover, DropdownMenu, Tooltip, CommandPalette | —                                                   |
| `--color-popover-foreground` | `20 14% 9%`      | `30 10% 94%`    | color-surface | Text inside Popover/Dropdown/Tooltip           | ≥7:1 on `--color-popover`                           |

### 2.2 Color — Brand

Source: `identity.md` Section 2.3 (primary), 2.6 (accent), Section 2.2 (muted/secondary neutral); `tokens.md` Section 3.2

| Token                          | Light Mode Value | Dark Mode Value | Category    | Used By                                                                                                                                          | Contrast Requirement                            |
| ------------------------------ | ---------------- | --------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `--color-primary`              | `245 40% 36%`    | `245 40% 68%`   | color-brand | Button (default variant), active sidebar item indicator, focus ring (via `--color-ring`), current-page nav item, CertaintySelector active border | ≥4.5:1 on `--color-background` (text/icon use)  |
| `--color-primary-foreground`   | `240 20% 98%`    | `245 45% 13%`   | color-brand | Text on primary-colored backgrounds (Button default)                                                                                             | ≥4.5:1 on `--color-primary`                     |
| `--color-secondary`            | `33 16% 93%`     | `24 8% 14%`     | color-brand | Button (secondary variant) background, secondary action surfaces                                                                                 | —                                               |
| `--color-secondary-foreground` | `20 12% 16%`     | `30 10% 94%`    | color-brand | Text on secondary backgrounds                                                                                                                    | ≥4.5:1 on `--color-secondary`                   |
| `--color-muted`                | `33 16% 93%`     | `24 8% 14%`     | color-brand | Table header background, skeleton pulse background, input background (same as secondary)                                                         | —                                               |
| `--color-muted-foreground`     | `26 10% 38%`     | `22 5% 55%`     | color-brand | Placeholder text, captions, secondary labels, entity IDs, timestamps, `.text-caption` utility, `.text-overline` utility                          | ≥4.5:1 on `--color-background` (AA normal text) |
| `--color-accent`               | `170 18% 92%`    | `170 12% 14%`   | color-brand | Hover state backgrounds on buttons/nav items, active sidebar item background, sidebar hover                                                      | —                                               |
| `--color-accent-foreground`    | `170 25% 18%`    | `170 18% 88%`   | color-brand | Text on accent backgrounds                                                                                                                       | ≥4.5:1 on `--color-accent`                      |

### 2.3 Color — Borders and Inputs

Source: `identity.md` Section 2.2 (scale steps 200, 500); `tokens.md` Section 3.3

| Token                  | Light Mode Value | Dark Mode Value | Category      | Used By                                                                                             | Contrast Requirement                                                       |
| ---------------------- | ---------------- | --------------- | ------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `--color-border`       | `30 14% 88%`     | `22 7% 18%`     | color-surface | Card borders, table row dividers, Separator component, Sidebar right border, FieldGroup border      | ≥3:1 on `--color-background` (WCAG 1.4.11 non-text contrast)               |
| `--color-input`        | `30 14% 88%`     | `22 7% 18%`     | color-surface | Input element background fill (matches `--color-border` by design)                                  | —                                                                          |
| `--color-input-border` | `30 14% 55%`     | `22 7% 40%`     | color-surface | Input, Select, Textarea — the visible border of form fields (higher contrast than `--color-border`) | ≥3:1 on `--color-background` (WCAG 1.4.11 — form inputs are UI components) |
| `--color-ring`         | `245 40% 36%`    | `245 40% 68%`   | color-brand   | `:focus-visible` outline on all interactive elements, `focus-visible:ring-ring` class               | ≥3:1 on `--color-background` (WCAG 1.4.11 focus indicator)                 |

**Important distinction:** `--color-border` (lightness 88% light / 18% dark) is intentionally subtle and used for structural chrome that does not need to be perceived by users with low contrast sensitivity. `--color-input-border` (lightness 55% light / 40% dark) is required at 3:1 because form inputs are functional UI components per WCAG 1.4.11. These must remain as two separate tokens.

### 2.4 Color — Semantic: Destructive (Iron Oxide)

Source: `identity.md` Section 2.4; `tokens.md` Section 3.4

| Token                            | Light Mode Value | Dark Mode Value | Category       | Used By                                                                                 | Contrast Requirement                     |
| -------------------------------- | ---------------- | --------------- | -------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| `--color-destructive`            | `4 60% 46%`      | `4 55% 58%`     | color-semantic | Button (destructive variant), delete action icon, Alert (destructive), error toast icon | ≥4.5:1 on `--color-background`           |
| `--color-destructive-foreground` | `0 0% 98%`       | `4 40% 94%`     | color-semantic | Text on destructive-colored button/badge                                                | ≥4.5:1 on `--color-destructive`          |
| `--color-destructive-background` | `4 50% 95%`      | `4 35% 11%`     | color-semantic | Error banner background, destructive badge fill, Alert (destructive) background         | —                                        |
| `--color-destructive-border`     | `4 40% 84%`      | `4 25% 24%`     | color-semantic | Error banner border, destructive badge outline                                          | ≥3:1 on `--color-destructive-background` |

### 2.5 Color — Semantic: Success (Muted Sage)

Source: `identity.md` Section 2.4; `tokens.md` Section 3.4

| Token                        | Light Mode Value | Dark Mode Value | Category       | Used By                                                              | Contrast Requirement                   |
| ---------------------------- | ---------------- | --------------- | -------------- | -------------------------------------------------------------------- | -------------------------------------- |
| `--color-success`            | `152 45% 32%`    | `152 40% 55%`   | color-semantic | Success toast icon, reviewed status indicator, positive confirmation | ≥4.5:1 on `--color-background`         |
| `--color-success-foreground` | `152 50% 14%`    | `152 30% 92%`   | color-semantic | Text on success-background elements                                  | ≥4.5:1 on `--color-success-background` |
| `--color-success-background` | `152 35% 93%`    | `152 25% 12%`   | color-semantic | Success toast/banner fill, reviewed badge background                 | —                                      |
| `--color-success-border`     | `152 30% 82%`    | `152 20% 22%`   | color-semantic | Success badge outline                                                | ≥3:1 on `--color-success-background`   |

### 2.6 Color — Semantic: Warning (Archival Amber)

Source: `identity.md` Section 2.4; `tokens.md` Section 3.4

| Token                        | Light Mode Value | Dark Mode Value | Category       | Used By                                                                             | Contrast Requirement                   |
| ---------------------------- | ---------------- | --------------- | -------------- | ----------------------------------------------------------------------------------- | -------------------------------------- |
| `--color-warning`            | `38 80% 42%`     | `38 70% 55%`    | color-semantic | Warning toast icon, unreviewed/degraded indicator, claim-without-evidence indicator | ≥4.5:1 on `--color-background`         |
| `--color-warning-foreground` | `32 70% 18%`     | `38 50% 94%`    | color-semantic | Text on warning-background elements                                                 | ≥4.5:1 on `--color-warning-background` |
| `--color-warning-background` | `40 60% 94%`     | `38 40% 11%`    | color-semantic | Warning banner fill, unreviewed badge background                                    | —                                      |
| `--color-warning-border`     | `38 50% 82%`     | `38 30% 24%`    | color-semantic | Warning badge border (dashed border style for "claim without evidence")             | ≥3:1 on `--color-warning-background`   |

### 2.7 Color — Semantic: Info (Manuscript Blue)

Source: `identity.md` Section 2.4; `tokens.md` Section 3.4

| Token                     | Light Mode Value | Dark Mode Value | Category       | Used By                                         | Contrast Requirement                |
| ------------------------- | ---------------- | --------------- | -------------- | ----------------------------------------------- | ----------------------------------- |
| `--color-info`            | `210 55% 44%`    | `210 50% 62%`   | color-semantic | Informational toast icon, neutral notice states | ≥4.5:1 on `--color-background`      |
| `--color-info-foreground` | `210 60% 16%`    | `210 35% 94%`   | color-semantic | Text on info-background elements                | ≥4.5:1 on `--color-info-background` |
| `--color-info-background` | `210 45% 94%`    | `210 30% 11%`   | color-semantic | Info banner fill, info badge background         | —                                   |
| `--color-info-border`     | `210 35% 82%`    | `210 22% 24%`   | color-semantic | Info badge border                               | ≥3:1 on `--color-info-background`   |

### 2.8 Color — Certainty

Source: `identity.md` Section 2.5; `tokens.md` Section 3.5

The certainty palette is the most critical color subsystem. Rules that govern it:

1. Progression: cool (Teal, hue 180) to warm (Amber, hue 38) to desaturated-warm-grey (hue 20).
2. No red-green spectrum dependency.
3. All badge text (`-foreground`) must achieve ≥4.5:1 on the paired `-background`.
4. All base indicator colors must achieve ≥3:1 on `--color-background`, `--color-card`, and `--color-muted`.
5. Icon shapes provide a second encoding channel (filled → dashed circle).

#### Certain (Teal, hue 180)

| Token                                  | Light Mode Value | Dark Mode Value | Category        | Used By                                                   | Contrast Requirement                             |
| -------------------------------------- | ---------------- | --------------- | --------------- | --------------------------------------------------------- | ------------------------------------------------ |
| `--color-certainty-certain`            | `180 50% 30%`    | `180 40% 55%`   | color-certainty | CertaintyBadge icon/text, CertaintySelector active option | ≥3:1 on `--color-background`                     |
| `--color-certainty-certain-foreground` | `180 55% 14%`    | `180 30% 92%`   | color-certainty | Text inside a Certain badge                               | ≥4.5:1 on `--color-certainty-certain-background` |
| `--color-certainty-certain-background` | `180 40% 93%`    | `180 25% 12%`   | color-certainty | Certain badge fill, CertaintySelector option background   | —                                                |
| `--color-certainty-certain-border`     | `180 35% 78%`    | `180 20% 26%`   | color-certainty | Certain badge border                                      | ≥3:1 on `--color-certainty-certain-background`   |

#### Probable (Manuscript Blue, hue 215)

| Token                                   | Light Mode Value | Dark Mode Value | Category        | Used By                      | Contrast Requirement                              |
| --------------------------------------- | ---------------- | --------------- | --------------- | ---------------------------- | ------------------------------------------------- |
| `--color-certainty-probable`            | `215 50% 38%`    | `215 42% 60%`   | color-certainty | Probable badge icon/text     | ≥3:1 on `--color-background`                      |
| `--color-certainty-probable-foreground` | `215 55% 16%`    | `215 30% 92%`   | color-certainty | Text inside a Probable badge | ≥4.5:1 on `--color-certainty-probable-background` |
| `--color-certainty-probable-background` | `215 40% 93%`    | `215 25% 12%`   | color-certainty | Probable badge fill          | —                                                 |
| `--color-certainty-probable-border`     | `215 35% 78%`    | `215 20% 26%`   | color-certainty | Probable badge border        | ≥3:1 on `--color-certainty-probable-background`   |

#### Possible (Indigo-Violet, hue 265)

| Token                                   | Light Mode Value | Dark Mode Value | Category        | Used By                      | Contrast Requirement                              |
| --------------------------------------- | ---------------- | --------------- | --------------- | ---------------------------- | ------------------------------------------------- |
| `--color-certainty-possible`            | `265 35% 45%`    | `265 32% 62%`   | color-certainty | Possible badge icon/text     | ≥3:1 on `--color-background`                      |
| `--color-certainty-possible-foreground` | `265 40% 18%`    | `265 25% 92%`   | color-certainty | Text inside a Possible badge | ≥4.5:1 on `--color-certainty-possible-background` |
| `--color-certainty-possible-background` | `265 30% 94%`    | `265 20% 13%`   | color-certainty | Possible badge fill          | —                                                 |
| `--color-certainty-possible-border`     | `265 25% 80%`    | `265 16% 28%`   | color-certainty | Possible badge border        | ≥3:1 on `--color-certainty-possible-background`   |

#### Unknown (Archival Amber, hue 38)

| Token                                  | Light Mode Value | Dark Mode Value | Category        | Used By                      | Contrast Requirement                             |
| -------------------------------------- | ---------------- | --------------- | --------------- | ---------------------------- | ------------------------------------------------ |
| `--color-certainty-unknown`            | `38 65% 45%`     | `38 55% 55%`    | color-certainty | Unknown badge icon/text      | ≥3:1 on `--color-background`                     |
| `--color-certainty-unknown-foreground` | `38 70% 18%`     | `38 40% 92%`    | color-certainty | Text inside an Unknown badge | ≥4.5:1 on `--color-certainty-unknown-background` |
| `--color-certainty-unknown-background` | `38 50% 93%`     | `38 30% 12%`    | color-certainty | Unknown badge fill           | —                                                |
| `--color-certainty-unknown-border`     | `38 40% 76%`     | `38 25% 26%`    | color-certainty | Unknown badge border         | ≥3:1 on `--color-certainty-unknown-background`   |

#### Unevidenced (Warm Grey, hue 20)

| Token                                      | Light Mode Value | Dark Mode Value | Category        | Used By                                    | Contrast Requirement                                 |
| ------------------------------------------ | ---------------- | --------------- | --------------- | ------------------------------------------ | ---------------------------------------------------- |
| `--color-certainty-unevidenced`            | `20 15% 40%`     | `20 12% 56%`    | color-certainty | Unevidenced badge icon/text                | ≥3:1 on `--color-background`                         |
| `--color-certainty-unevidenced-foreground` | `20 20% 22%`     | `20 10% 88%`    | color-certainty | Text inside an Unevidenced badge           | ≥4.5:1 on `--color-certainty-unevidenced-background` |
| `--color-certainty-unevidenced-background` | `20 10% 94%`     | `20 8% 10%`     | color-certainty | Unevidenced badge fill                     | —                                                    |
| `--color-certainty-unevidenced-border`     | `20 10% 80%`     | `20 8% 22%`     | color-certainty | Unevidenced badge border (rendered dashed) | ≥3:1 on `--color-certainty-unevidenced-background`   |

### 2.9 Color — Sidebar

Source: `identity.md` Section 2.7; `tokens.md` Section 3.6

| Token                               | Light Mode Value | Dark Mode Value | Category      | Used By                                                         | Contrast Requirement                          |
| ----------------------------------- | ---------------- | --------------- | ------------- | --------------------------------------------------------------- | --------------------------------------------- |
| `--color-sidebar`                   | `36 18% 97%`     | `25 8% 5.5%`    | color-surface | Sidebar background (AppShell Sidebar component)                 | —                                             |
| `--color-sidebar-foreground`        | `20 14% 9%`      | `30 10% 94%`    | color-surface | Default text and icon color in Sidebar                          | ≥4.5:1 on `--color-sidebar`                   |
| `--color-sidebar-border`            | `30 14% 88%`     | `22 7% 18%`     | color-surface | Sidebar right border, internal group dividers                   | ≥3:1 on `--color-sidebar` (non-text contrast) |
| `--color-sidebar-accent`            | `170 18% 92%`    | `170 12% 14%`   | color-surface | Hover and active nav item background inside Sidebar             | —                                             |
| `--color-sidebar-accent-foreground` | `170 25% 18%`    | `170 18% 88%`   | color-surface | Text on sidebar accent background                               | ≥4.5:1 on `--color-sidebar-accent`            |
| `--color-sidebar-ring`              | `245 40% 36%`    | `245 40% 68%`   | color-surface | Focus ring on Sidebar nav items (inset: `outline-offset: -2px`) | ≥3:1 on `--color-sidebar`                     |

### 2.10 Color — Extended Surface Aliases

Source: `tokens.md` Section 3.1

These are semantic aliases consumed by component code for clarity. Their values mirror the surface-hierarchy tokens listed above.

| Token                     | Light Mode Value | Dark Mode Value | Category      | Aliases           | Used By                                                             |
| ------------------------- | ---------------- | --------------- | ------------- | ----------------- | ------------------------------------------------------------------- |
| `--color-surface`         | `36 20% 99.5%`   | `25 9% 6.5%`    | color-surface | `--color-card`    | EntityCard, AttributesCard, component code preferring semantic name |
| `--color-surface-raised`  | `0 0% 100%`      | `24 8% 9%`      | color-surface | `--color-popover` | Any component that explicitly names its elevation level             |
| `--color-surface-overlay` | `36 18% 97%`     | `25 8% 5.5%`    | color-surface | `--color-sidebar` | Fixed-position panels, overlay surfaces                             |

### 2.11 Color — Chart Series

Source: `tokens.md` Section 3.7

| Token             | Light Mode Value | Dark Mode Value | Category    | Used By                                       |
| ----------------- | ---------------- | --------------- | ----------- | --------------------------------------------- |
| `--color-chart-1` | `245 40% 36%`    | `245 40% 68%`   | color-brand | Data visualization series 1 (Archival Indigo) |
| `--color-chart-2` | `180 50% 30%`    | `180 40% 55%`   | color-brand | Data visualization series 2 (Teal)            |
| `--color-chart-3` | `38 70% 50%`     | `38 60% 55%`    | color-brand | Data visualization series 3 (Manuscript Gold) |
| `--color-chart-4` | `152 45% 32%`    | `152 40% 55%`   | color-brand | Data visualization series 4 (Muted Sage)      |
| `--color-chart-5` | `265 35% 45%`    | `265 32% 62%`   | color-brand | Data visualization series 5 (Indigo-Violet)   |

### 2.12 Typography

Source: `identity.md` Section 3.2; `tokens.md` Section 4.2. These are light-mode-only; no dark overrides exist.

#### Font families

| Token         | Value                                                          | Category   | Used By                                                                    |
| ------------- | -------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `--font-sans` | `var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif` | typography | All UI text, body, labels, navigation                                      |
| `--font-mono` | `var(--font-geist-mono), ui-monospace, monospace`              | typography | Entity IDs, partial dates, transcriptions, archival references, timestamps |

#### Type scale

| Token         | Value      | Pixels | Category   | Used By                                                                          |
| ------------- | ---------- | ------ | ---------- | -------------------------------------------------------------------------------- |
| `--text-xs`   | `0.75rem`  | 12px   | typography | Captions, entity IDs, timestamps, `.text-caption`, `.text-overline`              |
| `--text-sm`   | `0.875rem` | 14px   | typography | Form labels, table headers, secondary UI text, `.text-body-small`, `.text-label` |
| `--text-base` | `1rem`     | 16px   | typography | Body text, form inputs, primary UI (root size), `.text-body`                     |
| `--text-lg`   | `1.125rem` | 18px   | typography | Notes, transcriptions, evidence quotes, `.text-body-large`                       |
| `--text-xl`   | `1.25rem`  | 20px   | typography | Section headings, card titles (h3)                                               |
| `--text-2xl`  | `1.5rem`   | 24px   | typography | Page section headings (h2)                                                       |
| `--text-3xl`  | `1.875rem` | 30px   | typography | Primary page title (h1)                                                          |
| `--text-4xl`  | `2.25rem`  | 36px   | typography | Display headings (marketing/landing)                                             |

#### Leading (line-height) scale

| Token            | Value   | Paired with   |
| ---------------- | ------- | ------------- |
| `--leading-xs`   | `1.5`   | `--text-xs`   |
| `--leading-sm`   | `1.5`   | `--text-sm`   |
| `--leading-base` | `1.625` | `--text-base` |
| `--leading-lg`   | `1.556` | `--text-lg`   |
| `--leading-xl`   | `1.5`   | `--text-xl`   |
| `--leading-2xl`  | `1.333` | `--text-2xl`  |
| `--leading-3xl`  | `1.267` | `--text-3xl`  |
| `--leading-4xl`  | `1.222` | `--text-4xl`  |

#### Tracking (letter-spacing) scale

| Token             | Value      | Paired with   |
| ----------------- | ---------- | ------------- |
| `--tracking-xs`   | `0.02em`   | `--text-xs`   |
| `--tracking-sm`   | `0.01em`   | `--text-sm`   |
| `--tracking-base` | `0em`      | `--text-base` |
| `--tracking-lg`   | `-0.005em` | `--text-lg`   |
| `--tracking-xl`   | `-0.01em`  | `--text-xl`   |
| `--tracking-2xl`  | `-0.015em` | `--text-2xl`  |
| `--tracking-3xl`  | `-0.02em`  | `--text-3xl`  |
| `--tracking-4xl`  | `-0.025em` | `--text-4xl`  |

### 2.13 Border Radius

Source: `identity.md` Section 5.1; `tokens.md` Section 6. No dark overrides.

| Token           | Value      | Category | Used By                                                                                |
| --------------- | ---------- | -------- | -------------------------------------------------------------------------------------- |
| `--radius`      | `0.5rem`   | radius   | shadcn canonical variable; equals `--radius-lg`. All shadcn components default radius. |
| `--radius-none` | `0px`      | radius   | Table cells, inline elements                                                           |
| `--radius-sm`   | `0.25rem`  | radius   | Badges, chips, code blocks, CertaintyBadge                                             |
| `--radius-md`   | `0.375rem` | radius   | Buttons, Inputs, Selects, CertaintySelector options                                    |
| `--radius-lg`   | `0.5rem`   | radius   | Cards, Dialogs, Popovers, EntityCard                                                   |
| `--radius-xl`   | `0.75rem`  | radius   | Large containers, auth card, modals                                                    |
| `--radius-full` | `9999px`   | radius   | Avatars, Avatar fallback, pills, circular indicators                                   |

### 2.14 Shadows

Source: `identity.md` Section 5.3; `tokens.md` Section 7.

Shadow tokens differ between light and dark mode and are overridden in `.dark {}`.

| Token         | Light Mode Value                                                               | Dark Mode Value                                                           | Category | Used By                      |
| ------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------- | ---------------------------- |
| `--shadow-sm` | `0 1px 2px 0 hsl(20 14% 9% / 0.04)`                                            | `0 1px 2px 0 hsl(0 0% 0% / 0.15)`                                         | shadow   | Button hover lift, auth card |
| `--shadow-md` | `0 4px 6px -1px hsl(20 14% 9% / 0.06), 0 2px 4px -2px hsl(20 14% 9% / 0.04)`   | `0 4px 6px -1px hsl(0 0% 0% / 0.25), 0 2px 4px -2px hsl(0 0% 0% / 0.15)`  | shadow   | Popovers, DropdownMenus      |
| `--shadow-lg` | `0 10px 15px -3px hsl(20 14% 9% / 0.07), 0 4px 6px -4px hsl(20 14% 9% / 0.04)` | `0 10px 15px -3px hsl(0 0% 0% / 0.35), 0 4px 6px -4px hsl(0 0% 0% / 0.2)` | shadow   | Dialogs, command palette     |

Note: Most cards use `--color-border` instead of shadows. Shadows serve functional separation only.

### 2.15 Motion — Duration

Source: `identity.md` Section 7.2; `tokens.md` Section 8.1. No dark overrides.

| Token                   | Value   | Category | Used By                                            |
| ----------------------- | ------- | -------- | -------------------------------------------------- |
| `--duration-instant`    | `0ms`   | motion   | Checkbox, radio — no perceptible delay             |
| `--duration-fast`       | `100ms` | motion   | Hover backgrounds, focus ring, tooltip delay       |
| `--duration-normal`     | `200ms` | motion   | Sidebar collapse/expand, theme switch, tab changes |
| `--duration-slow`       | `300ms` | motion   | Dialog open, toast enter, popover appear           |
| `--duration-deliberate` | `500ms` | motion   | Page navigation fade, bulk operation feedback      |

### 2.16 Motion — Easing

Source: `identity.md` Section 7.3; `tokens.md` Section 8.2. No dark overrides.

| Token           | Value                               | Category | Used By                                       |
| --------------- | ----------------------------------- | -------- | --------------------------------------------- |
| `--ease-enter`  | `cubic-bezier(0.16, 1, 0.3, 1)`     | motion   | Entering elements (dialogs, popovers, toasts) |
| `--ease-exit`   | `cubic-bezier(0.7, 0, 0.84, 0)`     | motion   | Exiting elements                              |
| `--ease-move`   | `cubic-bezier(0.65, 0, 0.35, 1)`    | motion   | Layout shifts (sidebar width, panel resize)   |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | motion   | Micro-interactions with subtle overshoot      |
| `--ease-out`    | `cubic-bezier(0.16, 1, 0.3, 1)`     | motion   | Alias for `--ease-enter` (same value)         |
| `--ease-in`     | `cubic-bezier(0.7, 0, 0.84, 0)`     | motion   | Alias for `--ease-exit` (same value)          |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)`    | motion   | Alias for `--ease-move` (same value)          |

### 2.17 Layout

Source: `identity.md` Section 4.3; `tokens.md` Section 5.1. No dark overrides.

| Token                       | Value    | Category | Used By                                                          |
| --------------------------- | -------- | -------- | ---------------------------------------------------------------- |
| `--sidebar-width-open`      | `14rem`  | layout   | AppShell: expanded sidebar `width`, main content `padding-left`  |
| `--sidebar-width-collapsed` | `3rem`   | layout   | AppShell: collapsed sidebar `width`, main content `padding-left` |
| `--topbar-height`           | `3.5rem` | layout   | AppShell: TopBar `height`, page content `padding-top`            |
| `--content-max-width`       | `80rem`  | layout   | Page container `max-width`                                       |

---

## 3. Deletion and Migration List

This section documents every token currently in `src/styles/globals.css` that is either (a) present with a value that contradicts the design system specification, (b) a shadcn scaffold default that was never replaced with Evidoxa values, or (c) an obsolete token from a previous approach.

### 3.1 Audit status

Based on comparison of `src/styles/globals.css` (read 2026-04-02) against the specification values in Section 2 of this document:

**Result: No drift detected.** All token values in `globals.css` match the specification exactly. The file does not contain:

- The zinc/slate defaults that shadcn generates for new projects (e.g., `--background: 0 0% 100%`, `--foreground: 240 10% 3.9%`). These were replaced with Evidoxa warm stone values.
- Any inline `hsl()` wrappers in token values.
- Duplicate token names.
- Tokens from shadcn's old v3 format (bare `--background` instead of `--color-background`).

### 3.2 Shadcn v3 naming patterns that must not exist

If any future scaffolding or package upgrade reintroduces tokens using the v3 naming convention (without the `color-` prefix), they must be deleted. The following names must not appear in `@theme {}`:

| Must not exist             | Replaced by                      |
| -------------------------- | -------------------------------- |
| `--background`             | `--color-background`             |
| `--foreground`             | `--color-foreground`             |
| `--card`                   | `--color-card`                   |
| `--card-foreground`        | `--color-card-foreground`        |
| `--popover`                | `--color-popover`                |
| `--popover-foreground`     | `--color-popover-foreground`     |
| `--primary`                | `--color-primary`                |
| `--primary-foreground`     | `--color-primary-foreground`     |
| `--secondary`              | `--color-secondary`              |
| `--secondary-foreground`   | `--color-secondary-foreground`   |
| `--muted`                  | `--color-muted`                  |
| `--muted-foreground`       | `--color-muted-foreground`       |
| `--accent`                 | `--color-accent`                 |
| `--accent-foreground`      | `--color-accent-foreground`      |
| `--destructive`            | `--color-destructive`            |
| `--destructive-foreground` | `--color-destructive-foreground` |
| `--border`                 | `--color-border`                 |
| `--input`                  | `--color-input`                  |
| `--ring`                   | `--color-ring`                   |

### 3.3 Wrong values that would indicate a regression

If any of the following exact values are found in `@theme {}`, it indicates the shadcn scaffold defaults have been restored and must be replaced:

| Token                              | Wrong (shadcn zinc default)             | Correct (Evidoxa) |
| ---------------------------------- | --------------------------------------- | ----------------- |
| `--color-background` (light)       | `0 0% 100%` or `210 40% 98%`            | `36 25% 98.5%`    |
| `--color-foreground` (light)       | `240 10% 3.9%` or `222.2 84% 4.9%`      | `20 14% 9%`       |
| `--color-primary` (light)          | `240 5.9% 10%` or `222.2 47.4% 11.2%`   | `245 40% 36%`     |
| `--color-muted` (light)            | `240 4.8% 95.9%` or `210 40% 96.1%`     | `33 16% 93%`      |
| `--color-muted-foreground` (light) | `240 3.8% 46.1%` or `215.4 16.3% 46.9%` | `26 10% 38%`      |
| `--color-border` (light)           | `240 5.9% 90%` or `214.3 31.8% 91.4%`   | `30 14% 88%`      |

### 3.4 Tokens that must not be deleted

These tokens exist in `globals.css` and are used by components but do not appear in the `REQUIRED_*` arrays in `src/test/tokens.ts`. Deleting them would silently break component styling. They are intentional additions beyond the shadcn base set:

- `--color-input-border` — used by Input, Select, Textarea for WCAG-compliant border contrast
- `--color-surface`, `--color-surface-raised`, `--color-surface-overlay` — semantic aliases used in custom component code
- `--color-chart-1` through `--color-chart-5` — required for data visualization
- `--color-success-*`, `--color-warning-*`, `--color-info-*` — required for semantic toast/alert states
- `--color-destructive-background`, `--color-destructive-border` — required for alert banners (beyond shadcn's single `--color-destructive`)
- All `--color-certainty-*` tokens (20 total)
- `--leading-*` and `--tracking-*` tokens
- All `--duration-*` and `--ease-*` tokens
- All `--sidebar-*`, `--topbar-*`, `--content-*` layout tokens

---

## 4. Acceptance Criteria Checklist

Tests are written using the utilities in `src/test/tokens.ts`. The test file calls `parseTokens()` to extract token maps without DOM injection, or calls `injectTokensIntoDocument()` then `getTokenValue()` / `getDarkTokenValue()` for DOM-based assertion. Contrast ratio assertions use `contrastRatio(fg, bg)` directly on the HSL channel strings from `parseTokens()`.

### Presence checks

- **AC-TOK-01:** All tokens listed in `REQUIRED_COLOR_TOKENS_LIGHT` exist in the `@theme` block with non-empty values.
- **AC-TOK-02:** All tokens listed in `REQUIRED_SEMANTIC_TOKENS_LIGHT` exist in the `@theme` block with non-empty values.
- **AC-TOK-03-C:** All tokens listed in `REQUIRED_CERTAINTY_TOKENS_LIGHT` (20 tokens: 5 levels × 4 variants) exist in the `@theme` block with non-empty values.
- **AC-TOK-03-S:** All tokens listed in `REQUIRED_SIDEBAR_TOKENS` exist in the `@theme` block with non-empty values.
- **AC-TOK-03-T:** All tokens listed in `REQUIRED_TYPOGRAPHY_TOKENS` exist in the `@theme` block with non-empty values.
- **AC-TOK-03-R:** All tokens listed in `REQUIRED_RADIUS_TOKENS` exist in the `@theme` block with non-empty values.
- **AC-TOK-03-D:** All tokens listed in `REQUIRED_DURATION_TOKENS` exist in the `@theme` block with non-empty values.
- **AC-TOK-03-E:** All tokens listed in `REQUIRED_EASING_TOKENS` exist in the `@theme` block with non-empty values.
- **AC-TOK-03-L:** All tokens listed in `REQUIRED_LAYOUT_TOKENS` exist in the `@theme` block with non-empty values.
- **AC-TOK-03-SH:** All tokens listed in `REQUIRED_SHADOW_TOKENS` exist in the `@theme` block with non-empty values.
- **AC-TOK-04-DK:** All tokens in `REQUIRED_COLOR_TOKENS_LIGHT` plus the shadow tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) exist in the `.dark {}` block with non-empty values. (Non-color tokens do not require dark overrides.)

### Exact value checks — light mode (HSL channels)

- **AC-TOK-05:** `--color-background` light value is exactly `36 25% 98.5%`.
- **AC-TOK-06:** `--color-foreground` light value is exactly `20 14% 9%`.
- **AC-TOK-07:** `--color-card` light value is exactly `36 20% 99.5%`.
- **AC-TOK-08:** `--color-popover` light value is exactly `0 0% 100%`.
- **AC-TOK-09:** `--color-primary` light value is exactly `245 40% 36%`.
- **AC-TOK-10:** `--color-primary-foreground` light value is exactly `240 20% 98%`.
- **AC-TOK-11:** `--color-secondary` light value is exactly `33 16% 93%`.
- **AC-TOK-12:** `--color-muted` light value is exactly `33 16% 93%`.
- **AC-TOK-13:** `--color-muted-foreground` light value is exactly `26 10% 38%`.
- **AC-TOK-14:** `--color-accent` light value is exactly `170 18% 92%`.
- **AC-TOK-15:** `--color-accent-foreground` light value is exactly `170 25% 18%`.
- **AC-TOK-16:** `--color-border` light value is exactly `30 14% 88%`.
- **AC-TOK-17:** `--color-input` light value is exactly `30 14% 88%`.
- **AC-TOK-18:** `--color-input-border` light value is exactly `30 14% 55%`.
- **AC-TOK-19:** `--color-ring` light value is exactly `245 40% 36%`.
- **AC-TOK-20:** `--color-destructive` light value is exactly `4 60% 46%`.
- **AC-TOK-21:** `--color-destructive-foreground` light value is exactly `0 0% 98%`.
- **AC-TOK-22:** `--color-destructive-background` light value is exactly `4 50% 95%`.
- **AC-TOK-23:** `--color-destructive-border` light value is exactly `4 40% 84%`.
- **AC-TOK-24:** `--color-success` light value is exactly `152 45% 32%`.
- **AC-TOK-25:** `--color-success-foreground` light value is exactly `152 50% 14%`.
- **AC-TOK-26:** `--color-success-background` light value is exactly `152 35% 93%`.
- **AC-TOK-27:** `--color-success-border` light value is exactly `152 30% 82%`.
- **AC-TOK-28:** `--color-warning` light value is exactly `38 80% 42%`.
- **AC-TOK-29:** `--color-warning-foreground` light value is exactly `32 70% 18%`.
- **AC-TOK-30:** `--color-warning-background` light value is exactly `40 60% 94%`.
- **AC-TOK-31:** `--color-warning-border` light value is exactly `38 50% 82%`.
- **AC-TOK-32:** `--color-info` light value is exactly `210 55% 44%`.
- **AC-TOK-33:** `--color-info-foreground` light value is exactly `210 60% 16%`.
- **AC-TOK-34:** `--color-info-background` light value is exactly `210 45% 94%`.
- **AC-TOK-35:** `--color-info-border` light value is exactly `210 35% 82%`.
- **AC-TOK-36:** `--color-certainty-certain` light value is exactly `180 50% 30%`.
- **AC-TOK-37:** `--color-certainty-certain-foreground` light value is exactly `180 55% 14%`.
- **AC-TOK-38:** `--color-certainty-certain-background` light value is exactly `180 40% 93%`.
- **AC-TOK-39:** `--color-certainty-certain-border` light value is exactly `180 35% 78%`.
- **AC-TOK-40:** `--color-certainty-probable` light value is exactly `215 50% 38%`.
- **AC-TOK-41:** `--color-certainty-probable-foreground` light value is exactly `215 55% 16%`.
- **AC-TOK-42:** `--color-certainty-probable-background` light value is exactly `215 40% 93%`.
- **AC-TOK-43:** `--color-certainty-probable-border` light value is exactly `215 35% 78%`.
- **AC-TOK-44:** `--color-certainty-possible` light value is exactly `265 35% 45%`.
- **AC-TOK-45:** `--color-certainty-possible-foreground` light value is exactly `265 40% 18%`.
- **AC-TOK-46:** `--color-certainty-possible-background` light value is exactly `265 30% 94%`.
- **AC-TOK-47:** `--color-certainty-possible-border` light value is exactly `265 25% 80%`.
- **AC-TOK-48:** `--color-certainty-unknown` light value is exactly `38 65% 45%`.
- **AC-TOK-49:** `--color-certainty-unknown-foreground` light value is exactly `38 70% 18%`.
- **AC-TOK-50:** `--color-certainty-unknown-background` light value is exactly `38 50% 93%`.
- **AC-TOK-51:** `--color-certainty-unknown-border` light value is exactly `38 40% 76%`.
- **AC-TOK-52:** `--color-certainty-unevidenced` light value is exactly `20 15% 40%`.
- **AC-TOK-53:** `--color-certainty-unevidenced-foreground` light value is exactly `20 20% 22%`.
- **AC-TOK-54:** `--color-certainty-unevidenced-background` light value is exactly `20 10% 94%`.
- **AC-TOK-55:** `--color-certainty-unevidenced-border` light value is exactly `20 10% 80%`.
- **AC-TOK-56:** `--color-sidebar` light value is exactly `36 18% 97%`.
- **AC-TOK-57:** `--color-sidebar-foreground` light value is exactly `20 14% 9%`.
- **AC-TOK-58:** `--color-sidebar-border` light value is exactly `30 14% 88%`.
- **AC-TOK-59:** `--color-sidebar-accent` light value is exactly `170 18% 92%`.
- **AC-TOK-60:** `--color-sidebar-accent-foreground` light value is exactly `170 25% 18%`.
- **AC-TOK-61:** `--color-sidebar-ring` light value is exactly `245 40% 36%`.

### Exact value checks — dark mode (HSL channels)

- **AC-TOK-62:** `--color-background` dark value is exactly `25 10% 4.5%`.
- **AC-TOK-63:** `--color-foreground` dark value is exactly `30 10% 94%`.
- **AC-TOK-64:** `--color-primary` dark value is exactly `245 40% 68%`.
- **AC-TOK-65:** `--color-primary-foreground` dark value is exactly `245 45% 13%`.
- **AC-TOK-66:** `--color-muted-foreground` dark value is exactly `22 5% 55%`.
- **AC-TOK-67:** `--color-border` dark value is exactly `22 7% 18%`.
- **AC-TOK-68:** `--color-input-border` dark value is exactly `22 7% 40%`.
- **AC-TOK-69:** `--color-ring` dark value is exactly `245 40% 68%`.
- **AC-TOK-70:** `--color-certainty-unevidenced` dark value is exactly `20 12% 56%`.
- **AC-TOK-71:** `--color-certainty-unevidenced-foreground` dark value is exactly `20 10% 88%`.
- **AC-TOK-72:** `--color-certainty-unevidenced-background` dark value is exactly `20 8% 10%`.
- **AC-TOK-73:** `--color-certainty-unevidenced-border` dark value is exactly `20 8% 22%`.
- **AC-TOK-74:** `--color-sidebar` dark value is exactly `25 8% 5.5%`.
- **AC-TOK-75:** `--color-sidebar-ring` dark value is exactly `245 40% 68%`.

### Non-color token exact value checks

- **AC-TOK-76:** `--radius` value is exactly `0.5rem`.
- **AC-TOK-77:** `--radius-sm` value is exactly `0.25rem`.
- **AC-TOK-78:** `--radius-md` value is exactly `0.375rem`.
- **AC-TOK-79:** `--radius-lg` value is exactly `0.5rem`.
- **AC-TOK-80:** `--radius-xl` value is exactly `0.75rem`.
- **AC-TOK-81:** `--radius-full` value is exactly `9999px`.
- **AC-TOK-82:** `--duration-instant` value is exactly `0ms`.
- **AC-TOK-83:** `--duration-fast` value is exactly `100ms`.
- **AC-TOK-84:** `--duration-normal` value is exactly `200ms`.
- **AC-TOK-85:** `--duration-slow` value is exactly `300ms`.
- **AC-TOK-86:** `--duration-deliberate` value is exactly `500ms`.
- **AC-TOK-87:** `--ease-enter` value is exactly `cubic-bezier(0.16, 1, 0.3, 1)`.
- **AC-TOK-88:** `--ease-exit` value is exactly `cubic-bezier(0.7, 0, 0.84, 0)`.
- **AC-TOK-89:** `--ease-move` value is exactly `cubic-bezier(0.65, 0, 0.35, 1)`.
- **AC-TOK-90:** `--ease-spring` value is exactly `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- **AC-TOK-91:** `--ease-out` value is exactly `cubic-bezier(0.16, 1, 0.3, 1)`.
- **AC-TOK-92:** `--ease-in` value is exactly `cubic-bezier(0.7, 0, 0.84, 0)`.
- **AC-TOK-93:** `--ease-in-out` value is exactly `cubic-bezier(0.65, 0, 0.35, 1)`.
- **AC-TOK-94:** `--sidebar-width-open` value is exactly `14rem`.
- **AC-TOK-95:** `--sidebar-width-collapsed` value is exactly `3rem`.
- **AC-TOK-96:** `--topbar-height` value is exactly `3.5rem`.
- **AC-TOK-97:** `--content-max-width` value is exactly `80rem`.
- **AC-TOK-98:** `--text-xs` value is exactly `0.75rem`.
- **AC-TOK-99:** `--text-sm` value is exactly `0.875rem`.
- **AC-TOK-100:** `--text-base` value is exactly `1rem`.
- **AC-TOK-101:** `--text-lg` value is exactly `1.125rem`.
- **AC-TOK-102:** `--text-2xl` value is exactly `1.5rem`.
- **AC-TOK-103:** `--text-3xl` value is exactly `1.875rem`.

### Contrast ratio checks

All contrast assertions use `contrastRatio(fg, bg)` from `src/test/tokens.ts`, passing the HSL channel strings obtained from `parseTokens().light` or `parseTokens().dark`. Thresholds are stated as minimum values; the test passes if `contrastRatio(...) >= threshold`.

**Light mode:**

- **AC-TOK-104:** `--color-foreground` on `--color-background` (light): `contrastRatio("20 14% 9%", "36 25% 98.5%") >= 7`. (AAA body text target. Design system states 15.8:1.)
- **AC-TOK-105:** `--color-muted-foreground` on `--color-background` (light): `contrastRatio("26 10% 38%", "36 25% 98.5%") >= 4.5`. (AA normal text. Design system states 5.8:1.)
- **AC-TOK-106:** `--color-primary` on `--color-background` (light): `contrastRatio("245 40% 36%", "36 25% 98.5%") >= 4.5`. (Design system states 8.2:1.)
- **AC-TOK-107:** `--color-primary-foreground` on `--color-primary` (light): `contrastRatio("240 20% 98%", "245 40% 36%") >= 4.5`. (Design system states 11.4:1.)
- **AC-TOK-108:** `--color-destructive` on `--color-background` (light): `contrastRatio("4 60% 46%", "36 25% 98.5%") >= 4.5`.
- **AC-TOK-109:** `--color-destructive-foreground` on `--color-destructive` (light): `contrastRatio("0 0% 98%", "4 60% 46%") >= 4.5`.
- **AC-TOK-110:** `--color-success` on `--color-background` (light): `contrastRatio("152 45% 32%", "36 25% 98.5%") >= 4.5`.
- **AC-TOK-111:** `--color-success-foreground` on `--color-success-background` (light): `contrastRatio("152 50% 14%", "152 35% 93%") >= 4.5`.
- **AC-TOK-112:** `--color-warning` on `--color-background` (light): `contrastRatio("38 80% 42%", "36 25% 98.5%") >= 4.5`.
- **AC-TOK-113:** `--color-warning-foreground` on `--color-warning-background` (light): `contrastRatio("32 70% 18%", "40 60% 94%") >= 4.5`.
- **AC-TOK-114:** `--color-info` on `--color-background` (light): `contrastRatio("210 55% 44%", "36 25% 98.5%") >= 4.5`.
- **AC-TOK-115:** `--color-info-foreground` on `--color-info-background` (light): `contrastRatio("210 60% 16%", "210 45% 94%") >= 4.5`.
- **AC-TOK-116:** `--color-certainty-certain` on `--color-background` (light): `contrastRatio("180 50% 30%", "36 25% 98.5%") >= 3`.
- **AC-TOK-117:** `--color-certainty-certain-foreground` on `--color-certainty-certain-background` (light): `contrastRatio("180 55% 14%", "180 40% 93%") >= 4.5`.
- **AC-TOK-118:** `--color-certainty-probable` on `--color-background` (light): `contrastRatio("215 50% 38%", "36 25% 98.5%") >= 3`.
- **AC-TOK-119:** `--color-certainty-probable-foreground` on `--color-certainty-probable-background` (light): `contrastRatio("215 55% 16%", "215 40% 93%") >= 4.5`.
- **AC-TOK-120:** `--color-certainty-possible` on `--color-background` (light): `contrastRatio("265 35% 45%", "36 25% 98.5%") >= 3`.
- **AC-TOK-121:** `--color-certainty-possible-foreground` on `--color-certainty-possible-background` (light): `contrastRatio("265 40% 18%", "265 30% 94%") >= 4.5`.
- **AC-TOK-122:** `--color-certainty-unknown` on `--color-background` (light): `contrastRatio("38 65% 45%", "36 25% 98.5%") >= 3`.
- **AC-TOK-123:** `--color-certainty-unknown-foreground` on `--color-certainty-unknown-background` (light): `contrastRatio("38 70% 18%", "38 50% 93%") >= 4.5`.
- **AC-TOK-124:** `--color-certainty-unevidenced` on `--color-background` (light): `contrastRatio("20 15% 40%", "36 25% 98.5%") >= 3`.
- **AC-TOK-125:** `--color-certainty-unevidenced-foreground` on `--color-certainty-unevidenced-background` (light): `contrastRatio("20 20% 22%", "20 10% 94%") >= 4.5`.
- **AC-TOK-126:** `--color-input-border` on `--color-background` (light): `contrastRatio("30 14% 55%", "36 25% 98.5%") >= 3`. (WCAG 1.4.11 UI component contrast.)
- **AC-TOK-127:** `--color-ring` on `--color-background` (light): `contrastRatio("245 40% 36%", "36 25% 98.5%") >= 3`. (Focus indicator contrast.)
- **AC-TOK-128:** `--color-sidebar-foreground` on `--color-sidebar` (light): `contrastRatio("20 14% 9%", "36 18% 97%") >= 4.5`.

**Dark mode:**

- **AC-TOK-129:** `--color-foreground` on `--color-background` (dark): `contrastRatio("30 10% 94%", "25 10% 4.5%") >= 7`. (Design system states 14.2:1.)
- **AC-TOK-130:** `--color-muted-foreground` on `--color-background` (dark): `contrastRatio("22 5% 55%", "25 10% 4.5%") >= 4.5`. (Design system states 5.2:1.)
- **AC-TOK-131:** `--color-primary` on `--color-background` (dark): `contrastRatio("245 40% 68%", "25 10% 4.5%") >= 4.5`. (Design system states 8.7:1.)
- **AC-TOK-132:** `--color-primary-foreground` on `--color-primary` (dark): `contrastRatio("245 45% 13%", "245 40% 68%") >= 4.5`. (Design system states 9.1:1.)
- **AC-TOK-133:** `--color-certainty-certain` on `--color-background` (dark): `contrastRatio("180 40% 55%", "25 10% 4.5%") >= 3`.
- **AC-TOK-134:** `--color-certainty-certain-foreground` on `--color-certainty-certain-background` (dark): `contrastRatio("180 30% 92%", "180 25% 12%") >= 4.5`.
- **AC-TOK-135:** `--color-certainty-probable` on `--color-background` (dark): `contrastRatio("215 42% 60%", "25 10% 4.5%") >= 3`.
- **AC-TOK-136:** `--color-certainty-probable-foreground` on `--color-certainty-probable-background` (dark): `contrastRatio("215 30% 92%", "215 25% 12%") >= 4.5`.
- **AC-TOK-137:** `--color-certainty-possible` on `--color-background` (dark): `contrastRatio("265 32% 62%", "25 10% 4.5%") >= 3`.
- **AC-TOK-138:** `--color-certainty-possible-foreground` on `--color-certainty-possible-background` (dark): `contrastRatio("265 25% 92%", "265 20% 13%") >= 4.5`.
- **AC-TOK-139:** `--color-certainty-unknown` on `--color-background` (dark): `contrastRatio("38 55% 55%", "25 10% 4.5%") >= 3`.
- **AC-TOK-140:** `--color-certainty-unknown-foreground` on `--color-certainty-unknown-background` (dark): `contrastRatio("38 40% 92%", "38 30% 12%") >= 4.5`.
- **AC-TOK-141:** `--color-certainty-unevidenced` on `--color-background` (dark): `contrastRatio("20 12% 56%", "25 10% 4.5%") >= 3`.
- **AC-TOK-142:** `--color-certainty-unevidenced-foreground` on `--color-certainty-unevidenced-background` (dark): `contrastRatio("20 10% 88%", "20 8% 10%") >= 4.5`.
- **AC-TOK-143:** `--color-input-border` on `--color-background` (dark): `contrastRatio("22 7% 40%", "25 10% 4.5%") >= 3`.
- **AC-TOK-144:** `--color-ring` on `--color-background` (dark): `contrastRatio("245 40% 68%", "25 10% 4.5%") >= 3`.
- **AC-TOK-145:** `--color-sidebar-foreground` on `--color-sidebar` (dark): `contrastRatio("30 10% 94%", "25 8% 5.5%") >= 4.5`.

### Format checks

- **AC-TOK-146:** No color token value in `@theme {}` contains the string `hsl(`. All color token values must be bare HSL channel strings. A regex test on the raw CSS text: `/--color-[^:]+:\s*hsl\(/` must return zero matches within the `@theme {}` block.
- **AC-TOK-147:** No shadcn v3 bare names (without `color-` prefix) appear inside `@theme {}`. A scan for patterns like `--background:`, `--foreground:`, `--primary:` (without the `color-` prefix) must return zero matches within `@theme {}`.

---

## 5. Token Dependency Map

This map shows which component categories depend on which token groups. It drives the implementation and test order: a component cannot be correctly implemented until all tokens it depends on are confirmed passing their AC-TOK tests.

### Reading the map

Each row names a component or component group, the token groups it requires (by category name used in Section 2), and the minimum AC-TOK checks that must pass before the component is tested in later phases.

| Component / Group                                     | Token groups required                                                                                                                                 | Minimum AC-TOK gates                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **AppShell / Layout**                                 | Layout (`--sidebar-*`, `--topbar-*`), Surface Hierarchy (background, foreground), Motion (duration-normal, ease-move)                                 | AC-TOK-94–96, AC-TOK-05–06, AC-TOK-84, AC-TOK-89                      |
| **TopBar**                                            | Surface Hierarchy (background), Brand (primary), Borders (ring), Layout (topbar-height)                                                               | AC-TOK-05, AC-TOK-09, AC-TOK-19, AC-TOK-96                            |
| **Sidebar**                                           | Sidebar tokens (all 6), Layout (sidebar-width-\*), Motion (duration-normal, ease-move), Radius (radius-md)                                            | AC-TOK-56–61, AC-TOK-74–75 (dark), AC-TOK-94–95, AC-TOK-84, AC-TOK-77 |
| **Button (default/primary)**                          | Brand (primary, primary-foreground), Radius (radius-md), Motion (duration-fast), Ring                                                                 | AC-TOK-09–10, AC-TOK-78, AC-TOK-83, AC-TOK-19                         |
| **Button (destructive)**                              | Semantic destructive (all 4), Radius (radius-md)                                                                                                      | AC-TOK-20–23, AC-TOK-78                                               |
| **Button (secondary/outline/ghost)**                  | Brand (secondary, muted, accent), Borders (border)                                                                                                    | AC-TOK-11–15, AC-TOK-16                                               |
| **Input / Select / Textarea**                         | Borders (input, input-border), Brand (muted, muted-foreground), Ring, Radius (radius-md)                                                              | AC-TOK-17–18, AC-TOK-12–13, AC-TOK-19, AC-TOK-78                      |
| **Card / EntityCard / AttributesCard**                | Surface (card, card-foreground), Borders (border), Radius (radius-lg, radius-xl), Shadow (shadow-sm)                                                  | AC-TOK-07 (card), AC-TOK-16 (border), AC-TOK-79–80, AC-TOK-103-SH     |
| **Popover / DropdownMenu / Tooltip / CommandPalette** | Surface (popover, popover-foreground), Borders (border), Radius (radius-lg), Shadow (shadow-md, shadow-lg)                                            | AC-TOK-08, AC-TOK-16, AC-TOK-79                                       |
| **Dialog / AlertDialog**                              | Surface (popover), Borders (border), Semantic (destructive), Radius (radius-xl), Shadow (shadow-lg)                                                   | AC-TOK-08, AC-TOK-20–23, AC-TOK-80                                    |
| **Badge**                                             | Radius (radius-sm), brand muted, or semantic tokens depending on variant                                                                              | AC-TOK-77, relevant semantic AC-TOK gates per variant                 |
| **DataTable**                                         | Surface (card, muted), Brand (muted-foreground), Borders (border), Radius (radius-none via `rounded-none`)                                            | AC-TOK-07, AC-TOK-12–13, AC-TOK-16                                    |
| **Tabs**                                              | Brand (primary, muted, accent), Borders (border), Motion (duration-fast)                                                                              | AC-TOK-09, AC-TOK-12, AC-TOK-14, AC-TOK-16, AC-TOK-83                 |
| **Toast / Sonner**                                    | Semantic (all groups), Surface (popover), Motion (duration-slow, ease-enter, ease-exit), Radius (radius-lg)                                           | AC-TOK-20–35, AC-TOK-08, AC-TOK-85, AC-TOK-87–88, AC-TOK-79           |
| **Alert**                                             | Semantic (destructive, success, warning, info — all 4 variants each), Radius (radius-lg)                                                              | AC-TOK-20–35, AC-TOK-79                                               |
| **Skeleton**                                          | Brand (muted), Motion (duration-deliberate, ease-in-out)                                                                                              | AC-TOK-12, AC-TOK-86, AC-TOK-93                                       |
| **Avatar**                                            | Radius (radius-full), Brand (muted, muted-foreground)                                                                                                 | AC-TOK-81, AC-TOK-12–13                                               |
| **Separator**                                         | Borders (border)                                                                                                                                      | AC-TOK-16                                                             |
| **CertaintyBadge / CertaintySelector**                | All 20 certainty tokens (5 levels × 4 variants), Radius (radius-sm for badge, radius-md for selector options, radius-lg for selector container), Ring | AC-TOK-36–55 (light), AC-TOK-133–142 (dark), AC-TOK-77–79             |
| **PropertyEvidence Badge**                            | Certainty tokens (same as CertaintyBadge), Brand (muted, muted-foreground), Borders (border)                                                          | AC-TOK-36–55, AC-TOK-12–13, AC-TOK-16                                 |
| **NetworkStatusIndicator**                            | Semantic (success, warning, destructive — base and background), Typography (text-xs, text-sm)                                                         | AC-TOK-24–31, AC-TOK-20–23, AC-TOK-98–99                              |
| **Empty State**                                       | Surface (background, card), Brand (muted-foreground), Semantic (any), Typography (text-sm, text-base, text-xl)                                        | AC-TOK-05, AC-TOK-07, AC-TOK-13, AC-TOK-98, AC-TOK-100                |
| **Focus ring (global :focus-visible)**                | Ring                                                                                                                                                  | AC-TOK-19, AC-TOK-69 (dark), AC-TOK-127, AC-TOK-144 (dark)            |
| **body / base layer**                                 | Surface (background, foreground), Typography (font-sans, text-base, leading-base), Motion (duration-normal, ease-in-out)                              | AC-TOK-05–06, AC-TOK-100, AC-TOK-84, AC-TOK-93                        |
| **Theme switch transition**                           | Motion (duration-normal, ease-in-out)                                                                                                                 | AC-TOK-84, AC-TOK-93                                                  |

### Test execution order

1. **Phase 1:** Run all AC-TOK-01 through AC-TOK-103 (presence and exact value checks). These are purely static and run without DOM injection. Use `parseTokens()` directly.
2. **Phase 2:** Run AC-TOK-104 through AC-TOK-145 (contrast ratio checks). These also use `parseTokens()` directly — no DOM injection needed. The `contrastRatio()` utility operates on raw HSL channel strings.
3. **Phase 3:** Run AC-TOK-146 and AC-TOK-147 (format checks). These operate on the `rawCss` string returned by `parseTokens()`.
4. **Phase 4 (component tests, later phases):** Any component test file can assume all AC-TOK checks pass. Component tests call `injectTokensIntoDocument()` in `beforeAll()` so Tailwind class resolutions can be asserted via `getComputedStyle`.

---

_Specification authored by Design System Specification Writer. Values are transcribed verbatim from identity.md and tokens.md and cross-verified against the current globals.css. Any discrepancy between this document and globals.css is a regression in globals.css — this spec is authoritative._
