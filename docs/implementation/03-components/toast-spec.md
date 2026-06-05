# Toast (Sonner) — Component Spec

**Source:** `docs/design-system/04-design-system/components.md` §18
**Integration point:** `src/app/layout.tsx` — `<Toaster>` from `sonner`
**Library:** `sonner` (already installed)

---

## 1. Visual Spec

### Toaster Root Configuration

Position: `bottom-right` on desktop. Sonner's default stacking and dismiss behavior is used.

`richColors` is NOT used — all coloring is applied via `toastOptions.classNames` so that the design system tokens govern appearance rather than Sonner's built-in palette.

### Default Toast

```
bg-card border border-border text-foreground shadow-md rounded-lg p-4 max-w-[420px]
```

Token references:

- Background: `--color-card` → `bg-card`
- Border: `--color-border` → `border-border`
- Text: `--color-foreground` → `text-foreground`
- Shadow: `--shadow-md` → `shadow-md`
- Radius: `--radius-lg` (8px) → `rounded-lg`

### Toast Title

```
text-sm font-semibold
```

### Toast Description

```
text-sm text-muted-foreground
```

Token reference: `--color-muted-foreground` → `text-muted-foreground`

### Variant Toasts

| Variant | Background                  | Border                      | Text (foreground)             |
| ------- | --------------------------- | --------------------------- | ----------------------------- |
| success | `bg-success-background`     | `border-success-border`     | `text-success-foreground`     |
| warning | `bg-warning-background`     | `border-warning-border`     | `text-warning-foreground`     |
| error   | `bg-destructive-background` | `border-destructive-border` | `text-destructive-foreground` |
| info    | `bg-info-background`        | `border-info-border`        | `text-info-foreground`        |

Token four-pattern per type: `--color-{type}`, `--color-{type}-background`, `--color-{type}-border`, `--color-{type}-foreground`.

### Action Button

```
bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium px-3 py-1.5 rounded-md
```

### Cancel Button

```
bg-muted text-muted-foreground hover:bg-muted/80 text-xs font-medium px-3 py-1.5 rounded-md
```

### Close Button

```
text-muted-foreground hover:text-foreground
```

### Both Themes

All tokens resolve from `globals.css` `@theme` (light) and `.dark {}` overrides. No per-theme Toaster config required — class names reference CSS custom properties that are already overridden by next-themes' `.dark` class.

---

## 2. Behavioral Spec

### Auto-dismiss Durations

| Toast type         | Duration                      |
| ------------------ | ----------------------------- |
| Success / Info     | 5 000 ms                      |
| Error (no retry)   | 8 000 ms                      |
| Error (with retry) | 15 000 ms                     |
| Undo countdown     | 5 000–8 000 ms (progress bar) |

### Animation

| Phase          | Motion                      | Duration                  | Easing         |
| -------------- | --------------------------- | ------------------------- | -------------- |
| Enter          | Slide from bottom + fade in | `--duration-slow` 300ms   | `--ease-enter` |
| Exit           | Slide down + fade out       | `--duration-normal` 200ms | `--ease-exit`  |
| Reduced motion | Opacity fade only           | same durations            | linear         |

Sonner handles animation via its built-in CSS. `motion-safe:` is not directly applicable; Sonner reads `prefers-reduced-motion` automatically.

### Stacking

When multiple toasts are visible, older toasts are scaled and dimmed behind the newest (`scale-95 opacity-80`). Managed by Sonner.

### Screen Reader

- Success / Info: `role="status"` (polite — does not interrupt)
- Warning / Error: `role="alert"` (assertive — interrupts screen reader)

Sonner handles ARIA live region announcements. The Toaster is mounted outside main content flow.

### Action Button ARIA

When the action label is short (e.g., "Undo"), add explicit `aria-label="Undo last action"` at the call site:

```ts
toast.success("Person deleted.", {
  action: { label: "Undo", onClick: handleUndo, "aria-label": "Undo last action" },
});
```

---

## 3. Integration Spec

### Toaster Configuration in Root Layout

```tsx
// src/app/layout.tsx
import { Toaster } from "sonner";

<Toaster
  position="bottom-right"
  toastOptions={{
    classNames: {
      toast: "bg-card border border-border text-foreground shadow-md rounded-lg",
      title: "text-sm font-semibold",
      description: "text-sm text-muted-foreground",
      actionButton:
        "bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium px-3 py-1.5 rounded-md",
      cancelButton:
        "bg-muted text-muted-foreground hover:bg-muted/80 text-xs font-medium px-3 py-1.5 rounded-md",
      closeButton: "text-muted-foreground hover:text-foreground",
      success: "bg-success-background border-success-border text-success-foreground",
      error: "bg-destructive-background border-destructive-border text-destructive-foreground",
      warning: "bg-warning-background border-warning-border text-warning-foreground",
      info: "bg-info-background border-info-border text-info-foreground",
    },
  }}
/>;
```

Note: `richColors` must be removed when providing custom classNames for variants, otherwise Sonner's inline styles override the design-system classes.

### Triggering Toasts

```ts
import { toast } from "sonner";

toast.success("Person erstellt.");
toast.error("Konnte nicht gespeichert werden.", {
  description: "Ihre Änderungen sind erhalten — erneut versuchen.",
  action: { label: "Wiederholen", onClick: retry },
});
toast.warning("Entwurf gespeichert.");
toast("Update verfügbar.", { description: "Bitte neu laden." }); // info/default
```

---

## 4. Acceptance Criteria

| ID        | Criterion                                                              | Testable signal                    |
| --------- | ---------------------------------------------------------------------- | ---------------------------------- |
| AC-TST-01 | `<Toaster>` is rendered in the root layout                             | import + JSX present in layout.tsx |
| AC-TST-02 | `position` prop is `"bottom-right"`                                    | prop value on Toaster element      |
| AC-TST-03 | `richColors` prop is NOT present (removed to allow custom classNames)  | prop absent                        |
| AC-TST-04 | `toastOptions.classNames.toast` contains `bg-card`                     | classNames config value            |
| AC-TST-05 | `toastOptions.classNames.toast` contains `border-border`               | classNames config value            |
| AC-TST-06 | `toastOptions.classNames.toast` contains `shadow-md`                   | classNames config value            |
| AC-TST-07 | `toastOptions.classNames.description` contains `text-muted-foreground` | classNames config value            |
| AC-TST-08 | `toastOptions.classNames.success` contains `bg-success-background`     | classNames config value            |
| AC-TST-09 | `toastOptions.classNames.success` contains `border-success-border`     | classNames config value            |
| AC-TST-10 | `toastOptions.classNames.success` contains `text-success-foreground`   | classNames config value            |
| AC-TST-11 | `toastOptions.classNames.error` contains `bg-destructive-background`   | classNames config value            |
| AC-TST-12 | `toastOptions.classNames.error` contains `border-destructive-border`   | classNames config value            |
| AC-TST-13 | `toastOptions.classNames.error` contains `text-destructive-foreground` | classNames config value            |
| AC-TST-14 | `toastOptions.classNames.warning` contains `bg-warning-background`     | classNames config value            |
| AC-TST-15 | `toastOptions.classNames.warning` contains `border-warning-border`     | classNames config value            |
| AC-TST-16 | `toastOptions.classNames.warning` contains `text-warning-foreground`   | classNames config value            |
| AC-TST-17 | `toastOptions.classNames.info` contains `bg-info-background`           | classNames config value            |
| AC-TST-18 | `toastOptions.classNames.info` contains `border-info-border`           | classNames config value            |
| AC-TST-19 | `toastOptions.classNames.info` contains `text-info-foreground`         | classNames config value            |
| AC-TST-20 | `toastOptions.classNames.closeButton` contains `text-muted-foreground` | classNames config value            |
| AC-TST-21 | `toastOptions.classNames.actionButton` contains `bg-primary`           | classNames config value            |
