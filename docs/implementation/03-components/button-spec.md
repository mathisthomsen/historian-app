# Button Component — Implementation Spec

**Date:** 2026-04-02
**Status:** Approved
**Source:** `docs/design-system/04-design-system/components.md` §1, `docs/design-system/02-brand/identity.md` §7

---

## 1. Visual Spec

### 1.1 Variants

All variants share the base class string defined in §1.4 (base classes). The columns below list the additional classes per variant.

| Variant             | Background       | Text                          | Border                       | Hover                                          |
| ------------------- | ---------------- | ----------------------------- | ---------------------------- | ---------------------------------------------- |
| `default` (primary) | `bg-primary`     | `text-primary-foreground`     | none                         | `hover:bg-primary/90`                          |
| `secondary`         | `bg-secondary`   | `text-secondary-foreground`   | none                         | `hover:bg-secondary/80`                        |
| `outline`           | `bg-background`  | (inherits foreground)         | `border border-input-border` | `hover:bg-accent hover:text-accent-foreground` |
| `ghost`             | transparent      | (inherits foreground)         | none                         | `hover:bg-accent hover:text-accent-foreground` |
| `destructive`       | `bg-destructive` | `text-destructive-foreground` | none                         | `hover:bg-destructive/90`                      |
| `link`              | none             | `text-primary`                | none                         | `hover:underline`                              |

Note on `outline`: the border must use `border-input-border` (maps to `--color-input-border`, contrast 3.5:1 on light / 3.2:1 on dark) rather than the low-contrast `border-input` to satisfy WCAG 1.4.11 Non-Text Contrast.

### 1.2 Sizes

| Size      | Height        | Horizontal padding | Vertical padding | Font size | Use case                                       |
| --------- | ------------- | ------------------ | ---------------- | --------- | ---------------------------------------------- |
| `sm`      | `h-8` (32px)  | `px-3`             | —                | `text-xs` | Compact toolbar, table row actions, pagination |
| `default` | `h-10` (40px) | `px-4`             | `py-2`           | `text-sm` | Standard form actions                          |
| `lg`      | `h-11` (44px) | `px-8`             | —                | `text-sm` | Primary CTA on auth pages, empty state actions |
| `icon`    | `h-10 w-10`   | —                  | —                | —         | Square icon-only button                        |

### 1.3 States

| State         | Class additions                                                                                       | Notes                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Default       | —                                                                                                     | Base variant classes                                     |
| Hover         | `hover:bg-{surface}/90` (or `hover:bg-accent`)                                                        | Via variant; 100ms `transition-colors`                   |
| Focus visible | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` | Ring color maps to `--color-ring` (archival indigo, AAA) |
| Active        | `active:scale-[0.98]`                                                                                 | Micro-press feedback                                     |
| Disabled      | `disabled:pointer-events-none disabled:opacity-50`                                                    | Native `disabled` attribute on `<button>`                |
| Loading       | Icon replaced with `Loader2 animate-spin`; `aria-busy="true"` added; label changes to "Saving…"       | Handled by caller, not CVA                               |

### 1.4 Base Classes (shared across all variants and sizes)

```
inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md
text-sm font-medium ring-offset-background
transition-colors duration-[var(--duration-fast)]
motion-safe:transition-colors
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
active:scale-[0.98]
disabled:pointer-events-none disabled:opacity-50
[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
```

### 1.5 Token Mapping

| Design token                 | CSS custom property              | Tailwind utility                  | Used by                  |
| ---------------------------- | -------------------------------- | --------------------------------- | ------------------------ |
| Primary surface              | `--color-primary`                | `bg-primary`                      | `default` variant        |
| Primary text                 | `--color-primary-foreground`     | `text-primary-foreground`         | `default` variant        |
| Secondary surface            | `--color-secondary`              | `bg-secondary`                    | `secondary` variant      |
| Secondary text               | `--color-secondary-foreground`   | `text-secondary-foreground`       | `secondary` variant      |
| Destructive surface          | `--color-destructive`            | `bg-destructive`                  | `destructive` variant    |
| Destructive text             | `--color-destructive-foreground` | `text-destructive-foreground`     | `destructive` variant    |
| Accent hover                 | `--color-accent`                 | `bg-accent`                       | `outline`, `ghost` hover |
| Accent text hover            | `--color-accent-foreground`      | `text-accent-foreground`          | `outline`, `ghost` hover |
| Link / primary text          | `--color-primary`                | `text-primary`                    | `link` variant           |
| Input border (high-contrast) | `--color-input-border`           | `border-input-border`             | `outline` variant border |
| Focus ring                   | `--color-ring`                   | `ring-ring`                       | all variants             |
| Border radius                | `--radius-md`                    | `rounded-md`                      | all variants             |
| Hover transition duration    | `--duration-fast` (100ms)        | `duration-[var(--duration-fast)]` | all variants             |
| Page background              | `--color-background`             | `bg-background`                   | `outline` variant fill   |
| Ring offset                  | `--color-background`             | `ring-offset-background`          | focus ring offset        |

### 1.6 Theme Behavior

**Light mode:**

- `--color-primary`: `hsl(245 40% 36%)` (archival indigo)
- `--color-input-border`: `hsl(30 14% 55%)` (3.5:1 on background — WCAG AA UI)
- `--color-ring`: `hsl(245 40% 36%)` (8.2:1 — AAA)

**Dark mode (`.dark`):**

- `--color-primary`: `hsl(245 40% 68%)` (lighter indigo on dark)
- `--color-input-border`: `hsl(22 7% 40%)` (3.2:1 on dark background — WCAG AA UI)
- `--color-ring`: `hsl(245 40% 68%)` (8.7:1 — AAA)

### 1.7 Responsive Behavior

Buttons do not change variant or size breakpoint automatically. Callers may apply responsive size props. Labels never truncate — content expands the button width.

---

## 2. Behavioral Spec

### 2.1 Keyboard Interaction

| Key         | Action                                            |
| ----------- | ------------------------------------------------- |
| `Space`     | Activates the button (native `<button>` behavior) |
| `Enter`     | Activates the button (native `<button>` behavior) |
| `Tab`       | Moves focus to next focusable element             |
| `Shift+Tab` | Moves focus to previous focusable element         |

### 2.2 Screen Reader Announcements

- Accessible name: derived from text content or `aria-label` attribute.
- Icon-only buttons (`size="icon"`) MUST receive `aria-label` — the SVG icon itself carries `aria-hidden="true"`.
- Loading state: caller must add `aria-busy="true"` and `aria-disabled="true"` (not the native `disabled` attribute, which removes the element from focus order and prevents screen reader announcement of the busy state).
- Disabled state: use native `disabled` attribute for buttons where focus removal is acceptable; use `aria-disabled="true"` + `pointer-events-none` when focus must be retained (e.g., inside a form that gives feedback on submit attempt).

### 2.3 Focus Management

- Focus ring uses `focus-visible:` pseudo-class — visible on keyboard navigation, suppressed on mouse click.
- Ring: 2px solid `--color-ring`, offset 2px via `ring-offset-background`.
- No custom focus management required; relies on native browser focus for `<button>`.

### 2.4 Loading State Behavior

1. Caller replaces icon slot with `<Loader2 className="animate-spin" aria-hidden="true" />`.
2. Caller sets `aria-busy="true"` on `<Button>`.
3. Caller updates visible label to "Saving…" / "Speichere…" for context.
4. Caller sets `disabled` or `aria-disabled="true"` to prevent duplicate submissions.
5. Loading state does not require changes to the Button component itself (handled by composition).

---

## 3. Integration Spec

### 3.1 Composition Patterns

```tsx
// Standard primary action
<Button variant="default">Person erstellen</Button>

// Destructive with icon
<Button variant="destructive" size="sm">
  <Trash2 aria-hidden="true" />
  Löschen
</Button>

// Icon-only (toolbar)
<Button variant="ghost" size="icon" aria-label="Zeile bearbeiten">
  <Pencil aria-hidden="true" />
</Button>

// Loading state (caller-managed)
<Button disabled aria-busy="true">
  <Loader2 className="animate-spin" aria-hidden="true" />
  Speichere…
</Button>

// asChild — wrapping a Next.js Link
<Button asChild variant="outline">
  <Link href="/persons/new">Neue Person</Link>
</Button>
```

### 3.2 CSS Class API

The component accepts a `className` prop that is merged (via `cn`) after variant classes — callers can override or extend.

### 3.3 Slot Support (`asChild`)

When `asChild={true}`, the component uses Radix `Slot` to merge all props (including class, ref, event handlers) onto the child element. This enables `<Button asChild><Link>` patterns without a wrapper DOM element.

---

## 4. Acceptance Criteria

| ID        | Criterion                                                                                                     | How to verify                                    |
| --------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| AC-BTN-01 | `default` variant renders with `bg-primary` and `text-primary-foreground` classes                             | Check rendered element's `className`             |
| AC-BTN-02 | `secondary` variant renders with `bg-secondary` and `text-secondary-foreground`                               | Check `className`                                |
| AC-BTN-03 | `outline` variant renders with `border-input-border` class (not `border-input`)                               | Check `className` contains `border-input-border` |
| AC-BTN-04 | `outline` variant renders with `bg-background` class                                                          | Check `className`                                |
| AC-BTN-05 | `ghost` variant renders with `hover:bg-accent` and `hover:text-accent-foreground`                             | Check `className`                                |
| AC-BTN-06 | `destructive` variant renders with `bg-destructive` and `text-destructive-foreground`                         | Check `className`                                |
| AC-BTN-07 | `link` variant renders with `text-primary` and `underline-offset-4`                                           | Check `className`                                |
| AC-BTN-08 | All variants include `focus-visible:ring-ring`                                                                | Check `className`                                |
| AC-BTN-09 | All variants include `disabled:pointer-events-none disabled:opacity-50`                                       | Check `className`                                |
| AC-BTN-10 | All variants include `rounded-md`                                                                             | Check `className`                                |
| AC-BTN-11 | All variants include `active:scale-[0.98]`                                                                    | Check `className`                                |
| AC-BTN-12 | `size="sm"` renders with `h-8` (not `h-9`)                                                                    | Check `className`                                |
| AC-BTN-13 | `size="default"` renders with `h-10 px-4`                                                                     | Check `className`                                |
| AC-BTN-14 | `size="lg"` renders with `h-11 px-8`                                                                          | Check `className`                                |
| AC-BTN-15 | `size="icon"` renders with `h-10 w-10`                                                                        | Check `className`                                |
| AC-BTN-16 | Button renders a `<button>` element by default                                                                | Check DOM element type                           |
| AC-BTN-17 | Button has `role="button"` semantics (implicit from `<button>`)                                               | axe / ARIA check                                 |
| AC-BTN-18 | Disabled button is not interactive (`pointer-events-none`)                                                    | Check `className`                                |
| AC-BTN-19 | `asChild` renders child element, not `<button>`                                                               | Check rendered DOM tag                           |
| AC-BTN-20 | Icon-only button without `aria-label` fails accessibility audit                                               | axe audit                                        |
| AC-BTN-21 | Icon-only button with `aria-label` passes accessibility audit                                                 | axe audit                                        |
| AC-BTN-22 | Button with `aria-busy="true"` is announced as busy by screen reader                                          | ARIA attribute present                           |
| AC-BTN-23 | Transition classes include `transition-colors`                                                                | Check `className`                                |
| AC-BTN-24 | `outline` variant does NOT contain class `border-input` as standalone border (must use `border-input-border`) | Negative check on `className`                    |
