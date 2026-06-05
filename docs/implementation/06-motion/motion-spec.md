# Motion Specification — Evidoxa Design System

**Date:** 2026-04-03
**Phase:** Implementation Layer 6 — Motion and Transitions
**Status:** Authoritative
**Upstream sources:**

- `docs/design-system/02-brand/identity.md` Section 7 (Motion and Animation Tokens)
- `docs/design-system/03-ui/concept.md` Section 4 (Micro-Interactions and Transitions)
- `docs/implementation/01-tokens/token-spec.md` Sections 2.15–2.16
- `src/styles/globals.css` (token definitions, animation utilities, reduced-motion base reset)

---

## Table of Contents

1. [Token Reference](#1-token-reference)
2. [Animation Inventory Table](#2-animation-inventory-table)
3. [Acceptance Criteria](#3-acceptance-criteria)
4. [Implementation Notes](#4-implementation-notes)

---

## 1. Token Reference

### 1.1 Duration Tokens (consumed via `var(--duration-*)`)

| CSS Custom Property     | Value   | Semantic Usage                                     |
| ----------------------- | ------- | -------------------------------------------------- |
| `--duration-instant`    | `0ms`   | Checkbox/radio toggles — no perceptible delay      |
| `--duration-fast`       | `100ms` | Hover backgrounds, focus ring, tooltip             |
| `--duration-normal`     | `200ms` | Sidebar collapse/expand, theme switch, tab changes |
| `--duration-slow`       | `300ms` | Dialog open, toast enter, popover appear           |
| `--duration-deliberate` | `500ms` | Page fade, bulk operation feedback                 |

### 1.2 Easing Tokens (consumed via `var(--ease-*)`)

| CSS Custom Property | Value                               | Semantic Usage                               |
| ------------------- | ----------------------------------- | -------------------------------------------- |
| `--ease-enter`      | `cubic-bezier(0.16, 1, 0.3, 1)`     | Enter animations (dialogs, popovers, toasts) |
| `--ease-exit`       | `cubic-bezier(0.7, 0, 0.84, 0)`     | Exit animations                              |
| `--ease-move`       | `cubic-bezier(0.65, 0, 0.35, 1)`    | Layout shifts (sidebar width, panel resize)  |
| `--ease-spring`     | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Micro-interactions (badge pulse)             |
| `--ease-out`        | `cubic-bezier(0.16, 1, 0.3, 1)`     | Alias for `--ease-enter`                     |
| `--ease-in`         | `cubic-bezier(0.7, 0, 0.84, 0)`     | Alias for `--ease-exit`                      |
| `--ease-in-out`     | `cubic-bezier(0.65, 0, 0.35, 1)`    | Alias for `--ease-move`                      |

---

## 2. Animation Inventory Table

All durations and easings MUST be consumed from CSS custom properties. No hardcoded values (e.g., `200ms`) are permitted in component class strings or inline styles.

| Animation Name                | Trigger                      | Duration Token                          | Easing Token    | Properties Animated                                      | Reduced Motion Behavior                                               |
| ----------------------------- | ---------------------------- | --------------------------------------- | --------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| **Sidebar collapse**          | Toggle button click          | `--duration-normal`                     | `--ease-move`   | `width`                                                  | Instant width change — no transition                                  |
| **Sidebar expand**            | Toggle button click          | `--duration-normal`                     | `--ease-move`   | `width`                                                  | Instant width change — no transition                                  |
| **AppShell padding shift**    | Sidebar toggle (same tick)   | `--duration-normal`                     | `--ease-move`   | `padding-left`                                           | Instant padding change — no transition                                |
| **Dialog open**               | `data-[state=open]`          | `--duration-slow`                       | `--ease-enter`  | `opacity`, `transform` (scale 0.95→1.0)                  | `animation-duration: 0.01ms` via global reset; opacity only if opt-in |
| **Dialog close**              | `data-[state=closed]`        | `--duration-normal`                     | `--ease-exit`   | `opacity`, `transform` (scale 1.0→0.97)                  | `animation-duration: 0.01ms` via global reset                         |
| **Dialog overlay open**       | `data-[state=open]`          | `--duration-slow`                       | `--ease-enter`  | `opacity`                                                | `animation-duration: 0.01ms` via global reset                         |
| **Dialog overlay close**      | `data-[state=closed]`        | `--duration-normal`                     | `--ease-exit`   | `opacity`                                                | `animation-duration: 0.01ms` via global reset                         |
| **Popover open**              | `data-[state=open]`          | `--duration-slow`                       | `--ease-enter`  | `opacity`, `transform` (scale 0.95→1.0, slide from side) | `animation-duration: 0.01ms` via global reset                         |
| **Popover close**             | `data-[state=closed]`        | `--duration-normal`                     | `--ease-exit`   | `opacity`, `transform` (scale 1.0→0.95)                  | `animation-duration: 0.01ms` via global reset                         |
| **Tooltip show**              | Pointer enter / focus        | `--duration-fast`                       | `--ease-enter`  | `opacity` (fade only — no scale/slide)                   | Instant appear — no transition (`0.01ms`)                             |
| **Tooltip hide**              | Pointer leave / blur         | `--duration-fast`                       | `--ease-exit`   | `opacity`                                                | Instant disappear                                                     |
| **Toast enter**               | Sonner `show()`              | `--duration-slow`                       | `--ease-enter`  | `opacity`, `transform` (slide up + fade)                 | Instant appear via global reset                                       |
| **Toast exit**                | Sonner dismiss               | `--duration-normal`                     | `--ease-exit`   | `opacity`, `transform` (slide down + fade)               | Instant dismiss via global reset                                      |
| **DataTable loading opacity** | `isLoading` prop true        | `--duration-fast`                       | `--ease-move`   | `opacity` (1.0→0.6, content stays visible)               | Instant opacity change                                                |
| **Button hover**              | `:hover` pseudo-class        | `--duration-fast`                       | `--ease-enter`  | `background-color`                                       | Instant color change via global reset                                 |
| **Sidebar nav item hover**    | `:hover` pseudo-class        | `--duration-fast`                       | `--ease-enter`  | `background-color`, `color`                              | Instant color change via global reset                                 |
| **Table row hover**           | `:hover` pseudo-class        | `--duration-fast`                       | `--ease-enter`  | `background-color`                                       | Instant color change via global reset                                 |
| **Theme switch**              | `next-themes` class toggle   | `--duration-normal`                     | `--ease-move`   | `background-color`, `color`, `border-color` (on `body`)  | Instant — `transition-duration: 0.01ms` via global reset              |
| **Page route fade**           | `usePathname()` route change | `--duration-deliberate`                 | `--ease-enter`  | `opacity` (0→1 on new content)                           | Instant content swap — `animation-duration: 0.01ms`                   |
| **Skeleton pulse**            | Continuous (loading state)   | `2000ms` (custom, not a duration token) | `--ease-move`   | `opacity` (1.0↔0.4 cycle)                                | Static `opacity: 0.6` — no animation                                  |
| **Badge count pulse**         | Count value change           | `--duration-fast`                       | `--ease-spring` | `transform` (scale 1.0→1.15→1.0)                         | No animation                                                          |

---

## 3. Acceptance Criteria

### 3.1 Token Consumption

- **AC-MOT-01:** Sidebar `<aside>` CSS transition for `width` uses `duration-[var(--duration-normal)]` and `ease-[var(--ease-move)]` (verified by class name or computed style).
- **AC-MOT-02:** AppShell `<main>` CSS transition for `padding-left` uses `duration-[var(--duration-normal)]` (verified by class name).
- **AC-MOT-03:** `DialogContent` carry the class `duration-[var(--duration-normal)]` referencing the token.
- **AC-MOT-04:** `PopoverContent` animations consume token-based duration via `.animate-in` / `.animate-out` utilities whose `animation-duration` references `var(--duration-slow)` and `var(--duration-normal)`.
- **AC-MOT-05:** `TooltipContent` animations use `.animate-in` / `.animate-out` utilities with token-based durations.
- **AC-MOT-06:** `Button` base class includes `transition-colors duration-[var(--duration-fast)]`.
- **AC-MOT-07:** `TableRow` includes `transition-colors` with a `duration-[var(--duration-fast)]` reference.
- **AC-MOT-08:** `body` CSS transition uses `var(--duration-normal)` and `var(--ease-in-out)` for theme switch.
- **AC-MOT-09:** Page template (`template.tsx`) applies `animate-in fade-in` class consuming `var(--duration-deliberate)`.
- **AC-MOT-10:** No hardcoded duration or easing values appear in component class strings (no `200ms`, `300ms`, `cubic-bezier(...)` literals in TSX files).

### 3.2 Reduced Motion

- **AC-MOT-11:** `@media (prefers-reduced-motion: reduce)` global reset in `@layer base` sets `animation-duration: 0.01ms !important` and `transition-duration: 0.01ms !important` on `*`.
- **AC-MOT-12:** `.animate-skeleton-pulse` is disabled under `prefers-reduced-motion: reduce` — `animation: none; opacity: 0.6`.
- **AC-MOT-13:** `.animate-badge-pulse` is disabled under `prefers-reduced-motion: reduce` — `animation: none`.
- **AC-MOT-14:** `.scale-in` and `.scale-out` use `animation-name: fade-in/fade-out` with `transform: none` under reduced motion.
- **AC-MOT-15:** Slide animations (`.slide-in-from-*`, `.slide-out-to-*`) map to fade-only under reduced motion.
- **AC-MOT-16:** JS code that checks `prefers-reduced-motion` uses `window.matchMedia('(prefers-reduced-motion: reduce)')` before applying programmatic animations.
- **AC-MOT-17:** All animated content remains accessible (readable, operable) when all animations are disabled.

### 3.3 Layout Safety

- **AC-MOT-18:** Sidebar width animation uses `transform`-adjacent `width` transition only on the sidebar element — not on siblings. Main content uses `padding-left` transition to avoid layout shift cascade.
- **AC-MOT-19:** Dialog, Popover, and Tooltip animations use only `opacity` and `transform`. They do not trigger layout recalculation (`width`, `height`, `margin`, `padding` are not animated).
- **AC-MOT-20:** Page fade animation uses only `opacity` — no `transform: translateY` or size changes.
- **AC-MOT-21:** Hover transitions use only `background-color` and `color` — no geometric properties.

### 3.4 Accessibility

- **AC-MOT-22:** No animation runs longer than 5 seconds without user control. Skeleton pulse (2s) is continuous but always stops when content loads.
- **AC-MOT-23:** Content inside animated containers (Dialog, Popover, Tooltip) is readable via screen reader regardless of animation state.
- **AC-MOT-24:** Focus ring (`outline`) has `duration-instant` (0ms) — it never transitions.

---

## 4. Implementation Notes

### 4.1 Global Reduced-Motion Reset

The `@layer base` block in `globals.css` applies the WCAG 2.3 reduced-motion pattern:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This is the baseline. Individual components do NOT need their own `@media (prefers-reduced-motion: reduce)` blocks for simple transitions — the global reset handles them. The per-utility overrides in `@layer utilities` apply to semantic animation classes (`.animate-skeleton-pulse`, `.scale-in`, etc.) that need specific behavior beyond duration zeroing.

### 4.2 Tailwind Arbitrary Duration Syntax

Tailwind v4 does not auto-generate `duration-*` utilities for CSS custom properties not registered in `@theme duration-*`. Components use the arbitrary value syntax:

```
duration-[var(--duration-fast)]
duration-[var(--duration-normal)]
duration-[var(--duration-slow)]
duration-[var(--duration-deliberate)]
```

Easing is similarly arbitrary:

```
ease-[var(--ease-move)]
ease-[var(--ease-enter)]
ease-[var(--ease-exit)]
```

### 4.3 Page Route Transition Strategy

The App Router does not support page transitions natively. The recommended approach is a `template.tsx` file in the `(app)` route group. Unlike `layout.tsx`, `template.tsx` is re-mounted on every route change, triggering CSS `animation` on the wrapping element on each navigation. The template applies `.animate-in .fade-in` which uses `animation-duration: var(--duration-deliberate)`.

### 4.4 Compositor-Only Properties

All animations in this spec use `opacity` and `transform` exclusively for enter/exit effects. The sidebar `width` transition is a layout property and intentionally so — it drives the spatial shift that provides orientation. It does not use `transform: scaleX()` because that would not actually shrink the sidebar's layout footprint. The `will-change` property is not applied statically; it should only be set immediately before an animation programmatically if needed, and removed after.

### 4.5 Sonner Toast Animations

Sonner manages its own enter/exit animations internally. The design token alignment is achieved through Tailwind class overrides in the `toastOptions.classNames` config in `src/app/layout.tsx`. Sonner's built-in slide animation is compatible with the spec. No custom duration override is applied to Sonner — the library's defaults (300ms enter, 200ms exit) match our `--duration-slow` and `--duration-normal` values.
