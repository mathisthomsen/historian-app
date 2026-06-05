# Input + Label + FormField — Implementation Spec

**Source spec:** `docs/design-system/04-design-system/components.md` §2
**Token source:** `docs/design-system/02-brand/identity.md`
**Component file:** `src/components/ui/input.tsx`
**Date:** 2026-04-02

---

## 1. Visual Spec

### 1.1 Anatomy

| Part          | Element                      | Notes                                         |
| ------------- | ---------------------------- | --------------------------------------------- |
| Label         | `<label>` via shadcn `Label` | Always present; `htmlFor` links to input `id` |
| Input         | `<input>` via shadcn `Input` | Core component styled here                    |
| Help text     | `<p>`                        | `text-xs text-muted-foreground`; optional     |
| Error message | `<p>`                        | `text-xs text-destructive`; populated by RHF  |
| Required mark | `*` in label                 | `text-destructive`, `aria-hidden="true"`      |

### 1.2 Token Usage

| Property         | CSS Variable               | Tailwind Class                      | Notes                                           |
| ---------------- | -------------------------- | ----------------------------------- | ----------------------------------------------- |
| Border (default) | `--color-input-border`     | `border-input-border`               | WCAG fix — NOT `border-input` / `border-border` |
| Background       | transparent                | `bg-transparent`                    | No fill in default state                        |
| Text color       | `--color-foreground`       | `text-foreground`                   | 15.8:1 contrast on background (AAA)             |
| Placeholder      | `--color-muted-foreground` | `placeholder:text-muted-foreground` | 5.8:1 on background (AA)                        |
| Focus ring       | `--color-ring`             | `focus-visible:ring-ring`           | Archival indigo; 8.7:1 in dark mode (AAA)       |
| Error border     | `--color-destructive`      | `border-destructive`                | `ring-destructive` on focus within error        |
| Border radius    | `--radius-md`              | `rounded-md`                        | 6px per scale                                   |
| Disabled bg      | `--color-muted`            | `disabled:bg-muted/50`              | Signals non-interactivity                       |

**Critical WCAG note:** `--color-input-border` provides 3.5:1 contrast against background in light mode (`hsl(30 14% 55%)`) and 3.2:1 in dark mode (`hsl(22 7% 40%)`). This satisfies WCAG 1.4.11 Non-text Contrast (AA). The generic `--color-border` token (`hsl(30 14% 88%)`) does NOT meet this threshold and must NOT be used for form input borders.

### 1.3 States

| State     | Class additions                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------- |
| Default   | `h-10 w-full rounded-md border border-input-border bg-transparent px-3 text-sm text-foreground`       |
| Hover     | `hover:border-foreground/20`                                                                          |
| Focus     | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |
| Disabled  | `disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50`                                |
| Error     | `border-destructive focus-visible:ring-destructive`                                                   |
| Read-only | `read-only:bg-muted/30 read-only:cursor-default`                                                      |

**Note:** The design system spec states `focus-visible:ring-1` but the implementation requirement specifies `ring-2 ring-offset-2` for WCAG 2.4.11 Focus Appearance compliance. The implemented value is `ring-2 ring-offset-2`.

### 1.4 Typography

- Font size: `text-sm` (14px / `--text-sm: 0.875rem`)
- Line height: default (no explicit override — inherits `leading-sm: 1.5`)
- Placeholder: same `text-sm`, color `text-muted-foreground`
- Archival reference variant: `font-mono text-base` (applied via `className` prop, not base)
- Numeric sub-field variant: `w-20 text-center font-mono tabular-nums` (applied via `className` prop)

### 1.5 Sizing and Spacing

- **Height:** `h-10` (40px minimum — touch target per WCAG 2.5.5 AAA / 2.5.8 AA)
- **Horizontal padding:** `px-3` (12px left and right)
- **Width:** `w-full` (fluid by default; constrained by container)

### 1.6 Transitions and Motion

- `transition-colors duration-[var(--duration-fast)]` (100ms)
- Applies to: `border-color`, `background-color`, `color`, `box-shadow`
- Respects `prefers-reduced-motion`: global `@media (prefers-reduced-motion: reduce)` in globals.css reduces all transition durations to `0.01ms`

### 1.7 Themes

| Token                  | Light mode         | Dark mode          |
| ---------------------- | ------------------ | ------------------ |
| `--color-input-border` | `hsl(30 14% 55%)`  | `hsl(22 7% 40%)`   |
| `--color-background`   | `hsl(40 20% 97%)`  | `hsl(22 8% 9%)`    |
| `--color-foreground`   | `hsl(20 14% 9%)`   | `hsl(30 10% 94%)`  |
| `--color-ring`         | `hsl(245 40% 36%)` | `hsl(245 40% 68%)` |
| `--color-destructive`  | `hsl(4 60% 46%)`   | `hsl(4 55% 58%)`   |
| `--color-muted`        | `hsl(33 16% 93%)`  | `hsl(24 8% 14%)`   |

Both themes must render the input border visibly distinct from the surrounding background surface.

---

## 2. Behavioral Spec

### 2.1 Keyboard Interaction

| Key       | Behavior                                                 |
| --------- | -------------------------------------------------------- |
| Tab       | Moves focus into/out of the input field                  |
| Shift+Tab | Moves focus backwards                                    |
| Enter     | Submits the enclosing `<form>` (native browser behavior) |
| Escape    | Blurs if focus is on the input (browser default)         |

Disabled inputs must not receive keyboard focus (`disabled` attribute prevents this natively).

### 2.2 Screen Reader Announcements

- Label announced on focus via `for`/`id` association
- Error message announced via `aria-describedby` pointing to error `<p id="field-id-error">`
- `aria-invalid="true"` causes screen readers to announce "invalid" along with the field label
- `aria-required="true"` causes screen readers to announce "required"
- Placeholder text is NOT read as the label — always pair with a visible `<label>`

### 2.3 Focus Management

- Focus ring: 2px solid ring using `--color-ring`, 2px offset (`ring-offset-2`)
- Focus must be visible with a minimum 3:1 contrast between ring color and adjacent colors (WCAG 2.4.11)
- `focus-visible:` variant ensures ring only shows on keyboard navigation, not on mouse click

### 2.4 Error State Behavior

- Error border replaces the default `border-input-border` with `border-destructive`
- Focus ring changes from `ring-ring` to `ring-destructive` when field is in error
- Error is communicated via: color, `aria-invalid`, and a visible text error message (`aria-describedby`)
- Never communicate error via border color alone (color-blind accessibility)

### 2.5 Disabled State Behavior

- `opacity-50` reduces visual prominence — communicates non-interactive state
- `cursor-not-allowed` provides pointer feedback
- `disabled:bg-muted/50` provides subtle fill to reinforce non-editability
- No keyboard focus, no hover effects (native `disabled` attribute handles this)

### 2.6 Read-only State Behavior

- `read-only:bg-muted/30` indicates content is not editable
- `read-only:cursor-default` removes text cursor for non-editable feel
- Unlike disabled: still receives focus, still selectable/copyable

---

## 3. Integration Spec

### 3.1 Composition with Label

```tsx
<div className="space-y-1.5">
  <label htmlFor="person-name" className="text-foreground text-sm font-medium">
    Name
    <span className="text-destructive ml-0.5" aria-hidden="true">
      *
    </span>
  </label>
  <Input
    id="person-name"
    aria-required="true"
    aria-describedby="person-name-error"
    aria-invalid={hasError}
    className={hasError ? "border-destructive focus-visible:ring-destructive" : ""}
  />
  {hasError && (
    <p id="person-name-error" className="text-destructive mt-1 flex items-center gap-1 text-xs">
      {errorMessage}
    </p>
  )}
</div>
```

### 3.2 FormField Wrapper (shadcn Form + React Hook Form)

The `FormField` wrapper from shadcn/ui (`src/components/ui/form.tsx`) handles:

- `aria-describedby` linkage via `FormMessage` id
- `aria-invalid` propagated from RHF `fieldState.invalid`
- `FormLabel` renders as shadcn `Label` with `text-sm font-medium text-foreground`

### 3.3 CSS Class API (className overrides)

The `Input` component accepts arbitrary `className` prop merged via `cn()`:

| Use case              | className to pass                                   |
| --------------------- | --------------------------------------------------- |
| Error state           | `border-destructive focus-visible:ring-destructive` |
| Archival reference    | `font-mono text-base`                               |
| Numeric sub-field     | `w-20 text-center font-mono tabular-nums`           |
| Fixed width           | `w-64` (or any Tailwind width)                      |
| Right-to-left content | `dir="auto"` (HTML attribute, not className)        |

### 3.4 File Input

- `file:border-0 file:bg-transparent file:text-sm file:font-medium` for consistent file input button styling
- File inputs use `type="file"` and inherit all base styles

---

## 4. Acceptance Criteria

### AC-INPUT-01: Border token

- [ ] Input renders with `border-input-border` class (uses `--color-input-border` token)
- [ ] Input does NOT have `border-input` or `border-border` as its border class

### AC-INPUT-02: Height (touch target)

- [ ] Input has class `h-10` (40px minimum height)
- [ ] Input does NOT have `h-9` (36px — insufficient for touch targets)

### AC-INPUT-03: Typography

- [ ] Input has `text-sm` (14px)
- [ ] Input has `text-foreground`
- [ ] Placeholder text has `placeholder:text-muted-foreground`

### AC-INPUT-04: Focus ring

- [ ] Input has `focus-visible:outline-none`
- [ ] Input has `focus-visible:ring-2`
- [ ] Input has `focus-visible:ring-ring`
- [ ] Input has `focus-visible:ring-offset-2`

### AC-INPUT-05: Disabled state

- [ ] Input has `disabled:cursor-not-allowed`
- [ ] Input has `disabled:opacity-50`

### AC-INPUT-06: Background

- [ ] Default state: `bg-transparent`

### AC-INPUT-07: Border radius

- [ ] Input has `rounded-md` (6px, `--radius-md`)

### AC-INPUT-08: Error state (ARIA)

- [ ] When `aria-invalid="true"` is set, input reflects attribute in DOM
- [ ] Error class overrides work via `className` prop merging

### AC-INPUT-09: Transition

- [ ] Input has `transition-colors` and `duration-[var(--duration-fast)]`

### AC-INPUT-10: Accessibility (axe-core)

- [ ] Rendered input with associated label has no axe violations
- [ ] Disabled input with associated label has no axe violations

### AC-INPUT-11: Theme rendering

- [ ] `--color-input-border` is present and non-empty in light mode
- [ ] `--color-input-border` is present and non-empty in dark mode
- [ ] Light and dark values differ

### AC-INPUT-12: No regressions

- [ ] Full vitest suite passes after implementation change
