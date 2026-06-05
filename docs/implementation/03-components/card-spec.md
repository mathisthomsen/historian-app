# Card Component — Implementation Spec

## Overview

The Card component is the primary content-grouping surface in Evidoxa. It sits one elevation level above the page background (`--color-card` vs `--color-background`), using a subtle warm-neutral fill and a low-contrast decorative border to define its boundary. Cards are intentionally "grounded" — no drop shadow on standard cards. Borders alone communicate the surface boundary.

**Source:** `src/components/ui/card.tsx`
**Token reference:** `src/styles/globals.css` `@theme` block
**Design spec:** `docs/design-system/04-design-system/components.md` §8

---

## Visual Spec

### Base Anatomy

| Sub-component     | Element | Role                                                   |
| ----------------- | ------- | ------------------------------------------------------ |
| `Card`            | `<div>` | Outermost container; defines surface, border, radius   |
| `CardHeader`      | `<div>` | Stacks title + description with consistent top padding |
| `CardTitle`       | `<div>` | Section heading — prominent weight and size            |
| `CardDescription` | `<div>` | Supporting text — muted foreground                     |
| `CardContent`     | `<div>` | Main body content area                                 |
| `CardFooter`      | `<div>` | Action row — horizontally aligned children             |

### Card (Container) Classes

```
rounded-lg border border-border bg-card text-card-foreground shadow-sm
```

| Property      | Tailwind class         | Token                     |
| ------------- | ---------------------- | ------------------------- |
| Border radius | `rounded-lg`           | `--radius-lg` (8px)       |
| Border        | `border border-border` | `--color-border`          |
| Background    | `bg-card`              | `--color-card`            |
| Foreground    | `text-card-foreground` | `--color-card-foreground` |
| Shadow        | `shadow-sm`            | `--shadow-sm`             |

**Shadow note:** `shadow-sm` is defined in `globals.css` as a warm-tinted shadow with very low opacity (`0 1px 2px 0 hsl(20 14% 9% / 0.04)`). In dark mode the shadow shifts to pure black at higher opacity (`0 1px 2px 0 hsl(0 0% 0% / 0.15)`), but because dark-mode elevation is communicated primarily through border and surface lightness, the visual effect is minimal and unobtrusive.

**The old `shadow` (Tailwind's `box-shadow: 0 1px 3px ...`) must be replaced with `shadow-sm`.** The design system uses `shadow-sm` only on cards; `shadow` (medium) is for popovers and dropdowns.

### Sub-component Classes

#### CardHeader

```
flex flex-col space-y-1.5 p-6
```

Stacks title and description in a column with 6px gap and 24px inset padding.

#### CardTitle

```
text-lg font-semibold leading-none tracking-tight
```

| Property    | Value            | Notes                                     |
| ----------- | ---------------- | ----------------------------------------- |
| Font size   | `text-lg`        | 18px — visible hierarchy over body        |
| Weight      | `font-semibold`  | 600                                       |
| Line height | `leading-none`   | Prevents unwanted gap above text          |
| Tracking    | `tracking-tight` | Slightly tightened for heading aesthetics |

#### CardDescription

```
text-sm text-muted-foreground
```

| Property  | Value                   | Token                                                         |
| --------- | ----------------------- | ------------------------------------------------------------- |
| Font size | `text-sm`               | 14px                                                          |
| Color     | `text-muted-foreground` | `--color-muted-foreground` (5.8:1 contrast on background, AA) |

#### CardContent

```
p-6 pt-0
```

Full 24px horizontal/bottom padding; no top padding (CardHeader provides it).

#### CardFooter

```
flex items-center p-6 pt-0
```

Horizontal flex row; same padding logic as CardContent.

---

### Variants

| Variant          | Description                                  | Class delta from base                                   |
| ---------------- | -------------------------------------------- | ------------------------------------------------------- |
| Default (raised) | Border + shadow-sm                           | Base classes as above                                   |
| Flat             | No shadow; suitable for embedded/nested use  | Override: no shadow (use `shadow-none` via `className`) |
| Ghost            | No border, no shadow; blends with background | Override: `border-0 shadow-none` via `className`        |

Flat and ghost are not encoded as CVA variants — they are applied via `className` prop per the shadcn/ui composition pattern. The base Card ships as the "default (raised)" variant.

---

### Sizing and Spacing

| Context              | Classes                                          | Notes                 |
| -------------------- | ------------------------------------------------ | --------------------- |
| Default              | `p-6` inside CardContent                         | Standard 24px padding |
| Compact (stat cards) | Consumer applies `p-4`                           | Pass via `className`  |
| Auth card            | Consumer applies `max-w-sm rounded-xl shadow-sm` | Auth layout overrides |

---

### Theme Behavior

**Light mode:**

- Background: `hsl(36 20% 99.5%)` — nearly white, warm
- Border: `hsl(30 14% 88%)` — intentionally low contrast (structural chrome)
- Shadow: `0 1px 2px 0 hsl(20 14% 9% / 0.04)` — barely perceptible warm shadow

**Dark mode:**

- Background: `hsl(25 9% 6.5%)` — very dark warm surface, lifted above page (`hsl(25 10% 4.5%)`)
- Border: `hsl(22 7% 18%)` — slightly lighter than background, communicates boundary
- Shadow: `0 1px 2px 0 hsl(0 0% 0% / 0.15)` — present but visually secondary to the border

---

### Responsive Behavior

Cards have no built-in responsive breakpoint styles. Width is determined by the parent grid or flex container. At mobile widths (<768px), entity-list cards may stack into full-width columns — this is handled by the parent layout, not the Card component itself.

---

## Behavioral Spec

### Keyboard Interaction

Standard cards are not interactive. They do not receive focus. Clickable entity cards (mobile stack view) must be wrapped in `<a>` or `<button>`, never a plain `<div>` with `onClick`.

### Screen Reader Announcements

- Use `<article>` for cards representing a distinct content entity (e.g., a person record card)
- Use `<section>` for grouping cards within a page region
- `CardTitle` should map to the appropriate heading level in context (e.g., `<h2>` for section headings on a detail page). Since `CardTitle` renders as `<div>`, consumer must apply `asChild` or wrap with the appropriate heading element when needed for semantic HTML

### Focus Management

No focus management by the Card itself. Interactive children manage their own focus.

---

## Integration Spec

### Composition

```tsx
// Standard card with all sub-components
<Card>
  <CardHeader>
    <CardTitle>Attributes</CardTitle>
    <CardDescription>Core fields for this person record.</CardDescription>
  </CardHeader>
  <CardContent>
    {/* field content */}
  </CardContent>
  <CardFooter>
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </CardFooter>
</Card>

// Flat variant (no shadow — embedded inside another surface)
<Card className="shadow-none">
  <CardContent>...</CardContent>
</Card>

// Ghost variant (no border, no shadow — blends into background)
<Card className="border-0 shadow-none">
  <CardContent>...</CardContent>
</Card>

// Auth card (consumer overrides radius and width)
<Card className="w-full max-w-sm rounded-xl shadow-sm">
  <CardHeader>
    <CardTitle>Sign in</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### CSS Class API

`className` is merged additively via `cn()` on each sub-component. Consumers may:

- Override padding: `className="p-4"` on CardContent for compact variant
- Add max-width: `className="max-w-sm"` on Card for auth layout
- Remove shadow: `className="shadow-none"` for flat variant
- Remove border: `className="border-0"` for ghost variant
- Override radius: `className="rounded-xl"` for auth card

---

## Acceptance Criteria

| ID         | Criterion                                                                      | How to verify                                                                           |
| ---------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| AC-CARD-01 | Card renders with `bg-card` class                                              | Unit test: assert `bg-card` in className                                                |
| AC-CARD-02 | Card renders with `text-card-foreground` class                                 | Unit test: assert `text-card-foreground` in className                                   |
| AC-CARD-03 | Card renders with `border-border` class (not a hardcoded color)                | Unit test: assert `border-border` in className; assert no hardcoded hex                 |
| AC-CARD-04 | Card renders with `rounded-lg` class                                           | Unit test: assert `rounded-lg` in className                                             |
| AC-CARD-05 | Card renders with `shadow-sm` class (not bare `shadow`)                        | Unit test: assert `shadow-sm` present; assert bare `shadow` (not `shadow-sm`) is absent |
| AC-CARD-06 | CardTitle renders with `font-semibold` class                                   | Unit test: assert `font-semibold` in className                                          |
| AC-CARD-07 | CardTitle renders with `text-lg` class                                         | Unit test: assert `text-lg` in className                                                |
| AC-CARD-08 | CardDescription renders with `text-muted-foreground` class                     | Unit test: assert `text-muted-foreground` in className                                  |
| AC-CARD-09 | CardDescription renders with `text-sm` class                                   | Unit test: assert `text-sm` in className                                                |
| AC-CARD-10 | CardContent renders with `p-6` and `pt-0` classes                              | Unit test: assert both present                                                          |
| AC-CARD-11 | CardFooter renders with `flex`, `items-center`, `p-6`, `pt-0` classes          | Unit test: assert all four present                                                      |
| AC-CARD-12 | CardHeader renders with `p-6` class                                            | Unit test: assert `p-6` in className                                                    |
| AC-CARD-13 | `className` prop merges additively on Card                                     | Unit test: pass `className="opacity-50"`, assert both base and custom classes present   |
| AC-CARD-14 | `className` prop merges additively on CardContent                              | Unit test: pass `className="p-4"`, assert present alongside `pt-0`                      |
| AC-CARD-15 | All sub-components pass children through                                       | Unit test: assert text content rendered inside each sub-component                       |
| AC-CARD-16 | Card passes arbitrary HTML attributes via `...props`                           | Unit test: pass `data-testid`, assert on rendered element                               |
| AC-CARD-17 | Card does not contain bare `rounded-xl` (auth card radius is consumer-applied) | Unit test: assert `rounded-xl` absent in base Card className                            |
