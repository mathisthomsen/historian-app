# Dialog / Modal Component — Implementation Spec

## Overview

The Dialog component provides focused, isolated interaction surfaces for forms, confirmations, and compact selections. It renders as a centered modal over a warm scrim overlay. Radix UI `@radix-ui/react-dialog` handles focus trapping, `Escape` dismissal, and ARIA wiring. This spec governs the Tailwind token layer applied on top of the Radix primitive.

**Source:** `src/components/ui/dialog.tsx`
**Token reference:** `src/styles/globals.css` `@theme` block
**Design spec:** `docs/design-system/04-design-system/components.md` §9

---

## Visual Spec

### Anatomy

| Part         | Component              | Element                                                 |
| ------------ | ---------------------- | ------------------------------------------------------- |
| Overlay      | `DialogOverlay`        | `<div>` — full-screen scrim rendered via `DialogPortal` |
| Container    | `DialogContent`        | `<div>` — centered floating surface                     |
| Title        | `DialogTitle`          | Radix `Title` primitive                                 |
| Description  | `DialogDescription`    | Radix `Description` primitive                           |
| Close button | inside `DialogContent` | `DialogPrimitive.Close` with `<X>` icon                 |
| Header       | `DialogHeader`         | `<div>` wrapping title + description                    |
| Footer       | `DialogFooter`         | `<div>` for action buttons                              |

---

### DialogOverlay

```
fixed inset-0 z-50 bg-background/80 backdrop-blur-sm
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
```

| Property    | Tailwind class     | Token / note                                               |
| ----------- | ------------------ | ---------------------------------------------------------- |
| Position    | `fixed inset-0`    | Covers full viewport                                       |
| Stack order | `z-50`             | Above all page content                                     |
| Background  | `bg-background/80` | `--color-background` at 80% opacity — warm, not pure black |
| Blur        | `backdrop-blur-sm` | Subtle depth separation without full black-out             |

**Key change from shadcn default:** `bg-black/80` is replaced with `bg-background/80` to honour the warm stone palette and avoid a jarring cold scrim.

---

### DialogContent

```
fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg
translate-x-[-50%] translate-y-[-50%]
gap-4 bg-card border border-border shadow-lg rounded-lg p-6
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2
duration-[var(--duration-normal)]
```

| Property           | Tailwind class                                                     | Token                                           |
| ------------------ | ------------------------------------------------------------------ | ----------------------------------------------- |
| Position           | `fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]` | Centered in viewport                            |
| Stack order        | `z-50`                                                             | —                                               |
| Width              | `w-full max-w-lg`                                                  | Default variant; `max-w-sm` for confirm dialogs |
| Background         | `bg-card`                                                          | `--color-card` — warm card surface              |
| Border             | `border border-border`                                             | `--color-border`                                |
| Shadow             | `shadow-lg`                                                        | `--shadow-lg`                                   |
| Radius             | `rounded-lg`                                                       | `--radius-lg` (8px)                             |
| Padding            | `p-6`                                                              | 24px internal padding                           |
| Animation duration | `duration-[var(--duration-normal)]`                                | `--duration-normal` = 200ms                     |

**Key change from shadcn default:** Background changed from `bg-background` to `bg-card`; radius changed from `sm:rounded-lg` (mobile-no-round) to `rounded-lg` (always rounded); slide direction changed from left/top offset to `slide-in-from-bottom-2` to match identity.md enter gesture.

#### Width variants

| Variant | Class       | Use case                                 |
| ------- | ----------- | ---------------------------------------- |
| Default | `max-w-lg`  | Standard forms: `RelationTypeFormDialog` |
| Narrow  | `max-w-sm`  | Simple confirmations                     |
| Wide    | `max-w-2xl` | Multi-step forms                         |
| Alert   | `max-w-md`  | Destructive confirmation (`AlertDialog`) |

---

### DialogHeader

```
flex flex-col space-y-1.5 text-center sm:text-left
```

Standard shadcn layout — stacks title and description with 6px gap.

---

### DialogTitle

```
text-lg font-semibold leading-none tracking-tight
```

| Property    | Tailwind class   | Value    |
| ----------- | ---------------- | -------- |
| Font size   | `text-lg`        | 18px     |
| Weight      | `font-semibold`  | 600      |
| Line height | `leading-none`   | 1        |
| Tracking    | `tracking-tight` | -0.025em |

---

### DialogDescription

```
text-sm text-muted-foreground
```

| Property  | Tailwind class          | Token                                                         |
| --------- | ----------------------- | ------------------------------------------------------------- |
| Font size | `text-sm`               | 14px                                                          |
| Color     | `text-muted-foreground` | `--color-muted-foreground` (5.8:1 contrast on background, AA) |

---

### Close Button (inside DialogContent)

```
absolute right-4 top-4 rounded-sm opacity-70
text-muted-foreground hover:opacity-100 hover:text-foreground
focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
disabled:pointer-events-none
```

| Property      | Class                                              | Note                         |
| ------------- | -------------------------------------------------- | ---------------------------- |
| Position      | `absolute right-4 top-4`                           | Top-right corner, 16px inset |
| Default color | `text-muted-foreground`                            | Recedes visually             |
| Hover color   | `hover:text-foreground`                            | Becomes prominent on hover   |
| Opacity       | `opacity-70 hover:opacity-100`                     | Subtle in rest state         |
| Focus ring    | `focus:ring-2 focus:ring-ring focus:ring-offset-2` | Keyboard visible             |
| Tap target    | 44×44px minimum via icon size + padding            | Accessibility requirement    |

---

### DialogFooter

```
flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2
```

Actions are right-aligned on desktop; stacked (reverse order) on mobile so primary action is visually first. Primary action is rightmost.

Footer with border (for forms with many fields):

```
mt-6 flex items-center justify-end gap-3 pt-6 border-t border-border
```

---

## Animation Spec

### Enter animation

- Scale: 95% → 100%
- Opacity: 0 → 1
- Y position: slides in from bottom (+8px)
- Duration: `--duration-normal` (200ms) — see `globals.css`
- Easing: `--ease-enter` (`cubic-bezier(0.16, 1, 0.3, 1)`)

### Exit animation

- Scale: 100% → 95%
- Opacity: 1 → 0
- Y position: slides out to bottom (+8px)
- Duration: `--duration-normal` (200ms)
- Easing: `--ease-exit` (`cubic-bezier(0.7, 0, 0.84, 0)`)

### Reduced motion

When `prefers-reduced-motion: reduce` is active, Tailwind's `motion-safe:` variant strips zoom and slide classes, leaving only opacity fade. The global override in `globals.css` sets animation duration to `0.01ms` effectively making it instant.

Overlay transition: fade only (no scale). Content: fade only (no zoom/slide).

---

## Behavioral Spec

### Keyboard interaction

| Key         | Behavior                                                 |
| ----------- | -------------------------------------------------------- |
| `Escape`    | Closes dialog; focus returns to trigger element          |
| `Tab`       | Cycles forward through focusable elements within dialog  |
| `Shift+Tab` | Cycles backward through focusable elements within dialog |

Focus trap is handled automatically by Radix UI `Dialog`.

### Screen reader announcements

- `role="dialog"` on `DialogContent` ensures SR announces "dialog" on open.
- `aria-modal="true"` tells SR to hide background content.
- `aria-labelledby` → `DialogTitle` id: SR announces title on focus.
- `aria-describedby` → `DialogDescription` id when description is present.
- Close button has `<span className="sr-only">Close</span>`.

### Focus management

- On open: focus moves to the first focusable element inside the dialog (or the dialog container itself if none).
- On close: focus returns to the element that triggered the dialog.
- `AlertDialog`: Cancel button receives initial focus (safe default).

---

## Integration Spec

### Composition pattern

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Relation</DialogTitle>
      <DialogDescription>Add a relationship between two entities.</DialogDescription>
    </DialogHeader>
    {/* form content */}
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button type="submit">Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Slot / children

- `DialogContent` renders `DialogPortal` + `DialogOverlay` internally; consumers do not render these separately.
- `DialogHeader` and `DialogFooter` are layout helpers — they do not carry ARIA roles.
- `DialogTitle` and `DialogDescription` are Radix primitives; they are wired to `aria-labelledby` / `aria-describedby` automatically.

### CSS class API

- Pass `className` to override `max-w-lg` with `max-w-sm` or `max-w-2xl` for variant widths.
- `DialogFooter` can receive `className="border-t border-border pt-6 mt-6"` for forms.

---

## Both Themes

### Light mode

- Overlay: warm off-white at 80% opacity (`--color-background` = `hsl(36 25% 98.5%)`)
- Content bg: `--color-card` = `hsl(36 20% 99.5%)`
- Border: `--color-border` = `hsl(30 14% 88%)`

### Dark mode

- Overlay: dark warm background at 80% opacity (CSS variable flips via `.dark` class)
- Content bg: dark card surface (CSS variable flips)
- Border: dark border (CSS variable flips)

All tokens are defined via `@theme` in `globals.css` and flipped in the `.dark` block. No hard-coded color values in component classes.

---

## Acceptance Criteria

| ID        | Criterion                                                                       | Testable                   |
| --------- | ------------------------------------------------------------------------------- | -------------------------- |
| AC-DLG-01 | `DialogOverlay` has class `bg-background/80` (not `bg-black/80`)                | className check            |
| AC-DLG-02 | `DialogOverlay` has class `backdrop-blur-sm`                                    | className check            |
| AC-DLG-03 | `DialogContent` has class `bg-card` (not `bg-background`)                       | className check            |
| AC-DLG-04 | `DialogContent` has class `border-border`                                       | className check            |
| AC-DLG-05 | `DialogContent` has class `shadow-lg`                                           | className check            |
| AC-DLG-06 | `DialogContent` has class `rounded-lg`                                          | className check            |
| AC-DLG-07 | `DialogContent` has enter animation class `data-[state=open]:animate-in`        | className check            |
| AC-DLG-08 | `DialogContent` has `zoom-in-95` and `slide-in-from-bottom-2` animation classes | className check            |
| AC-DLG-09 | `DialogContent` has `duration-[var(--duration-normal)]`                         | className check            |
| AC-DLG-10 | `DialogTitle` has class `text-lg`                                               | className check            |
| AC-DLG-11 | `DialogTitle` has class `font-semibold`                                         | className check            |
| AC-DLG-12 | `DialogDescription` has class `text-muted-foreground`                           | className check            |
| AC-DLG-13 | `DialogDescription` has class `text-sm`                                         | className check            |
| AC-DLG-14 | Rendered dialog has `role="dialog"`                                             | ARIA query                 |
| AC-DLG-15 | Rendered dialog has `aria-modal="true"`                                         | ARIA query                 |
| AC-DLG-16 | Close button has `text-muted-foreground` class                                  | className check            |
| AC-DLG-17 | Close button has `hover:text-foreground` class                                  | className check            |
| AC-DLG-18 | Close button has focus ring classes `focus:ring-2 focus:ring-ring`              | className check            |
| AC-DLG-19 | `DialogContent` does NOT have `bg-background` (old default)                     | className check (negative) |
| AC-DLG-20 | `DialogOverlay` does NOT have `bg-black/80`                                     | className check (negative) |
| AC-DLG-21 | Full composition (title + description + footer) renders all text content        | DOM query                  |
| AC-DLG-22 | Passes axe-core with no violations                                              | axe audit                  |
