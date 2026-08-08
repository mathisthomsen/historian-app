# Tooltip Component — Implementation Spec

## Overview

The Tooltip component renders a floating supplementary label that appears on hover or keyboard focus. It is used for icon-only buttons (collapsed sidebar nav items, toolbar icons), abbreviation explanations, and absolute timestamps alongside relative time strings.

**Source:** `src/components/ui/tooltip.tsx`
**Token reference:** `src/styles/globals.css` `@theme` block and `@layer components`
**Design spec:** `docs/design-system/04-design-system/components.md` §11
**Motion spec:** `docs/design-system/02-brand/identity.md` §7.4

---

## Visual Spec

### Anatomy

| Part     | Element           | Notes                                                                 |
| -------- | ----------------- | --------------------------------------------------------------------- |
| Provider | `TooltipProvider` | Wraps the app (or a subtree); sets global `delayDuration`             |
| Root     | `Tooltip`         | Radix `TooltipPrimitive.Root` — manages open/close state              |
| Trigger  | `TooltipTrigger`  | Any focusable element; Radix injects `aria-describedby` automatically |
| Content  | `TooltipContent`  | `TooltipPrimitive.Content` — the floating label rendered in a portal  |

### Token usage

| Property   | Token                      | CSS variable                 | Tailwind class            |
| ---------- | -------------------------- | ---------------------------- | ------------------------- |
| Background | Popover surface            | `--color-popover`            | `bg-popover`              |
| Text       | Popover surface foreground | `--color-popover-foreground` | `text-popover-foreground` |
| Border     | Border                     | `--color-border`             | `border border-border`    |
| Shadow     | Medium shadow              | `--shadow-md`                | `shadow-md`               |
| Radius     | Medium radius              | `--radius-md`                | `rounded-md`              |
| Font size  | Extra small                | —                            | `text-xs`                 |
| Padding    | —                          | —                            | `px-3 py-1.5`             |
| Z-index    | —                          | —                            | `z-50`                    |
| Max width  | —                          | —                            | `max-w-[280px]`           |

The surface token (`bg-popover`) is used instead of an inverted (`bg-foreground`) scheme so that both light and dark themes produce a consistent panel appearance that matches other overlay surfaces (Dialog, Popover). This avoids hard-to-read inverted text on low-contrast foreground colours in some theme palettes.

### Themes

| Theme | `bg-popover`               | `text-popover-foreground` |
| ----- | -------------------------- | ------------------------- |
| Light | White / near-white surface | Dark text                 |
| Dark  | Dark surface               | Light text                |

Both themes retain sufficient contrast because `--color-popover` and `--color-popover-foreground` are paired semantic tokens guaranteed to meet WCAG AA contrast.

### Responsive / max-width

Content is capped at `max-w-[280px]` to prevent overly wide tooltips. Text wraps naturally within that constraint. Tooltip copy should be kept to ≤60 characters (EN) or ≤80 characters (DE).

---

## Animation Spec

### Enter animation

| Property         | Value                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Classes          | `animate-in fade-in-0 zoom-in-95`                                                                                                                             |
| Duration         | Inherits `.animate-in` → `--duration-slow` (300ms) at base; overridden by Radix Tooltip's own transition; the `animate-in` class is applied on mount          |
| Side-aware slide | `data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2` |

### Exit animation

| Property | Value                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------ |
| Classes  | `data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95` |

### Show delay

`TooltipProvider` is configured with `delayDuration={500}` to prevent tooltip flicker during accidental mouse-overs. This 500 ms delay applies globally to all tooltip triggers within the provider subtree.

### Reduced motion

The global `@media (prefers-reduced-motion: reduce)` rule in `globals.css` sets `animation-duration: 0.01ms !important` on all elements, which effectively makes the enter and exit animations instant. Spatial slide transforms (`slide-in-from-*`) also fall back to `fade-in` per the `@layer components` override. No additional per-component override is needed.

---

## Behavioral Spec

### Keyboard interaction

| Key                 | Behavior                                                                            |
| ------------------- | ----------------------------------------------------------------------------------- |
| `Tab` / `Shift+Tab` | Move focus to / away from the trigger; tooltip appears on focus, disappears on blur |
| `Escape`            | Dismisses the tooltip while trigger remains focused                                 |
| No key              | Tooltip does not trap focus; it is not interactive                                  |

### Screen reader

- Radix `TooltipPrimitive` injects `aria-describedby="{tooltip-id}"` on the trigger element pointing to the tooltip content element automatically.
- `TooltipContent` renders with `role="tooltip"` (set by Radix).
- The tooltip content supplements the trigger's accessible name; it must never be the only accessible name (e.g., icon-only buttons must always have `aria-label` as their primary accessible name).

### Focus management

- Tooltip is non-interactive; focus stays on the trigger.
- No focus trap.
- Tooltip content is not reachable by keyboard navigation (it is informational only).

### Loading / error states

Tooltip has no loading or error state — it is a pure presentational overlay.

---

## Integration Spec

### Composition pattern

```tsx
<TooltipProvider delayDuration={500}>
  <Tooltip>
    <TooltipTrigger asChild>
      <button aria-label="Delete record">
        <Trash2Icon aria-hidden="true" />
      </button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Delete record</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

`TooltipProvider` should wrap the application root (or at minimum the page layout) so that `delayDuration` is set once globally.

### Collapsed sidebar usage

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <a href="/persons" aria-label="Personen">
      <UsersIcon aria-hidden="true" />
    </a>
  </TooltipTrigger>
  <TooltipContent side="right">
    <p>Personen</p>
  </TooltipContent>
</Tooltip>
```

Side is `"right"` for left-anchored sidebar; Radix adjusts if the viewport clips the placement.

### CSS class API

`TooltipContent` accepts a `className` prop that is merged via `cn()` (clsx + tailwind-merge). Custom classes are appended after the base class string and will win specificity conflicts.

---

## Acceptance Criteria

- [ ] **AC-TT-01** `TooltipContent` DOM element has `bg-popover` in its `className`.
- [ ] **AC-TT-02** `TooltipContent` DOM element has `text-popover-foreground` in its `className`.
- [ ] **AC-TT-03** `TooltipContent` DOM element has `border-border` (or `border` + `border-border`) in its `className`.
- [ ] **AC-TT-04** `TooltipContent` DOM element has `shadow-md` in its `className`.
- [ ] **AC-TT-05** `TooltipContent` DOM element has `rounded-md` in its `className`.
- [ ] **AC-TT-06** `TooltipContent` DOM element has `text-xs` in its `className`.
- [ ] **AC-TT-07** `TooltipContent` DOM element has `animate-in` and `fade-in-0` in its `className`.
- [ ] **AC-TT-08** `TooltipContent` DOM element has `data-[state=closed]:animate-out` and `data-[state=closed]:fade-out-0` classes in its `className`.
- [ ] **AC-TT-09** `TooltipContent` DOM element has `data-[side=top]:slide-in-from-bottom-2` in its `className` (side-aware slide variants are present).
- [ ] **AC-TT-10** The tooltip content element has `role="tooltip"` (set by Radix).
- [ ] **AC-TT-11** A custom `className` passed to `TooltipContent` is present on the rendered element alongside the base classes.
- [ ] **AC-TT-12** `TooltipContent` does NOT contain `bg-foreground` or `text-background` (inverted scheme removed).
- [ ] **AC-TT-13** `TooltipProvider`, `Tooltip`, `TooltipTrigger`, and `TooltipContent` are all exported from `src/components/ui/tooltip.tsx`.
- [ ] **AC-TT-14** `TooltipContent` has `overflow-hidden` in its `className`.
- [ ] **AC-TT-15** Axe-core finds no accessibility violations when a tooltip is rendered in the open state.

---

## Implementation Notes

### Radix DOM Structure

Radix `TooltipContent` renders the following structure in jsdom:

```html
<div data-radix-popper-content-wrapper>
  <div
    data-side="top|bottom|left|right"
    data-align="start|center|end"
    data-state="instant-open|delayed-open|closed"
    class="[TooltipContent className props]"
  >
    [children]
    <span id="radix-*" role="tooltip" style="[visually-hidden clip]">
      [children duplicated for ARIA]
    </span>
  </div>
</div>
```

**Critical test note:** `screen.getByRole("tooltip")` returns the visually-hidden ARIA `<span>` inside the content `<div>`, which has an empty `className`. Tests that assert on `TooltipContent` classes must query the styled `<div>` directly:

```ts
document.querySelector("[data-radix-popper-content-wrapper] > div") as HTMLElement;
```

The trigger receives `aria-describedby` pointing to the hidden span's `id`, satisfying the ARIA requirement. AC-TT-10 (role="tooltip" in DOM) is verified by confirming the span element is found by role, not by checking its className.
