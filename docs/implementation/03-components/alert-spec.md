# Alert / AlertDialog — Component Specification

**Source:** `docs/design-system/04-design-system/components.md` §22
**Component files:**

- `src/components/ui/alert.tsx` (inline banner — new file)
- `src/components/ui/alert-dialog.tsx` (destructive confirmation — existing)

**Category:** Feedback / Confirmation

---

## 1. Alert (inline banner)

### 1.1 Visual Specification

#### Anatomy

| Part        | Element         | Notes                                                   |
| ----------- | --------------- | ------------------------------------------------------- |
| Container   | `<div>`         | `role="alert"` or `role="status"` depending on severity |
| Icon        | Lucide SVG 16px | `aria-hidden="true"`; color matches variant             |
| Title       | `<div>`         | `font-semibold text-sm`                                 |
| Description | `<div>`         | `text-sm` at `opacity-90`                               |

#### Variants

| Variant          | Background                  | Border                      | Text (icon + title)           | Icon            |
| ---------------- | --------------------------- | --------------------------- | ----------------------------- | --------------- |
| `default` (info) | `bg-info-background`        | `border-info-border`        | `text-info-foreground`        | `Info`          |
| `destructive`    | `bg-destructive-background` | `border-destructive-border` | `text-destructive-foreground` | `XCircle`       |
| `success`        | `bg-success-background`     | `border-success-border`     | `text-success-foreground`     | `CheckCircle`   |
| `warning`        | `bg-warning-background`     | `border-warning-border`     | `text-warning-foreground`     | `AlertTriangle` |

> Note: The spec treats `default` as an info-style banner using info tokens (not the generic card surface). The shadcn default of `bg-background` / `border` is replaced by `bg-info-background` / `border-info-border`.

#### Token usage

| Token              | CSS variable                     | Tailwind class                |
| ------------------ | -------------------------------- | ----------------------------- |
| Info bg            | `--color-info-background`        | `bg-info-background`          |
| Info border        | `--color-info-border`            | `border-info-border`          |
| Info text          | `--color-info-foreground`        | `text-info-foreground`        |
| Destructive bg     | `--color-destructive-background` | `bg-destructive-background`   |
| Destructive border | `--color-destructive-border`     | `border-destructive-border`   |
| Destructive text   | `--color-destructive-foreground` | `text-destructive-foreground` |
| Success bg         | `--color-success-background`     | `bg-success-background`       |
| Success border     | `--color-success-border`         | `border-success-border`       |
| Success text       | `--color-success-foreground`     | `text-success-foreground`     |
| Warning bg         | `--color-warning-background`     | `bg-warning-background`       |
| Warning border     | `--color-warning-border`         | `border-warning-border`       |
| Warning text       | `--color-warning-foreground`     | `text-warning-foreground`     |

#### Class recipe

```
// Alert container (base)
"relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-inherit"

// default (info) variant
"bg-info-background border-info-border text-info-foreground"

// destructive variant
"bg-destructive-background border-destructive-border text-destructive-foreground"

// success variant
"bg-success-background border-success-border text-success-foreground"

// warning variant
"bg-warning-background border-warning-border text-warning-foreground"

// AlertTitle
"mb-1 font-semibold leading-none tracking-tight text-sm"

// AlertDescription
"text-sm [&_p]:leading-relaxed opacity-90"
```

#### States

| State          | Behaviour                                                       |
| -------------- | --------------------------------------------------------------- |
| Default render | Static; dismissible only if a close button is added by consumer |
| Persistent     | Remains until condition is resolved (no auto-dismiss)           |
| With icon      | Icon left-aligned inside padding; text indented 28px            |
| Without icon   | Text flush with padding edge                                    |

#### Both themes

- Light: background tints are ~93-95% lightness; borders at ~78-84%.
- Dark: background tints are ~11-12% lightness; borders at ~22-24%.
- Same Tailwind class names; CSS variables handle the swap.

---

### 1.2 Behavioral Specification

#### ARIA

| Variant          | role                       |
| ---------------- | -------------------------- |
| `default` (info) | `role="status"` (polite)   |
| `destructive`    | `role="alert"` (assertive) |
| `success`        | `role="status"` (polite)   |
| `warning`        | `role="alert"` (assertive) |

> The component renders `role="alert"` by default (shadcn convention). The consuming page should set `role="status"` on non-critical variants; the component's base class provides `role="alert"` as a safe default.

#### Keyboard

- Not focusable itself (div, no interaction).
- If a dismiss button is added inside, it must be keyboard-operable.

#### Screen reader

- `role="alert"` announces content immediately (assertive live region).
- Icon is `aria-hidden="true"` — meaning conveyed by title text.

---

### 1.3 Integration Specification

#### Composition

```tsx
// Without icon (plain text)
<Alert variant="destructive">
  <AlertTitle>Fehler beim Speichern</AlertTitle>
  <AlertDescription>Verbindung unterbrochen. Bitte erneut versuchen.</AlertDescription>
</Alert>

// With icon (consumer places icon as first child)
<Alert variant="success">
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>Person erstellt.</AlertTitle>
  <AlertDescription>Die Person wurde erfolgreich gespeichert.</AlertDescription>
</Alert>
```

#### CSS class API

- `Alert` accepts `variant` prop and `className` for overrides.
- `AlertTitle` and `AlertDescription` accept `className`.

---

### 1.4 Alert Acceptance Criteria

| ID       | Criterion                                                            |
| -------- | -------------------------------------------------------------------- |
| AC-AL-01 | Default variant renders with `bg-info-background` class              |
| AC-AL-02 | Default variant renders with `border-info-border` class              |
| AC-AL-03 | Default variant renders with `text-info-foreground` class            |
| AC-AL-04 | Destructive variant renders with `bg-destructive-background` class   |
| AC-AL-05 | Destructive variant renders with `border-destructive-border` class   |
| AC-AL-06 | Destructive variant renders with `text-destructive-foreground` class |
| AC-AL-07 | Success variant renders with `bg-success-background` class           |
| AC-AL-08 | Success variant renders with `border-success-border` class           |
| AC-AL-09 | Success variant renders with `text-success-foreground` class         |
| AC-AL-10 | Warning variant renders with `bg-warning-background` class           |
| AC-AL-11 | Warning variant renders with `border-warning-border` class           |
| AC-AL-12 | Warning variant renders with `text-warning-foreground` class         |
| AC-AL-13 | `AlertTitle` carries `font-semibold` class                           |
| AC-AL-14 | `AlertDescription` carries `text-sm` class                           |
| AC-AL-15 | Container has `role="alert"`                                         |
| AC-AL-16 | Component passes axe-core accessibility audit                        |

---

## 2. AlertDialog (destructive confirmation)

### 2.1 Visual Specification

The AlertDialog uses the existing `src/components/ui/alert-dialog.tsx` (Radix AlertDialog primitive). Styling aligns with the Dialog spec (§9).

#### Overlay

```
"fixed inset-0 z-50 bg-black/40 dark:bg-black/60"
```

#### Content

```
"fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border bg-popover p-6 shadow-lg"
```

> `max-w-md` for destructive confirmation per the spec variant table (§9 "Alert" variant).

#### Footer layout

```
"flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"
```

Cancel button appears first (visually left); receives initial focus.
Confirm button uses `variant="destructive"`.

### 2.2 Behavioral Specification

#### ARIA

- `role="alertdialog"` (set by Radix primitive automatically)
- `aria-modal="true"` (set by Radix primitive automatically)
- `aria-labelledby` → `AlertDialogTitle` id
- `aria-describedby` → `AlertDialogDescription` id

#### Keyboard

| Key             | Behaviour                                                     |
| --------------- | ------------------------------------------------------------- |
| Tab / Shift+Tab | Cycles through Cancel and Action buttons only (focus trapped) |
| Enter           | Activates focused button                                      |
| Escape          | Cancels and closes dialog                                     |

#### Focus management

- Initial focus: **Cancel** button (safe default — prevents Enter-to-confirm on open).
- On close: focus returns to the trigger element.

### 2.3 AlertDialog Acceptance Criteria

| ID       | Criterion                                                        |
| -------- | ---------------------------------------------------------------- |
| AC-AD-01 | Overlay applies `bg-black/40` (light)                            |
| AC-AD-02 | Content applies `max-w-md` for destructive confirmation          |
| AC-AD-03 | Cancel button receives `autoFocus` or is first-focused element   |
| AC-AD-04 | Confirm button uses `buttonVariants({ variant: "destructive" })` |
| AC-AD-05 | `AlertDialogTitle` has `text-lg font-semibold`                   |
| AC-AD-06 | `AlertDialogDescription` has `text-sm text-muted-foreground`     |
| AC-AD-07 | Component passes axe-core when rendered (open state)             |
