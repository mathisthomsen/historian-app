# Select / Combobox — Component Spec

**Component:** `src/components/ui/select.tsx`
**Source:** shadcn/ui (Radix UI `@radix-ui/react-select`) — added via `pnpm dlx shadcn@latest add select`
**Design system reference:** `docs/design-system/04-design-system/components.md` Section 4

---

## 1. Visual Spec

### 1.1 Variants

| Variant  | Description                                                                    |
| -------- | ------------------------------------------------------------------------------ |
| Select   | Static bounded list — shadcn `Select` wrapping Radix `@radix-ui/react-select`  |
| Combobox | Searchable dynamic list — `Command` + `Popover` (uses existing `cmdk` library) |

This spec focuses on the **Select** variant. Combobox is documented separately (uses `command.tsx` + `popover.tsx`).

### 1.2 Anatomy

| Part             | Element                                                  | Tailwind classes                                                                                                                                                                                                                               |
| ---------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger          | `<button>` (Radix `SelectTrigger`)                       | `flex h-10 w-full items-center justify-between rounded-md border border-input-border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50` |
| Chevron icon     | `ChevronDown` 16px inside trigger                        | `opacity-50 ml-auto shrink-0`                                                                                                                                                                                                                  |
| Dropdown content | `<div role="listbox">` (Radix `SelectContent`)           | `max-h-[300px] overflow-y-auto rounded-md border border-border bg-popover shadow-md py-1 z-50`                                                                                                                                                 |
| Option           | `<div role="option">` (Radix `SelectItem`)               | `relative flex cursor-pointer select-none items-center py-2 px-3 text-sm outline-none`                                                                                                                                                         |
| Check indicator  | `Check` icon in option                                   | `absolute left-2 h-4 w-4 text-primary`                                                                                                                                                                                                         |
| Group label      | `<div role="group">` (Radix `SelectGroup`/`SelectLabel`) | `px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-[0.08em]`                                                                                                                                                            |
| Separator        | `<div role="separator">`                                 | `-mx-1 my-1 h-px bg-muted`                                                                                                                                                                                                                     |
| Placeholder      | Text node inside trigger                                 | `text-muted-foreground`                                                                                                                                                                                                                        |
| Value            | Text node inside trigger                                 | `text-foreground`                                                                                                                                                                                                                              |

### 1.3 Token Reference

| Token                    | CSS variable                | Tailwind class           | Value (light)      |
| ------------------------ | --------------------------- | ------------------------ | ------------------ |
| Trigger border           | `--color-input-border`      | `border-input-border`    | `hsl(30 14% 55%)`  |
| Trigger bg               | transparent                 | `bg-transparent`         | —                  |
| Focus ring               | `--color-ring`              | `ring-ring`              | `hsl(245 40% 36%)` |
| Dropdown bg              | `--color-popover`           | `bg-popover`             | `hsl(0 0% 100%)`   |
| Dropdown border          | `--color-border`            | `border-border`          | `hsl(30 14% 88%)`  |
| Dropdown shadow          | `--shadow-md`               | `shadow-md`              | warm shadow        |
| Option hover bg          | `--color-accent`            | `bg-accent`              | `hsl(170 18% 92%)` |
| Option hover text        | `--color-accent-foreground` | `text-accent-foreground` | `hsl(170 25% 18%)` |
| Selected check icon      | `--color-primary`           | `text-primary`           | `hsl(245 40% 36%)` |
| Border radius (trigger)  | `--radius-md`               | `rounded-md`             | `0.375rem`         |
| Border radius (dropdown) | `--radius-md`               | `rounded-md`             | `0.375rem`         |
| Disabled opacity         | —                           | `opacity-50`             | —                  |
| Placeholder text         | `--color-muted-foreground`  | `text-muted-foreground`  | —                  |

### 1.4 States

| State                                 | Visual treatment                                                         |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Default                               | `border-input-border`, no ring                                           |
| Open (data-state="open")              | `ring-1 ring-ring` on trigger                                            |
| Disabled                              | `opacity-50 cursor-not-allowed pointer-events-none` on trigger           |
| Option default                        | `py-2 px-3 text-sm cursor-pointer text-foreground`                       |
| Option highlighted (data-highlighted) | `bg-accent text-accent-foreground`                                       |
| Option selected                       | `bg-accent text-accent-foreground` + visible Check icon (`text-primary`) |
| Option disabled (data-disabled)       | `opacity-50 pointer-events-none`                                         |

### 1.5 Dark Mode

All tokens resolve automatically via CSS custom property overrides in the `.dark` class:

- `--color-input-border: 22 7% 40%` (dark)
- `--color-popover: 24 8% 9%` (dark)
- `--color-primary: 245 40% 68%` (dark — lighter indigo for AAA contrast)
- `--color-ring: 245 40% 68%` (dark)
- `--color-accent: 170 12% 14%` (dark)
- `--color-accent-foreground: 170 18% 88%` (dark)

### 1.6 Responsive Behavior

- Trigger: `w-full` — fills container width at all breakpoints.
- Dropdown: `max-h-[300px] overflow-y-auto` — scrollable at any viewport height.
- Touch targets: option items have `min-h-[44px]` (or `py-2` with `text-sm` line height totalling ≥ 44px on mobile via CSS). On mobile, option `py-2.5` ensures 44px minimum tap target.

### 1.7 Motion

- Dropdown enter: `animate-in fade-in-0 zoom-in-95` — uses `--ease-enter` (100ms fast).
- Dropdown exit: `animate-out fade-out-0 zoom-out-95` — uses `--ease-exit`.
- Respects `motion-safe:` — animations are gated by `prefers-reduced-motion` via Tailwind's `motion-safe:` variant.

---

## 2. Behavioral Spec

### 2.1 Keyboard Interaction

| Key               | Action                                                 |
| ----------------- | ------------------------------------------------------ |
| `Space` / `Enter` | Opens dropdown when trigger is focused                 |
| `ArrowDown`       | Moves focus to next option                             |
| `ArrowUp`         | Moves focus to previous option                         |
| `Enter`           | Selects highlighted option and closes dropdown         |
| `Escape`          | Closes dropdown without selection change               |
| `Tab`             | Closes dropdown; moves focus to next focusable element |
| `Home`            | Moves focus to first option                            |
| `End`             | Moves focus to last option                             |
| Type-ahead        | Jumps to first option matching typed character         |

### 2.2 Screen Reader Announcements

- Trigger has `aria-expanded="true|false"` and `aria-haspopup="listbox"`.
- When an option is selected, screen reader announces the new value.
- Listbox has `aria-label` or is associated with the trigger via `aria-controls`.
- Disabled trigger: `aria-disabled="true"`.
- Each option: `aria-selected="true|false"`.

### 2.3 Focus Management

- On open: focus moves to the currently selected option (or the first option if none selected).
- On close (Escape or selection): focus returns to the trigger.
- Focus ring on trigger: `focus-visible:ring-1 focus-visible:ring-ring` (2px ring, archival indigo).

---

## 3. Integration Spec

### 3.1 Composition

```tsx
<Select value={value} onValueChange={onChange}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Auswählen…" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Gruppe</SelectLabel>
      <SelectItem value="a">Option A</SelectItem>
      <SelectItem value="b">Option B</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

### 3.2 CSS Class API

- `SelectTrigger`: accepts `className` for width overrides (`w-[200px]`, `w-full`, etc.).
- `SelectContent`: accepts `className` for positional overrides.
- `SelectItem`: accepts `className` for custom item styles.
- `SelectLabel`: accepts `className`.

### 3.3 Slots / Children

- `SelectValue` renders the selected value text or placeholder inside `SelectTrigger`.
- Custom icons can be placed after `SelectValue` inside `SelectTrigger`.

---

## 4. Acceptance Criteria

### AC-SEL-01: Component file exists

- `src/components/ui/select.tsx` exists and exports `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`, `SelectLabel`, `SelectGroup`, `SelectSeparator`.

### AC-SEL-02: Trigger border uses `border-input-border`

- `SelectTrigger` renders with class `border-input-border` (not `border-input`).

### AC-SEL-03: Trigger height matches Input

- `SelectTrigger` renders with class `h-10`.

### AC-SEL-04: Trigger focus ring

- `SelectTrigger` has `focus-visible:ring-1 focus-visible:ring-ring` classes.

### AC-SEL-05: ARIA attributes on trigger

- Trigger element has `role="combobox"` (set by Radix).
- Trigger element has `aria-expanded` attribute (set by Radix, `"false"` when closed).
- Note: Radix v2 does not set `aria-haspopup` explicitly — `role="combobox"` implies `aria-haspopup="listbox"` per WAI-ARIA 1.2 spec.

### AC-SEL-06: Disabled state

- When `disabled` prop is set, trigger has class `disabled:cursor-not-allowed disabled:opacity-50`.
- When `disabled` prop is set, trigger has `aria-disabled` or is a disabled button.

### AC-SEL-07: Dropdown background uses `bg-popover`

- `SelectContent` renders with class `bg-popover`.

### AC-SEL-08: Dropdown border uses `border-border`

- `SelectContent` renders with class `border-border` (not `border-input`).

### AC-SEL-09: Option hover state uses `bg-accent`

- `SelectItem` renders with `focus:bg-accent focus:text-accent-foreground` (or equivalent data attribute selectors).

### AC-SEL-10: Check indicator uses `text-primary`

- The check icon inside `SelectItem` renders with class `text-primary`.

### AC-SEL-11: Keyboard navigation works

- `ArrowDown`/`ArrowUp` navigate options; `Enter` selects; `Escape` closes (Radix default behavior).

### AC-SEL-12: No accessibility violations

- `axe-core` reports zero violations on the rendered trigger.

### AC-SEL-13: Dropdown max height

- `SelectContent` renders with class `max-h-[300px]` (or equivalent scroll container).
