# Separator Component — Implementation Spec

## Overview

The Separator component renders a single 1px dividing line between logically distinct sections. It is used to divide sidebar navigation groups, form sections, and layout regions where spacing alone is insufficient.

**Source:** `src/components/ui/separator.tsx`
**Token reference:** `src/styles/globals.css` `@theme` block
**Design spec:** `docs/design-system/04-design-system/components.md` §20

---

## Visual Spec

### Anatomy

A single `<div>` rendered as a 1px line via Radix UI `SeparatorPrimitive.Root`.

| Part | Element                                   | Notes    |
| ---- | ----------------------------------------- | -------- |
| Root | `<div>` (Radix `SeparatorPrimitive.Root`) | 1px line |

### Variants

| Orientation            | Width    | Height   | Notes                       |
| ---------------------- | -------- | -------- | --------------------------- |
| `horizontal` (default) | `w-full` | `h-px`   | Spans full container width  |
| `vertical`             | `w-px`   | `h-full` | Spans full container height |

Note: The implementation uses `h-[1px]` / `w-[1px]` (arbitrary Tailwind values) which are equivalent to `h-px` / `w-px`. Both are acceptable.

### Token usage

| Token | CSS variable     | Tailwind class |
| ----- | ---------------- | -------------- |
| Color | `--color-border` | `bg-border`    |

The `--color-border` token resolves to:

- Light: `hsl(30 14% 88%)` — warm stone border
- Dark: `hsl(22 7% 18%)` — dark warm stone border

### States

The Separator is a purely structural element. It has no interactive states (hover, focus, active, disabled). It renders the same in both light and dark themes via the `bg-border` token.

### Responsive behavior

The component stretches to fill its container in the primary dimension. No responsive class changes are needed — callers control layout context.

### Spacing

The design spec suggests optional `my-2` (horizontal) / `mx-2` (vertical), but these are caller-applied, not baked into the component defaults.

---

## Behavioral Spec

### ARIA semantics

- When `decorative={false}` (default is `true`): Radix renders `role="separator"` and `aria-orientation="horizontal|vertical"`.
- When `decorative={true}`: Radix renders `role="none"` and omits `aria-orientation`, making it invisible to screen readers.
- Callers should pass `decorative={true}` for visual-only dividers between nav groups.
- Callers should pass `decorative={false}` for structural separators that delineate regions meaningful to screen reader users.

### Keyboard interaction

None. The Separator is non-interactive and non-focusable.

### Screen reader announcements

None when decorative. When `decorative={false}`, assistive technologies recognise the landmark as a structural separator.

---

## Integration Spec

### Composition

```tsx
// Decorative use (default) — sidebar nav group divider
<Separator className="my-2" />

// Structural use — meaningful section boundary
<Separator decorative={false} />

// Vertical use — inline divider between breadcrumb items
<Separator orientation="vertical" className="mx-2 h-4" />
```

### CSS class API

Callers extend via `className`. Internally, `cn()` merges caller classes after the base classes, so callers can override spacing but should not override `bg-border` without design-system approval.

---

## Acceptance Criteria

| ID        | Criterion                                                 | How to verify                                                |
| --------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| AC-SEP-01 | Renders with `bg-border` Tailwind class                   | Check `className` contains `bg-border`                       |
| AC-SEP-02 | Horizontal orientation applies `h-[1px]` and `w-full`     | Check className for sizing classes                           |
| AC-SEP-03 | Vertical orientation applies `w-[1px]` and `h-full`       | Check className for sizing classes                           |
| AC-SEP-04 | Default orientation is horizontal                         | Render without `orientation` prop; verify horizontal classes |
| AC-SEP-05 | Non-decorative separator has `role="separator"`           | Query by `role="separator"`                                  |
| AC-SEP-06 | Non-decorative separator has `aria-orientation` attribute | Check attribute value matches orientation                    |
| AC-SEP-07 | Decorative separator (default) is hidden from AT          | Element has `role="none"` or `aria-hidden`                   |
| AC-SEP-08 | Accepts and merges additional className                   | Pass extra class, confirm presence                           |
| AC-SEP-09 | Passes axe accessibility audit                            | Run axe on rendered output                                   |
