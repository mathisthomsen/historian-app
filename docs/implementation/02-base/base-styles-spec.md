# Base Styles Implementation Specification

**Scope:** `@layer base` and `@layer utilities` in `src/styles/globals.css`
**Date:** 2026-04-02
**Status:** Ready for implementation and test authoring
**Upstream dependencies:**

- `docs/design-system/02-brand/identity.md` — Sections 2, 3, 5.4, 7
- `docs/design-system/03-ui/concept.md` — Sections 2.1, 5.4
- `docs/design-system/04-design-system/tokens.md` — Sections 3, 4, 8
- `src/styles/globals.css` — `@theme` block (token definitions, lines 28–262), `.dark` block (lines 272–394)

---

## Table of Contents

1. [Typography Base](#1-typography-base)
2. [Focus Styles](#2-focus-styles)
3. [Selection Styles](#3-selection-styles)
4. [Scrollbar Styles](#4-scrollbar-styles)
5. [Animation Utilities](#5-animation-utilities)
6. [Typography Utility Classes](#6-typography-utility-classes)
7. [Certainty Badge Utilities](#7-certainty-badge-utilities)
8. [Acceptance Criteria](#8-acceptance-criteria)

---

## Preliminary: Token Dependencies

All computed values in this specification derive from tokens defined in `src/styles/globals.css`. The table below lists every token referenced by the base styles. Values are in HSL channel format (no `hsl()` wrapper in the token; wrapper added at point of use).

| Token                                      | Light Mode Value                                               | Dark Mode Value |
| ------------------------------------------ | -------------------------------------------------------------- | --------------- |
| `--color-background`                       | `36 25% 98.5%`                                                 | `25 10% 4.5%`   |
| `--color-foreground`                       | `20 14% 9%`                                                    | `30 10% 94%`    |
| `--color-muted-foreground`                 | `26 10% 38%`                                                   | `22 5% 55%`     |
| `--color-primary`                          | `245 40% 36%`                                                  | `245 40% 68%`   |
| `--color-ring`                             | `245 40% 36%`                                                  | `245 40% 68%`   |
| `--color-muted`                            | `33 16% 93%`                                                   | `24 8% 14%`     |
| `--font-sans`                              | `var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif` | (same)          |
| `--font-mono`                              | `var(--font-geist-mono), ui-monospace, monospace`              | (same)          |
| `--text-base`                              | `1rem` (16px)                                                  | (same)          |
| `--text-sm`                                | `0.875rem` (14px)                                              | (same)          |
| `--text-lg`                                | `1.125rem` (18px)                                              | (same)          |
| `--text-xl`                                | `1.25rem` (20px)                                               | (same)          |
| `--text-2xl`                               | `1.5rem` (24px)                                                | (same)          |
| `--text-3xl`                               | `1.875rem` (30px)                                              | (same)          |
| `--text-xs`                                | `0.75rem` (12px)                                               | (same)          |
| `--leading-base`                           | `1.625`                                                        | (same)          |
| `--leading-lg`                             | `1.556`                                                        | (same)          |
| `--leading-xl`                             | `1.5`                                                          | (same)          |
| `--leading-2xl`                            | `1.333`                                                        | (same)          |
| `--leading-3xl`                            | `1.267`                                                        | (same)          |
| `--leading-sm`                             | `1.5`                                                          | (same)          |
| `--leading-xs`                             | `1.5`                                                          | (same)          |
| `--tracking-base`                          | `0em`                                                          | (same)          |
| `--tracking-lg`                            | `-0.005em`                                                     | (same)          |
| `--tracking-xl`                            | `-0.01em`                                                      | (same)          |
| `--tracking-2xl`                           | `-0.015em`                                                     | (same)          |
| `--tracking-3xl`                           | `-0.02em`                                                      | (same)          |
| `--tracking-sm`                            | `0.01em`                                                       | (same)          |
| `--tracking-xs`                            | `0.02em`                                                       | (same)          |
| `--duration-slow`                          | `300ms`                                                        | (same)          |
| `--duration-normal`                        | `200ms`                                                        | (same)          |
| `--duration-fast`                          | `100ms`                                                        | (same)          |
| `--ease-enter`                             | `cubic-bezier(0.16, 1, 0.3, 1)`                                | (same)          |
| `--ease-exit`                              | `cubic-bezier(0.7, 0, 0.84, 0)`                                | (same)          |
| `--ease-in-out`                            | `cubic-bezier(0.65, 0, 0.35, 1)`                               | (same)          |
| `--ease-spring`                            | `cubic-bezier(0.34, 1.56, 0.64, 1)`                            | (same)          |
| `--radius-full`                            | `9999px`                                                       | (same)          |
| `--color-certainty-certain-background`     | `180 40% 93%`                                                  | `180 25% 12%`   |
| `--color-certainty-certain-border`         | `180 35% 78%`                                                  | `180 20% 26%`   |
| `--color-certainty-certain-foreground`     | `180 55% 14%`                                                  | `180 30% 92%`   |
| `--color-certainty-probable-background`    | `215 40% 93%`                                                  | `215 25% 12%`   |
| `--color-certainty-probable-border`        | `215 35% 78%`                                                  | `215 20% 26%`   |
| `--color-certainty-probable-foreground`    | `215 55% 16%`                                                  | `215 30% 92%`   |
| `--color-certainty-possible-background`    | `265 30% 94%`                                                  | `265 20% 13%`   |
| `--color-certainty-possible-border`        | `265 25% 80%`                                                  | `265 16% 28%`   |
| `--color-certainty-possible-foreground`    | `265 40% 18%`                                                  | `265 25% 92%`   |
| `--color-certainty-unknown-background`     | `38 50% 93%`                                                   | `38 30% 12%`    |
| `--color-certainty-unknown-border`         | `38 40% 76%`                                                   | `38 25% 26%`    |
| `--color-certainty-unknown-foreground`     | `38 70% 18%`                                                   | `38 40% 92%`    |
| `--color-certainty-unevidenced-background` | `20 10% 94%`                                                   | `20 8% 10%`     |
| `--color-certainty-unevidenced-border`     | `20 10% 80%`                                                   | `20 8% 22%`     |
| `--color-certainty-unevidenced-foreground` | `20 20% 22%`                                                   | `20 10% 88%`    |

---

## 1. Typography Base

Typography base rules live in `@layer base`. They establish defaults for the document that require no class to activate.

### 1.1 Universal Border Color Reset

**Selector:** `*`

| Property       | Value                      | Token            |
| -------------- | -------------------------- | ---------------- |
| `border-color` | `hsl(var(--color-border))` | `--color-border` |

**Purpose:** All elements inherit the warm stone border color by default, so adding `border` anywhere produces the correct color without requiring `border-border` on every element.

**Reference:** `globals.css` line 404–406; `tokens.md` Section 3.3.

---

### 1.2 Body Text

**Selector:** `body`

| Property                     | Value                                   | Token                | Computed value                                                 |
| ---------------------------- | --------------------------------------- | -------------------- | -------------------------------------------------------------- |
| `background-color`           | `hsl(var(--color-background))`          | `--color-background` | `hsl(36 25% 98.5%)` light / `hsl(25 10% 4.5%)` dark            |
| `color`                      | `hsl(var(--color-foreground))`          | `--color-foreground` | `hsl(20 14% 9%)` light / `hsl(30 10% 94%)` dark                |
| `font-family`                | `var(--font-sans)`                      | `--font-sans`        | `var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif` |
| `font-size`                  | `var(--text-base)`                      | `--text-base`        | `1rem` (16px)                                                  |
| `line-height`                | `var(--leading-base)`                   | `--leading-base`     | `1.625`                                                        |
| `transition-property`        | `background-color, color, border-color` | —                    | (theme-switch transition)                                      |
| `transition-duration`        | `var(--duration-normal)`                | `--duration-normal`  | `200ms`                                                        |
| `transition-timing-function` | `var(--ease-in-out)`                    | `--ease-in-out`      | `cubic-bezier(0.65, 0, 0.35, 1)`                               |

**Notes:**

- `font-weight` is not set on `body`; it inherits browser default of `400`. No explicit override is required.
- `letter-spacing` is not set on `body`; `--tracking-base` is `0em`, so the browser default is correct.
- The theme-switch transition animates `background-color`, `color`, and `border-color` only. `transform` and layout properties are NOT included to prevent unintended layout shifts.

**Reference:** `globals.css` lines 408–420; `identity.md` Section 3.2 (`text-base` row), Section 7.4.

---

### 1.3 Heading Styles

Heading styles are specified here for `@layer base` implementation. The exact CSS properties below must be applied as base rules on `h1`, `h2`, `h3`, and `h4` selectors.

#### h1

| Property         | Value                          | Token                | Computed value        |
| ---------------- | ------------------------------ | -------------------- | --------------------- |
| `font-size`      | `var(--text-3xl)`              | `--text-3xl`         | `1.875rem` (30px)     |
| `font-weight`    | `600`                          | —                    | semibold              |
| `line-height`    | `var(--leading-3xl)`           | `--leading-3xl`      | `1.267`               |
| `letter-spacing` | `var(--tracking-3xl)`          | `--tracking-3xl`     | `-0.02em`             |
| `color`          | `hsl(var(--color-foreground))` | `--color-foreground` | inherited from `body` |

**Usage:** Page title, entity name on detail pages (e.g., "Johann von Dalberg", "Personen").

#### h2

| Property         | Value                          | Token                | Computed value  |
| ---------------- | ------------------------------ | -------------------- | --------------- |
| `font-size`      | `var(--text-2xl)`              | `--text-2xl`         | `1.5rem` (24px) |
| `font-weight`    | `600`                          | —                    | semibold        |
| `line-height`    | `var(--leading-2xl)`           | `--leading-2xl`      | `1.333`         |
| `letter-spacing` | `var(--tracking-2xl)`          | `--tracking-2xl`     | `-0.015em`      |
| `color`          | `hsl(var(--color-foreground))` | `--color-foreground` | inherited       |

**Usage:** Section titles, card headers, FieldGroup legends.

#### h3

| Property         | Value                          | Token                | Computed value   |
| ---------------- | ------------------------------ | -------------------- | ---------------- |
| `font-size`      | `var(--text-xl)`               | `--text-xl`          | `1.25rem` (20px) |
| `font-weight`    | `500`                          | —                    | medium           |
| `line-height`    | `var(--leading-xl)`            | `--leading-xl`       | `1.5`            |
| `letter-spacing` | `var(--tracking-xl)`           | `--tracking-xl`      | `-0.01em`        |
| `color`          | `hsl(var(--color-foreground))` | `--color-foreground` | inherited        |

**Usage:** Sub-section titles, tab panel headers.

#### h4

| Property         | Value                          | Token                | Computed value    |
| ---------------- | ------------------------------ | -------------------- | ----------------- |
| `font-size`      | `var(--text-lg)`               | `--text-lg`          | `1.125rem` (18px) |
| `font-weight`    | `500`                          | —                    | medium            |
| `line-height`    | `var(--leading-lg)`            | `--leading-lg`       | `1.556`           |
| `letter-spacing` | `var(--tracking-lg)`           | `--tracking-lg`      | `-0.005em`        |
| `color`          | `hsl(var(--color-foreground))` | `--color-foreground` | inherited         |

**Usage:** Minor headings, inline group labels.

**Rules for all headings:**

- Heading level must never be skipped in the DOM. `h1` is always the page-level entity name or title.
- Color uses full-contrast `foreground`, never `muted-foreground`.

**Reference:** `identity.md` Section 3.3; `tokens.md` Section 4.2.

---

### 1.4 Link Styles

**Selector:** `a`

| State            | Property                | Value                                                        | Token                             |
| ---------------- | ----------------------- | ------------------------------------------------------------ | --------------------------------- |
| Default          | `color`                 | `hsl(var(--color-primary))`                                  | `--color-primary`                 |
| Default          | `text-decoration`       | `underline`                                                  | —                                 |
| Default          | `text-decoration-color` | `hsl(var(--color-primary) / 0.4)`                            | `--color-primary` at 40% opacity  |
| Default          | `text-underline-offset` | `2px`                                                        | —                                 |
| `:hover`         | `text-decoration-color` | `hsl(var(--color-primary))`                                  | `--color-primary` at 100% opacity |
| `:hover`         | `transition`            | `text-decoration-color var(--duration-fast) var(--ease-out)` | `--duration-fast`, `--ease-out`   |
| `:focus-visible` | `outline`               | `2px solid hsl(var(--color-ring))`                           | `--color-ring`                    |
| `:focus-visible` | `outline-offset`        | `2px`                                                        | —                                 |
| `:focus-visible` | `border-radius`         | `2px`                                                        | —                                 |

**Notes:**

- The `:focus-visible` rule on `a` is provided by the global `:focus-visible` selector defined in Section 2. No separate rule on `a:focus-visible` is required unless overriding for navigation contexts.
- Links within navigation (`sidebar`, `topbar`, `breadcrumbs`) will override color via component-specific classes. The base style applies to inline prose links.

**Reference:** `identity.md` Section 3 (general); `concept.md` Section 2.1 (sidebar focus), Section 2.6 (source reference links as `text-primary`).

---

### 1.5 Code and Preformatted Text

**Selector:** `code` (inline)

| Property           | Value                           | Token           | Computed value                                    |
| ------------------ | ------------------------------- | --------------- | ------------------------------------------------- |
| `font-family`      | `var(--font-mono)`              | `--font-mono`   | `var(--font-geist-mono), ui-monospace, monospace` |
| `font-size`        | `0.875em`                       | —               | ~14px when inside body text (em-relative)         |
| `background-color` | `hsl(var(--color-muted) / 0.6)` | `--color-muted` | warm stone muted at 60% opacity                   |
| `border-radius`    | `var(--radius-sm)`              | `--radius-sm`   | `0.25rem` (4px)                                   |
| `padding`          | `0.125em 0.25em`                | —               | 2px 4px (em-relative)                             |

**Selector:** `pre`

| Property           | Value                     | Token           | Computed value                                    |
| ------------------ | ------------------------- | --------------- | ------------------------------------------------- |
| `font-family`      | `var(--font-mono)`        | `--font-mono`   | `var(--font-geist-mono), ui-monospace, monospace` |
| `font-size`        | `var(--text-sm)`          | `--text-sm`     | `0.875rem` (14px)                                 |
| `background-color` | `hsl(var(--color-muted))` | `--color-muted` | `hsl(33 16% 93%)` light / `hsl(24 8% 14%)` dark   |
| `border-radius`    | `var(--radius-sm)`        | `--radius-sm`   | `0.25rem` (4px)                                   |
| `padding`          | `1rem`                    | —               | `16px`                                            |
| `overflow-x`       | `auto`                    | —               | —                                                 |

**Selector:** `pre code` (code inside pre — reset inline styles)

| Property           | Value         |
| ------------------ | ------------- |
| `background-color` | `transparent` |
| `border-radius`    | `0`           |
| `padding`          | `0`           |
| `font-size`        | `inherit`     |

**Reference:** `identity.md` Section 3.5; `tokens.md` Sections 4.1, 6.

---

### 1.6 Strong and Em

**Selector:** `strong`

| Property      | Value |
| ------------- | ----- |
| `font-weight` | `600` |

**Selector:** `em`

| Property     | Value    |
| ------------ | -------- |
| `font-style` | `italic` |

These are browser defaults that must be preserved. No token is consumed.

**Reference:** Standard HTML semantic elements; `identity.md` Section 3 implicitly (no override specified, so browser defaults stand).

---

## 2. Focus Styles

### 2.1 Global :focus-visible Rule

**Selector:** `:focus-visible`

**Layer:** `@layer base`

| Property         | Value                              | Token          | Computed value                                                         |
| ---------------- | ---------------------------------- | -------------- | ---------------------------------------------------------------------- |
| `outline`        | `2px solid hsl(var(--color-ring))` | `--color-ring` | `2px solid hsl(245 40% 36%)` light / `2px solid hsl(245 40% 68%)` dark |
| `outline-offset` | `2px`                              | —              | `2px`                                                                  |

**Activation condition:** Applied only when the browser determines the element received focus via keyboard or sequential navigation (`:focus-visible` pseudo-class). Mouse-click focus does NOT show the ring. This is the browser's built-in behavior; no JavaScript is needed.

**Exception — inset ring for sidebar navigation items:**
Per `concept.md` Section 2.1, sidebar nav items use `outline-offset: -2px` (inset). This override must be applied as a component-level rule on `.sidebar [role="link"]:focus-visible` or equivalent, not in the base layer.

### 2.2 Contrast Requirements

| Mode  | Ring color (computed) | Background surface               | Contrast ratio | Requirement                |
| ----- | --------------------- | -------------------------------- | -------------- | -------------------------- |
| Light | `hsl(245 40% 36%)`    | `hsl(36 25% 98.5%)` (background) | 8.2:1          | WCAG AA 3:1 minimum — PASS |
| Light | `hsl(245 40% 36%)`    | `hsl(36 20% 99.5%)` (card)       | 7.9:1          | WCAG AA 3:1 minimum — PASS |
| Dark  | `hsl(245 40% 68%)`    | `hsl(25 10% 4.5%)` (background)  | 8.7:1          | WCAG AA 3:1 minimum — PASS |
| Dark  | `hsl(245 40% 68%)`    | `hsl(25 9% 6.5%)` (card)         | 8.1:1          | WCAG AA 3:1 minimum — PASS |

All combinations exceed 3:1 (WCAG 2.1 SC 1.4.11 Non-text Contrast).

**Reference:** `identity.md` Section 5.4; `concept.md` Section 2.1; `tokens.md` Section 3.3 (`--color-ring`).

---

## 3. Selection Styles

### 3.1 ::selection Rule

**Selector:** `::selection`

**Layer:** `@layer base`

| Property           | Value                              | Token                | Computed value                                                   |
| ------------------ | ---------------------------------- | -------------------- | ---------------------------------------------------------------- |
| `background-color` | `hsl(var(--color-primary) / 0.15)` | `--color-primary`    | `hsl(245 40% 36% / 0.15)` light / `hsl(245 40% 68% / 0.15)` dark |
| `color`            | `hsl(var(--color-foreground))`     | `--color-foreground` | `hsl(20 14% 9%)` light / `hsl(30 10% 94%)` dark                  |

**Rationale:**

- Primary color at 15% opacity provides a visible highlight with the archival indigo tint.
- Text color remains `foreground` (not `primary-foreground`) because the selection background is not a solid primary surface — it is a tinted overlay over existing background surfaces.
- The combination of `hsl(20 14% 9%)` text over a light primary-tinted background exceeds 7:1 contrast (AAA).

**Reference:** `identity.md` Section 2.3 (primary color), Section 2.8 (dark mode foreground).

---

## 4. Scrollbar Styles

### 4.1 Standard Scrollbar (Firefox and Chromium)

**Selector:** `*` (universal)

**Layer:** `@layer base`

| Property          | Value                                                  | Token                      | Notes                                                     |
| ----------------- | ------------------------------------------------------ | -------------------------- | --------------------------------------------------------- |
| `scrollbar-width` | `thin`                                                 | —                          | Firefox: renders a thinner scrollbar without custom track |
| `scrollbar-color` | `hsl(var(--color-muted-foreground) / 0.3) transparent` | `--color-muted-foreground` | Firefox two-value syntax: thumb color then track color    |

### 4.2 WebKit Scrollbar (Chrome, Safari, Edge)

**Selector:** `*::-webkit-scrollbar`

| Property | Value |
| -------- | ----- |
| `width`  | `6px` |
| `height` | `6px` |

**Selector:** `*::-webkit-scrollbar-track`

| Property     | Value         |
| ------------ | ------------- |
| `background` | `transparent` |

**Selector:** `*::-webkit-scrollbar-thumb`

| Property           | Value                                      | Token                      |
| ------------------ | ------------------------------------------ | -------------------------- |
| `background-color` | `hsl(var(--color-muted-foreground) / 0.3)` | `--color-muted-foreground` |
| `border-radius`    | `var(--radius-full)`                       | `--radius-full` = `9999px` |
| `border`           | `2px solid transparent`                    | —                          |

The `2px solid transparent` border creates a 2px gap between the thumb and the scrollbar track edge via `background-clip: padding-box` effect. This makes the thumb appear 2px narrower on each side for a more refined look without reducing the `width` property.

**Selector:** `*::-webkit-scrollbar-thumb:hover`

| Property           | Value                                      | Token                      |
| ------------------ | ------------------------------------------ | -------------------------- |
| `background-color` | `hsl(var(--color-muted-foreground) / 0.5)` | `--color-muted-foreground` |

### 4.3 Layout-Shift Prevention

- `scrollbar-gutter` is NOT set globally. The 6px `width` on WebKit scrollbars is thin enough that any layout shift on overflow is minimal and expected behavior.
- Scrollbars use `transparent` track, so they visually "appear" over content without reserving space until content overflows.
- Firefox `scrollbar-width: thin` reserves a fixed but narrow gutter automatically.

### 4.4 Cross-Browser Fallback

Browsers that support neither `scrollbar-width`/`scrollbar-color` nor `::-webkit-scrollbar` will display the system default scrollbar. No functional degradation occurs.

**Reference:** `globals.css` lines 433–456; `identity.md` Section 1.2 ("interface recedes").

---

## 5. Animation Utilities

All animation utilities live in `@layer utilities`.

### 5.1 Base Enter/Exit Classes

These classes set shared animation properties. They are combined with a specific animation-name class (e.g., `.fade-in`, `.slide-in-from-top`).

#### .animate-in

| Property                    | Value                  | Token             | Computed value                                              |
| --------------------------- | ---------------------- | ----------------- | ----------------------------------------------------------- |
| `animation-fill-mode`       | `both`                 | —                 | element holds start-state before animation, end-state after |
| `animation-duration`        | `var(--duration-slow)` | `--duration-slow` | `300ms`                                                     |
| `animation-timing-function` | `var(--ease-enter)`    | `--ease-enter`    | `cubic-bezier(0.16, 1, 0.3, 1)`                             |

**Usage:** Applied to elements appearing in the DOM (dialogs opening, popovers appearing, toasts entering).

#### .animate-out

| Property                    | Value                    | Token               | Computed value                  |
| --------------------------- | ------------------------ | ------------------- | ------------------------------- |
| `animation-fill-mode`       | `both`                   | —                   | holds end-state                 |
| `animation-duration`        | `var(--duration-normal)` | `--duration-normal` | `200ms`                         |
| `animation-timing-function` | `var(--ease-exit)`       | `--ease-exit`       | `cubic-bezier(0.7, 0, 0.84, 0)` |

**Usage:** Applied to elements leaving the DOM.

---

### 5.2 Fade Animations

#### @keyframes fade-in

```css
from {
  opacity: 0;
}
to {
  opacity: 1;
}
```

#### @keyframes fade-out

```css
from {
  opacity: 1;
}
to {
  opacity: 0;
}
```

#### .fade-in

| Property         | Value     |
| ---------------- | --------- |
| `animation-name` | `fade-in` |

#### .fade-out

| Property         | Value      |
| ---------------- | ---------- |
| `animation-name` | `fade-out` |

---

### 5.3 Slide Animations

All slide animations combine an opacity change with an 8px translate. The translate distance is fixed at 8px in all directions.

#### slide-in-from-top

```css
@keyframes slide-in-from-top {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Class:** `.slide-in-from-top` — sets `animation-name: slide-in-from-top`

#### slide-out-to-top

```css
@keyframes slide-out-to-top {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}
```

**Class:** `.slide-out-to-top` — sets `animation-name: slide-out-to-top`

#### slide-in-from-bottom

```css
@keyframes slide-in-from-bottom {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Class:** `.slide-in-from-bottom` — sets `animation-name: slide-in-from-bottom`

#### slide-out-to-bottom

```css
@keyframes slide-out-to-bottom {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(8px);
  }
}
```

**Class:** `.slide-out-to-bottom` — sets `animation-name: slide-out-to-bottom`

#### slide-in-from-left

```css
@keyframes slide-in-from-left {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

**Class:** `.slide-in-from-left` — sets `animation-name: slide-in-from-left`

#### slide-out-to-left

```css
@keyframes slide-out-to-left {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-8px);
  }
}
```

**Class:** `.slide-out-to-left` — sets `animation-name: slide-out-to-left`

#### slide-in-from-right

```css
@keyframes slide-in-from-right {
  from {
    opacity: 0;
    transform: translateX(8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

**Class:** `.slide-in-from-right` — sets `animation-name: slide-in-from-right`

#### slide-out-to-right

```css
@keyframes slide-out-to-right {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(8px);
  }
}
```

**Class:** `.slide-out-to-right` — sets `animation-name: slide-out-to-right`

---

### 5.4 Scale Animations

Used for dialog open/close.

#### scale-in

```css
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

**Class:** `.scale-in` — sets `animation-name: scale-in`

#### scale-out

```css
@keyframes scale-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.97);
  }
}
```

**Note:** Exit scale goes to `0.97`, not `0.95`. This asymmetry makes the close feel faster and less dramatic than the open.

**Class:** `.scale-out` — sets `animation-name: scale-out`

---

### 5.5 Skeleton Pulse

Used for loading skeleton states.

#### @keyframes skeleton-pulse

```css
@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
```

#### .animate-skeleton-pulse

| Property    | Value                                           | Token           | Computed value                                              |
| ----------- | ----------------------------------------------- | --------------- | ----------------------------------------------------------- |
| `animation` | `skeleton-pulse 2s var(--ease-in-out) infinite` | `--ease-in-out` | `skeleton-pulse 2s cubic-bezier(0.65, 0, 0.35, 1) infinite` |

**Behavior:** Cycles from `opacity: 1` → `opacity: 0.4` → `opacity: 1` over 2 seconds, looping indefinitely.

---

### 5.6 Badge Count Pulse

Used for badge count updates.

#### @keyframes badge-pulse

```css
@keyframes badge-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}
```

#### .animate-badge-pulse

| Property    | Value                                                 | Token                              | Computed value                                        |
| ----------- | ----------------------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| `animation` | `badge-pulse var(--duration-fast) var(--ease-spring)` | `--duration-fast`, `--ease-spring` | `badge-pulse 100ms cubic-bezier(0.34, 1.56, 0.64, 1)` |

**Behavior:** Single-play scale overshoot to 1.15× then back to 1×. Does not loop.

---

### 5.7 Reduced-Motion Overrides

**Media query:** `@media (prefers-reduced-motion: reduce)`

**Layer:** `@layer base` contains the global reset. `@layer utilities` contains animation-specific overrides.

#### Global reset (in @layer base)

**Selector:** `*, *::before, *::after`

| Property                    | Value               |
| --------------------------- | ------------------- |
| `animation-duration`        | `0.01ms !important` |
| `animation-iteration-count` | `1 !important`      |
| `transition-duration`       | `0.01ms !important` |
| `scroll-behavior`           | `auto !important`   |

This collapses all motion to near-instant. The `!important` is required to override inline styles and utility classes. The value `0.01ms` (not `0ms`) ensures `animationend` events still fire so JavaScript listeners are not broken.

#### Slide animation overrides (in @layer utilities)

When `prefers-reduced-motion: reduce` is active, slide-in classes switch to opacity-only fade:

| Selector                | `animation-name` override | `transform` override |
| ----------------------- | ------------------------- | -------------------- |
| `.slide-in-from-top`    | `fade-in`                 | `none !important`    |
| `.slide-in-from-bottom` | `fade-in`                 | `none !important`    |
| `.slide-in-from-left`   | `fade-in`                 | `none !important`    |
| `.slide-in-from-right`  | `fade-in`                 | `none !important`    |
| `.slide-out-to-top`     | `fade-out`                | `none !important`    |
| `.slide-out-to-bottom`  | `fade-out`                | `none !important`    |
| `.slide-out-to-left`    | `fade-out`                | `none !important`    |
| `.slide-out-to-right`   | `fade-out`                | `none !important`    |
| `.scale-in`             | `fade-in`                 | `none !important`    |
| `.scale-out`            | `fade-out`                | `none !important`    |

#### Skeleton and badge overrides (in @layer utilities)

| Selector                  | Effect                                                     |
| ------------------------- | ---------------------------------------------------------- |
| `.animate-skeleton-pulse` | `animation: none; opacity: 0.6;` — static muted appearance |
| `.animate-badge-pulse`    | `animation: none;` — no overshoot                          |

**Reference:** `identity.md` Section 7.5; `tokens.md` Section 8.3.

---

## 6. Typography Utility Classes

These classes live in `@layer utilities`. They combine size, line-height, letter-spacing, and font-weight into semantic shortcuts. **None of these classes set `color`** except where explicitly noted below (`.text-caption` and `.text-overline`). Color is always applied separately via Tailwind utilities (`text-foreground`, `text-muted-foreground`, etc.) in the component.

### 6.1 .text-body

**Usage:** Standard body text, form values, descriptions, primary UI text.

| Property         | Value                  | Token             | Computed value |
| ---------------- | ---------------------- | ----------------- | -------------- |
| `font-size`      | `var(--text-base)`     | `--text-base`     | `1rem` (16px)  |
| `line-height`    | `var(--leading-base)`  | `--leading-base`  | `1.625`        |
| `letter-spacing` | `var(--tracking-base)` | `--tracking-base` | `0em`          |
| `font-weight`    | `400`                  | —                 | normal         |

---

### 6.2 .text-body-large

**Usage:** Notes fields, transcription reading areas, evidence quotes.

| Property         | Value                | Token           | Computed value    |
| ---------------- | -------------------- | --------------- | ----------------- |
| `font-size`      | `var(--text-lg)`     | `--text-lg`     | `1.125rem` (18px) |
| `line-height`    | `var(--leading-lg)`  | `--leading-lg`  | `1.556`           |
| `letter-spacing` | `var(--tracking-lg)` | `--tracking-lg` | `-0.005em`        |
| `font-weight`    | `400`                | —               | normal            |

---

### 6.3 .text-body-small

**Usage:** Table cell text, compact UI contexts.

| Property         | Value                | Token           | Computed value    |
| ---------------- | -------------------- | --------------- | ----------------- |
| `font-size`      | `var(--text-sm)`     | `--text-sm`     | `0.875rem` (14px) |
| `line-height`    | `var(--leading-sm)`  | `--leading-sm`  | `1.5`             |
| `letter-spacing` | `var(--tracking-sm)` | `--tracking-sm` | `0.01em`          |
| `font-weight`    | `400`                | —               | normal            |

---

### 6.4 .text-caption

**Usage:** Timestamps, attribution lines, count labels.

| Property         | Value                                | Token                      | Computed value                                  |
| ---------------- | ------------------------------------ | -------------------------- | ----------------------------------------------- |
| `font-size`      | `var(--text-xs)`                     | `--text-xs`                | `0.75rem` (12px)                                |
| `line-height`    | `var(--leading-xs)`                  | `--leading-xs`             | `1.5`                                           |
| `letter-spacing` | `var(--tracking-xs)`                 | `--tracking-xs`            | `0.02em`                                        |
| `font-weight`    | `400`                                | —                          | normal                                          |
| `color`          | `hsl(var(--color-muted-foreground))` | `--color-muted-foreground` | `hsl(26 10% 38%)` light / `hsl(22 5% 55%)` dark |

**Note:** `.text-caption` is the one body-text utility class that sets `color` directly, because captions are always de-emphasized. This is the only typography utility class where color is baked in.

---

### 6.5 .text-overline

**Usage:** Section labels above headings, uppercase entity-type labels (e.g., "PERSON", "QUELLE").

| Property         | Value                                | Token                      | Computed value                                  |
| ---------------- | ------------------------------------ | -------------------------- | ----------------------------------------------- |
| `font-size`      | `var(--text-xs)`                     | `--text-xs`                | `0.75rem` (12px)                                |
| `line-height`    | `var(--leading-xs)`                  | `--leading-xs`             | `1.5`                                           |
| `letter-spacing` | `0.08em`                             | —                          | `0.08em` (wider than standard tracking-xs)      |
| `font-weight`    | `500`                                | —                          | medium                                          |
| `text-transform` | `uppercase`                          | —                          | —                                               |
| `color`          | `hsl(var(--color-muted-foreground))` | `--color-muted-foreground` | `hsl(26 10% 38%)` light / `hsl(22 5% 55%)` dark |

**Note:** Letter-spacing is `0.08em`, which is wider than `--tracking-xs` (`0.02em`). This wider tracking is intentional for uppercase text to improve legibility. The value `0.08em` is not a named token; it is a hard-coded value specific to uppercase text.

---

### 6.6 .text-label

**Usage:** Form field labels, attribute names in `<dt>` elements.

| Property         | Value                | Token           | Computed value    |
| ---------------- | -------------------- | --------------- | ----------------- |
| `font-size`      | `var(--text-sm)`     | `--text-sm`     | `0.875rem` (14px) |
| `line-height`    | `var(--leading-sm)`  | `--leading-sm`  | `1.5`             |
| `letter-spacing` | `var(--tracking-sm)` | `--tracking-sm` | `0.01em`          |
| `font-weight`    | `500`                | —               | medium            |

**Note:** `.text-label` differs from `.text-body-small` only in `font-weight` (500 vs 400). Color is not set; the consuming component applies `text-foreground`.

---

### 6.7 .text-mono

**Usage:** Entity IDs, partial dates, diplomatic transcriptions, archival references, timestamps.

| Property               | Value              | Token         | Computed value                                           |
| ---------------------- | ------------------ | ------------- | -------------------------------------------------------- |
| `font-family`          | `var(--font-mono)` | `--font-mono` | `var(--font-geist-mono), ui-monospace, monospace`        |
| `font-variant-numeric` | `tabular-nums`     | —             | enables tabular number spacing                           |
| `letter-spacing`       | `0`                | —             | reset to zero (monospace fonts with tracking look wrong) |

**Notes:**

- `.text-mono` does not set `font-size`, `line-height`, or `font-weight`. These inherit from the context or from a co-applied typography class.
- The class switches to Geist Mono and enables `tabular-nums` for alignment of numbers in columns (dates, counts, IDs).

**Reference:** `identity.md` Section 3.5; `tokens.md` Section 4.3.

---

## 7. Certainty Badge Utilities

These classes live in `@layer utilities`. They set the three color properties needed for a certainty badge. **They do not set** `font-size`, `padding`, `border-width`, `border-radius`, or `display`. Those layout properties are applied in the component via Tailwind utilities (e.g., `rounded-full px-2 py-0.5 text-xs border`).

The pattern for a complete certainty badge in markup is:

```html
<span class="certainty-certain rounded-full border px-2 py-0.5 text-xs">Sicher</span>
```

### 7.1 .certainty-certain

**Level:** Certain — hue 180 (Teal). Paired with filled-circle icon.

| Property           | Value                                            | Token                                  | Light computed     | Dark computed      |
| ------------------ | ------------------------------------------------ | -------------------------------------- | ------------------ | ------------------ |
| `background-color` | `hsl(var(--color-certainty-certain-background))` | `--color-certainty-certain-background` | `hsl(180 40% 93%)` | `hsl(180 25% 12%)` |
| `border-color`     | `hsl(var(--color-certainty-certain-border))`     | `--color-certainty-certain-border`     | `hsl(180 35% 78%)` | `hsl(180 20% 26%)` |
| `color`            | `hsl(var(--color-certainty-certain-foreground))` | `--color-certainty-certain-foreground` | `hsl(180 55% 14%)` | `hsl(180 30% 92%)` |

---

### 7.2 .certainty-probable

**Level:** Probable — hue 215 (Manuscript Blue). Paired with three-quarter-circle icon.

| Property           | Value                                             | Token                                   | Light computed     | Dark computed      |
| ------------------ | ------------------------------------------------- | --------------------------------------- | ------------------ | ------------------ |
| `background-color` | `hsl(var(--color-certainty-probable-background))` | `--color-certainty-probable-background` | `hsl(215 40% 93%)` | `hsl(215 25% 12%)` |
| `border-color`     | `hsl(var(--color-certainty-probable-border))`     | `--color-certainty-probable-border`     | `hsl(215 35% 78%)` | `hsl(215 20% 26%)` |
| `color`            | `hsl(var(--color-certainty-probable-foreground))` | `--color-certainty-probable-foreground` | `hsl(215 55% 16%)` | `hsl(215 30% 92%)` |

---

### 7.3 .certainty-possible

**Level:** Possible — hue 265 (Indigo-Violet). Paired with half-circle icon.

| Property           | Value                                             | Token                                   | Light computed     | Dark computed      |
| ------------------ | ------------------------------------------------- | --------------------------------------- | ------------------ | ------------------ |
| `background-color` | `hsl(var(--color-certainty-possible-background))` | `--color-certainty-possible-background` | `hsl(265 30% 94%)` | `hsl(265 20% 13%)` |
| `border-color`     | `hsl(var(--color-certainty-possible-border))`     | `--color-certainty-possible-border`     | `hsl(265 25% 80%)` | `hsl(265 16% 28%)` |
| `color`            | `hsl(var(--color-certainty-possible-foreground))` | `--color-certainty-possible-foreground` | `hsl(265 40% 18%)` | `hsl(265 25% 92%)` |

---

### 7.4 .certainty-unknown

**Level:** Unknown — hue 38 (Archival Amber). Paired with empty-circle (ring) icon.

| Property           | Value                                            | Token                                  | Light computed    | Dark computed     |
| ------------------ | ------------------------------------------------ | -------------------------------------- | ----------------- | ----------------- |
| `background-color` | `hsl(var(--color-certainty-unknown-background))` | `--color-certainty-unknown-background` | `hsl(38 50% 93%)` | `hsl(38 30% 12%)` |
| `border-color`     | `hsl(var(--color-certainty-unknown-border))`     | `--color-certainty-unknown-border`     | `hsl(38 40% 76%)` | `hsl(38 25% 26%)` |
| `color`            | `hsl(var(--color-certainty-unknown-foreground))` | `--color-certainty-unknown-foreground` | `hsl(38 70% 18%)` | `hsl(38 40% 92%)` |

---

### 7.5 .certainty-unevidenced

**Level:** Unevidenced — hue 20 (Warm Grey). Paired with dashed-circle icon.

| Property           | Value                                                | Token                                      | Light computed    | Dark computed     |
| ------------------ | ---------------------------------------------------- | ------------------------------------------ | ----------------- | ----------------- |
| `background-color` | `hsl(var(--color-certainty-unevidenced-background))` | `--color-certainty-unevidenced-background` | `hsl(20 10% 94%)` | `hsl(20 8% 10%)`  |
| `border-color`     | `hsl(var(--color-certainty-unevidenced-border))`     | `--color-certainty-unevidenced-border`     | `hsl(20 10% 80%)` | `hsl(20 8% 22%)`  |
| `color`            | `hsl(var(--color-certainty-unevidenced-foreground))` | `--color-certainty-unevidenced-foreground` | `hsl(20 20% 22%)` | `hsl(20 10% 88%)` |
| `border-style`     | `dashed`                                             | —                                          | —                 | —                 |

**Special behavior:** `.certainty-unevidenced` is the only certainty class that sets `border-style`. All other classes use the default (`solid`) inherited from the `border` utility class applied in the component. The dashed border mirrors the dashed-circle icon shape, providing dual-channel encoding.

**Reference:** `identity.md` Section 2.5; `tokens.md` Section 3.5; `globals.css` lines 726–755.

---

## 8. Acceptance Criteria

Each criterion is independently testable. Contrast ratios can be verified with a browser devtools accessibility checker or a dedicated tool (e.g., `colorzilla` contrast analyzer, `axe-core`). CSS property values can be verified by inspecting computed styles.

### 8.1 Body / Global Base

**AC-BASE-01:** `body` `font-size` computes to `16px`.

**AC-BASE-02:** `body` `line-height` computes to `1.625`.

**AC-BASE-03:** `body` `font-family` begins with the Geist Sans variable (`var(--font-geist-sans)`) and falls back to `ui-sans-serif, system-ui, sans-serif`.

**AC-BASE-04:** In light mode, `body` `background-color` computes to `hsl(36 25% 98.5%)` (warm off-white, not pure white).

**AC-BASE-05:** In dark mode (`.dark` on `<html>`), `body` `background-color` computes to `hsl(25 10% 4.5%)` (warm deep charcoal, not pure black).

**AC-BASE-06:** In light mode, `body` `color` computes to `hsl(20 14% 9%)`.

**AC-BASE-07:** In dark mode, `body` `color` computes to `hsl(30 10% 94%)`.

**AC-BASE-08:** A `div` with no explicit `border-color` and a `border` class renders its border in `hsl(30 14% 88%)` (light mode) or `hsl(22 7% 18%)` (dark mode) — the `--color-border` value.

**AC-BASE-09:** When the theme switches between light and dark, `background-color`, `color`, and `border-color` animate over `200ms` using `cubic-bezier(0.65, 0, 0.35, 1)`. No other properties animate during the theme switch on `body`.

---

### 8.2 Heading Styles

**AC-BASE-10:** `h1` `font-size` computes to `1.875rem` (30px at default root size).

**AC-BASE-11:** `h1` `font-weight` is `600`.

**AC-BASE-12:** `h1` `line-height` computes to `1.267`.

**AC-BASE-13:** `h1` `letter-spacing` computes to `-0.02em`.

**AC-BASE-14:** `h2` `font-size` computes to `1.5rem` (24px).

**AC-BASE-15:** `h2` `font-weight` is `600`.

**AC-BASE-16:** `h2` `line-height` computes to `1.333`.

**AC-BASE-17:** `h2` `letter-spacing` computes to `-0.015em`.

**AC-BASE-18:** `h3` `font-size` computes to `1.25rem` (20px).

**AC-BASE-19:** `h3` `font-weight` is `500`.

**AC-BASE-20:** `h3` `line-height` computes to `1.5`.

**AC-BASE-21:** `h3` `letter-spacing` computes to `-0.01em`.

**AC-BASE-22:** `h4` `font-size` computes to `1.125rem` (18px).

**AC-BASE-23:** `h4` `font-weight` is `500`.

**AC-BASE-24:** `h4` `line-height` computes to `1.556`.

**AC-BASE-25:** `h4` `letter-spacing` computes to `-0.005em`.

**AC-BASE-26:** In light mode, `h1` through `h4` `color` computes to `hsl(20 14% 9%)` (the `--color-foreground` value).

**AC-BASE-27:** In dark mode, `h1` through `h4` `color` computes to `hsl(30 10% 94%)`.

---

### 8.3 Link Styles

**AC-BASE-28:** An `<a>` element rendered in light mode has `color: hsl(245 40% 36%)` (archival indigo primary).

**AC-BASE-29:** An `<a>` element has `text-decoration: underline`.

**AC-BASE-30:** On hover, an `<a>` element's underline becomes fully opaque (the `text-decoration-color` increases to full primary opacity).

---

### 8.4 Code and Pre

**AC-BASE-31:** A `code` element inside a paragraph renders with `font-family` starting with `var(--font-geist-mono)`.

**AC-BASE-32:** A `code` element has a visible `background-color` that is the `--color-muted` surface at reduced opacity.

**AC-BASE-33:** A `pre` element's `font-size` computes to `0.875rem` (14px).

**AC-BASE-34:** A `code` element nested inside `pre` has `background-color: transparent` (the code-inside-pre reset is applied).

---

### 8.5 Focus Styles

**AC-BASE-35:** A keyboard-focused `<button>` has `outline: 2px solid hsl(245 40% 36%)` in light mode.

**AC-BASE-36:** A keyboard-focused `<button>` has `outline-offset: 2px`.

**AC-BASE-37:** In dark mode, a keyboard-focused `<button>` has `outline: 2px solid hsl(245 40% 68%)`.

**AC-BASE-38:** The focus ring is NOT visible when an element is focused via mouse click (`:focus-visible` must not trigger on pointer focus in supporting browsers).

**AC-BASE-39:** The focus ring contrast against `--color-background` (light mode) is at minimum 3:1. Target: 8.2:1 as documented.

**AC-BASE-40:** The focus ring contrast against `--color-background` (dark mode) is at minimum 3:1. Target: 8.7:1 as documented.

**AC-BASE-41:** The focus ring is visible on elements rendered over `--color-card` surface (minimum 3:1). Target: 7.9:1 (light) / 8.1:1 (dark).

---

### 8.6 Selection Styles

**AC-BASE-42:** Selecting text in light mode shows a selection highlight with a background derived from the primary indigo color at reduced opacity (visually: a light indigo tint, not the full primary color).

**AC-BASE-43:** The selected text `color` does not change from the document `foreground` color (text remains readable during selection).

**AC-BASE-44:** In dark mode, the selection background is derived from the dark primary (`hsl(245 40% 68%)`) at reduced opacity.

---

### 8.7 Scrollbar Styles

**AC-BASE-45:** In Firefox, every scrollable element has `scrollbar-width: thin`.

**AC-BASE-46:** In Chromium/Safari, the scrollbar thumb width is `6px`.

**AC-BASE-47:** The scrollbar track is transparent (no visible track background when at rest).

**AC-BASE-48:** The scrollbar thumb `border-radius` is `9999px` (fully rounded, matching `--radius-full`).

**AC-BASE-49:** The scrollbar thumb has `border: 2px solid transparent` to create visual padding between thumb and track edge.

**AC-BASE-50:** The scrollbar thumb `background-color` on hover has higher opacity than at rest (thumb becomes more visible on hover).

---

### 8.8 Animation Utilities

**AC-BASE-51:** `.animate-in` sets `animation-fill-mode: both`, `animation-duration: 300ms`, and `animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1)`.

**AC-BASE-52:** `.animate-out` sets `animation-fill-mode: both`, `animation-duration: 200ms`, and `animation-timing-function: cubic-bezier(0.7, 0, 0.84, 0)`.

**AC-BASE-53:** `.animate-in.fade-in` causes an element to animate from `opacity: 0` to `opacity: 1`.

**AC-BASE-54:** `.animate-out.fade-out` causes an element to animate from `opacity: 1` to `opacity: 0`.

**AC-BASE-55:** `.animate-in.slide-in-from-top` causes an element to animate from `translateY(-8px)` and `opacity: 0` to `translateY(0)` and `opacity: 1`.

**AC-BASE-56:** `.animate-in.slide-in-from-bottom` starts from `translateY(8px)`.

**AC-BASE-57:** `.animate-in.slide-in-from-left` starts from `translateX(-8px)`.

**AC-BASE-58:** `.animate-in.slide-in-from-right` starts from `translateX(8px)`.

**AC-BASE-59:** `.animate-in.scale-in` causes an element to animate from `scale(0.95)` and `opacity: 0` to `scale(1)` and `opacity: 1`.

**AC-BASE-60:** `.animate-out.scale-out` causes an element to animate to `scale(0.97)` (not `0.95`) and `opacity: 0`.

**AC-BASE-61:** `.animate-skeleton-pulse` produces a continuous animation cycling between `opacity: 1` (at 0% and 100% keyframe) and `opacity: 0.4` (at 50% keyframe) over a 2-second duration.

**AC-BASE-62:** `.animate-badge-pulse` produces a single-play animation that scales the element to `1.15×` at the midpoint and returns to `1×`.

---

### 8.9 Reduced-Motion Overrides

**AC-BASE-63:** When `prefers-reduced-motion: reduce` is active, the computed `animation-duration` on any element with a CSS animation is `0.01ms` or less.

**AC-BASE-64:** When `prefers-reduced-motion: reduce` is active and `.slide-in-from-top` is applied, the element does NOT translate on the Y axis (`transform` is `none`).

**AC-BASE-65:** When `prefers-reduced-motion: reduce` is active, `.slide-in-from-top` behaves identically to `.fade-in` (opacity transition only).

**AC-BASE-66:** When `prefers-reduced-motion: reduce` is active, `.scale-in` behaves identically to `.fade-in` (no scale change).

**AC-BASE-67:** When `prefers-reduced-motion: reduce` is active, `.animate-skeleton-pulse` applies no animation. The element has `opacity: 0.6` as a static value.

**AC-BASE-68:** When `prefers-reduced-motion: reduce` is active, `.animate-badge-pulse` applies no animation. The element renders at its natural size.

---

### 8.10 Typography Utility Classes

**AC-BASE-69:** An element with `.text-body` has `font-size: 1rem`, `line-height: 1.625`, `letter-spacing: 0em`, `font-weight: 400`.

**AC-BASE-70:** An element with `.text-body-large` has `font-size: 1.125rem`, `line-height: 1.556`, `letter-spacing: -0.005em`, `font-weight: 400`.

**AC-BASE-71:** An element with `.text-body-small` has `font-size: 0.875rem`, `line-height: 1.5`, `letter-spacing: 0.01em`, `font-weight: 400`.

**AC-BASE-72:** An element with `.text-caption` has `font-size: 0.75rem`, `line-height: 1.5`, `letter-spacing: 0.02em`, `font-weight: 400`.

**AC-BASE-73:** An element with `.text-caption` has `color: hsl(26 10% 38%)` in light mode (the `--color-muted-foreground` value).

**AC-BASE-74:** An element with `.text-caption` has `color: hsl(22 5% 55%)` in dark mode.

**AC-BASE-75:** An element with `.text-overline` has `font-size: 0.75rem`, `font-weight: 500`, `letter-spacing: 0.08em`, `text-transform: uppercase`.

**AC-BASE-76:** An element with `.text-overline` has `color: hsl(26 10% 38%)` in light mode.

**AC-BASE-77:** An element with `.text-overline` `letter-spacing` is `0.08em`, which is strictly greater than the `--tracking-xs` token value of `0.02em`.

**AC-BASE-78:** An element with `.text-label` has `font-size: 0.875rem`, `line-height: 1.5`, `letter-spacing: 0.01em`, `font-weight: 500`.

**AC-BASE-79:** `.text-label` does NOT set a `color` property. The color must be applied by the component.

**AC-BASE-80:** An element with `.text-mono` has a `font-family` value starting with `var(--font-geist-mono)` (Geist Mono).

**AC-BASE-81:** An element with `.text-mono` has `font-variant-numeric: tabular-nums`.

**AC-BASE-82:** An element with `.text-mono` has `letter-spacing: 0` (reset to zero, not inherited tracking).

---

### 8.11 Certainty Badge Utilities

**AC-BASE-83:** An element with `.certainty-certain` has `background-color: hsl(180 40% 93%)` in light mode.

**AC-BASE-84:** An element with `.certainty-certain` has `border-color: hsl(180 35% 78%)` in light mode.

**AC-BASE-85:** An element with `.certainty-certain` has `color: hsl(180 55% 14%)` in light mode.

**AC-BASE-86:** An element with `.certainty-probable` has `background-color: hsl(215 40% 93%)` in light mode.

**AC-BASE-87:** An element with `.certainty-probable` has `border-color: hsl(215 35% 78%)` in light mode.

**AC-BASE-88:** An element with `.certainty-probable` has `color: hsl(215 55% 16%)` in light mode.

**AC-BASE-89:** An element with `.certainty-possible` has `background-color: hsl(265 30% 94%)` in light mode.

**AC-BASE-90:** An element with `.certainty-possible` has `border-color: hsl(265 25% 80%)` in light mode.

**AC-BASE-91:** An element with `.certainty-possible` has `color: hsl(265 40% 18%)` in light mode.

**AC-BASE-92:** An element with `.certainty-unknown` has `background-color: hsl(38 50% 93%)` in light mode.

**AC-BASE-93:** An element with `.certainty-unknown` has `border-color: hsl(38 40% 76%)` in light mode.

**AC-BASE-94:** An element with `.certainty-unknown` has `color: hsl(38 70% 18%)` in light mode.

**AC-BASE-95:** An element with `.certainty-unevidenced` has `background-color: hsl(20 10% 94%)` in light mode.

**AC-BASE-96:** An element with `.certainty-unevidenced` has `border-color: hsl(20 10% 80%)` in light mode.

**AC-BASE-97:** An element with `.certainty-unevidenced` has `color: hsl(20 20% 22%)` in light mode.

**AC-BASE-98:** An element with `.certainty-unevidenced` has `border-style: dashed`.

**AC-BASE-99:** All other certainty classes (`.certainty-certain`, `.certainty-probable`, `.certainty-possible`, `.certainty-unknown`) do NOT set `border-style`. The border renders as `solid` when a `border` utility is applied in the component.

**AC-BASE-100:** In dark mode, `.certainty-certain` `background-color` changes to `hsl(180 25% 12%)`.

**AC-BASE-101:** In dark mode, `.certainty-certain` `border-color` changes to `hsl(180 20% 26%)`.

**AC-BASE-102:** In dark mode, `.certainty-certain` `color` changes to `hsl(180 30% 92%)`.

**AC-BASE-103:** In dark mode, `.certainty-unevidenced` `border-style` remains `dashed`.

---

## Migration Notes

The `@layer base` rules in this specification are already partially present in `src/styles/globals.css` (lines 402–472). The following gaps exist between the current file and this specification:

1. **Heading base styles (h1–h4):** The current `globals.css` does not include `h1`–`h4` base rules. These must be added to `@layer base`. Without them, headings inherit browser UA defaults (`h1: 2em bold`, etc.) which conflict with the type scale.

2. **Link base styles (a):** No `a` base rules exist in the current file. The specification in Section 1.4 must be added to `@layer base`.

3. **Code/pre base styles:** No `code`/`pre` base rules exist. Section 1.5 must be added to `@layer base`.

4. **Strong/em base styles:** Browser defaults are correct but should be explicitly preserved in `@layer base` to prevent accidental override by reset libraries.

5. **Selection styles (::selection):** Not present in the current file. Section 3.1 must be added to `@layer base`.

6. **Heading font-size at root:** The type scale tokens define sizes in `rem`. If the root `font-size` is ever changed from the browser default `16px`, all computed pixel values in this specification will scale proportionally. The specification assumes `1rem = 16px` (standard browser default, not overridden).

The animation utilities (Section 5), typography utilities (Section 6), and certainty badge utilities (Section 7) are fully present in the current `globals.css` (lines 480–784) and match this specification.
