# Textarea Component Spec

**Date:** 2026-04-02
**Status:** Approved
**Upstream:** `docs/design-system/04-design-system/components.md` § 3. Textarea

---

## 1. Visual Spec

### 1.1 Anatomy

```
┌─────────────────────────────────────────┐
│ Label (text-sm font-medium)             │
├─────────────────────────────────────────┤
│ [  textarea — w-full, min-h-[80px]   ]  │
│ [  resize handle (bottom-right)      ]  │
└─────────────────────────────────────────┘
  Help text or error message (text-xs)
```

| Part          | Element               | Notes                                            |
| ------------- | --------------------- | ------------------------------------------------ |
| Label         | `<label>` via `Label` | Always present; `htmlFor` links to textarea `id` |
| Textarea      | `<textarea>`          | shadcn `Textarea` component                      |
| Help text     | `<p>`                 | `text-xs text-muted-foreground`; optional        |
| Error message | `<p>`                 | `text-xs text-destructive`; populated by RHF     |
| Required mark | `*` in label          | `text-destructive aria-hidden="true"`            |

### 1.2 Variants

| Variant       | Key classes                                                    | Use case                                |
| ------------- | -------------------------------------------------------------- | --------------------------------------- |
| Standard      | `text-sm min-h-[80px]`                                         | Notes, short descriptions               |
| Large         | `text-lg min-h-[160px] leading-[1.556]`                        | Biographical summaries, long-form notes |
| Transcription | `font-mono text-base min-h-[160px] leading-[1.625] dir="auto"` | Diplomatic source text                  |

### 1.3 States

| State     | Classes / behaviour                                                                                 | Token                  |
| --------- | --------------------------------------------------------------------------------------------------- | ---------------------- |
| Default   | `border border-input-border bg-transparent`                                                         | `--color-input-border` |
| Focus     | `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring` | `--color-ring`         |
| Disabled  | `disabled:cursor-not-allowed disabled:opacity-50`                                                   | opacity 50%            |
| Error     | `border-destructive ring-1 ring-destructive`                                                        | `--color-destructive`  |
| Read-only | `read-only:bg-muted read-only:cursor-default`                                                       | `--color-muted`        |

### 1.4 Token Reference

| Property          | CSS variable               | Tailwind class                      |
| ----------------- | -------------------------- | ----------------------------------- |
| Border (default)  | `--color-input-border`     | `border-input-border`               |
| Border (focus)    | `--color-ring`             | `focus-visible:border-ring`         |
| Border (error)    | `--color-destructive`      | `border-destructive`                |
| Background        | transparent                | `bg-transparent`                    |
| Text              | `--color-foreground`       | `text-foreground` (inherited)       |
| Placeholder       | `--color-muted-foreground` | `placeholder:text-muted-foreground` |
| Focus ring        | `--color-ring`             | `focus-visible:ring-ring`           |
| Radius            | `--radius-md` (0.375rem)   | `rounded-md`                        |
| Font size (std)   | `--text-sm` (0.875rem)     | `text-sm`                           |
| Line height (std) | `--leading-sm` (1.5)       | `leading-normal` (1.5)              |
| Line height (lg)  | `--leading-lg` (1.556)     | `leading-[1.556]`                   |

### 1.5 Sizing and Spacing

- **min-height:** 80px (`min-h-[80px]`) — standard variant (2 visible rows at `text-sm`)
- **min-height:** 160px (`min-h-[160px]`) — large and transcription variants
- **width:** `w-full` (fills container)
- **padding:** `px-3 py-2.5` — matches Input horizontal and vertical padding
- **resize:** `resize-y` only — horizontal resize breaks adjacent layout

### 1.6 Responsive Behaviour

- `w-full` ensures full width at all breakpoints
- German text expansion (30–40% longer than English) is handled by `min-h` floor plus `resize-y`; no max-height enforced in the base component

### 1.7 Dark Mode

All tokens automatically resolve to dark-mode values when `.dark` is on `<html>`:

- `--color-input-border`: `22 7% 40%` (3.2:1 on dark background — AA UI)
- `--color-ring`: `245 40% 68%` (8.7:1 — AAA)
- `--color-background`: transparent, so dark background shows through

---

## 2. Behavioral Spec

### 2.1 Keyboard Interaction

| Key           | Behaviour                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| Tab           | Moves focus to textarea (if not disabled)                                                                       |
| Shift+Tab     | Moves focus to previous focusable element                                                                       |
| Enter         | Inserts newline (native textarea behaviour)                                                                     |
| All printable | Inserted as text (native textarea behaviour)                                                                    |
| Tab (inside)  | Inserts tab character (browser default) or traps focus depending on consuming app — component does not override |

### 2.2 Screen Reader Announcements

- Label announced on focus via native `<label for>` association
- Error message announced via `aria-describedby` pointing to the error `<p id>`
- Character count (if rendered) announced via `aria-live="polite"` region
- `placeholder` text is NOT a substitute for `<label>`

### 2.3 Focus Management

- Focus ring: `focus-visible:ring-1 focus-visible:ring-ring` — 1px ring, archival indigo (`--color-ring`)
- `focus-visible:outline-none` removes browser default outline; ring replaces it
- Ring is only visible for keyboard focus (`:focus-visible`, not `:focus`) — pointer users are unaffected
- Disabled textarea must NOT be focusable; `disabled` attribute prevents this natively

### 2.4 Error State Behaviour

- Error state is applied via an `aria-invalid="true"` attribute on the textarea element
- Visual indication: `border-destructive ring-1 ring-destructive` applied via className
- Error message rendered as `<p id="…-error" role="alert">` linked via `aria-describedby`

### 2.5 Loading / Skeleton State

- Not applicable to bare Textarea; consuming components use `<Skeleton>` as a placeholder before data loads

---

## 3. Integration Spec

### 3.1 Composition Pattern

```tsx
<div className="space-y-1.5">
  <Label htmlFor="notes">Notizen</Label>
  <Textarea
    id="notes"
    placeholder="Notizen hinzufügen …"
    aria-describedby={error ? "notes-error" : undefined}
    aria-invalid={!!error}
  />
  {error && (
    <p id="notes-error" role="alert" className="text-destructive mt-1 text-xs">
      {error}
    </p>
  )}
</div>
```

### 3.2 Slot / Children

Textarea is a leaf element; no children are expected. All customisation through props and `className`.

### 3.3 CSS Class API

The `className` prop is merged via `cn()` and appended after base classes, so callers can override:

- `min-h-[*]` — override minimum height
- `font-mono` — enable monospace (transcription variant)
- `text-lg leading-[1.556]` — large variant
- `resize-none` — suppress resize handle when layout requires it
- `border-destructive ring-1 ring-destructive` — error state

### 3.4 `dir="auto"` Recommendation

Per component spec § Accessibility, `dir="auto"` must be applied to all user-content textareas (notes, transcriptions, annotations) to support right-to-left text (Arabic, Hebrew archival sources). The base component does NOT set `dir` by default; consuming code is responsible for adding `dir="auto"` where appropriate.

---

## 4. Acceptance Criteria

- [ ] **AC-1** `<textarea>` element is rendered (not `<div>` or `<input>`)
- [ ] **AC-2** Has class `border-input-border` (WCAG requirement per design system)
- [ ] **AC-3** Has class `min-h-[80px]` (2-row default minimum height)
- [ ] **AC-4** Has class `resize-y` and does NOT have class `resize` or `resize-x`
- [ ] **AC-5** Has `focus-visible:ring-1` and `focus-visible:ring-ring` (keyboard focus ring)
- [ ] **AC-6** Has `focus-visible:outline-none` (removes browser default outline)
- [ ] **AC-7** Disabled state: `disabled:cursor-not-allowed disabled:opacity-50`; element is not focusable
- [ ] **AC-8** `className` prop is merged and applied (consumer overrides work)
- [ ] **AC-9** Standard textarea props (`placeholder`, `rows`, `value`, `onChange`, `aria-*`) pass through
- [ ] **AC-10** `ref` forwarding works — `React.forwardRef` used
- [ ] **AC-11** No axe-core violations when label is associated via `htmlFor`/`id`
- [ ] **AC-12** Has class `w-full` (full-width layout)
- [ ] **AC-13** Has class `rounded-md` (matches Input radius)
- [ ] **AC-14** Has class `bg-transparent` (matches Input background pattern)
- [ ] **AC-15** Has `transition-colors` for smooth state transitions
