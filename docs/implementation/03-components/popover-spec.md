# Popover — Implementation Spec

**Date:** 2026-04-03
**Component:** `src/components/ui/popover.tsx`
**Category:** Overlay / Contextual
**Status:** Spec complete

---

## 1. Visual Spec

### 1.1 Anatomy

| Part    | Element                                           | Notes                                |
| ------- | ------------------------------------------------- | ------------------------------------ |
| Trigger | Any focusable element wrapped in `PopoverTrigger` | No styling applied by this component |
| Content | `PopoverContent` — floating panel                 | Rendered into a Radix Portal         |

No arrow pointer. Design intent: clean, borderless pointer-free panel per Evidoxa brand.

### 1.2 Token Usage

| Token        | CSS variable                 | Tailwind class            | Role                   |
| ------------ | ---------------------------- | ------------------------- | ---------------------- |
| Background   | `--color-popover`            | `bg-popover`              | Panel surface          |
| Foreground   | `--color-popover-foreground` | `text-popover-foreground` | Panel text             |
| Border color | `--color-border`             | `border-border`           | Panel edge             |
| Shadow       | `--shadow-md`                | `shadow-md`               | Elevation over page    |
| Radius       | `--radius-lg`                | `rounded-lg`              | 8px per shape language |
| Z-index      | —                            | `z-50`                    | Above all page content |

### 1.3 Sizing

| Property       | Value                  | Notes                                                    |
| -------------- | ---------------------- | -------------------------------------------------------- |
| Default width  | `w-72` (288px)         | Content can override via `className`                     |
| Max width spec | `max-w-[360px]`        | `PropertyEvidencePanel` context (content-level override) |
| Padding        | `p-4` (16px all sides) | Default; content can override                            |
| Side offset    | `sideOffset={4}`       | 4px gap between trigger and panel                        |

### 1.4 States

| State          | Visual                                     |
| -------------- | ------------------------------------------ |
| Default (open) | Full opacity, rendered in DOM              |
| Closing        | Fade out + zoom out; `data-[state=closed]` |
| Opening        | Fade in + zoom in; `data-[state=open]`     |

### 1.5 Animation Classes

| Phase        | Classes                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Enter        | `data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95`          |
| Exit         | `data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95` |
| Side: bottom | `data-[side=bottom]:slide-in-from-top-2`                                                         |
| Side: left   | `data-[side=left]:slide-in-from-right-2`                                                         |
| Side: right  | `data-[side=right]:slide-in-from-left-2`                                                         |
| Side: top    | `data-[side=top]:slide-in-from-bottom-2`                                                         |

Duration: `--duration-slow` (300ms) for open, `--duration-normal` (200ms) for close — governed by Tailwind animation utilities.

Motion safety: Radix + tailwindcss-animate respects `prefers-reduced-motion`; no additional override needed at this layer.

### 1.6 Both Themes

| Theme | `bg-popover` resolves to            | `text-popover-foreground` resolves to |
| ----- | ----------------------------------- | ------------------------------------- |
| Light | `hsl(0 0% 100%)` — true white       | `hsl(20 14% 9%)` — near-black warm    |
| Dark  | `hsl(24 8% 9%)` — warm dark surface | `hsl(30 10% 94%)` — warm near-white   |

---

## 2. Behavioral Spec

### 2.1 Keyboard Interaction

| Key                          | Behavior                                             |
| ---------------------------- | ---------------------------------------------------- |
| `Enter` / `Space` on trigger | Opens popover                                        |
| `Escape`                     | Closes popover, returns focus to trigger             |
| `Tab`                        | Moves focus through interactive content inside panel |
| `Shift+Tab`                  | Moves focus backward through interactive content     |

Focus management is handled by Radix UI `@radix-ui/react-popover` (FocusScope + DismissableLayer). No custom implementation required.

### 2.2 Screen Reader Announcements

- Trigger should carry `aria-haspopup="dialog"` and `aria-expanded="true|false"` when used for interactive content such as `PropertyEvidencePanel`.
- Panel content should include a visible or visually-hidden heading or `aria-label` to give the popover a name in the accessibility tree.
- When evidence count changes within `PropertyEvidencePanel`, a live region must announce: "{field name} now has {count} citations." (responsibility of the consuming component, not this primitive).

### 2.3 Focus Management

- On open: focus moves into the panel content (Radix default).
- On close via `Escape`: focus returns to the trigger element.
- On close via outside click: focus returns to the trigger element.

### 2.4 Loading / Error States

These are content-level concerns handled by the consumers (`PropertyEvidencePanel`, `EntitySelector`). The Popover primitive itself has no loading or error state.

---

## 3. Integration Spec

### 3.1 Composition Pattern

```tsx
<Popover>
  <PopoverTrigger asChild>
    <button aria-haspopup="dialog" aria-expanded={open}>
      Open
    </button>
  </PopoverTrigger>
  <PopoverContent aria-label="Evidence for birth year">{/* content */}</PopoverContent>
</Popover>
```

### 3.2 PropertyEvidencePanel Usage

```tsx
<PopoverContent className="w-full max-w-[360px]" aria-label={`Evidence for ${fieldName}`}>
  {/* evidence list + add form */}
</PopoverContent>
```

### 3.3 EntitySelector (Combobox) Usage

```tsx
<PopoverContent className="w-full p-0" align="start">
  <Command>
    <CommandInput />
    <CommandList>{/* results */}</CommandList>
  </Command>
</PopoverContent>
```

Note: `p-0` overrides default `p-4` when Command palette handles its own padding.

### 3.4 CSS Class API

`PopoverContent` accepts a `className` prop merged via `cn()`. All default classes can be extended or overridden through Tailwind's specificity rules. The `align` prop (default `"center"`) and `sideOffset` prop (default `4`) are forwarded directly to `@radix-ui/react-popover`.

---

## 4. Acceptance Criteria

### Styling

- [ ] AC-PV-01: `PopoverContent` has `bg-popover` class.
- [ ] AC-PV-02: `PopoverContent` has `text-popover-foreground` class.
- [ ] AC-PV-03: `PopoverContent` has `border` and `border-border` classes.
- [ ] AC-PV-04: `PopoverContent` has `shadow-md` class.
- [ ] AC-PV-05: `PopoverContent` has `rounded-lg` class (NOT `rounded-md`).
- [ ] AC-PV-06: `PopoverContent` has `p-4` class.
- [ ] AC-PV-07: `PopoverContent` has `w-72` class.
- [ ] AC-PV-08: `PopoverContent` has `z-50` class.
- [ ] AC-PV-09: `PopoverContent` has `outline-none` class.

### Animation

- [ ] AC-PV-10: Has `data-[state=open]:animate-in` class.
- [ ] AC-PV-11: Has `data-[state=open]:fade-in-0` class.
- [ ] AC-PV-12: Has `data-[state=open]:zoom-in-95` class.
- [ ] AC-PV-13: Has `data-[state=closed]:animate-out` class.
- [ ] AC-PV-14: Has `data-[state=closed]:fade-out-0` class.
- [ ] AC-PV-15: Has `data-[state=closed]:zoom-out-95` class.
- [ ] AC-PV-16: Has `data-[side=bottom]:slide-in-from-top-2` class.
- [ ] AC-PV-17: Has `data-[side=left]:slide-in-from-right-2` class.
- [ ] AC-PV-18: Has `data-[side=right]:slide-in-from-left-2` class.
- [ ] AC-PV-19: Has `data-[side=top]:slide-in-from-bottom-2` class.

### Accessibility

- [ ] AC-PV-20: No axe-core violations when popover is open with `aria-label`.
- [ ] AC-PV-21: `PopoverContent` is not rendered in the DOM when popover is closed.
- [ ] AC-PV-22: `PopoverContent` is present in the DOM when popover is open.
- [ ] AC-PV-23: Trigger carries `aria-controls` pointing at the content element.

### Behaviour

- [ ] AC-PV-24: Custom `className` is merged alongside base classes (className merging).
- [ ] AC-PV-25: `align` prop forwarded — default is `"center"`.
- [ ] AC-PV-26: `sideOffset` prop forwarded — default is `4`.
- [ ] AC-PV-27: Does NOT contain `rounded-md` without also containing `rounded-lg` (no regression to old radius).
