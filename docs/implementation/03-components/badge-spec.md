# Badge Component — Implementation Spec

## Overview

The Badge component renders short, non-interactive status labels. It is the primary surface for conveying certainty levels on entity fields and property evidence, as well as semantic state labels throughout the application.

**Source:** `src/components/ui/badge.tsx`
**Token reference:** `src/styles/globals.css` `@theme` block and `@layer components`
**Design spec:** `docs/design-system/04-design-system/components.md` §7

---

## Visual Spec

### Base anatomy

| Part      | Element                  | Notes                                 |
| --------- | ------------------------ | ------------------------------------- |
| Container | `<div>` (shadcn default) | Presentational; non-interactive       |
| Icon      | Lucide SVG 14–16px       | Optional; always `aria-hidden="true"` |
| Label     | Text node                | Max 20 characters                     |

Base classes applied to all variants (preserved from shadcn):

```
inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
```

The base shape uses `rounded-full` (pill form) to match the design spec's class recipe for status/count badges.

---

### Standard Variants

| Variant       | Background       | Text                          | Border                              |
| ------------- | ---------------- | ----------------------------- | ----------------------------------- |
| `default`     | `bg-primary`     | `text-primary-foreground`     | `border-transparent`                |
| `secondary`   | `bg-secondary`   | `text-secondary-foreground`   | `border-transparent`                |
| `outline`     | transparent      | `text-foreground`             | `border-border` (inherits `border`) |
| `destructive` | `bg-destructive` | `text-destructive-foreground` | `border-transparent`                |

Token references (CSS custom properties):

- `--color-primary`, `--color-primary-foreground`
- `--color-secondary`, `--color-secondary-foreground`
- `--color-destructive`, `--color-destructive-foreground`
- `--color-foreground`

---

### Semantic Variants

| Variant   | Background token             | Text token                   | Border token             |
| --------- | ---------------------------- | ---------------------------- | ------------------------ |
| `success` | `--color-success-background` | `--color-success-foreground` | `--color-success-border` |
| `warning` | `--color-warning-background` | `--color-warning-foreground` | `--color-warning-border` |
| `info`    | `--color-info-background`    | `--color-info-foreground`    | `--color-info-border`    |

Light mode values:

- success: background `hsl(152 35% 93%)`, foreground `hsl(152 50% 14%)`, border `hsl(152 30% 82%)`
- warning: background `hsl(40 60% 94%)`, foreground `hsl(32 70% 18%)`, border `hsl(38 50% 82%)`
- info: background `hsl(210 45% 94%)`, foreground `hsl(210 60% 16%)`, border `hsl(210 35% 82%)`

Dark mode values (defined in `.dark` block in globals.css):

- success: background `hsl(152 25% 12%)`, foreground `hsl(152 30% 92%)`, border `hsl(152 20% 22%)`
- warning: background `hsl(38 40% 11%)`, foreground `hsl(38 50% 94%)`, border `hsl(38 30% 24%)`
- info: background `hsl(210 30% 11%)`, foreground `hsl(210 35% 94%)`, border `hsl(210 22% 24%)`

Tailwind class recipe:

- success: `bg-[hsl(var(--color-success-background))] text-[hsl(var(--color-success-foreground))] border-[hsl(var(--color-success-border))]`
- warning: `bg-[hsl(var(--color-warning-background))] text-[hsl(var(--color-warning-foreground))] border-[hsl(var(--color-warning-border))]`
- info: `bg-[hsl(var(--color-info-background))] text-[hsl(var(--color-info-foreground))] border-[hsl(var(--color-info-border))]`

---

### Certainty Variants

Certainty variants delegate all color logic to the `.certainty-*` utility classes defined in `@layer components` of `globals.css`. These classes set `background-color`, `border-color`, and `color` from the five-step certainty token family.

| Variant       | CSS utility class        | Border style                                                            |
| ------------- | ------------------------ | ----------------------------------------------------------------------- |
| `certain`     | `.certainty-certain`     | solid                                                                   |
| `probable`    | `.certainty-probable`    | solid                                                                   |
| `possible`    | `.certainty-possible`    | solid                                                                   |
| `unknown`     | `.certainty-unknown`     | solid                                                                   |
| `unevidenced` | `.certainty-unevidenced` | **dashed** (set by the utility class itself via `border-style: dashed`) |

Token families consumed per level:

- `--color-certainty-{level}` (base, used for icon)
- `--color-certainty-{level}-foreground` (text)
- `--color-certainty-{level}-background` (fill)
- `--color-certainty-{level}-border` (stroke)

Light mode certainty values:
| Level | Background HSL | Foreground HSL | Border HSL |
|---|---|---|---|
| certain | `180 40% 93%` | `180 55% 14%` | `180 35% 78%` |
| probable | `215 40% 93%` | `215 55% 16%` | `215 35% 78%` |
| possible | `265 30% 94%` | `265 40% 18%` | `265 25% 80%` |
| unknown | `38 50% 93%` | `38 70% 18%` | `38 40% 76%` |
| unevidenced | `20 10% 94%` | `20 20% 22%` | `20 10% 80%` |

Dark mode certainty values:
| Level | Background HSL | Foreground HSL | Border HSL |
|---|---|---|---|
| certain | `180 25% 12%` | `180 30% 92%` | `180 20% 26%` |
| probable | `215 25% 12%` | `215 30% 92%` | `215 20% 26%` |
| possible | `265 20% 13%` | `265 25% 92%` | `265 16% 28%` |
| unknown | `38 30% 12%` | `38 40% 92%` | `38 25% 26%` |
| unevidenced | `20 8% 10%` | `20 10% 88%` | `20 8% 22%` |

**Unevidenced special rule:** The `.certainty-unevidenced` utility class includes `border-style: dashed` to visually match the dashed-circle icon shape that represents absence of evidence. No additional Tailwind class is needed — the utility class handles it.

---

### State Variants

| State                            | Visual treatment                                                   |
| -------------------------------- | ------------------------------------------------------------------ |
| Default                          | Full color per variant                                             |
| Hover (interactive context only) | `hover:opacity-80` or variant-specific `hover:bg-*/80`             |
| Focus-visible                    | `focus:ring-2 focus:ring-ring focus:ring-offset-2` (from base CVA) |
| Zero-count                       | `opacity-60` — visible but de-emphasized                           |
| Disabled                         | Not applicable (badges are non-interactive)                        |

---

### Responsive Behavior

Badges are inline-flex and respond naturally to container width. No breakpoint-specific size changes are needed. In constrained table cells, use the compact icon-only rendering (outside scope of this spec).

---

### Border Radius

- `rounded-full` — pill form for all badge variants (status, count, certainty, semantic)
- `rounded-sm` is reserved for chip/inline-label usage and can be applied via `className` override

---

## Behavioral Spec

### Keyboard Interaction

Badges are non-interactive. They do not receive focus and are not keyboard navigable unless wrapped in an interactive element.

### Screen Reader Announcements

- Static badges: purely presentational; no `role` or `aria-*` required in most contexts
- Dynamically updated count badges: use `role="status"` and `aria-live="polite"` on the containing element when the count changes in response to user action
- Certainty badges: **must** include both icon and text label to satisfy dual-channel encoding. The icon carries `aria-hidden="true"`; the text label is the accessible name
- Count badges on tab triggers: the count is embedded in the tab's `aria-label` (e.g., `aria-label="Relations, 12 items"`); the visible count badge itself is `aria-hidden="true"`

### Focus Management

No focus management required for standalone badges. Focus is managed by containing interactive elements (tabs, buttons) if a badge is placed inside them.

---

## Integration Spec

### Composition

```tsx
// Basic usage
<Badge variant="success">Verified</Badge>

// Certainty badge with icon
<Badge variant="certain">
  <CheckCircle className="h-3 w-3" aria-hidden="true" />
  Certain
</Badge>

// Unevidenced (dashed border applied via certainty-unevidenced class)
<Badge variant="unevidenced">Unevidenced</Badge>

// Count badge on tab (tab owns aria-label)
<TabsTrigger aria-label="Relations, 12 items">
  Relations
  <Badge variant="secondary" aria-hidden="true">12</Badge>
</TabsTrigger>

// Dynamic status with role
<div role="status" aria-live="polite">
  <Badge variant="info">Loading…</Badge>
</div>
```

### CSS Class API

Consumer can pass `className` to override or augment:

- Override radius: `className="rounded-sm"` for chip style
- Add opacity: `className="opacity-60"` for zero-count state
- Add tabular numbers for count: `className="tabular-nums font-mono"`

### Slot / Children

The `Badge` component renders its `children` as a text node or mixed content (icon + text). No named slots. All children are passed through via `...props`.

---

## Acceptance Criteria

| ID          | Criterion                                                                                                                                                                      | How to verify                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| AC-BADGE-01 | `default` variant renders with `bg-primary` and `text-primary-foreground` classes                                                                                              | Unit test: assert class names on rendered element                                                    |
| AC-BADGE-02 | `secondary` variant renders with `bg-secondary` and `text-secondary-foreground` classes                                                                                        | Unit test                                                                                            |
| AC-BADGE-03 | `outline` variant renders with `text-foreground` class (no background fill)                                                                                                    | Unit test                                                                                            |
| AC-BADGE-04 | `destructive` variant renders with `bg-destructive` and `text-destructive-foreground` classes                                                                                  | Unit test                                                                                            |
| AC-BADGE-05 | `success` variant renders with `bg-[hsl(var(--color-success-background))]`, `text-[hsl(var(--color-success-foreground))]`, `border-[hsl(var(--color-success-border))]` classes | Unit test                                                                                            |
| AC-BADGE-06 | `warning` variant renders with matching warning token classes                                                                                                                  | Unit test                                                                                            |
| AC-BADGE-07 | `info` variant renders with matching info token classes                                                                                                                        | Unit test                                                                                            |
| AC-BADGE-08 | `certain` variant renders with the `certainty-certain` CSS class                                                                                                               | Unit test                                                                                            |
| AC-BADGE-09 | `probable` variant renders with the `certainty-probable` CSS class                                                                                                             | Unit test                                                                                            |
| AC-BADGE-10 | `possible` variant renders with the `certainty-possible` CSS class                                                                                                             | Unit test                                                                                            |
| AC-BADGE-11 | `unknown` variant renders with the `certainty-unknown` CSS class                                                                                                               | Unit test                                                                                            |
| AC-BADGE-12 | `unevidenced` variant renders with the `certainty-unevidenced` CSS class                                                                                                       | Unit test                                                                                            |
| AC-BADGE-13 | `unevidenced` badge has `border-dashed` class or inherits dashed border from `.certainty-unevidenced` utility                                                                  | Unit test: assert `certainty-unevidenced` class is present (the utility sets `border-style: dashed`) |
| AC-BADGE-14 | All variants render `rounded-full` in base class                                                                                                                               | Unit test                                                                                            |
| AC-BADGE-15 | Base CVA class includes focus ring classes                                                                                                                                     | Unit test: assert `focus:ring-2` in class string                                                     |
| AC-BADGE-16 | `className` prop is merged additively (not replaced)                                                                                                                           | Unit test: pass `className="opacity-60"` and assert both base classes and custom class present       |
| AC-BADGE-17 | Component renders children as content                                                                                                                                          | Unit test: assert text node present                                                                  |
| AC-BADGE-18 | `badgeVariants` is exported for external use                                                                                                                                   | Unit test: import and assert it is a function                                                        |
| AC-BADGE-19 | Component passes through arbitrary HTML attributes via `...props`                                                                                                              | Unit test: pass `data-testid` and assert on rendered element                                         |
| AC-BADGE-20 | Default variant is `default` when no `variant` prop is supplied                                                                                                                | Unit test: render without variant, assert `bg-primary` class present                                 |
