# Avatar Component — Implementation Spec

## Overview

The Avatar component renders a circular user identity graphic: either a photo via `AvatarImage` or two-letter initials via `AvatarFallback`. It is used in the TopBar, activity log entries, comment threads, and profile settings.

**Source:** `src/components/ui/avatar.tsx`
**Token reference:** `src/styles/globals.css` `@theme` block
**Design spec:** `docs/design-system/04-design-system/components.md` §19

---

## Visual Spec

### Anatomy

| Part     | Element                       | Notes                                               |
| -------- | ----------------------------- | --------------------------------------------------- |
| Root     | `<span>` (Radix `AvatarRoot`) | Circular clip container                             |
| Image    | `<img>` via `AvatarImage`     | Shown when image loads successfully                 |
| Fallback | `<span>` via `AvatarFallback` | Shown when image absent or fails; displays initials |

### Size variants

| Size | Dimension        | Use case                              |
| ---- | ---------------- | ------------------------------------- |
| xs   | `h-6 w-6` 24px   | Activity log inline, comment threads  |
| sm   | `h-8 w-8` 32px   | TopBar user control (current default) |
| md   | `h-10 w-10` 40px | Profile page, settings header         |

Sizes are not built-in prop variants — callers pass `className` to the `Avatar` root to override size.

### Token usage

| Token               | CSS variable               | Tailwind class          |
| ------------------- | -------------------------- | ----------------------- |
| Fallback background | `--color-muted`            | `bg-muted`              |
| Fallback text color | `--color-muted-foreground` | `text-muted-foreground` |
| Border radius       | `--radius-full`            | `rounded-full`          |

`--color-muted` resolves to:

- Light: `hsl(33 16% 93%)` — warm stone muted (not zinc)
- Dark: `hsl(24 8% 14%)` — dark warm stone muted

`--color-muted-foreground` resolves to:

- Light: `hsl(26 10% 38%)` — warm stone muted text, 5.8:1 on background (AA)
- Dark: `hsl(22 5% 55%)` — dark warm stone muted text, 5.2:1 on dark background (AA)

### Optional bordered variant

A `ring-2 ring-border` className may be added to the Avatar root by the caller for a bordered variant (e.g., overlapping avatars in a group).

### Fallback typography

Fallback initials must use `text-xs font-medium` to fit within the circular container at all sizes. The design spec also specifies `uppercase` for initials.

### States

| State              | Appearance                                                     |
| ------------------ | -------------------------------------------------------------- |
| Image present      | `AvatarImage` renders; `AvatarFallback` hidden                 |
| Image absent/error | `AvatarFallback` renders with `bg-muted text-muted-foreground` |

Both themes (light/dark) resolve correctly via CSS custom properties.

---

## Behavioral Spec

### ARIA semantics

- `AvatarImage` must receive an `alt` attribute equal to the user's display name.
- Decorative avatars (where the user name appears in adjacent text): add `aria-hidden="true"` to the `Avatar` root so screen readers skip the image.
- When the Avatar conveys identity without adjacent text (e.g., a standalone profile header), the `alt` on `AvatarImage` is the primary accessible label.

### Keyboard interaction

None. The Avatar itself is non-interactive. If it triggers an action (e.g., dropdown menu), the interactive wrapper (`<button>`) is responsible for keyboard handling.

### Screen reader announcements

- Image mode: reads `alt` attribute.
- Fallback mode: reads initials text content (two letters).

### Focus management

Not applicable — Avatar is non-interactive.

---

## Integration Spec

### Composition

```tsx
// Standard usage — image with fallback initials
<Avatar>
  <AvatarImage src={user.avatarUrl} alt={user.displayName} />
  <AvatarFallback>LM</AvatarFallback>
</Avatar>

// Decorative (user name in adjacent text)
<Avatar aria-hidden="true">
  <AvatarImage src={user.avatarUrl} alt="" />
  <AvatarFallback>LM</AvatarFallback>
</Avatar>

// Larger profile size
<Avatar className="h-10 w-10">
  <AvatarImage src={user.avatarUrl} alt={user.displayName} />
  <AvatarFallback>LM</AvatarFallback>
</Avatar>

// Bordered group variant
<Avatar className="ring-2 ring-border">
  <AvatarFallback>AB</AvatarFallback>
</Avatar>
```

### CSS class API

- `Avatar` root: controls size; `rounded-full` and `overflow-hidden` are always present.
- `AvatarFallback`: `bg-muted text-muted-foreground` always present; caller may add `text-xs font-medium uppercase` for typography.

---

## Acceptance Criteria

| ID        | Criterion                                                   | How to verify                                    |
| --------- | ----------------------------------------------------------- | ------------------------------------------------ |
| AC-AVT-01 | `AvatarFallback` renders with `bg-muted` class              | Check className contains `bg-muted`              |
| AC-AVT-02 | `AvatarFallback` renders with `text-muted-foreground` class | Check className contains `text-muted-foreground` |
| AC-AVT-03 | `Avatar` root has `rounded-full` class                      | Check className contains `rounded-full`          |
| AC-AVT-04 | `Avatar` root has `overflow-hidden` class                   | Check className contains `overflow-hidden`       |
| AC-AVT-05 | Default size is `h-8 w-8` (32px)                            | Check className contains `h-8` and `w-8`         |
| AC-AVT-06 | Accepts className to override size                          | Pass `h-10 w-10`; verify presence in root        |
| AC-AVT-07 | `AvatarImage` renders with `alt` attribute                  | Pass `alt="Test User"`; verify attribute         |
| AC-AVT-08 | Fallback not shown when image is present                    | Image renders; fallback absent from DOM          |
| AC-AVT-09 | Accepts and merges additional className on root             | Pass extra class; confirm presence               |
| AC-AVT-10 | Passes axe accessibility audit                              | Run axe on rendered output                       |
