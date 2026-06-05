# Command Palette — Component Spec

**Source:** `docs/design-system/04-design-system/components.md` §12
**Component files:** `src/components/ui/command.tsx`
**Library:** `cmdk` (via shadcn/ui)

---

## 1. Visual Spec

### Container

The `Command` root wraps an `overflow-hidden rounded-md` shell with `bg-popover text-popover-foreground`. When used inside `CommandDialog` the `DialogContent` provides `shadow-lg` and `p-0`.

When used as a standalone centered modal overlay (global command palette):

| Layer           | Classes                                                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overlay / scrim | `fixed inset-0 z-50 bg-black/40`                                                                                                                                  |
| Container       | `fixed left-[50%] top-[50%] z-50 w-full max-w-[640px] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-xl border border-border bg-popover shadow-lg` |

Token references:

- Background: `--color-popover` → `bg-popover`
- Border: `--color-border` → `border-border`
- Shadow: `--shadow-lg` → `shadow-lg`
- Radius: `--radius-xl` (12px) → `rounded-xl`

### Search Input (`CommandInput`)

Wrapper `<div>` carries the bottom border:

```
flex items-center border-b border-border px-3
```

Inner `<input>`:

```
flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none
placeholder:text-muted-foreground
disabled:cursor-not-allowed disabled:opacity-50
```

Token references:

- Border: `--color-border` → `border-border`
- Placeholder: `--color-muted-foreground` → `placeholder:text-muted-foreground`
- Height: `h-11` (44px); spec calls for `h-12` in full-palette variant — use `h-12` via className override

### Result Items (`CommandItem`)

```
relative flex cursor-default gap-2 select-none items-center rounded-sm
px-2 py-1.5 text-sm outline-none
data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50
data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground
[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
```

Token references:

- Selected bg: `--color-accent` → `data-[selected='true']:bg-accent`
- Selected text: `--color-accent-foreground` → `data-[selected=true]:text-accent-foreground`

### Group Headers (`CommandGroup` heading)

The heading is applied via the cmdk data attribute selector on the group:

```
[&_[cmdk-group-heading]]:px-2
[&_[cmdk-group-heading]]:py-1.5
[&_[cmdk-group-heading]]:text-xs
[&_[cmdk-group-heading]]:font-medium
[&_[cmdk-group-heading]]:text-muted-foreground
```

Design system spec also requires `uppercase tracking-[0.08em]` on the group label — add via the `CommandDialog` wrapper or extend `CommandGroup`:

```
[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em]
```

Token reference: `--color-muted-foreground` → `text-muted-foreground`

### Empty State (`CommandEmpty`)

```
py-6 text-center text-sm text-muted-foreground
```

Token reference: `--color-muted-foreground` → `text-muted-foreground`

### Keyboard Badge (`CommandShortcut`)

```
ml-auto text-xs tracking-widest text-muted-foreground font-mono
```

Add `font-mono` to use `--font-mono` (Geist Mono). Spec: `bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono`.

### Separator (`CommandSeparator`)

```
-mx-1 h-px bg-border
```

### Both Themes

All tokens are defined in `@theme` (light) and `.dark {}` overrides in `globals.css`. The `bg-popover`, `border-border`, `bg-accent`, `text-muted-foreground` tokens all update automatically — no per-theme overrides required in the component.

---

## 2. Behavioral Spec

### Keyboard Navigation

| Key                | Action                                              |
| ------------------ | --------------------------------------------------- |
| `ArrowDown`        | Move selection to next item                         |
| `ArrowUp`          | Move selection to previous item                     |
| `Enter`            | Activate selected item                              |
| `Escape`           | Close dialog / clear input                          |
| `Cmd+K` / `Ctrl+K` | Open global command palette (consumer-side binding) |

Provided by the `cmdk` library natively. No custom keyboard handler needed.

### Screen Reader

- Container: `role="dialog"` `aria-modal="true"` `aria-label="Command palette"` (set on `DialogContent` or `Command` root at point of use)
- `CommandInput`: cmdk renders `role="combobox"` `aria-expanded` `aria-controls`
- `CommandList`: cmdk renders `role="listbox"`
- `CommandItem`: cmdk renders `role="option"` `aria-selected`
- `CommandGroup`: cmdk renders `role="group"` with `aria-label` from the `heading` prop

### Focus Management

- On open: focus is placed on `CommandInput` automatically by cmdk
- On close: focus returns to the triggering element (managed by `Dialog` from Radix)
- Tab should not cycle through items; arrow keys navigate within the list

### Loading / Empty State

- `CommandEmpty` renders when no items match the current query
- Text: `"Keine Ergebnisse."` / `"No results found."`
- Results should be debounced at 200ms for async searches (consumer responsibility)

---

## 3. Integration Spec

### Composition Patterns

```tsx
// Global command palette (modal)
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Search…" />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Pages">
      <CommandItem>Dashboard</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Actions">
      <CommandItem>
        Create Person
        <CommandShortcut>⌘N</CommandShortcut>
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>

// Inline (e.g., inside a Popover for Combobox)
<Command>
  <CommandInput placeholder="Search…" />
  <CommandList>…</CommandList>
</Command>
```

### CSS Class API

All sub-components accept `className` for overrides. The `cn()` utility merges additions after the base classes. Example to make the palette wider:

```tsx
<Command className="max-w-[800px]" />
```

---

## 4. Acceptance Criteria

| ID        | Criterion                                                                          | Testable signal                |
| --------- | ---------------------------------------------------------------------------------- | ------------------------------ |
| AC-CMD-01 | `CommandInput` wrapper has `border-b border-border`                                | class present on wrapper div   |
| AC-CMD-02 | `CommandInput` inner `<input>` has `placeholder:text-muted-foreground`             | class on input element         |
| AC-CMD-03 | `CommandItem` selected state applies `data-[selected='true']:bg-accent`            | class string contains token    |
| AC-CMD-04 | `CommandItem` selected state applies `data-[selected=true]:text-accent-foreground` | class string contains token    |
| AC-CMD-05 | `CommandGroup` heading has `text-muted-foreground` via group class                 | class present on group element |
| AC-CMD-06 | `CommandEmpty` has `py-6 text-center text-sm` and `text-muted-foreground`          | classes on empty element       |
| AC-CMD-07 | `CommandShortcut` has `text-muted-foreground` and `text-xs`                        | classes present                |
| AC-CMD-08 | `CommandSeparator` has `bg-border`                                                 | class present                  |
| AC-CMD-09 | `Command` root has `bg-popover`                                                    | class present                  |
| AC-CMD-10 | cmdk provides `role="combobox"` on the input                                       | attribute assertion            |
| AC-CMD-11 | cmdk provides `role="listbox"` on the list                                         | attribute assertion            |
| AC-CMD-12 | cmdk provides `role="option"` on items                                             | attribute assertion            |
| AC-CMD-13 | Axe-core passes with no violations on a populated Command                          | axe audit                      |
| AC-CMD-14 | `CommandDialog` renders a `<dialog>` (or element with `role="dialog"`)             | role="dialog" in DOM           |
