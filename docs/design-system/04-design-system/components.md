# Component Pattern Library — Evidoxa

**Date:** 2026-04-02
**Status:** Complete — covers all components through Epic 2.4
**Upstream dependencies:** `03-ui/concept.md`, `04-design-system/tokens.md`, `src/styles/globals.css`

---

## How to Read This Document

Each component entry is self-contained. The **Tailwind class recipe** shows the key class strings, not full JSX. Combine them with `cn()` (clsx + tailwind-merge) in component code. Token names prefixed `--color-*` map directly to Tailwind utilities in v4 (e.g., `--color-primary` → `bg-primary`, `text-primary`, `border-primary`). Color values are stored as HSL channels without `hsl()` wrapper; Tailwind adds the wrapper automatically.

---

## Table of Contents

1. [Button](#1-button)
2. [Input + Label + FormField](#2-input--label--formfield)
3. [Textarea](#3-textarea)
4. [Select / Combobox](#4-select--combobox)
5. [Checkbox + Radio](#5-checkbox--radio)
6. [Toggle / Switch](#6-toggle--switch)
7. [Badge](#7-badge)
8. [Card](#8-card)
9. [Dialog / Modal](#9-dialog--modal)
10. [Popover](#10-popover)
11. [Tooltip](#11-tooltip)
12. [Command Palette](#12-command-palette)
13. [DataTable](#13-datatable)
14. [Tabs](#14-tabs)
15. [Sidebar](#15-sidebar)
16. [TopBar](#16-topbar)
17. [Breadcrumb](#17-breadcrumb)
18. [Toast / Sonner](#18-toast--sonner)
19. [Avatar](#19-avatar)
20. [Separator](#20-separator)
21. [Skeleton](#21-skeleton)
22. [Alert / AlertDialog](#22-alert--alertdialog)
23. [PropertyEvidence Badge (custom)](#23-propertyevidence-badge-custom)
24. [CertaintySelector (custom)](#24-certaintyselector-custom)
25. [EntityCard / AttributesCard (custom)](#25-entitycard--attributescard-custom)
26. [NetworkStatusIndicator (custom)](#26-networkstatusindicator-custom)
27. [Empty State (custom)](#27-empty-state-custom)

---

## 1. Button

**Category:** Interactive / Action

### When to use

- The primary action on a page or dialog (create, save, confirm).
- Navigation-initiating actions that cause a state change (delete, submit form).
- Icon-only for compact toolbars (column visibility toggle, row-level edit/delete).

### When NOT to use

- Navigation between pages — use `<Link>` styled as a button, or a sidebar nav item.
- Toggling content visibility with no data mutation — use a plain `<button>` with ARIA.
- Displaying read-only status labels — use `Badge` instead.

### Anatomy

| Part            | Element                  | Notes                                     |
| --------------- | ------------------------ | ----------------------------------------- |
| Container       | `<button>`               | Radix `Slot` when `asChild`               |
| Leading icon    | Lucide SVG 16px          | Optional; `aria-hidden="true"`            |
| Label           | Text node                | Required for all non-icon-only buttons    |
| Trailing icon   | Lucide SVG 16px          | Optional; e.g., external-link arrow       |
| Loading spinner | `Loader2` 16px, rotating | Replaces leading icon during async action |

### Variants

| Variant       | Use case                                       | Background       | Text                              | Border          |
| ------------- | ---------------------------------------------- | ---------------- | --------------------------------- | --------------- |
| `default`     | Primary CTA                                    | `bg-primary`     | `text-primary-foreground`         | none            |
| `secondary`   | Secondary action alongside primary             | `bg-secondary`   | `text-secondary-foreground`       | none            |
| `outline`     | Tertiary or cancel action                      | transparent      | `text-foreground`                 | `border-border` |
| `ghost`       | Low-emphasis inline action; icon-only toolbars | transparent      | `text-foreground`                 | none            |
| `destructive` | Delete, irreversible operations                | `bg-destructive` | `text-destructive-foreground`     | none            |
| `link`        | Inline text action (navigation flavor)         | none             | `text-primary underline-offset-4` | none            |

| Size      | Height      | Padding       | Font size | Use case                                       |
| --------- | ----------- | ------------- | --------- | ---------------------------------------------- |
| `sm`      | `h-8` 32px  | `px-3`        | `text-xs` | Compact toolbar, table row actions, pagination |
| `default` | `h-10` 40px | `px-4 py-2.5` | `text-sm` | Standard form actions                          |
| `lg`      | `h-11` 44px | `px-6`        | `text-sm` | Primary CTA on auth pages, empty state actions |
| `icon`    | `h-10 w-10` | none          | —         | Square icon-only button                        |

### Token usage

| Token               | CSS variable                     | Tailwind class                     |
| ------------------- | -------------------------------- | ---------------------------------- |
| Primary surface     | `--color-primary`                | `bg-primary`                       |
| Primary text        | `--color-primary-foreground`     | `text-primary-foreground`          |
| Secondary surface   | `--color-secondary`              | `bg-secondary`                     |
| Destructive surface | `--color-destructive`            | `bg-destructive`                   |
| Destructive text    | `--color-destructive-foreground` | `text-destructive-foreground`      |
| Hover tint          | `--color-accent`                 | `hover:bg-accent`                  |
| Focus ring          | `--color-ring`                   | `focus-visible:ring-ring`          |
| Border radius       | `--radius-md`                    | `rounded-md`                       |
| Hover transition    | `--duration-fast`                | `transition-colors` (100ms global) |

### States

| State             | Class additions                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| Default (primary) | `bg-primary text-primary-foreground rounded-md px-4 py-2.5 text-sm font-medium`                       |
| Hover             | `hover:bg-primary/90`                                                                                 |
| Focus visible     | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |
| Active            | `active:scale-[0.98]`                                                                                 |
| Disabled          | `disabled:pointer-events-none disabled:opacity-50`                                                    |
| Loading           | Replace icon with `Loader2 animate-spin`; add `aria-busy="true"`; label changes to "Saving…"          |

### Accessibility requirements

- All buttons must have an accessible name. Icon-only buttons require `aria-label`.
- Loading: set `aria-busy="true"` and `aria-disabled="true"` on the button element.
- Destructive confirm buttons in `AlertDialog`: the **Cancel** button must receive initial focus (safe default — prevents accidental confirmation).
- Never use a `<div>` or `<span>` as a button.

### Content guidelines

- Labels are verb-first: "Create Person" / "Person erstellen"; "Delete" / "Löschen".
- Never use: "Submit", "OK", "Go", "Proceed".
- Maximum label length: 24 characters (German baseline: "Beziehung erstellen" = 19 chars).
- Labels never truncate — if a German label is too wide, the button widens.

### Do / Don't

| Do                                                        | Don't                                            |
| --------------------------------------------------------- | ------------------------------------------------ |
| Use `variant="destructive"` for delete actions            | Style a delete button as `variant="default"`     |
| Use `size="icon"` with `aria-label` for icon-only buttons | Render icon-only buttons without `aria-label`    |
| Change label to "Saving…" during form submission          | Keep the label unchanged while spinner is active |

### Class recipe

```
// Primary default
"inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

// Destructive
"bg-destructive text-destructive-foreground hover:bg-destructive/90"

// Outline
"border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"

// Ghost
"bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"

// Icon-only (size="icon")
"h-10 w-10 rounded-md"
```

---

## 2. Input + Label + FormField

**Category:** Form / Data entry

### When to use

- Single-line text entry: names, references, search queries, URLs.
- Numeric sub-fields: year and day in `PartialDateInput` (`inputmode="numeric"`).
- Archival references requiring mono-spaced alignment.

### When NOT to use

- Multi-line content — use `Textarea`.
- Selecting from a bounded set of options — use `Select` or `Combobox`.
- Binary on/off states — use `Checkbox` or `Switch`.

### Anatomy

| Part               | Element                      | Notes                                         |
| ------------------ | ---------------------------- | --------------------------------------------- |
| Label              | `<label>` via shadcn `Label` | Always present; `htmlFor` links to input `id` |
| Input              | `<input>` via shadcn `Input` |                                               |
| Help text          | `<p>`                        | `text-xs text-muted-foreground`; optional     |
| Error message      | `<p>`                        | `text-xs text-destructive`; populated by RHF  |
| Required indicator | `*` in label                 | `text-destructive`, `aria-hidden="true"`      |

### Variants

| Variant              | Key difference                                                           |
| -------------------- | ------------------------------------------------------------------------ |
| Text (`type="text"`) | Default                                                                  |
| Password             | `type="password"`, show/hide toggle (Eye icon)                           |
| Archival reference   | `font-mono text-base` — GLA refs, folio numbers                          |
| Numeric sub-field    | `w-20 text-center font-mono tabular-nums` (year/day in PartialDateInput) |
| Search               | Leading search icon; clear (X) button when non-empty                     |

### Token usage

| Token            | CSS variable               | Tailwind class                      |
| ---------------- | -------------------------- | ----------------------------------- |
| Border (default) | `--color-input-border`     | `border-input-border`               |
| Background       | transparent                | `bg-transparent`                    |
| Placeholder      | `--color-muted-foreground` | `placeholder:text-muted-foreground` |
| Focus ring       | `--color-ring`             | `focus-visible:ring-ring`           |
| Error border     | `--color-destructive`      | `border-destructive`                |
| Border radius    | `--radius-md`              | `rounded-md`                        |
| Disabled bg      | `--color-muted`            | `bg-muted/50`                       |

Note: form inputs use `--color-input-border` (light: `30 14% 55%`, 3.5:1 contrast) rather than `--color-border` (light: `30 14% 88%`) — the higher-contrast token exists specifically so inputs are perceivable by users with low-contrast sensitivity (WCAG 1.4.11).

### States

| State     | Class additions                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------- |
| Default   | `border border-input-border rounded-md bg-transparent px-3 py-2.5 text-sm text-foreground`          |
| Hover     | `hover:border-foreground/20`                                                                        |
| Focus     | `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring` |
| Disabled  | `disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50`                              |
| Error     | `border-destructive ring-1 ring-destructive`                                                        |
| Read-only | `read-only:bg-muted/30 read-only:cursor-default`                                                    |

### Accessibility requirements

- Label always present via `<label>` or `aria-label`. Never use `placeholder` as the sole label.
- Error messages linked via `aria-describedby="field-id-error"`.
- `aria-required="true"` on required fields.
- `aria-invalid="true"` when in error state.
- User-content text fields: `dir="auto"` to support mixed-direction source material (Arabic, Hebrew, Ottoman Turkish — common in early modern German history research).

### Content guidelines

- Label style: `.text-label` — `text-sm font-medium text-foreground`.
- German label max: 40 characters. "Diplomatische Transkription" (27 chars) is the current longest.
- Placeholder text supplements the label; it must not replace it.
- Help text: one sentence, ≤80 characters (German).

### Do / Don't

| Do                                                          | Don't                                          |
| ----------------------------------------------------------- | ---------------------------------------------- |
| Use `border-input-border` (higher contrast) for form inputs | Use `border-border` on form inputs             |
| Link error messages via `aria-describedby`                  | Communicate errors only through border color   |
| Add `dir="auto"` to notes, transcription, and quote fields  | Omit `dir` on fields that may receive RTL text |

### Class recipe

```
// Label
"text-sm font-medium text-foreground"

// Input (default)
"h-10 w-full rounded-md border border-input-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"

// Error state additions
"border-destructive ring-1 ring-destructive"

// Error message
"mt-1 flex items-center gap-1 text-xs text-destructive"

// FormField wrapper
"space-y-1.5"
```

---

## 3. Textarea

**Category:** Form / Data entry

### When to use

- Multi-line user content: notes, biographical summaries, source descriptions.
- Long-form content requiring reading: evidence quotes (normalized), diplomatic transcriptions, annotations.

### When NOT to use

- Short single-line values — use `Input`.
- Structured multi-field content (structured reference sets) — use multiple `Input` fields in a `FieldGroup`.

### Anatomy

Same structure as Input + Label + FormField; container element is `<textarea>`.

### Variants

| Variant            | Key difference                                                          |
| ------------------ | ----------------------------------------------------------------------- |
| Standard           | `text-sm min-h-[80px]`                                                  |
| Large reading area | `text-lg min-h-[160px]` — notes, biographical text                      |
| Transcription      | `font-mono text-base min-h-[160px] dir="auto"` — diplomatic source text |

### Token usage

Same as Input. Additional tokens:

| Token             | CSS variable   | Tailwind class    |
| ----------------- | -------------- | ----------------- |
| Mono font         | `--font-mono`  | `font-mono`       |
| Large body size   | `--text-lg`    | `text-lg`         |
| Large line height | `--leading-lg` | `leading-[1.556]` |

### States

Identical to Input states. Additional class:

```
// Resize
"resize-y"   // vertical resize only — horizontal resize breaks layout
```

### Accessibility requirements

- `dir="auto"` required on all user-content textareas.
- Link error messages via `aria-describedby`.
- For transcription fields: label "Diplomatische Transkription / Diplomatic Transcription" is always visible (not hidden in a tooltip).

### Content guidelines

- No character limit enforced in UI (database constraints apply server-side).
- Transcription fields: label styled as `.text-overline` to clearly distinguish the field from standard notes.

### Do / Don't

| Do                                                 | Don't                                                  |
| -------------------------------------------------- | ------------------------------------------------------ |
| Use `font-mono dir="auto"` on transcription fields | Use standard `text-sm` for diplomatic source text      |
| Use `resize-y`                                     | Allow `resize` (both axes) — it breaks adjacent layout |

### Class recipe

```
// Standard
"min-h-[80px] w-full rounded-md border border-input-border bg-transparent px-3 py-2.5 text-sm placeholder:text-muted-foreground resize-y focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

// Transcription variant
"min-h-[160px] font-mono text-base leading-[1.625] resize-y"
```

---

## 4. Select / Combobox

**Category:** Form / Data entry

### When to use

- **Select**: Choosing from a static bounded list (month names, reliability tiers, locale).
- **Combobox** (Command + Popover): Choosing from a large dynamic or searchable list (entity search, event type selection, relation type selection). Uses the installed `cmdk` library.

### When NOT to use

- 2–3 options that fit inline without crowding — use `RadioGroup` or a segmented control.
- Filtering a table column — use the `DataTableSearch` pattern.

### Anatomy

**Select:**

| Part           | Element                                                             |
| -------------- | ------------------------------------------------------------------- |
| Trigger        | `<button>` with selected value text + ChevronDown icon              |
| Dropdown panel | `<div role="listbox">` with scroll; `max-h-[300px] overflow-y-auto` |
| Option         | `<div role="option">` with optional Check icon                      |
| Group label    | `<div role="group">` header in `.text-overline` style               |

**Combobox:**

| Part          | Element                                           |
| ------------- | ------------------------------------------------- |
| Trigger       | `<button>` — opens Popover                        |
| Search input  | `<input type="text">` at top of `Command`         |
| Result list   | `CommandList` with `CommandGroup` + `CommandItem` |
| Empty message | `CommandEmpty`                                    |

### Variants

| Variant  | Use case                                                      |
| -------- | ------------------------------------------------------------- |
| Select   | Month, reliability tier, locale, boolean radio-style          |
| Combobox | `EntitySelector`, `EventTypeCombobox`, `RelationTypeSelector` |

### Token usage

| Token                    | CSS variable                | Tailwind class                 |
| ------------------------ | --------------------------- | ------------------------------ |
| Trigger border           | `--color-input-border`      | `border-input-border`          |
| Dropdown bg              | `--color-popover`           | `bg-popover`                   |
| Dropdown border          | `--color-border`            | `border-border`                |
| Dropdown shadow          | `--shadow-md`               | `shadow-md`                    |
| Option hover bg          | `--color-accent`            | `hover:bg-accent`              |
| Option hover text        | `--color-accent-foreground` | `hover:text-accent-foreground` |
| Selected check icon      | `--color-primary`           | `text-primary`                 |
| Border radius (trigger)  | `--radius-md`               | `rounded-md`                   |
| Border radius (dropdown) | `--radius-md`               | `rounded-md`                   |

### States

| State              | Class                                                     |
| ------------------ | --------------------------------------------------------- |
| Trigger default    | `h-10 rounded-md border border-input-border px-3 text-sm` |
| Trigger open       | `ring-1 ring-ring`                                        |
| Option default     | `py-2 px-3 text-sm cursor-pointer`                        |
| Option highlighted | `bg-accent text-accent-foreground`                        |
| Option selected    | `bg-accent text-accent-foreground` + Check icon           |
| Option disabled    | `opacity-50 pointer-events-none`                          |

### Accessibility requirements

- Trigger: `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`.
- Options: `role="option"`, `aria-selected`.
- Combobox: follow WAI-ARIA Combobox pattern 1.2; `aria-activedescendant` tracks focused option.
- Keyboard: `ArrowDown`/`ArrowUp` navigate options; `Enter` selects; `Escape` closes dropdown.

### Content guidelines

- Trigger placeholder: "Auswählen…" / "Select…" — never empty.
- Option labels in German: allow ~30% expansion over English equivalents.
- Group labels use `.text-overline` style (uppercase, tracked).

### Class recipe

```
// Trigger
"flex h-10 w-full items-center justify-between rounded-md border border-input-border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

// Dropdown container
"max-h-[300px] overflow-y-auto rounded-md border border-border bg-popover shadow-md py-1"

// Option
"relative flex cursor-pointer select-none items-center py-2 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"

// Group label
"px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-[0.08em]"
```

---

## 5. Checkbox + Radio

**Category:** Form / Selection

### When to use

- **Checkbox**: Multi-select in forms; row selection in `DataTable`; individual boolean toggles.
- **Radio** (via `CertaintySelector`): Mutually exclusive selection within a group.

### When NOT to use

- Checkbox for confirming an irreversible action alone — pair with `AlertDialog`.
- Radio group for >6 options that need search — use `Select` or `Combobox`.

### Anatomy

**Checkbox:**

| Part              | Element                                       |
| ----------------- | --------------------------------------------- |
| Control           | `<button role="checkbox">` (Radix `Checkbox`) |
| Check mark / dash | SVG inside control                            |
| Label             | `<label>` to the right                        |

**RadioGroup:**

| Part            | Element                   |
| --------------- | ------------------------- |
| Group container | `<div role="radiogroup">` |
| Control         | `<button role="radio">`   |
| Label           | `<label>`                 |

### Variants

| Variant                | Use case                                   |
| ---------------------- | ------------------------------------------ |
| Checkbox default       | Form boolean fields                        |
| Checkbox indeterminate | `DataTable` header (partial row selection) |
| Radio group            | `CertaintySelector`, yes/no pairs          |

### Token usage

| Token            | CSS variable                 | Tailwind class                                 |
| ---------------- | ---------------------------- | ---------------------------------------------- |
| Checked bg       | `--color-primary`            | `data-[state=checked]:bg-primary`              |
| Checked icon     | `--color-primary-foreground` | `data-[state=checked]:text-primary-foreground` |
| Unchecked border | `--color-input-border`       | `border-input-border`                          |
| Focus ring       | `--color-ring`               | `focus-visible:ring-ring`                      |
| Border radius    | `--radius-sm`                | `rounded-sm`                                   |

### States

| State         | Class                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Unchecked     | `h-4 w-4 rounded-sm border border-input-border`                                                       |
| Checked       | `data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground`                        |
| Indeterminate | `data-[state=indeterminate]:bg-primary` (dash icon)                                                   |
| Disabled      | `disabled:cursor-not-allowed disabled:opacity-50`                                                     |
| Focus         | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |

### Accessibility requirements

- Checkbox: `role="checkbox"`, `aria-checked="true|false|mixed"` (mixed = indeterminate).
- RadioGroup: `role="radiogroup"` with `aria-label`; each radio has `role="radio"`, `aria-checked`.
- Keyboard: `Space` toggles checkbox; `ArrowLeft`/`ArrowRight` or `ArrowUp`/`ArrowDown` move within radio group.
- `DataTable` indeterminate checkbox: `aria-label="Select all rows"`.
- Row checkbox: `aria-label="Select row for {entity name}"`.

### Class recipe

```
// Checkbox
"h-4 w-4 shrink-0 rounded-sm border border-input-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
```

---

## 6. Toggle / Switch

**Category:** Form / Selection

### When to use

- Binary setting with immediate effect: dark mode toggle, inline feature flag.
- The shadcn `Switch` component; install when first needed.

### When NOT to use

- A form field that requires an explicit save — use `Checkbox` + submit button.
- Replacing a `Checkbox` within a vertical list of options.

### Anatomy

| Part  | Element                        |
| ----- | ------------------------------ |
| Track | `<button role="switch">`       |
| Thumb | Sliding indicator inside track |

### Token usage

| State      | Token                | Tailwind        |
| ---------- | -------------------- | --------------- |
| Track off  | `--color-input`      | `bg-input`      |
| Track on   | `--color-primary`    | `bg-primary`    |
| Thumb      | `--color-background` | `bg-background` |
| Focus ring | `--color-ring`       | `ring-ring`     |

### States

| State    | Description                                |
| -------- | ------------------------------------------ |
| Off      | `bg-input` track, thumb positioned left    |
| On       | `bg-primary` track, thumb positioned right |
| Disabled | `opacity-50 cursor-not-allowed`            |

### Accessibility requirements

- `role="switch"`, `aria-checked="true|false"`.
- Label clearly identifies what is toggled: `aria-label="Enable dark mode"`.
- Keyboard: `Space` or `Enter` toggles.
- Avoid using Switch as a substitute for a Checkbox in a form that requires saving — the implicit "immediate effect" semantic misleads users.

---

## 7. Badge

**Category:** Display / Status

### When to use

- Status labels: reliability tiers, entity type overlines, certainty indicators (compact mode).
- Count indicators on tab triggers, sidebar nav items.
- Semantic state labels: "Reviewed", "Unreviewed", "Draft".

### When NOT to use

- Primary actions — use `Button`.
- Long descriptive text (>30 chars) — use `Alert` or inline paragraph text.
- Clickable items — use a `Button` variant styled appropriately.

### Anatomy

| Part      | Element                                            |
| --------- | -------------------------------------------------- |
| Container | `<span>` (non-interactive)                         |
| Icon      | Lucide SVG 14–16px; optional; `aria-hidden="true"` |
| Label     | Text node                                          |

### Variants

| Variant               | Background                            | Text                                    | Border                                               |
| --------------------- | ------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Default               | `bg-secondary`                        | `text-secondary-foreground`             | none                                                 |
| Outline               | transparent                           | `text-foreground`                       | `border-border`                                      |
| Destructive           | `bg-destructive/10`                   | `text-destructive`                      | `border-destructive-border`                          |
| Success               | `bg-success-background`               | `text-success-foreground`               | `border-success-border`                              |
| Warning               | `bg-warning-background`               | `text-warning-foreground`               | `border-warning-border`                              |
| Info                  | `bg-info-background`                  | `text-info-foreground`                  | `border-info-border`                                 |
| Certainty-certain     | `bg-certainty-certain-background`     | `text-certainty-certain-foreground`     | `border-certainty-certain-border`                    |
| Certainty-probable    | `bg-certainty-probable-background`    | `text-certainty-probable-foreground`    | `border-certainty-probable-border`                   |
| Certainty-possible    | `bg-certainty-possible-background`    | `text-certainty-possible-foreground`    | `border-certainty-possible-border`                   |
| Certainty-unknown     | `bg-certainty-unknown-background`     | `text-certainty-unknown-foreground`     | `border-certainty-unknown-border`                    |
| Certainty-unevidenced | `bg-certainty-unevidenced-background` | `text-certainty-unevidenced-foreground` | `border-certainty-unevidenced-border` (dashed style) |
| Count (tab/nav)       | `bg-muted`                            | `text-muted-foreground`                 | none                                                 |

### Token usage

Certainty badges consume: `--color-certainty-{level}`, `--color-certainty-{level}-background`, `--color-certainty-{level}-border`, `--color-certainty-{level}-foreground`.

Semantic badges consume the same four-token pattern with `--color-{success|warning|destructive|info}` prefix.

Radius: `--radius-sm` (`rounded-sm`) for inline chips; `--radius-full` (`rounded-full`) for pill/count badges.

### Accessibility requirements

- Non-interactive badges are `<span>` with no `role`. Do not add `role="status"` unless the value updates dynamically.
- Certainty badges must include both icon shape and text label (never icon-only in full rendering mode).
- Count badges on tabs: their count is included in the containing tab's `aria-label`: `aria-label="Relations, 12 items"`.
- Tab count badges showing zero items: `opacity-60` (visible but de-emphasized — zero evidence is semantically meaningful in Evidoxa).

### Content guidelines

- Max label length: 20 characters (German: "Wahrscheinlich" = 14 chars fits within the pill).
- Entity type overline labels use uppercase: "PERSON", "EREIGNIS", "QUELLE".
- Count badges use `tabular-nums font-mono` for consistent column alignment.

### Do / Don't

| Do                                                                 | Don't                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------- |
| Use dual-channel encoding (icon + color) for certainty badges      | Use color alone for certainty — fails color-blind users |
| Use `rounded-full` for count badges, `rounded-sm` for inline chips | Mix radius styles within the same context               |
| Show zero-count certainty badges in `opacity-60`                   | Hide zero-count tabs or certainty badges                |

### Class recipe

```
// Pill badge (count, status pill)
"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"

// Chip badge (inline label)
"inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium"

// Count badge on tab trigger (non-zero)
"rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums font-mono text-muted-foreground"

// Count badge (zero items)
"rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums font-mono text-muted-foreground opacity-60"

// Certainty-certain full rendering
"inline-flex items-center gap-1.5 rounded-full border border-certainty-certain-border bg-certainty-certain-background px-2 py-0.5 text-xs font-medium text-certainty-certain-foreground"
```

---

## 8. Card

**Category:** Layout / Container

### When to use

- Grouping related content into a visually distinct surface: `AttributesCard`, dashboard stat cards, form containers, settings table containers, auth form card.
- Separating a logically distinct unit from the page background.

### When NOT to use

- Nesting cards more than one level deep — use a `FieldGroup` (`<fieldset>`) inside a card.
- Decorative visual grouping with no semantic separation — use a `<section>` with spacing instead.

### Anatomy

| Part        | Element           | Notes                                   |
| ----------- | ----------------- | --------------------------------------- |
| Container   | `<div>`           | shadcn `Card`                           |
| Header      | `CardHeader`      | Optional; title + description           |
| Title       | `CardTitle`       | `text-xl font-semibold text-foreground` |
| Description | `CardDescription` | `text-sm text-muted-foreground`         |
| Content     | `CardContent`     | Main body area                          |
| Footer      | `CardFooter`      | Action buttons (cancel, submit)         |

### Variants

| Variant | Padding        | Shadow             | Use case                                         |
| ------- | -------------- | ------------------ | ------------------------------------------------ |
| Default | `p-6`          | none (border only) | Standard container — `AttributesCard`, form card |
| Compact | `p-4`          | none               | Dashboard stat cards, relation row cards         |
| Auth    | `p-8 max-w-sm` | `shadow-sm`        | Auth page centered card                          |
| Flat    | `p-6 border-0` | none               | Embedded inside another card area                |

### Token usage

| Token            | CSS variable              | Tailwind class         |
| ---------------- | ------------------------- | ---------------------- |
| Background       | `--color-card`            | `bg-card`              |
| Foreground       | `--color-card-foreground` | `text-card-foreground` |
| Border           | `--color-border`          | `border-border`        |
| Border radius    | `--radius-lg`             | `rounded-lg`           |
| Auth card radius | `--radius-xl`             | `rounded-xl`           |
| Auth card shadow | `--shadow-sm`             | `shadow-sm`            |

No drop shadow on standard cards — borders alone communicate the surface boundary. This is a deliberate "grounded, not floating" design decision from the brand identity.

### Accessibility requirements

- Clickable entity cards (mobile stack view) must be `<a>` or `<button>`, never a `<div>` with an `onClick`.
- Use `<article>` for cards representing a distinct content entity; `<section>` for grouping within a page.

### Content guidelines

- Card titles: sentence-case, ≤40 characters.
- Card descriptions: one sentence, ≤80 characters.

### Class recipe

```
// Default card
"rounded-lg border border-border bg-card text-card-foreground"

// Card + default padding (content area)
"rounded-lg border border-border bg-card p-6"

// Compact card
"rounded-lg border border-border bg-card p-4"

// Auth card
"w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm"

// Card header
"flex flex-col space-y-1.5 pb-6"

// Card footer
"flex items-center justify-between pt-6 border-t border-border"
```

---

## 9. Dialog / Modal

**Category:** Overlay / Focus

### When to use

- Forms requiring isolated focus: `RelationFormDialog`, `RelationTypeFormDialog`.
- Destructive confirmation: `BulkDeleteDialog`, single entity delete.
- Compact selections that do not warrant a full-page route.

### When NOT to use

- Content requiring extensive scrolling (>3 screen heights) — use a full page route.
- Toast-level feedback — use Sonner.
- A popover inside a dialog — escalate to a page or restructure.

### Anatomy

| Part         | Element                                              |
| ------------ | ---------------------------------------------------- |
| Overlay      | `DialogOverlay` — full-screen scrim                  |
| Container    | `DialogContent`                                      |
| Title        | `DialogTitle`                                        |
| Description  | `DialogDescription`                                  |
| Close button | X icon button, top-right, 44px tap target            |
| Footer       | `flex justify-end gap-3 pt-6 border-t border-border` |

### Variants

| Variant | Max width   | Use case                                            |
| ------- | ----------- | --------------------------------------------------- |
| Default | `max-w-lg`  | Standard forms: `RelationTypeFormDialog`            |
| Narrow  | `max-w-sm`  | Simple non-destructive confirmation                 |
| Wide    | `max-w-2xl` | Multi-step forms, relation + evidence combined form |
| Alert   | `max-w-md`  | Destructive confirmation only (`AlertDialog`)       |

### Token usage

| Token           | CSS variable      | Tailwind class     |
| --------------- | ----------------- | ------------------ |
| Content bg      | `--color-popover` | `bg-popover`       |
| Overlay (light) | —                 | `bg-black/40`      |
| Overlay (dark)  | —                 | `dark:bg-black/60` |
| Border          | `--color-border`  | `border-border`    |
| Shadow          | `--shadow-lg`     | `shadow-lg`        |
| Radius          | `--radius-xl`     | `rounded-xl`       |

### States

| State          | Animation                                                              |
| -------------- | ---------------------------------------------------------------------- |
| Opening        | Scale 95%→100% + opacity 0→1; `--duration-slow` 300ms; `--ease-enter`  |
| Closing        | Scale 100%→97% + opacity 1→0; `--duration-normal` 200ms; `--ease-exit` |
| Reduced motion | Opacity only, effectively instant (global 0.01ms override)             |

### Accessibility requirements

- `role="dialog"`, `aria-modal="true"`.
- `aria-labelledby` points to `DialogTitle` id.
- `aria-describedby` points to `DialogDescription` id when present.
- Focus trapped inside when open (Radix `Dialog` handles this automatically).
- `Escape` closes dialog.
- On close, focus returns to the trigger element.

### Content guidelines

- Title: action-oriented, ≤40 characters. "Create Relation" / "Beziehung erstellen".
- Description: context sentence, ≤120 characters.
- `AlertDialog` body text must state the consequence and recovery path: "Delete 3 persons? This can be undone within 30 days."
- `AlertDialog` confirm button label: verb only ("Delete" / "Löschen"), not "Yes" or "Confirm".
- In `AlertDialog`, `Cancel` appears first and receives initial focus.

### Class recipe

```
// Overlay
"fixed inset-0 z-50 bg-black/40 dark:bg-black/60"

// Content
"fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-xl border border-border bg-popover p-6 shadow-lg"

// Title
"text-xl font-semibold text-foreground"

// Description
"mt-1 text-sm text-muted-foreground"

// Footer
"mt-6 flex items-center justify-end gap-3 pt-6 border-t border-border"
```

---

## 10. Popover

**Category:** Overlay / Contextual

### When to use

- `PropertyEvidencePanel`: field-level evidence annotations, inline on detail pages.
- `EntitySelector`: searchable dropdown for selecting related entities.
- Non-destructive contextual actions needing more space than a tooltip.

### When NOT to use

- Full forms — use `Dialog`.
- Simple labels — use `Tooltip`.
- A popover triggered from inside a dialog — escalate to a `Dialog` or a page.

### Anatomy

| Part    | Element               |
| ------- | --------------------- |
| Trigger | Any focusable element |
| Content | `PopoverContent`      |

No arrow pointer used in Evidoxa (cleaner visual per design intent).

### Token usage

Same as Dialog, without the full-screen overlay. Shadow: `--shadow-md` → `shadow-md`. Max width: `max-w-[360px]`. The `PropertyEvidencePanel` on desktop >=1024px may expand to a 400px side panel when transcription entry is needed.

### States

| State   | Animation                                                             |
| ------- | --------------------------------------------------------------------- |
| Opening | Fade in + `translateY(-4px)`; `--duration-slow` 300ms; `--ease-enter` |
| Closing | Fade out; `--duration-normal` 200ms; `--ease-exit`                    |

### Accessibility requirements

- Focus trapped inside while open (Radix handles this).
- `Escape` closes popover and returns focus to trigger.
- `PropertyEvidence` trigger: `aria-haspopup="dialog"`, `aria-expanded="true|false"`.
- Panel: `role="dialog"`, `aria-label="Evidence for {field name}"`.
- Evidence list within panel: `role="list"` with `role="listitem"` per entry.
- When evidence count changes: live region announces "{field name} now has {count} citations."

### Class recipe

```
// Content
"z-50 w-full max-w-[360px] rounded-lg border border-border bg-popover p-4 shadow-md outline-none"
```

---

## 11. Tooltip

**Category:** Overlay / Informational

### When to use

- Supplementary labels for icon-only buttons (collapsed sidebar nav items, toolbar icons).
- Abbreviation explanations on hover.
- Absolute timestamps displayed alongside relative time ("vor 2 Std.").

### When NOT to use

- Essential information a user needs without hovering — put it in a visible label or help text.
- Content longer than ~50 characters — use a `Popover` or help text instead.
- Touch-primary contexts — tooltips are inaccessible on touch; ensure the label is visible by other means.

### Anatomy

| Part    | Element                                           |
| ------- | ------------------------------------------------- |
| Trigger | Any focusable element wrapped in `TooltipTrigger` |
| Content | `TooltipContent` — floating label                 |

### Token usage

| Token      | CSS variable         | Tailwind class    |
| ---------- | -------------------- | ----------------- |
| Background | `--color-foreground` | `bg-foreground`   |
| Text       | `--color-background` | `text-background` |
| Radius     | `--radius-md`        | `rounded-md`      |

Inverted color scheme (foreground bg, background text) ensures maximum visibility in both light and dark modes. The tooltip is always visually distinct from the surface it floats over.

### States

| State     | Behavior                                                                               |
| --------- | -------------------------------------------------------------------------------------- |
| Hidden    | Not rendered in DOM                                                                    |
| Appearing | Delay `--duration-fast` (100ms) before show — prevents flicker on accidental hover     |
| Visible   | Static; no enter/exit animation (matches Evidoxa's "calm, unhurried" motion principle) |

### Accessibility requirements

- The tooltip's content supplements the trigger's accessible name; it must not be the only accessible name.
- Screen readers: `TooltipContent` is surfaced via `aria-describedby` on the trigger (Radix sets this automatically).
- Collapsed sidebar nav items: the `aria-label` on the `<a>` is the primary accessible name; the tooltip is supplementary.

### Class recipe

```
// Content
"z-50 overflow-hidden rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-sm max-w-[280px]"
```

---

## 12. Command Palette

**Category:** Navigation / Search

### When to use

- Global search and navigation triggered by `Cmd+K` / `Ctrl+K`.
- Action shortcuts: "New Person", "New Event", navigate to Settings sub-pages.
- Power-user feature — keyboard-first workflow entry point.

### When NOT to use

- In-page filtering of a visible list — use `DataTableSearch`.
- Form field autocomplete — use `Combobox`.

### Anatomy

| Part          | Element                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Overlay       | Full-screen scrim                                                                                      |
| Container     | `Command` root — centered modal                                                                        |
| Search input  | `CommandInput` — `h-12 border-b border-border`                                                         |
| Result groups | `CommandGroup` — one per entity type + actions + recent                                                |
| Result items  | `CommandItem` — entity type icon + name + disambiguating metadata                                      |
| Empty message | `CommandEmpty` — "No results found"                                                                    |
| Group labels  | `.text-overline` style: `px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider` |

### Variants

| Group   | Contents                                                         |
| ------- | ---------------------------------------------------------------- |
| Pages   | Dashboard, Settings sub-pages                                    |
| Persons | Matching person records (primary name + dates)                   |
| Events  | Matching events (title + event type)                             |
| Sources | Matching sources (title + reliability tier)                      |
| Actions | "Neue Person erstellen", "Neues Ereignis", etc.                  |
| Recent  | Recent searches (from `localStorage`, shown when input is empty) |

### Token usage

| Token             | CSS variable                | Tailwind class                         |
| ----------------- | --------------------------- | -------------------------------------- |
| Container bg      | `--color-popover`           | `bg-popover`                           |
| Container border  | `--color-border`            | `border-border`                        |
| Shadow            | `--shadow-lg`               | `shadow-lg`                            |
| Active item bg    | `--color-accent`            | `aria-selected:bg-accent`              |
| Active item text  | `--color-accent-foreground` | `aria-selected:text-accent-foreground` |
| Group label color | `--color-muted-foreground`  | `text-muted-foreground`                |
| Radius            | `--radius-xl`               | `rounded-xl`                           |

### States

| State   | Animation                                                           |
| ------- | ------------------------------------------------------------------- |
| Opening | Scale 95%→100% + fade in; `--duration-normal` 200ms; `--ease-enter` |
| Closing | Fade out; `--duration-normal` 200ms; `--ease-exit`                  |

### Accessibility requirements

- Container: `role="dialog"`, `aria-modal="true"`, `aria-label="Command palette"`.
- `CommandInput`: `role="combobox"`, `aria-expanded`, `aria-controls` pointing to the list id.
- `CommandList`: `role="listbox"`.
- `CommandItem`: `role="option"`, `aria-selected`.
- `CommandGroup`: `role="group"` with `aria-label`.
- Keyboard: `ArrowUp`/`ArrowDown` to navigate; `Enter` to select; `Escape` to close.
- Results debounced at 200ms after input change.

### Content guidelines

- Result items show: entity type icon + primary name + disambiguating metadata (dates for persons, type label for events, reliability badge for sources).
- Action items: verb-first. "Neue Person erstellen" / "Create new person".
- Empty state: "Keine Ergebnisse." / "No results found."
- Recent searches label: "Zuletzt besucht" / "Recent".

### Class recipe

```
// Overlay
"fixed inset-0 z-50 bg-black/40"

// Container
"fixed left-[50%] top-[50%] z-50 w-full max-w-[640px] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-xl border border-border bg-popover shadow-lg"

// Search input
"h-12 w-full border-b border-border bg-transparent px-4 text-base outline-none placeholder:text-muted-foreground"

// Group label
"px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-[0.08em]"

// Result item
"flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"

// Empty state
"py-8 text-center text-sm text-muted-foreground"
```

---

## 13. DataTable

**Category:** Data display / List

### When to use

- Displaying a paginated, sortable, searchable collection of entities on all list pages.
- Enabling bulk selection and bulk delete.
- All entity list pages: `/persons`, `/events`, `/sources`, `/relations`.

### When NOT to use

- Displaying ≤8 items with no sorting/pagination — use a simple `<ul>` list.
- Displaying a single entity's attributes — use the `AttributesCard` (`<dl>` pattern).
- Settings with inline row editing — use `InlineEditTable` pattern (see patterns.md).

### Anatomy

| Part                  | Element                    | Notes                                             |
| --------------------- | -------------------------- | ------------------------------------------------- |
| Search                | `DataTableSearch`          | Debounced text input, URL-reflected               |
| Filter controls       | Filter-specific components | Above table, entity-specific                      |
| Active filter chips   | Removable chip row         | Below filters, above table; "Clear all" action    |
| Table container       | `<div>`                    | `rounded-lg border border-border overflow-hidden` |
| Header row            | `<thead>`                  | `bg-muted/50 text-muted-foreground text-sm`       |
| Column header         | `<th scope="col">`         | Sort trigger; `aria-sort` attribute               |
| Body                  | `<tbody>`                  |                                                   |
| Row                   | `<tr>`                     | Hover, selected, focused states                   |
| Checkbox cell         | `<td>` 40px wide           | shadcn `Checkbox`; replaces native `<input>`      |
| Data cells            | `<td>`                     | `py-3 px-4 text-sm text-foreground`               |
| Floating bulk toolbar | `<div role="toolbar">`     | Fixed bottom-center when ≥1 row selected          |
| Pagination            | `DataTablePagination`      | Below table, `mt-4`                               |

### Variants

| Variant            | When active                                                   |
| ------------------ | ------------------------------------------------------------- |
| Full (all columns) | ≥1024px desktop                                               |
| Priority columns   | 768–1023px; secondary columns hidden, column toggle available |
| Card stack         | <768px; each row becomes a card                               |

### Token usage

| Token                | CSS variable               | Tailwind class                      |
| -------------------- | -------------------------- | ----------------------------------- |
| Container border     | `--color-border`           | `border-border`                     |
| Header bg            | `--color-muted`            | `bg-muted/50`                       |
| Row bg               | `--color-card`             | `bg-card`                           |
| Row hover            | `--color-accent`           | `hover:bg-accent/30`                |
| Row selected         | `--color-accent`           | `data-[selected=true]:bg-accent/50` |
| Sort icon (active)   | `--color-foreground`       | `text-foreground`                   |
| Sort icon (inactive) | `--color-muted-foreground` | `text-muted-foreground`             |
| Pagination text      | `--color-muted-foreground` | `text-muted-foreground`             |

### States

| State                     | Visual treatment                                                           |
| ------------------------- | -------------------------------------------------------------------------- |
| Default                   | `bg-card`                                                                  |
| Row hover                 | `hover:bg-accent/30 transition-colors`                                     |
| Row selected              | `bg-accent/50`                                                             |
| Row focus (keyboard)      | `outline-2 outline-ring outline-offset-[-2px]` on the row                  |
| Loading (pagination/sort) | `opacity-60` on `<tbody>` — content stays visible, no skeleton replacement |
| Empty                     | Centered empty state within the table container                            |
| Error                     | Full-width error card within the table container area                      |

### Accessibility requirements

- `<table>` with `role="table"`, `aria-label="{Entity type list}"` (e.g., `aria-label="Persons"`).
- Column headers: `<th scope="col">`, `aria-sort="ascending|descending|none"`.
- Row checkboxes: `aria-label="Select row for {entity name}"`.
- Header checkbox (select all): `aria-label="Select all rows"`.
- Selected rows: `aria-selected="true"` on `<tr>`.
- Bulk toolbar: `role="toolbar"`, `aria-label="Bulk actions"`.
- Pagination: live region announces "Page 3 of 12, showing 21–30 of 120."
- Keyboard: `Tab` enters table; `ArrowUp`/`ArrowDown` between rows; `Space` toggles row selection; `Enter` navigates to detail page; `Cmd+A`/`Ctrl+A` selects all visible rows; `Escape` clears selection.

### Content guidelines

- Count text (pagination left): "47 Personen" / "12 von 47 Personen" (when filtered).
- Column header labels: title-case, ≤30 characters. German: "Erstellungsdatum" (17 chars) with sort chevron.
- Empty state within table: see Section 27.
- Active filter chips: show filter name + value. "Typ: Brief ×" / "Type: Letter ×". "Alle Filter löschen" / "Clear all filters" link.

### Do / Don't

| Do                                                           | Don't                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| Keep content visible at `opacity-60` during pagination loads | Replace table content with a skeleton during sort/page transitions |
| Use shadcn `Checkbox` for row selection                      | Use native `<input type="checkbox">` in DataTable rows             |
| Show the count in pagination as "12 von 47" when filtered    | Show only "47" when filters are active                             |

### Class recipe

```
// Table container
"rounded-lg border border-border overflow-hidden"

// Header cell
"py-3 px-4 text-left text-sm font-medium text-muted-foreground bg-muted/50"

// Body row
"border-b border-border last:border-0 bg-card transition-colors hover:bg-accent/30 data-[selected=true]:bg-accent/50"

// Data cell
"py-3 px-4 text-sm text-foreground"

// Floating bulk toolbar
"fixed bottom-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-md"

// Pagination row
"mt-4 flex items-center justify-between"

// Pagination count
"text-sm text-muted-foreground tabular-nums"
```

---

## 14. Tabs

**Category:** Navigation / Layout

### When to use

- Intra-page navigation on entity detail pages: switching between Attributes, Names/Sub-events, linked entities, Relations, Evidence, Activity.
- Any context where one content panel is shown at a time from a set of related panels.

### When NOT to use

- Navigating between different pages — use sidebar nav or breadcrumb.
- Hiding rarely-used features behind a tab — use a collapsible `FieldGroup`.
- Fewer than two tabs — just show the content.

### Anatomy

| Part          | Element                           |
| ------------- | --------------------------------- |
| Tab list      | `TabsList` — `role="tablist"`     |
| Tab trigger   | `TabsTrigger` — `role="tab"`      |
| Trigger label | Text node                         |
| Count badge   | Inline `<span>` inside trigger    |
| Tab panel     | `TabsContent` — `role="tabpanel"` |

### Canonical tab order (entity detail pages)

The tab order is standardized across all entity types per the UX Architecture Principle 4 (Consistent Entity Grammar):

| Position | Tab        | Person | Event | Source |
| -------- | ---------- | ------ | ----- | ------ |
| 1        | Attributes | Yes    | Yes   | Yes    |
| 2        | Names      | Yes    | —     | —      |
| 3        | Sub-events | —      | Yes   | —      |
| 4        | Persons    | —      | Yes   | Yes    |
| 5        | Events     | Yes    | —     | Yes    |
| 6        | Sources    | Yes    | Yes   | —      |
| 7        | Relations  | Yes    | Yes   | Yes    |
| 8        | Evidence   | Yes    | Yes   | Yes    |
| 9        | Activity   | Yes    | Yes   | Yes    |

### Token usage

| Token            | CSS variable               | Tailwind class                |
| ---------------- | -------------------------- | ----------------------------- |
| Inactive text    | `--color-muted-foreground` | `text-muted-foreground`       |
| Active text      | `--color-foreground`       | `text-foreground`             |
| Active indicator | `--color-primary`          | `border-primary` (2px bottom) |
| Hover            | —                          | `hover:text-foreground`       |
| Count badge bg   | `--color-muted`            | `bg-muted`                    |
| Count badge text | `--color-muted-foreground` | `text-muted-foreground`       |

### States

| State            | Class additions                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Inactive trigger | `text-muted-foreground py-2.5 px-4 text-sm font-medium`                                               |
| Hover            | `hover:text-foreground transition-colors`                                                             |
| Active           | `text-foreground` + 2px bottom border in `border-primary`                                             |
| Focus            | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |

### Accessibility requirements

- `TabsList`: `role="tablist"`.
- `TabsTrigger`: `role="tab"`, `aria-selected="true|false"`, `aria-controls="{panel-id}"`.
- `TabsContent`: `role="tabpanel"`, `aria-labelledby="{trigger-id}"`.
- Active tab persisted in URL hash (`#relations`) for direct linking.
- Keyboard: `ArrowLeft`/`ArrowRight` moves between triggers. `Tab` moves focus into panel content.
- Tab trigger `aria-label` includes the count: `aria-label="Relations, 12 items"`.
- Zero-count tabs remain visible with `opacity-60` on the count badge — they are not hidden.

### Content guidelines

- Tab labels: noun form, not imperative. "Relations" not "View Relations"; "Beziehungen" not "Beziehungen anzeigen".
- German max: 18 characters per label. "Beziehungen (12)" = 16 chars — fits within the maximum.
- Tab labels never truncate in DOM — abbreviate via the i18n system if needed.

### Class recipe

```
// Tab list (bottom-bordered strip)
"inline-flex w-full items-end border-b border-border"

// Tab trigger (inactive)
"relative py-2.5 px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

// Tab trigger active indicator (use data-state or CSS)
"data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary"

// Count badge (non-zero)
"ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums font-mono text-muted-foreground"

// Count badge (zero)
"ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums font-mono text-muted-foreground opacity-60"

// Tab panel
"mt-4 outline-none"
```

---

## 15. Sidebar

**Category:** Navigation / Shell

### When to use

- Primary navigation surface within the `(app)` layout group. Always present on desktop in either expanded or collapsed state.

### When NOT to use

- `(auth)` layout pages — use the centered card layout without any sidebar.
- Public marketing pages (Epic 2.6) — use a top navigation bar.

### Anatomy

| Part        | Element            | Notes                                                                |
| ----------- | ------------------ | -------------------------------------------------------------------- |
| Container   | `<nav>`            | Fixed left, full-height below TopBar                                 |
| Nav group 1 | `<ul>`             | Dashboard + entity items (Persons, Events, Sources, Relations)       |
| Separator   | shadcn `Separator` | Divides entity group from settings group                             |
| Nav group 2 | `<ul>`             | Event Types, Relation Types                                          |
| Nav item    | `<a>`              | Icon + label (expanded); icon only + tooltip (collapsed)             |
| Item icon   | Lucide SVG 20px    | `aria-hidden="true"` when label text is present                      |
| Item label  | `<span>`           | Visually hidden in collapsed state; `aria-label` on `<a>` takes over |
| Count badge | `<span>`           | Future: total entity count per type                                  |
| Footer area | Bottom-pinned      | Future: user info, project selector                                  |

### Variants

| Variant        | Width             | Content                                                                       |
| -------------- | ----------------- | ----------------------------------------------------------------------------- |
| Expanded       | `w-56` 224px      | Icon + label + optional count badge                                           |
| Collapsed      | `w-12` 48px       | Icon only; label shown via `Tooltip` on hover                                 |
| Mobile overlay | Full-width drawer | Triggered by hamburger in `TopBar`; closes on nav item click or overlay click |

### Token usage

| Token               | CSS variable                        | Tailwind class                    |
| ------------------- | ----------------------------------- | --------------------------------- |
| Background          | `--color-sidebar`                   | `bg-sidebar`                      |
| Default text        | `--color-sidebar-foreground`        | `text-sidebar-foreground`         |
| Right border        | `--color-sidebar-border`            | `border-sidebar-border`           |
| Hover / active bg   | `--color-sidebar-accent`            | `bg-sidebar-accent`               |
| Hover / active text | `--color-sidebar-accent-foreground` | `text-sidebar-accent-foreground`  |
| Active left border  | `--color-primary`                   | `border-primary`                  |
| Focus ring          | `--color-sidebar-ring`              | `ring-sidebar-ring`               |
| Width (expanded)    | `--sidebar-width-open`              | `w-56`                            |
| Width (collapsed)   | `--sidebar-width-collapsed`         | `w-12`                            |
| Width transition    | `--duration-normal` + `--ease-move` | `transition-[width] duration-200` |

### States

| State                 | Visual treatment                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| Default               | `text-muted-foreground` on icon and label                                                       |
| Hover                 | `bg-sidebar-accent/50 text-sidebar-accent-foreground`                                           |
| Active (current page) | `bg-sidebar-accent text-sidebar-accent-foreground` + `border-l-2 border-primary`                |
| Focus                 | `outline-none ring-2 ring-sidebar-ring ring-offset-[-2px]` (inset ring within sidebar boundary) |
| Collapsed + active    | `text-primary` icon; 2px left border still visible                                              |

### Accessibility requirements

- **Collapsed sidebar**: every `<a>` must have `aria-label="{nav item label in current locale}"` (e.g., `aria-label="Dashboard"`, `aria-label="Personen"`). The icon is `aria-hidden="true"`. The visually-hidden text label is removed from the DOM during collapse, making `aria-label` the sole accessible name.
- **Expanded sidebar**: icon is `aria-hidden="true"`; the text label provides the accessible name.
- Active page: `aria-current="page"` on the active nav item.
- `<nav>` element with `aria-label="Primary navigation"`.
- Keyboard shortcut `Cmd+B` / `Ctrl+B` toggles expanded/collapsed.
- Arrow keys navigate between nav items when sidebar has focus; `Enter` activates focused item.

### Content guidelines

- Nav item labels max: 20 characters. "Beziehungstypen" (16 chars) is the longest current German label.
- Nav items never truncate. The sidebar width (224px) must accommodate the longest German label.

### Do / Don't

| Do                                                              | Don't                                                                 |
| --------------------------------------------------------------- | --------------------------------------------------------------------- |
| Add `aria-label` to every nav link when collapsed               | Remove text without adding `aria-label` — icon alone is inaccessible  |
| Use `border-l-2 border-primary` as the primary active indicator | Use only `bg-accent` for active state (not visible in collapsed mode) |
| Include `aria-current="page"` on the active item                | Rely only on visual styling to indicate active page                   |

### Class recipe

```
// Container
"fixed left-0 top-[var(--topbar-height)] bottom-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-[200ms] ease-[cubic-bezier(0.65,0,0.35,1)] overflow-hidden"

// Nav item (default)
"relative flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"

// Nav item (active)
"bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-primary before:rounded-r-sm"

// Nav item icon
"h-5 w-5 shrink-0"

// Nav label (hidden in collapsed state)
"truncate" // in expanded; hidden via CSS when collapsed
```

---

## 16. TopBar

**Category:** Navigation / Shell

### When to use

- Fixed top bar in the `(app)` layout group. Always present; always the same.

### Anatomy

| Part                    | Position | Element                                            |
| ----------------------- | -------- | -------------------------------------------------- |
| Sidebar toggle          | Left     | Icon button — hamburger/menu icon, 44px tap target |
| Brand name              | Left     | `<a>` linking to `/{locale}/dashboard`             |
| Spacer                  | Center   | `flex-1`                                           |
| Command palette trigger | Right    | Search icon + "⌘K" keyboard hint                   |
| `LocaleSwitcher`        | Right    | DE/EN pill toggle group                            |
| `ThemeToggle`           | Right    | Sun/Moon icon button                               |
| User avatar             | Right    | 32px `Avatar`, opens dropdown (profile, logout)    |

### Token usage

| Token         | CSS variable               | Tailwind class           |
| ------------- | -------------------------- | ------------------------ |
| Background    | `--color-card`             | `bg-card`                |
| Bottom border | `--color-border`           | `border-b border-border` |
| Height        | `--topbar-height`          | `h-14`                   |
| Brand text    | `--color-foreground`       | `text-foreground`        |
| Icon buttons  | `--color-muted-foreground` | `text-muted-foreground`  |

TopBar does not add a drop shadow when the page is scrolled. This is an intentional decision — scroll-triggered shadows create visual noise during long sessions.

### Accessibility requirements

- `<header role="banner">` wrapping element.
- Brand link: `aria-label="Evidoxa – Dashboard"`.
- Sidebar toggle: `aria-label="Toggle navigation sidebar"`, `aria-expanded` reflecting sidebar state.
- Command palette trigger: `aria-label="Open command palette (⌘K)"` / `"Befehlspalette öffnen (⌘K)"`.
- All icon buttons must have `aria-label`.
- `LocaleSwitcher` uses `aria-label="Change language"`.
- `ThemeToggle` uses `aria-label="Toggle theme"`.

### Class recipe

```
// TopBar container
"fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-card px-4"

// Brand name
"text-lg font-semibold tracking-tight text-foreground hover:text-foreground/80 transition-colors"

// Spacer
"flex-1"

// ⌘K keyboard hint (desktop only)
"hidden text-xs font-mono text-muted-foreground sm:inline"
```

---

## 17. Breadcrumb

**Category:** Navigation / Wayfinding

### When to use

- All pages deeper than top-level list: detail pages, create pages, edit pages, settings sub-pages.
- Rendered inside the page content area (not the TopBar) below the TopBar.

### When NOT to use

- Top-level list pages (Persons, Events, Sources, Relations, Dashboard) — these are navigation roots, no breadcrumb.
- Mobile (<768px) — replaced by a back arrow button.

### Anatomy

| Part            | Element                               | Notes                                    |
| --------------- | ------------------------------------- | ---------------------------------------- |
| Container       | `<nav aria-label="Breadcrumb">`       |                                          |
| List            | `<ol>`                                |                                          |
| Link segment    | `<li>` → `<a>`                        | All preceding segments                   |
| Separator       | `<li aria-hidden="true">`             | `/` character in `text-muted-foreground` |
| Current segment | `<li>` → `<span aria-current="page">` | Not a link                               |

### Breadcrumb patterns

```
/{locale}/persons/[id]       → Persons > {entity name}
/{locale}/persons/[id]/edit  → Persons > {entity name} > Edit
/{locale}/persons/new        → Persons > New Person
/{locale}/settings/event-types → Settings > Event Types
```

### Token usage

| Token                | CSS variable               | Tailwind class          |
| -------------------- | -------------------------- | ----------------------- |
| Link text            | `--color-muted-foreground` | `text-muted-foreground` |
| Current segment text | `--color-foreground`       | `text-foreground`       |
| Separator            | `--color-muted-foreground` | `text-muted-foreground` |

### Accessibility requirements

- `<nav aria-label="Breadcrumb">` wraps the `<ol>`.
- Current segment: `aria-current="page"`.
- Separator: `aria-hidden="true"`.
- Entity names truncated at 30 characters with `…` in breadcrumb. The entity name on its own detail page `<h1>` never truncates.

### Content guidelines

- Segment labels: title-case entity type plural (Persons / Personen), translated "Edit" / "Bearbeiten", translated "New Person" / "Neue Person".
- Entity name truncation only in breadcrumb context — the full name appears in the `<h1>` below.

### Class recipe

```
// Nav + ol
"mb-4 flex items-center gap-1.5 text-sm"

// Link segment
"text-muted-foreground hover:text-foreground transition-colors"

// Separator
"text-muted-foreground select-none"

// Current segment
"font-medium text-foreground max-w-[30ch] truncate"
```

---

## 18. Toast / Sonner

**Category:** Feedback / Notification

### When to use

- Confirming completed actions: "Person erstellt." / "Person created."
- Offering undo for reversible operations (5–8s window with countdown progress bar).
- Reporting recoverable errors with a retry action.
- Status updates that do not require the user to stop and make a decision.

### When NOT to use

- Errors requiring user decision — use `Alert` inline or `AlertDialog`.
- Confirmation before an action — use `AlertDialog`.
- Status that must persist until explicitly dismissed — use an inline `Alert` banner.

### Anatomy

| Part             | Element                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| `<Toaster>` root | In root layout; position: bottom-right desktop, bottom-center mobile      |
| Toast item       | `<li>` managed by Sonner                                                  |
| Icon             | Lucide SVG 16px                                                           |
| Message text     | `text-sm`                                                                 |
| Action link      | `<button>` styled as a text link (e.g., "Undo" / "Rückgängig")            |
| Countdown bar    | 2px strip at bottom of toast (undo toasts only); `bg-muted-foreground/20` |

### Variants

| Type    | Icon            | Background                  | Border                      | Text                          |
| ------- | --------------- | --------------------------- | --------------------------- | ----------------------------- |
| Success | `CheckCircle`   | `bg-success-background`     | `border-success-border`     | `text-success-foreground`     |
| Warning | `AlertTriangle` | `bg-warning-background`     | `border-warning-border`     | `text-warning-foreground`     |
| Error   | `XCircle`       | `bg-destructive-background` | `border-destructive-border` | `text-destructive-foreground` |
| Info    | `Info`          | `bg-info-background`        | `border-info-border`        | `text-info-foreground`        |

### Token usage

All four toast types consume the four-token pattern: `--color-{type}`, `--color-{type}-background`, `--color-{type}-border`, `--color-{type}-foreground`.

Container dimensions: `rounded-lg border p-4 shadow-md max-w-[420px]`.

### States

| State                      | Duration                                                          |
| -------------------------- | ----------------------------------------------------------------- |
| Enter                      | Slide from bottom + fade; `--duration-slow` 300ms; `--ease-enter` |
| Visible (success/info)     | 5 000ms auto-dismiss                                              |
| Visible (error no retry)   | 8 000ms auto-dismiss                                              |
| Visible (error with retry) | 15 000ms auto-dismiss                                             |
| Undo countdown             | Countdown bar animates for 5s or 8s                               |
| Stacked (>1 toast)         | Older toasts: `scale-95 opacity-80` behind newest                 |
| Exit                       | Slide + fade; `--duration-normal` 200ms; `--ease-exit`            |
| Reduced motion             | Opacity fade only; effectively instant                            |

### Accessibility requirements

- Success/info toasts: `role="status"` (polite announcement — does not interrupt).
- Warning/error toasts: `role="alert"` (assertive announcement — interrupts screen reader).
- Action button: explicit `aria-label` when label is short (e.g., "Undo last action").
- The Sonner `<Toaster>` is outside the main content flow; screen readers receive announcements via ARIA live regions.

### Content guidelines

- Past tense, direct. "Relation erstellt." / "Relation created."
- Error format: state what happened + recovery. "Konnte nicht gespeichert werden. Ihre Änderungen sind erhalten — erneut versuchen."
- Never: "Oops!", "Something went wrong", "Error 422", "Please try again later."
- Undo action label: "Rückgängig" / "Undo".

### Do / Don't

| Do                                           | Don't                                                        |
| -------------------------------------------- | ------------------------------------------------------------ |
| Use `role="alert"` for error toasts          | Use `role="status"` for error toasts (too polite for errors) |
| State what happened AND what the user can do | Provide only a generic error message                         |
| Dismiss success toasts after 5s              | Keep success toasts on screen indefinitely                   |

---

## 19. Avatar

**Category:** Display / Identity

### When to use

- User identity in TopBar (32px), comment threads (24px), profile settings (40px).
- Activity log entries: 24px inline before the actor name.

### When NOT to use

- Entity type icons — use Lucide SVG icons.
- Large placeholder graphics (>48px) without a confirmed profile image.

### Anatomy

| Part     | Element                                             |
| -------- | --------------------------------------------------- |
| Root     | `<span>` (Radix `AvatarRoot`)                       |
| Image    | `<img>` via `AvatarImage`                           |
| Fallback | `<span>` via `AvatarFallback` — two-letter initials |

### Variants

| Size | Dimension        | Use case                      |
| ---- | ---------------- | ----------------------------- |
| xs   | `h-6 w-6` 24px   | Activity log, comment threads |
| sm   | `h-8 w-8` 32px   | TopBar user control           |
| md   | `h-10 w-10` 40px | Profile page, settings header |

### Token usage

| Token         | CSS variable               | Tailwind class          |
| ------------- | -------------------------- | ----------------------- |
| Fallback bg   | `--color-muted`            | `bg-muted`              |
| Fallback text | `--color-muted-foreground` | `text-muted-foreground` |
| Border radius | `--radius-full`            | `rounded-full`          |

### Accessibility requirements

- `alt` attribute on `AvatarImage`: the user's display name.
- Decorative avatars (where the user name is in adjacent text): `aria-hidden="true"` on the Avatar root.
- Fallback initials: `text-xs font-medium` to fit within the circular container at all sizes.

### Class recipe

```
// Root
"relative flex shrink-0 overflow-hidden rounded-full"

// Fallback
"flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground font-medium text-xs uppercase"
```

---

## 20. Separator

**Category:** Layout / Structural

### When to use

- Dividing sidebar nav groups (entity nav from settings nav).
- Separating logically distinct sections within a form or panel.
- Horizontal rule in a layout where spacing alone is insufficient.

### When NOT to use

- Between every list item — use row borders or consistent spacing.
- Purely decorative grouping — use spacing and section headings instead.

### Anatomy

A single `<div>` or `<hr>` rendered as a 1px line.

### Token usage

| Token | CSS variable     | Tailwind class |
| ----- | ---------------- | -------------- |
| Color | `--color-border` | `bg-border`    |

### Accessibility requirements

- `role="separator"` (Radix default).
- `aria-orientation="horizontal|vertical"`.
- Decorative separators: `aria-hidden="true"`.

### Class recipe

```
// Horizontal
"h-px w-full bg-border my-2"

// Vertical
"w-px h-full bg-border mx-2"
```

---

## 21. Skeleton

**Category:** Feedback / Loading

### When to use

- Page-level loading states in `loading.tsx` files (per-route, Next.js).
- In-place placeholder while async data is loading on initial page render.

### When NOT to use

- During pagination, sort, or search transitions in `DataTable` — use `opacity-60` on existing content instead. Flashing content→skeleton→content disrupts spatial memory.
- During operations expected to complete in <200ms.
- During auth page initial renders (too brief to warrant a skeleton).

### Anatomy

| Variant   | Structure                                                           |
| --------- | ------------------------------------------------------------------- |
| List      | 1 header row (3–4 bars) + 5 body rows (bars matching column widths) |
| Detail    | Two-column grid of label/value bar pairs + tab bar skeleton         |
| Card-grid | 4 cards 2×2 (desktop) / stacked (mobile)                            |
| Inline    | Single rectangle replacing a text value                             |

### Token usage

| Token           | CSS variable    | Tailwind class  |
| --------------- | --------------- | --------------- |
| Base fill       | `--color-muted` | `bg-muted`      |
| Pulse animation | —               | `animate-pulse` |

Dark mode: `bg-muted` automatically uses the dark muted surface (`24 8% 14%`). No extra token needed.

### States

| State          | Class                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Pulsing        | `animate-pulse bg-muted rounded-md`                                                                                                        |
| Reduced motion | `bg-muted opacity-60` (no pulse — `@media (prefers-reduced-motion: reduce)` global override in `globals.css` collapses duration to 0.01ms) |

### Accessibility requirements

- Loading region container: `aria-busy="true"`, `aria-label="Loading {content type}"`.
- Individual skeleton bars: no ARIA attributes needed.

### Class recipe

```
// Generic skeleton bar
"h-4 w-full animate-pulse rounded-md bg-muted"

// Card-shaped skeleton
"h-32 w-full animate-pulse rounded-lg bg-muted"

// Short label skeleton
"h-3 w-24 animate-pulse rounded bg-muted"

// Inline value skeleton
"inline-block h-4 w-16 animate-pulse rounded bg-muted align-middle"
```

---

## 22. Alert / AlertDialog

**Category:** Feedback / Confirmation

### Alert (inline banner)

Use for non-blocking status messages that persist until the condition is resolved: server-side validation errors, network degraded notice, form submission result.

**Anatomy:**

| Part        | Element                                       |
| ----------- | --------------------------------------------- |
| Container   | `<div role="alert">` or `<div role="status">` |
| Icon        | Lucide SVG 16px                               |
| Title       | `<p class="font-medium text-sm">`             |
| Description | `<p class="text-sm mt-1">`                    |

**Variants:**

| Variant        | Background                  | Border                      | Icon            |
| -------------- | --------------------------- | --------------------------- | --------------- |
| Info / default | `bg-info-background`        | `border-info-border`        | `Info`          |
| Success        | `bg-success-background`     | `border-success-border`     | `CheckCircle`   |
| Warning        | `bg-warning-background`     | `border-warning-border`     | `AlertTriangle` |
| Destructive    | `bg-destructive-background` | `border-destructive-border` | `XCircle`       |

**Class recipe:**

```
// Alert container
"rounded-lg border p-4 flex items-start gap-3"

// Destructive
"border-destructive-border bg-destructive-background"

// Alert title
"text-sm font-medium"

// Alert description
"mt-1 text-sm opacity-90"
```

### AlertDialog (destructive confirmation)

Use only for irreversible or high-stakes operations: single entity delete, bulk delete, account deletion.

**Key rules:**

1. Cancel button receives initial focus (safe default — prevents accidental confirmation on Enter).
2. Body text names the consequence and recovery path: "Delete {n} persons? This can be undone within 30 days."
3. Confirm button: `variant="destructive"`, label is the action verb ("Delete" / "Löschen"), never "Yes" or "OK".

**Accessibility requirements:**

- `role="alertdialog"` (more assertive than `role="dialog"`).
- `aria-modal="true"`.
- `aria-labelledby` → title, `aria-describedby` → consequence text.
- Focus trap: initial focus on Cancel button.

---

## 23. PropertyEvidence Badge (custom)

**Category:** Custom / Domain-specific display

### Description

The field-level evidence indicator that appears next to each annotatable attribute value on entity detail pages. Clicking opens the `PropertyEvidencePanel` popover showing source citations and the evidence add form.

### When to use

- Next to every annotatable field on entity `AttributesCard` components: `birth_year`, `death_year`, certainty, and any field that supports source annotations.
- Always visible when a certainty claim exists; conditionally visible when evidence exists.

### When NOT to use

- In form edit views (not appropriate during editing).
- For fields that are structurally not annotatable.

### Anatomy

| Part                    | Element         | Notes                                     |
| ----------------------- | --------------- | ----------------------------------------- |
| Badge button            | `<button>`      | Always interactive; cursor pointer        |
| Count number            | Text node       | "0", "1", "2"... `tabular-nums font-mono` |
| Dashed circle icon      | SVG             | Only in warning state                     |
| `PropertyEvidencePanel` | Popover content | Opened on click                           |

### Variants

| State                             | Background              | Border                                | Text                      | When                             |
| --------------------------------- | ----------------------- | ------------------------------------- | ------------------------- | -------------------------------- |
| Has evidence (count > 0)          | `bg-muted`              | none                                  | `text-muted-foreground`   | Default                          |
| No evidence, no certainty         | Not rendered            | —                                     | —                         | Field has no certainty claim     |
| Warning (certainty + no evidence) | `bg-warning-background` | `border-dashed border-warning-border` | `text-warning-foreground` | Certainty claimed but count is 0 |
| Hover (has evidence)              | `bg-accent`             | none                                  | `text-accent-foreground`  | On hover                         |

### Token usage

| State          | Token                        | Tailwind class                 |
| -------------- | ---------------------------- | ------------------------------ |
| Default bg     | `--color-muted`              | `bg-muted`                     |
| Default text   | `--color-muted-foreground`   | `text-muted-foreground`        |
| Warning bg     | `--color-warning-background` | `bg-warning-background`        |
| Warning border | `--color-warning-border`     | `border-warning-border`        |
| Warning text   | `--color-warning-foreground` | `text-warning-foreground`      |
| Hover bg       | `--color-accent`             | `hover:bg-accent`              |
| Hover text     | `--color-accent-foreground`  | `hover:text-accent-foreground` |
| Radius         | `--radius-full`              | `rounded-full`                 |

### Accessibility requirements

- Badge button: `aria-label="Evidence for {field label}, {count} citations"`.
- `aria-haspopup="dialog"`, `aria-expanded="true|false"`.
- Warning state: `aria-label="Warning: {field label} has a certainty claim but no evidence attached. Click to add evidence."`.
- Panel: `role="dialog"`, `aria-label="Evidence for {field label}"`.
- Evidence list: `role="list"` with `role="listitem"` per entry.
- When evidence count changes: ARIA live region announces "{field label} now has {count} citations."

### Content guidelines

- The "0" badge is always shown in warning state — absence of evidence is a first-class concept in Evidoxa, not hidden.
- The count uses `tabular-nums font-mono` for consistent column alignment.

### Class recipe

```
// Default (has evidence)
"inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums font-mono text-muted-foreground cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"

// Warning state (certainty claimed, zero evidence)
"inline-flex items-center gap-0.5 rounded-full border border-dashed border-warning-border bg-warning-background px-1.5 py-0.5 text-xs tabular-nums font-mono text-warning-foreground cursor-pointer"
```

---

## 24. CertaintySelector (custom)

**Category:** Custom / Domain-specific input

### Description

A segmented radio-group for selecting one of four certainty levels: Certain, Probable, Possible, Unknown. Used on all entity forms wherever a `certainty` column exists (birth date, death date, relation certainty). The Unevidenced state is never user-selectable — it is a computed display state.

### When to use

- Any form field controlling a `certainty` database column.

### When NOT to use

- Read-only display on detail pages — use a certainty `Badge` instead.
- In table cells — use the compact icon-only `Badge` rendering.

### Anatomy

| Part             | Element                                                 |
| ---------------- | ------------------------------------------------------- |
| Group container  | `<div role="radiogroup">` with `aria-label="Certainty"` |
| Button per level | `<button role="radio">`                                 |
| Level icon       | SVG 16px — filled/three-quarter/half/ring circle        |
| Level label      | Text node                                               |

### Variants (active state per level)

| Level    | Icon shape           | Active background                  | Active border                      | Active text                          |
| -------- | -------------------- | ---------------------------------- | ---------------------------------- | ------------------------------------ |
| Certain  | Filled circle        | `bg-certainty-certain-background`  | `border-certainty-certain-border`  | `text-certainty-certain-foreground`  |
| Probable | Three-quarter circle | `bg-certainty-probable-background` | `border-certainty-probable-border` | `text-certainty-probable-foreground` |
| Possible | Half circle          | `bg-certainty-possible-background` | `border-certainty-possible-border` | `text-certainty-possible-foreground` |
| Unknown  | Ring (empty circle)  | `bg-certainty-unknown-background`  | `border-certainty-unknown-border`  | `text-certainty-unknown-foreground`  |

Inactive state (all levels): `bg-muted text-muted-foreground border-border`.

### Token usage

Per level: `--color-certainty-{level}`, `--color-certainty-{level}-background`, `--color-certainty-{level}-border`, `--color-certainty-{level}-foreground`.

### States

| State            | Class                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Inactive button  | `rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground`      |
| Active (Certain) | `border-certainty-certain-border bg-certainty-certain-background text-certainty-certain-foreground`   |
| Focus            | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |
| Disabled         | `opacity-50 pointer-events-none`                                                                      |

### Accessibility requirements

- Group: `role="radiogroup"`, `aria-label="Gewissheit"` (DE) / `"Certainty"` (EN).
- Each button: `role="radio"`, `aria-checked="true|false"`, `aria-label="Certainty: {level}"`.
- Icon shapes are `aria-hidden="true"` — the `aria-label` carries the accessible meaning.
- Keyboard: `ArrowLeft`/`ArrowRight` cycles through levels; `Space` or `Enter` confirms selection.

### Content guidelines

- Display both icon and text in the selector (full rendering mode).
- Level names — German: "Sicher / Wahrscheinlich / Möglich / Unbekannt"; English: "Certain / Probable / Possible / Unknown".

### Class recipe

```
// Group container
"flex rounded-lg border border-border overflow-hidden"

// Individual button (inactive)
"flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground border border-transparent transition-colors"

// Active (Certain example)
"bg-certainty-certain-background border-certainty-certain-border text-certainty-certain-foreground"

// Active (Probable example)
"bg-certainty-probable-background border-certainty-probable-border text-certainty-probable-foreground"
```

---

## 25. EntityCard / AttributesCard (custom)

**Category:** Custom / Data display

### Description

The primary data surface on entity detail pages. Displays all primary attributes in a `<dl>` definition list grid. Each field has a label (`<dt>`) in overline style and a value (`<dd>`), with optional `CertaintyBadge` and `PropertyEvidenceBadge` inline.

### When to use

- Entity detail pages: `PersonDetailCard`, `EventDetailCard`, `SourceDetailCard`.

### When NOT to use

- Lists of entities — use `DataTable` rows or mobile card stack.
- Settings tables — use `InlineEditTable`.

### Anatomy

| Part            | Element                            | Notes                                                                                |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| Card container  | `<section>` wrapping shadcn `Card` | `p-6 rounded-lg border border-border bg-card`                                        |
| Section heading | `<h2>`                             | Optional "Attributes" / "Details" heading                                            |
| Definition list | `<dl>`                             | `grid grid-cols-1 sm:grid-cols-2 gap-4`                                              |
| Term            | `<dt>`                             | Overline style: `text-xs font-medium text-muted-foreground uppercase tracking-wider` |
| Value           | `<dd>`                             | `flex items-center gap-2 text-sm text-foreground`                                    |
| Certainty badge | Inline after date value            | Full rendering mode: icon + text + optional evidence count                           |
| Evidence badge  | Inline `<button>` after value      | See Section 23                                                                       |

### Token usage

| Token            | CSS variable               | Tailwind class          |
| ---------------- | -------------------------- | ----------------------- |
| Card bg          | `--color-card`             | `bg-card`               |
| Card border      | `--color-border`           | `border-border`         |
| Term label       | `--color-muted-foreground` | `text-muted-foreground` |
| Value text       | `--color-foreground`       | `text-foreground`       |
| Monospace values | `--font-mono`              | `font-mono`             |

### Accessibility requirements

- `<dl>` with `<dt>`/`<dd>` pairs conveys attribute/value semantics to screen readers.
- The page's `<h1>` is the entity name in the page header; the card uses `<h2>` for the "Attributes" section label.
- PropertyEvidence badges follow the accessibility spec in Section 23.
- Entity IDs shown in the card use `font-mono text-xs text-muted-foreground`.

### Class recipe

```
// Card container
"rounded-lg border border-border bg-card p-6"

// Definition list grid
"grid grid-cols-1 sm:grid-cols-2 gap-4"

// Single attribute group
"space-y-1"

// dt (term/label)
"text-xs font-medium text-muted-foreground uppercase tracking-wider"

// dd (value)
"flex items-center gap-2 text-sm text-foreground"

// Monospace date value
"font-mono tabular-nums"
```

---

## 26. NetworkStatusIndicator (custom)

**Category:** Custom / System feedback

### Description

Communicates the application's network/API connectivity status. Surfaced passively (degraded dot in TopBar) or actively (offline banner below TopBar).

### States

| State    | Treatment                         | Location                        |
| -------- | --------------------------------- | ------------------------------- |
| Online   | No indicator (normal state)       | —                               |
| Degraded | 8px amber dot next to user avatar | TopBar, rightmost area          |
| Offline  | Full-width banner                 | Between TopBar and page content |

### Token usage

| State                 | Token                            | Tailwind class                       |
| --------------------- | -------------------------------- | ------------------------------------ |
| Degraded dot          | `--color-warning`                | `bg-warning`                         |
| Offline banner bg     | `--color-destructive-background` | `bg-destructive-background`          |
| Offline banner border | `--color-destructive-border`     | `border-b border-destructive-border` |
| Offline banner text   | `--color-destructive-foreground` | `text-destructive-foreground`        |

### Accessibility requirements

- Degraded dot: `Tooltip` with text "Service degraded — some operations may be slow." / "Dienst eingeschränkt — einige Vorgänge könnten langsamer sein."
- Offline banner: `role="alert"` — assertive ARIA live region, announced immediately when it appears.
- `aria-live="assertive"` on the banner container.

### Class recipe

```
// Degraded dot
"h-2 w-2 rounded-full bg-warning shrink-0"

// Offline banner
"relative z-50 flex items-center justify-center gap-2 border-b border-destructive-border bg-destructive-background py-2 px-4 text-sm text-destructive-foreground"
```

---

## 27. Empty State (custom)

**Category:** Custom / Feedback

### Description

Displayed when a list, tab panel, or data area contains no items. Guides the user toward the first productive action.

### When to use

- Entity list pages when no entities of that type exist yet.
- DataTable when search/filter combination returns no results.
- Tab panels (Relations, Evidence, Activity) when no items are linked.

### Variants

| Variant              | Use case                                        | Illustration      | Padding      |
| -------------------- | ----------------------------------------------- | ----------------- | ------------ |
| Full page            | Entity list (`/persons` etc.) with zero records | 64px abstract SVG | `py-16 px-6` |
| Tab panel            | Relations, Evidence, Activity tabs with 0 items | None              | `py-8`       |
| Table (search empty) | DataTable search/filter returns 0 results       | None              | `py-12 px-4` |

### Anatomy

| Part          | Element                              | Notes                                              |
| ------------- | ------------------------------------ | -------------------------------------------------- |
| Illustration  | `<svg>` 64px                         | Full-page variant only; `text-muted-foreground/40` |
| Heading       | `<p>` or `<h2>`                      | `text-lg font-medium text-foreground`              |
| Description   | `<p>`                                | `text-sm text-muted-foreground mt-2`               |
| Action button | `Button variant="default" size="sm"` | `mt-4`; primary CTA                                |

### Token usage

| Token        | CSS variable               | Tailwind class             |
| ------------ | -------------------------- | -------------------------- |
| Illustration | `--color-muted-foreground` | `text-muted-foreground/40` |
| Heading      | `--color-foreground`       | `text-foreground`          |
| Description  | `--color-muted-foreground` | `text-muted-foreground`    |

### Accessibility requirements

- Container: `role="status"`, `aria-label="No {entity type} found"`.
- Action button has a clear verb-first label.

### Content guidelines

Follow Evidoxa voice (direct, professional, domain-respectful):

| Scenario               | German heading                 | German description                                               |
| ---------------------- | ------------------------------ | ---------------------------------------------------------------- |
| No entities yet        | "Noch keine Personen"          | "Legen Sie jetzt die erste Person an."                           |
| Search returns nothing | "Keine Personen für '{query}'" | "Versuchen Sie eine andere Suche oder entfernen Sie die Filter." |
| Tab panel empty        | "Keine Beziehungen"            | "Fügen Sie die erste Beziehung hinzu."                           |

Never: "Wow, so empty!", "Nothing here yet!", gamification language, commands disguised as descriptions.

### Do / Don't

| Do                                                   | Don't                                            |
| ---------------------------------------------------- | ------------------------------------------------ |
| Include a primary action button in full-page variant | Show an empty state with no path forward         |
| Echo the search query in filtered empty states       | Show generic "No results" without context        |
| Use compact (no illustration) variant for tab panels | Use the full-page illustration in sub-tab panels |

### Class recipe

```
// Full-page empty state container
"flex flex-col items-center justify-center py-16 px-6 text-center"

// Tab/compact empty state container
"flex flex-col items-center justify-center py-8 px-4 text-center"

// Illustration (full-page only)
"mb-4 h-16 w-16 text-muted-foreground/40"

// Heading
"text-lg font-medium text-foreground"

// Description
"mt-2 max-w-[340px] text-sm text-muted-foreground"

// Action button wrapper
"mt-4"
```

---

## Component Token Dependency Map

| Component         | Critical CSS variables                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button            | `--color-primary`, `--color-primary-foreground`, `--color-destructive`, `--color-ring`, `--radius-md`                                                                       |
| Input             | `--color-input-border`, `--color-ring`, `--color-muted-foreground`, `--color-destructive`, `--radius-md`                                                                    |
| Badge             | `--color-secondary`, `--color-muted`, `--color-certainty-{level}-*` (16 tokens), `--radius-sm`, `--radius-full`                                                             |
| Card              | `--color-card`, `--color-card-foreground`, `--color-border`, `--radius-lg`                                                                                                  |
| Dialog            | `--color-popover`, `--color-border`, `--shadow-lg`, `--radius-xl`                                                                                                           |
| Sidebar           | `--color-sidebar`, `--color-sidebar-foreground`, `--color-sidebar-border`, `--color-sidebar-accent`, `--color-primary`, `--sidebar-width-open`, `--sidebar-width-collapsed` |
| TopBar            | `--color-card`, `--color-border`, `--topbar-height`                                                                                                                         |
| DataTable         | `--color-card`, `--color-muted`, `--color-accent`, `--color-border`                                                                                                         |
| Tabs              | `--color-primary` (active indicator), `--color-muted`, `--color-muted-foreground`                                                                                           |
| CertaintySelector | `--color-certainty-{level}-background`, `--color-certainty-{level}-border`, `--color-certainty-{level}-foreground` (12 tokens)                                              |
| PropertyEvidence  | `--color-muted`, `--color-muted-foreground`, `--color-warning-background`, `--color-warning-border`, `--color-warning-foreground`, `--color-accent`                         |
| Toast             | `--color-{success,warning,destructive,info}-{background,border,foreground}` (12 tokens)                                                                                     |
| Alert             | Same 12 tokens as Toast                                                                                                                                                     |
| Skeleton          | `--color-muted`                                                                                                                                                             |
| Empty State       | `--color-muted-foreground`, `--color-foreground`                                                                                                                            |
