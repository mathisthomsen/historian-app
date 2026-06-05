# Design Token Inventory — Evidoxa

**Date:** 2026-04-02
**Author:** Design Token Engineer
**Status:** Complete — implementation live in `src/styles/globals.css`
**Upstream dependencies:** `02-brand/identity.md`, `03-ui/concept.md`

---

## Table of Contents

1. [Naming Convention](#1-naming-convention)
2. [How to Add New Tokens](#2-how-to-add-new-tokens)
3. [Color Token Inventory](#3-color-token-inventory)
4. [Typography Tokens](#4-typography-tokens)
5. [Spacing and Layout Tokens](#5-spacing-and-layout-tokens)
6. [Border Radius Tokens](#6-border-radius-tokens)
7. [Shadow Tokens](#7-shadow-tokens)
8. [Motion Tokens](#8-motion-tokens)
9. [Tailwind v4 Usage Guide](#9-tailwind-v4-usage-guide)
10. [shadcn/ui Compatibility Notes](#10-shadcnui-compatibility-notes)
11. [Token Mapping Table](#11-token-mapping-table)

---

## 1. Naming Convention

### Structure

All CSS custom properties follow a consistent naming pattern:

```
--{category}-{semantic-group}-{variant}
```

| Segment          | Purpose                   | Examples                                                           |
| ---------------- | ------------------------- | ------------------------------------------------------------------ |
| `category`       | The type of token         | `color`, `font`, `radius`, `shadow`, `duration`, `ease`            |
| `semantic-group` | What the token represents | `background`, `primary`, `certainty-certain`, `sidebar`            |
| `variant`        | Modifier within the group | `foreground`, `background`, `border`, (omitted for the base value) |

### Examples

| Variable                               | Category | Group             | Variant    | Meaning                         |
| -------------------------------------- | -------- | ----------------- | ---------- | ------------------------------- |
| `--color-background`                   | color    | background        | —          | Page background surface         |
| `--color-primary`                      | color    | primary           | —          | Primary brand color (base)      |
| `--color-primary-foreground`           | color    | primary           | foreground | Text on primary background      |
| `--color-certainty-certain`            | color    | certainty-certain | —          | Certain level indicator color   |
| `--color-certainty-certain-background` | color    | certainty-certain | background | Certain level badge background  |
| `--color-certainty-certain-border`     | color    | certainty-certain | border     | Certain level badge border      |
| `--radius-md`                          | radius   | md                | —          | Medium border radius            |
| `--duration-fast`                      | duration | fast              | —          | 100ms animation duration        |
| `--ease-enter`                         | ease     | enter             | —          | Enter animation easing function |

### Color Format

All color tokens use **HSL channel values without the `hsl()` wrapper**:

```css
/* Token definition (globals.css @theme block): */
--color-primary: 245 40% 36%;

/* Usage in component CSS or Tailwind: */
color: hsl(var(--color-primary));

/* Usage via Tailwind utility (automatic): */
/* text-primary → color: hsl(var(--color-primary)) */
```

This is the shadcn/ui convention. It enables composing colors with opacity modifiers:

```css
/* 50% opacity variant, no extra token needed: */
background-color: hsl(var(--color-primary) / 0.5);
/* Tailwind: bg-primary/50 */
```

### Dark Mode Tokens

Dark mode overrides live in the `.dark {}` block in `globals.css`. These are not separate token names — they redefine the same variables under the `.dark` selector. This means component code never needs to reference dark-specific token names. The tokens are context-aware automatically.

---

## 2. How to Add New Tokens

### Step 1: Determine the category and group name

Follow the naming convention above. If the token is a color, choose a semantic name that describes its _purpose_, not its visual value. Use `--color-success` not `--color-green`. Use `--color-certainty-certain` not `--color-teal`.

### Step 2: Add the token to `@theme` in `globals.css`

```css
@theme {
  /* Add under the appropriate comment section */
  --color-my-new-token: 210 50% 44%;
}
```

### Step 3: Add the dark mode override in `.dark {}`

Only include the dark variant if the value differs from light mode. Non-color tokens (radius, spacing, duration) rarely need a dark override.

```css
.dark {
  --color-my-new-token: 210 45% 62%;
}
```

### Step 4: Document the token in this file

Add a row to the relevant inventory table below. Include:

- CSS variable name
- Light mode value
- Dark mode value
- Intended usage context

### Step 5: Verify contrast (for color tokens)

Use a contrast checker to verify the combination meets:

- **4.5:1** for normal body text
- **3:1** for large text (18px+ regular or 14px+ bold) and UI components
- **7:1** target for body text in extended reading contexts (AAA)

### What NOT to do

- Do not add raw color values in component files. Always reference a token.
- Do not create tokens for one-off values. If a color appears in only one place, use an existing token or reconsider the design.
- Do not modify existing token values without updating this document and checking all usages.
- Do not create tokens that duplicate Tailwind's built-in utilities (e.g., no `--spacing-4` when `p-4` exists).

---

## 3. Color Token Inventory

### 3.1 Surface Hierarchy

Four elevation levels create depth through lightness and warmth rather than dramatic shadows.

| CSS Variable                 | Light Mode Value | Dark Mode Value | Usage                                                                               |
| ---------------------------- | ---------------- | --------------- | ----------------------------------------------------------------------------------- |
| `--color-background`         | `36 25% 98.5%`   | `25 10% 4.5%`   | Page background (the ground surface). Warm off-white / warm deep charcoal.          |
| `--color-foreground`         | `20 14% 9%`      | `30 10% 94%`    | Primary text, headings. 15.8:1 (light) / 14.2:1 (dark) on background.               |
| `--color-card`               | `36 20% 99.5%`   | `25 9% 6.5%`    | Card and table surfaces. Nearly white but warm.                                     |
| `--color-card-foreground`    | `20 14% 9%`      | `30 10% 94%`    | Text within card surfaces.                                                          |
| `--color-popover`            | `0 0% 100%`      | `24 8% 9%`      | Popovers, dropdowns, tooltips. True white / deepest dark for "floating" separation. |
| `--color-popover-foreground` | `20 14% 9%`      | `30 10% 94%`    | Text within overlays.                                                               |
| `--color-surface`            | `36 20% 99.5%`   | `25 9% 6.5%`    | Named alias for `--color-card`. Semantic surface label.                             |
| `--color-surface-raised`     | `0 0% 100%`      | `24 8% 9%`      | Named alias for `--color-popover`. Floating surfaces.                               |
| `--color-surface-overlay`    | `36 18% 97%`     | `25 8% 5.5%`    | Named alias for `--color-sidebar`. Fixed panels.                                    |

### 3.2 Brand Colors

| CSS Variable                   | Light Mode Value | Dark Mode Value | Usage                                                                                      |
| ------------------------------ | ---------------- | --------------- | ------------------------------------------------------------------------------------------ |
| `--color-primary`              | `245 40% 36%`    | `245 40% 68%`   | Primary buttons, active states, focus rings, current-page indicators. Archival indigo.     |
| `--color-primary-foreground`   | `240 20% 98%`    | `245 45% 13%`   | Text on primary-colored backgrounds. 11.4:1 (light) / 9.1:1 (dark) on primary.             |
| `--color-secondary`            | `33 16% 93%`     | `24 8% 14%`     | Secondary button backgrounds, muted action surfaces.                                       |
| `--color-secondary-foreground` | `20 12% 16%`     | `30 10% 94%`    | Text on secondary backgrounds.                                                             |
| `--color-muted`                | `33 16% 93%`     | `24 8% 14%`     | Muted backgrounds: table headers, input backgrounds, skeleton states.                      |
| `--color-muted-foreground`     | `26 10% 38%`     | `22 5% 55%`     | Deemphasized text: placeholders, captions, secondary labels. 5.8:1 (light) / 5.2:1 (dark). |
| `--color-accent`               | `170 18% 92%`    | `170 12% 14%`   | Hover state backgrounds, active sidebar item background. Desaturated verdigris.            |
| `--color-accent-foreground`    | `170 25% 18%`    | `170 18% 88%`   | Text on accent backgrounds.                                                                |

### 3.3 Borders and Inputs

| CSS Variable           | Light Mode Value | Dark Mode Value | Usage                                                                                                                         |
| ---------------------- | ---------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--color-border`       | `30 14% 88%`     | `22 7% 18%`     | Card borders, dividers, table row separators. Subtle — structural, not emphatic.                                              |
| `--color-input`        | `30 14% 88%`     | `22 7% 18%`     | Input element fill/background. Currently matches `--color-border`.                                                            |
| `--color-input-border` | `30 14% 55%`     | `22 7% 40%`     | Input element border — HIGHER contrast than `--color-border`. 3.5:1 (light) / 3.2:1 (dark). Distinct token for accessibility. |
| `--color-ring`         | `245 40% 36%`    | `245 40% 68%`   | Focus ring color. Matches `--color-primary`. 8.2:1 (light) / 8.7:1 (dark).                                                    |

**Why `--color-input-border` is separate from `--color-border`:**
The general `--color-border` (light: 88% lightness) is intentionally subtle for structural borders on cards and dividers. Form inputs require a higher-contrast border so users with low contrast sensitivity can perceive the input field boundaries. Per WCAG 1.4.11 (Non-text Contrast), UI components require 3:1.

### 3.4 Semantic Colors

Each semantic group has four tokens: the indicator color, its foreground (text on the background), a soft background (for banners and chips), and a border (for outlined badges).

#### Destructive (Iron Oxide)

A muted red-brown. Serious but not alarming. Distinct from the certainty palette.

| CSS Variable                     | Light Mode Value | Dark Mode Value | Usage                                                              |
| -------------------------------- | ---------------- | --------------- | ------------------------------------------------------------------ |
| `--color-destructive`            | `4 60% 46%`      | `4 55% 58%`     | Delete buttons, error indicators, destructive action confirmation. |
| `--color-destructive-foreground` | `0 0% 98%`       | `4 40% 94%`     | Text on destructive-colored elements.                              |
| `--color-destructive-background` | `4 50% 95%`      | `4 35% 11%`     | Error banner background, destructive badge fill.                   |
| `--color-destructive-border`     | `4 40% 84%`      | `4 25% 24%`     | Error banner border, destructive badge outline.                    |

#### Success (Muted Sage)

| CSS Variable                 | Light Mode Value | Dark Mode Value | Usage                                                     |
| ---------------------------- | ---------------- | --------------- | --------------------------------------------------------- |
| `--color-success`            | `152 45% 32%`    | `152 40% 55%`   | Success toast icon, reviewed status, positive indicators. |
| `--color-success-foreground` | `152 50% 14%`    | `152 30% 92%`   | Text on success backgrounds.                              |
| `--color-success-background` | `152 35% 93%`    | `152 25% 12%`   | Success toast/banner background, reviewed badge fill.     |
| `--color-success-border`     | `152 30% 82%`    | `152 20% 22%`   | Success badge outline.                                    |

#### Warning (Archival Amber)

| CSS Variable                 | Light Mode Value | Dark Mode Value | Usage                                                                          |
| ---------------------------- | ---------------- | --------------- | ------------------------------------------------------------------------------ |
| `--color-warning`            | `38 80% 42%`     | `38 70% 55%`    | Warning toast icon, network degraded indicator, unreviewed status.             |
| `--color-warning-foreground` | `32 70% 18%`     | `38 50% 94%`    | Text on warning backgrounds.                                                   |
| `--color-warning-background` | `40 60% 94%`     | `38 40% 11%`    | Warning banner/badge background. Also used for "claim without evidence" badge. |
| `--color-warning-border`     | `38 50% 82%`     | `38 30% 24%`    | Warning badge border. Dashed border style for "claim without evidence."        |

#### Info (Manuscript Blue)

| CSS Variable              | Light Mode Value | Dark Mode Value | Usage                                            |
| ------------------------- | ---------------- | --------------- | ------------------------------------------------ |
| `--color-info`            | `210 55% 44%`    | `210 50% 62%`   | Informational toast icon, neutral notice states. |
| `--color-info-foreground` | `210 60% 16%`    | `210 35% 94%`   | Text on info backgrounds.                        |
| `--color-info-background` | `210 45% 94%`    | `210 30% 11%`   | Info banner/badge background.                    |
| `--color-info-border`     | `210 35% 82%`    | `210 22% 24%`   | Info badge border.                               |

### 3.5 Certainty Colors

The certainty palette is the most critical color subsystem in Evidoxa. It must:

1. Progress from cool (confident) to warm (attention-seeking)
2. Never rely on the red-green spectrum
3. Be distinguishable under protanopia, deuteranopia, and tritanopia
4. Be paired with distinct icon shapes (dual-channel encoding)

The five-step direction: **Teal (Certain) → Blue (Probable) → Indigo-Violet (Possible) → Amber (Unknown) → Warm-Grey (Unevidenced)**

#### Certain — Teal (hue 180)

| CSS Variable                           | Light Mode Value | Dark Mode Value | Usage                                                  |
| -------------------------------------- | ---------------- | --------------- | ------------------------------------------------------ |
| `--color-certainty-certain`            | `180 50% 30%`    | `180 40% 55%`   | Badge text/icon color. Paired with filled-circle icon. |
| `--color-certainty-certain-foreground` | `180 55% 14%`    | `180 30% 92%`   | Text within a certain-background element.              |
| `--color-certainty-certain-background` | `180 40% 93%`    | `180 25% 12%`   | Badge fill for the Certain level.                      |
| `--color-certainty-certain-border`     | `180 35% 78%`    | `180 20% 26%`   | Badge border for the Certain level.                    |

#### Probable — Manuscript Blue (hue 215)

| CSS Variable                            | Light Mode Value | Dark Mode Value | Usage                                                         |
| --------------------------------------- | ---------------- | --------------- | ------------------------------------------------------------- |
| `--color-certainty-probable`            | `215 50% 38%`    | `215 42% 60%`   | Badge text/icon color. Paired with three-quarter-circle icon. |
| `--color-certainty-probable-foreground` | `215 55% 16%`    | `215 30% 92%`   | Text within a probable-background element.                    |
| `--color-certainty-probable-background` | `215 40% 93%`    | `215 25% 12%`   | Badge fill for the Probable level.                            |
| `--color-certainty-probable-border`     | `215 35% 78%`    | `215 20% 26%`   | Badge border for the Probable level.                          |

#### Possible — Indigo-Violet (hue 265)

| CSS Variable                            | Light Mode Value | Dark Mode Value | Usage                                                |
| --------------------------------------- | ---------------- | --------------- | ---------------------------------------------------- |
| `--color-certainty-possible`            | `265 35% 45%`    | `265 32% 62%`   | Badge text/icon color. Paired with half-circle icon. |
| `--color-certainty-possible-foreground` | `265 40% 18%`    | `265 25% 92%`   | Text within a possible-background element.           |
| `--color-certainty-possible-background` | `265 30% 94%`    | `265 20% 13%`   | Badge fill for the Possible level.                   |
| `--color-certainty-possible-border`     | `265 25% 80%`    | `265 16% 28%`   | Badge border for the Possible level.                 |

#### Unknown — Archival Amber (hue 38)

| CSS Variable                           | Light Mode Value | Dark Mode Value | Usage                                                        |
| -------------------------------------- | ---------------- | --------------- | ------------------------------------------------------------ |
| `--color-certainty-unknown`            | `38 65% 45%`     | `38 55% 55%`    | Badge text/icon color. Paired with empty-circle (ring) icon. |
| `--color-certainty-unknown-foreground` | `38 70% 18%`     | `38 40% 92%`    | Text within an unknown-background element.                   |
| `--color-certainty-unknown-background` | `38 50% 93%`     | `38 30% 12%`    | Badge fill for the Unknown level.                            |
| `--color-certainty-unknown-border`     | `38 40% 76%`     | `38 25% 26%`    | Badge border for the Unknown level.                          |

#### Unevidenced — Warm Grey (hue 20)

| CSS Variable                               | Light Mode Value | Dark Mode Value | Usage                                                                     |
| ------------------------------------------ | ---------------- | --------------- | ------------------------------------------------------------------------- |
| `--color-certainty-unevidenced`            | `20 15% 40%`     | `20 12% 56%`    | Badge text/icon color. Paired with dashed-circle icon.                    |
| `--color-certainty-unevidenced-foreground` | `20 20% 22%`     | `20 10% 88%`    | Text within an unevidenced-background element.                            |
| `--color-certainty-unevidenced-background` | `20 10% 94%`     | `20 8% 10%`     | Badge fill for the Unevidenced level.                                     |
| `--color-certainty-unevidenced-border`     | `20 10% 80%`     | `20 8% 22%`     | Badge border. Rendered as `border-style: dashed` to reinforce icon shape. |

### 3.6 Sidebar Tokens

| CSS Variable                        | Light Mode Value | Dark Mode Value | Usage                                                                                            |
| ----------------------------------- | ---------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| `--color-sidebar`                   | `36 18% 97%`     | `25 8% 5.5%`    | Sidebar background. Slightly cooler than page background (light) / slightly above ground (dark). |
| `--color-sidebar-foreground`        | `20 14% 9%`      | `30 10% 94%`    | Default text and icon color within the sidebar.                                                  |
| `--color-sidebar-border`            | `30 14% 88%`     | `22 7% 18%`     | Sidebar right border and internal dividers.                                                      |
| `--color-sidebar-accent`            | `170 18% 92%`    | `170 12% 14%`   | Hover and active item background in the sidebar.                                                 |
| `--color-sidebar-accent-foreground` | `170 25% 18%`    | `170 18% 88%`   | Text on sidebar accent backgrounds.                                                              |
| `--color-sidebar-ring`              | `245 40% 36%`    | `245 40% 68%`   | Focus ring for sidebar navigation items. Uses inset outline-offset.                              |

### 3.7 Chart Colors

Used for data visualization series. Ordered to maintain maximum contrast between adjacent series.

| CSS Variable      | Light Mode Value | Dark Mode Value | Notes                                                   |
| ----------------- | ---------------- | --------------- | ------------------------------------------------------- |
| `--color-chart-1` | `245 40% 36%`    | `245 40% 68%`   | Archival Indigo (primary brand). Series 1.              |
| `--color-chart-2` | `180 50% 30%`    | `180 40% 55%`   | Teal (certainty-certain hue). Series 2.                 |
| `--color-chart-3` | `38 70% 50%`     | `38 60% 55%`    | Manuscript Gold. Series 3. Distinct from warning amber. |
| `--color-chart-4` | `152 45% 32%`    | `152 40% 55%`   | Muted Sage (success hue). Series 4.                     |
| `--color-chart-5` | `265 35% 45%`    | `265 32% 62%`   | Indigo-Violet (certainty-possible hue). Series 5.       |

---

## 4. Typography Tokens

### 4.1 Font Families

| CSS Variable  | Value                                                          | Usage                                                               |
| ------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| `--font-sans` | `var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif` | All UI text, body copy, labels, navigation                          |
| `--font-mono` | `var(--font-geist-mono), ui-monospace, monospace`              | IDs, partial dates, transcriptions, archival references, timestamps |

`--font-geist-sans` and `--font-geist-mono` are injected by `next/font/google` at runtime.

### 4.2 Type Scale

| CSS Variable  | Rem        | Px  | Line Height                 | Letter Spacing                 | Usage                                     |
| ------------- | ---------- | --- | --------------------------- | ------------------------------ | ----------------------------------------- |
| `--text-xs`   | `0.75rem`  | 12  | `var(--leading-xs)` 1.5     | `var(--tracking-xs)` 0.02em    | Smallest metadata, legal text             |
| `--text-sm`   | `0.875rem` | 14  | `var(--leading-sm)` 1.5     | `var(--tracking-sm)` 0.01em    | Form labels, table headers, secondary UI  |
| `--text-base` | `1rem`     | 16  | `var(--leading-base)` 1.625 | `var(--tracking-base)` 0em     | Body text, inputs, primary UI (root size) |
| `--text-lg`   | `1.125rem` | 18  | `var(--leading-lg)` 1.556   | `var(--tracking-lg)` -0.005em  | Notes, transcriptions, evidence quotes    |
| `--text-xl`   | `1.25rem`  | 20  | `var(--leading-xl)` 1.5     | `var(--tracking-xl)` -0.01em   | Section headings, card titles (h3)        |
| `--text-2xl`  | `1.5rem`   | 24  | `var(--leading-2xl)` 1.333  | `var(--tracking-2xl)` -0.015em | Page section headings (h2)                |
| `--text-3xl`  | `1.875rem` | 30  | `var(--leading-3xl)` 1.267  | `var(--tracking-3xl)` -0.02em  | Primary page title (h1)                   |
| `--text-4xl`  | `2.25rem`  | 36  | `var(--leading-4xl)` 1.222  | `var(--tracking-4xl)` -0.025em | Display headings (marketing/landing)      |

### 4.3 Typography Utilities

These `@layer utilities` classes combine size, line-height, letter-spacing, and weight into semantic shortcuts. Apply in addition to Tailwind text-color classes.

| Class              | Size        | Weight   | Special                                                      | Usage                                             |
| ------------------ | ----------- | -------- | ------------------------------------------------------------ | ------------------------------------------------- |
| `.text-body`       | `text-base` | 400      | —                                                            | Standard body text, form values                   |
| `.text-body-large` | `text-lg`   | 400      | —                                                            | Notes, transcription reading areas                |
| `.text-body-small` | `text-sm`   | 400      | —                                                            | Table cells, compact UI text                      |
| `.text-caption`    | `text-xs`   | 400      | sets `text-muted-foreground`                                 | Timestamps, count labels, attribution             |
| `.text-overline`   | `text-xs`   | 500      | uppercase, `tracking-[0.08em]`, sets `text-muted-foreground` | Section labels above headings, entity type labels |
| `.text-label`      | `text-sm`   | 500      | —                                                            | Form field labels, `<dt>` attribute names         |
| `.text-mono`       | inherits    | inherits | `font-family: var(--font-mono)`, `tabular-nums`              | IDs, dates, archival references, code             |

---

## 5. Spacing and Layout Tokens

### 5.1 Component-Specific Layout Tokens

These are not spacing utilities (use Tailwind's built-in scale for that) but named structural dimensions.

| CSS Variable                | Value            | Usage                                                              |
| --------------------------- | ---------------- | ------------------------------------------------------------------ |
| `--sidebar-width-open`      | `14rem` (224px)  | Expanded sidebar width. Applied as `padding-left` to main content. |
| `--sidebar-width-collapsed` | `3rem` (48px)    | Collapsed (icon-only) sidebar width.                               |
| `--topbar-height`           | `3.5rem` (56px)  | Fixed top bar height. Applied as `padding-top` to page content.    |
| `--content-max-width`       | `80rem` (1280px) | Maximum content area width (`max-w-7xl`).                          |

### 5.2 Spacing Reference (Tailwind Classes)

These use Tailwind's built-in scale rather than custom tokens. Documented here for reference:

| Usage                               | Value       | Tailwind Class |
| ----------------------------------- | ----------- | -------------- |
| Badge vertical padding              | 2px         | `py-0.5`       |
| Badge horizontal padding            | 8px         | `px-2`         |
| Button vertical padding (default)   | 10px        | `py-2.5`       |
| Button horizontal padding (default) | 16px        | `px-4`         |
| Input padding                       | 10px / 12px | `py-2.5 px-3`  |
| Card padding (default)              | 24px        | `p-6`          |
| Card padding (compact)              | 16px        | `p-4`          |
| FieldGroup padding                  | 16px        | `p-4`          |
| Section vertical gap                | 24px        | `space-y-6`    |
| Form field gap                      | 16px        | `space-y-4`    |

---

## 6. Border Radius Tokens

| CSS Variable    | Value            | Tailwind Class Mapping | Usage                                                 |
| --------------- | ---------------- | ---------------------- | ----------------------------------------------------- |
| `--radius`      | `0.5rem` (8px)   | `rounded-lg`           | shadcn canonical; same as `--radius-lg`.              |
| `--radius-none` | `0px`            | `rounded-none`         | Table cells, inline elements. Rectilinear.            |
| `--radius-sm`   | `0.25rem` (4px)  | `rounded-sm`           | Badges, small chips, code blocks.                     |
| `--radius-md`   | `0.375rem` (6px) | `rounded-md`           | Buttons, inputs, selects. Default interactive radius. |
| `--radius-lg`   | `0.5rem` (8px)   | `rounded-lg`           | Cards, dialogs, popovers. Default container radius.   |
| `--radius-xl`   | `0.75rem` (12px) | `rounded-xl`           | Large containers, modals, auth card.                  |
| `--radius-full` | `9999px`         | `rounded-full`         | Avatars, circular indicators, pills.                  |

**Nesting rule:** Nested elements use a smaller radius than their parent. Card (`radius-lg`) contains buttons (`radius-md`) which contain badges (`radius-sm`). Table rows use `radius-none`.

---

## 7. Shadow Tokens

### Light Mode

| CSS Variable  | Value                                                                          | Usage                         |
| ------------- | ------------------------------------------------------------------------------ | ----------------------------- |
| `--shadow-sm` | `0 1px 2px 0 hsl(20 14% 9% / 0.04)`                                            | Button hover lift, auth card. |
| `--shadow-md` | `0 4px 6px -1px hsl(20 14% 9% / 0.06), 0 2px 4px -2px hsl(20 14% 9% / 0.04)`   | Popovers, dropdown menus.     |
| `--shadow-lg` | `0 10px 15px -3px hsl(20 14% 9% / 0.07), 0 4px 6px -4px hsl(20 14% 9% / 0.04)` | Dialogs, command palette.     |

Shadow color is warm stone neutral-900 (`hsl(20 14% 9%)`), not pure black. This keeps the "grounded" feeling of the Evidoxa visual language. Shadows are very subtle; most cards use borders only, not shadows.

### Dark Mode

| CSS Variable  | Dark Mode Value                                                           | Notes                                                                                         |
| ------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--shadow-sm` | `0 1px 2px 0 hsl(0 0% 0% / 0.15)`                                         | Shifts to pure black; increased opacity since warm shadows are invisible on dark backgrounds. |
| `--shadow-md` | `0 4px 6px -1px hsl(0 0% 0% / 0.25), 0 2px 4px -2px hsl(0 0% 0% / 0.15)`  | Supplementary to border-based elevation.                                                      |
| `--shadow-lg` | `0 10px 15px -3px hsl(0 0% 0% / 0.35), 0 4px 6px -4px hsl(0 0% 0% / 0.2)` | Dialog overlay provides primary separation.                                                   |

---

## 8. Motion Tokens

### 8.1 Duration Scale

| CSS Variable            | Value   | Usage                                                     |
| ----------------------- | ------- | --------------------------------------------------------- |
| `--duration-instant`    | `0ms`   | Checkbox toggle, radio select. No perceptible transition. |
| `--duration-fast`       | `100ms` | Hover backgrounds, focus ring appearance, tooltip delay.  |
| `--duration-normal`     | `200ms` | Sidebar collapse/expand, theme switch, tab panel changes. |
| `--duration-slow`       | `300ms` | Dialog open, toast enter, popover appear.                 |
| `--duration-deliberate` | `500ms` | Page navigation fade, bulk operation feedback.            |

### 8.2 Easing Functions

| CSS Variable    | Value                               | When to Use                                                                            |
| --------------- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| `--ease-enter`  | `cubic-bezier(0.16, 1, 0.3, 1)`     | Elements appearing: dialogs, popovers, toasts. Fast start, gentle deceleration.        |
| `--ease-exit`   | `cubic-bezier(0.7, 0, 0.84, 0)`     | Elements disappearing. Slow start, fast exit — user returns to work quickly.           |
| `--ease-move`   | `cubic-bezier(0.65, 0, 0.35, 1)`    | Layout shifts: sidebar width, panel resize. Symmetric S-curve.                         |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Micro-interactions only: badge count update, certainty level change. Subtle overshoot. |
| `--ease-out`    | same as `--ease-enter`              | Alias for shadcn/ui and other conventions.                                             |
| `--ease-in`     | same as `--ease-exit`               | Alias.                                                                                 |
| `--ease-in-out` | same as `--ease-move`               | Alias.                                                                                 |

### 8.3 Reduced-Motion Strategy

When `prefers-reduced-motion: reduce` is active:

1. The global reset in `@layer base` collapses all animation/transition durations to `0.01ms`.
2. Individual animation utilities (`.slide-in-from-*`, `.scale-in`) are overridden to use opacity-only variants.
3. Components that must provide essential feedback (dialogs, toasts) may opt back into opacity-only fades at reduced durations.

| Original behavior                | Reduced-motion replacement                 |
| -------------------------------- | ------------------------------------------ |
| Dialog scale + fade (300ms)      | Opacity only (instant due to global reset) |
| Toast slide + fade (300ms)       | Opacity only                               |
| Sidebar width transition (200ms) | Instant width change                       |
| Page fade (500ms)                | Instant content swap                       |
| Badge scale pulse (100ms)        | No animation                               |
| Skeleton pulse (2000ms)          | Static `opacity: 0.6`                      |
| Theme color transition (200ms)   | Instant color change                       |

---

## 9. Tailwind v4 Usage Guide

### How Tailwind v4 Consumes `@theme` Tokens

In Tailwind v4, CSS custom properties defined in `@theme {}` automatically generate Tailwind utility classes. The color variables are consumed as:

```
--color-{name}  →  bg-{name}, text-{name}, border-{name}, ring-{name}
--font-{name}   →  font-{name}
--radius-{name} →  rounded-{name}
--shadow-{name} →  shadow-{name}
```

Tailwind wraps color values in `hsl()` automatically, which is why values are stored without the wrapper.

### Color Utilities

```jsx
// Backgrounds
<div className="bg-background" />         // hsl(var(--color-background))
<div className="bg-card" />               // hsl(var(--color-card))
<div className="bg-primary" />            // hsl(var(--color-primary))
<div className="bg-muted" />              // hsl(var(--color-muted))
<div className="bg-accent" />             // hsl(var(--color-accent))
<div className="bg-destructive" />        // hsl(var(--color-destructive))
<div className="bg-success-background" /> // hsl(var(--color-success-background))

// Opacity modifiers (enabled by the channel-value format)
<div className="bg-primary/10" />         // hsl(var(--color-primary) / 0.1)
<div className="bg-accent/50" />          // hsl(var(--color-accent) / 0.5)

// Text colors
<p className="text-foreground" />
<p className="text-muted-foreground" />
<p className="text-primary" />
<p className="text-destructive" />
<p className="text-certainty-certain" />  // hsl(var(--color-certainty-certain))

// Border colors
<div className="border-border" />
<div className="border-input-border" />
<div className="border-certainty-certain-border" />

// Ring (focus)
<button className="focus-visible:ring-ring" />
```

### Typography Utilities

```jsx
// Tailwind built-in (auto-generated from @theme)
<p className="font-sans" />      // var(--font-sans)
<code className="font-mono" />   // var(--font-mono)
<p className="text-sm" />        // var(--text-sm)
<h1 className="text-3xl" />      // var(--text-3xl)

// Custom utilities from @layer utilities
<p className="text-body" />          // size + line-height + tracking + weight
<p className="text-body-large" />
<p className="text-caption" />       // also sets text-muted-foreground color
<p className="text-overline" />      // uppercase label style
<code className="text-mono" />       // Geist Mono + tabular-nums
```

### Radius Utilities

```jsx
<button className="rounded-md" />   // var(--radius-md) = 6px
<div className="rounded-lg" />      // var(--radius-lg) = 8px (also --radius)
<div className="rounded-xl" />      // var(--radius-xl) = 12px
<span className="rounded-full" />   // var(--radius-full) = 9999px
```

### Animation Utilities

```jsx
// Combine animate-in/out with a motion variant class
<div className="animate-in fade-in" />
<div className="animate-in slide-in-from-bottom" />
<div className="animate-out fade-out" />
<div className="animate-out scale-out" />

// Skeleton loading
<div className="animate-skeleton-pulse bg-muted rounded-md" />
```

### Certainty Badge Pattern

```jsx
// Full badge (utility classes)
<span className="certainty-certain rounded-full border px-2 py-0.5 text-xs font-medium">
  Sicher
</span>

// Or with explicit Tailwind classes (equivalent)
<span className="rounded-full border border-certainty-certain-border
                 bg-certainty-certain-background text-certainty-certain-foreground
                 px-2 py-0.5 text-xs font-medium">
  Sicher
</span>
```

---

## 10. shadcn/ui Compatibility Notes

shadcn/ui components reference CSS custom properties through Tailwind utility classes. When a shadcn component uses `bg-background`, it resolves to `hsl(var(--color-background))`. The token names in Evidoxa's `@theme` block match shadcn's expected names exactly, so all components are automatically re-skinned.

### Direct Mapping (No Configuration Needed)

| shadcn expects             | Evidoxa provides                 | Notes                                            |
| -------------------------- | -------------------------------- | ------------------------------------------------ |
| `--background`             | `--color-background`             | v4: Tailwind adds `color-` prefix automatically. |
| `--foreground`             | `--color-foreground`             |                                                  |
| `--card`                   | `--color-card`                   |                                                  |
| `--card-foreground`        | `--color-card-foreground`        |                                                  |
| `--popover`                | `--color-popover`                |                                                  |
| `--popover-foreground`     | `--color-popover-foreground`     |                                                  |
| `--primary`                | `--color-primary`                | Archival Indigo (replaces shadcn zinc).          |
| `--primary-foreground`     | `--color-primary-foreground`     |                                                  |
| `--secondary`              | `--color-secondary`              | Warm stone (replaces zinc secondary).            |
| `--secondary-foreground`   | `--color-secondary-foreground`   |                                                  |
| `--muted`                  | `--color-muted`                  | Warm stone (replaces zinc muted).                |
| `--muted-foreground`       | `--color-muted-foreground`       |                                                  |
| `--accent`                 | `--color-accent`                 | Verdigris (replaces zinc accent).                |
| `--accent-foreground`      | `--color-accent-foreground`      |                                                  |
| `--destructive`            | `--color-destructive`            | Iron oxide (replaces pure red).                  |
| `--destructive-foreground` | `--color-destructive-foreground` |                                                  |
| `--border`                 | `--color-border`                 | Warm stone border.                               |
| `--input`                  | `--color-input`                  |                                                  |
| `--ring`                   | `--color-ring`                   | Archival Indigo focus ring.                      |
| `--radius`                 | `--radius`                       | `0.5rem` — same value, standard shadcn variable. |

### Tailwind v4 Note on the `color-` Prefix

Tailwind v4 automatically namespaces CSS custom properties defined in `@theme` with `color-` for color tokens. This means the `@theme` block uses `--color-background` but the Tailwind class is `bg-background` (not `bg-color-background`). shadcn/ui's class names (`bg-background`, `text-foreground`, etc.) work correctly without any modification.

### Extended Tokens (Evidoxa Additions Beyond shadcn)

These tokens are not used by shadcn components directly but are used by Evidoxa's custom components and utilities:

- `--color-input-border` — higher-contrast input border
- `--color-success-*` — four-token success group
- `--color-warning-*` — four-token warning group
- `--color-info-*` — four-token info group
- `--color-destructive-background`, `--color-destructive-border` — extended destructive group
- `--color-certainty-*` — twenty certainty tokens (5 levels × 4 variants)
- `--color-sidebar-*` — six sidebar tokens
- `--color-surface`, `--color-surface-raised`, `--color-surface-overlay` — named elevation aliases
- `--color-chart-1` through `--color-chart-5` — data visualization series

---

## 11. Token Mapping Table

Maps the design concept's semantic language to CSS variables to Tailwind classes.

| Design Concept Term       | CSS Variable                           | Tailwind Class                                                     | Dark Mode Variant |
| ------------------------- | -------------------------------------- | ------------------------------------------------------------------ | ----------------- |
| Page background           | `--color-background`                   | `bg-background`                                                    | Auto via `.dark`  |
| Primary text              | `--color-foreground`                   | `text-foreground`                                                  | Auto              |
| Card surface              | `--color-card`                         | `bg-card`                                                          | Auto              |
| Floating overlay          | `--color-popover`                      | `bg-popover`                                                       | Auto              |
| Brand action (button)     | `--color-primary`                      | `bg-primary`                                                       | Auto              |
| Text on brand color       | `--color-primary-foreground`           | `text-primary-foreground`                                          | Auto              |
| Muted text (deemphasized) | `--color-muted-foreground`             | `text-muted-foreground`                                            | Auto              |
| Muted background          | `--color-muted`                        | `bg-muted`                                                         | Auto              |
| Hover state background    | `--color-accent`                       | `bg-accent`                                                        | Auto              |
| Structural border         | `--color-border`                       | `border-border`                                                    | Auto              |
| Input field border        | `--color-input-border`                 | `border-[hsl(var(--color-input-border))]` or `border-input-border` | Auto              |
| Focus ring                | `--color-ring`                         | `ring-ring`                                                        | Auto              |
| Delete action             | `--color-destructive`                  | `bg-destructive` / `text-destructive`                              | Auto              |
| Delete banner             | `--color-destructive-background`       | `bg-destructive-background`                                        | Auto              |
| Success state             | `--color-success`                      | `text-success`                                                     | Auto              |
| Success banner            | `--color-success-background`           | `bg-success-background`                                            | Auto              |
| Warning state             | `--color-warning`                      | `text-warning`                                                     | Auto              |
| Warning banner            | `--color-warning-background`           | `bg-warning-background`                                            | Auto              |
| Info state                | `--color-info`                         | `text-info`                                                        | Auto              |
| Sidebar surface           | `--color-sidebar`                      | `bg-sidebar`                                                       | Auto              |
| Sidebar active item       | `--color-sidebar-accent`               | `bg-sidebar-accent`                                                | Auto              |
| Certainty: Certain        | `--color-certainty-certain`            | `text-certainty-certain`                                           | Auto              |
| Certainty: Probable       | `--color-certainty-probable`           | `text-certainty-probable`                                          | Auto              |
| Certainty: Possible       | `--color-certainty-possible`           | `text-certainty-possible`                                          | Auto              |
| Certainty: Unknown        | `--color-certainty-unknown`            | `text-certainty-unknown`                                           | Auto              |
| Certainty: Unevidenced    | `--color-certainty-unevidenced`        | `text-certainty-unevidenced`                                       | Auto              |
| Certainty badge fill      | `--color-certainty-{level}-background` | `bg-certainty-{level}-background`                                  | Auto              |
| Certainty badge border    | `--color-certainty-{level}-border`     | `border-certainty-{level}-border`                                  | Auto              |
| Certainty badge text      | `--color-certainty-{level}-foreground` | `text-certainty-{level}-foreground`                                | Auto              |
| UI font                   | `--font-sans`                          | `font-sans`                                                        | —                 |
| Monospace font            | `--font-mono`                          | `font-mono`                                                        | —                 |
| Default border radius     | `--radius`                             | `rounded-lg`                                                       | —                 |
| Small radius              | `--radius-sm`                          | `rounded-sm`                                                       | —                 |
| Interactive radius        | `--radius-md`                          | `rounded-md`                                                       | —                 |
| Large container radius    | `--radius-xl`                          | `rounded-xl`                                                       | —                 |
| Pill/circle radius        | `--radius-full`                        | `rounded-full`                                                     | —                 |
| Sidebar width (open)      | `--sidebar-width-open`                 | `w-[var(--sidebar-width-open)]`                                    | —                 |
| Sidebar width (closed)    | `--sidebar-width-collapsed`            | `w-[var(--sidebar-width-collapsed)]`                               | —                 |
| Top bar height            | `--topbar-height`                      | `h-[var(--topbar-height)]`                                         | —                 |
| Hover animation           | `--duration-fast`                      | `duration-[var(--duration-fast)]`                                  | —                 |
| Component animation       | `--duration-normal`                    | `duration-[var(--duration-normal)]`                                | —                 |
| Overlay animation         | `--duration-slow`                      | `duration-[var(--duration-slow)]`                                  | —                 |
| Enter easing              | `--ease-enter`                         | `ease-[var(--ease-enter)]`                                         | —                 |
| Exit easing               | `--ease-exit`                          | `ease-[var(--ease-exit)]`                                          | —                 |
| Layout shift easing       | `--ease-move`                          | `ease-[var(--ease-move)]`                                          | —                 |
| Micro-interaction easing  | `--ease-spring`                        | `ease-[var(--ease-spring)]`                                        | —                 |

---

_All token values are sourced from `02-brand/identity.md` Sections 2–8 and `03-ui/concept.md` Sections 5 and 7. Do not modify values without cross-referencing the upstream identity document._
