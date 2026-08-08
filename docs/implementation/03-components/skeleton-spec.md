# Skeleton Component — Implementation Spec

## Overview

The Skeleton component renders a pulsing placeholder shape for loading states. It is used in `loading.tsx` route files and anywhere async data renders in-place on the initial page load.

**Source:** `src/components/ui/skeleton.tsx`
**Token reference:** `src/styles/globals.css` `@theme` block and `@layer components` (animation)
**Design spec:** `docs/design-system/04-design-system/components.md` §21

---

## Visual Spec

### Anatomy

A single `<div>` with no children, styled to match the shape and size of the content it replaces.

| Part | Element | Notes                            |
| ---- | ------- | -------------------------------- |
| Root | `<div>` | No children; sized via className |

### Shape variants (via className)

| Variant               | className to add | Use case                 |
| --------------------- | ---------------- | ------------------------ |
| Rectangular (default) | `rounded-md`     | Text blocks, table rows  |
| Circular              | `rounded-full`   | Avatar placeholders      |
| Text line             | `rounded-sm h-4` | Single line of body text |

Shape is not a built-in prop variant — callers pass `className` to control shape.

### Token usage

| Token     | CSS variable    | Tailwind class           |
| --------- | --------------- | ------------------------ |
| Base fill | `--color-muted` | `bg-muted`               |
| Animation | —               | `animate-skeleton-pulse` |

The `--color-muted` token resolves to:

- Light: `hsl(33 16% 93%)` — warm stone muted (not zinc)
- Dark: `hsl(24 8% 14%)` — dark warm stone muted

### Animation

The `animate-skeleton-pulse` class (defined in `globals.css @layer components`) applies a custom keyframe:

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
.animate-skeleton-pulse {
  animation: skeleton-pulse 2s var(--ease-in-out) infinite;
}
```

This is distinct from Tailwind's built-in `animate-pulse` (which uses a brightness/scale transform). The design system mandates `animate-skeleton-pulse`.

### Reduced motion

The global `prefers-reduced-motion: reduce` override in `globals.css` suppresses the pulse:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-skeleton-pulse {
    animation: none;
    opacity: 0.6;
  }
}
```

No additional `motion-safe:` variant is required in the component — the global CSS handles suppression.

### States

| State          | Appearance                                |
| -------------- | ----------------------------------------- |
| Default        | `bg-muted` + pulsing opacity              |
| Reduced motion | `bg-muted` + `opacity: 0.6`, no animation |

---

## Behavioral Spec

### ARIA semantics

The Skeleton `<div>` has no explicit ARIA role. The containing loading region should be wrapped with `aria-busy="true"` and `aria-label` by the caller (e.g., in `loading.tsx`). The Skeleton itself is purely decorative.

### Screen reader announcements

None from the Skeleton itself. Route-level `loading.tsx` files are responsible for announcing loading state.

### Keyboard interaction

None. Skeleton is non-interactive.

---

## Integration Spec

### Composition — PageSkeleton variants

The `PageSkeleton` composite component (co-located in `skeleton.tsx`) provides pre-assembled layout skeletons:

| Variant          | data-testid          | Layout                                  |
| ---------------- | -------------------- | --------------------------------------- |
| `list` (default) | `skeleton-list`      | 5 rows: circular avatar + two text bars |
| `detail`         | `skeleton-detail`    | Header bar + 4 label/value row pairs    |
| `card-grid`      | `skeleton-card-grid` | 6 cards, 3-column grid                  |

### CSS class API

```tsx
// Text line skeleton
<Skeleton className="h-4 w-3/4" />

// Circular avatar skeleton
<Skeleton className="h-10 w-10 rounded-full" />

// Rectangular card block
<Skeleton className="h-24 w-full rounded-xl" />
```

---

## Acceptance Criteria

| ID        | Criterion                                                          | How to verify                                       |
| --------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| AC-SKL-01 | Renders with `bg-muted` class                                      | Check `className` contains `bg-muted`               |
| AC-SKL-02 | Uses `animate-skeleton-pulse` (not `animate-pulse`)                | Check `className` contains `animate-skeleton-pulse` |
| AC-SKL-03 | Does not use `animate-pulse`                                       | Check `className` does NOT contain `animate-pulse`  |
| AC-SKL-04 | Does not use hardcoded color (e.g., `bg-primary/10`)               | Check `className` does NOT contain `bg-primary`     |
| AC-SKL-05 | Accepts className for shape customization (circular)               | Pass `rounded-full`; verify presence                |
| AC-SKL-06 | Accepts className for size customization                           | Pass `h-10 w-10`; verify presence                   |
| AC-SKL-07 | PageSkeleton list variant renders `skeleton-list` testid           | Render `<PageSkeleton variant="list" />`            |
| AC-SKL-08 | PageSkeleton detail variant renders `skeleton-detail` testid       | Render `<PageSkeleton variant="detail" />`          |
| AC-SKL-09 | PageSkeleton card-grid variant renders `skeleton-card-grid` testid | Render `<PageSkeleton variant="card-grid" />`       |
