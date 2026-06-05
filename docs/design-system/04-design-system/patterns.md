# Layout Pattern Library — Evidoxa

**Date:** 2026-04-02
**Status:** Complete — covers all page templates and composition rules through Epic 2.4
**Upstream dependencies:** `03-ui/concept.md`, `04-design-system/tokens.md`, `04-design-system/components.md`

---

## Table of Contents

1. [Page Templates](#1-page-templates)
   - 1.1 [List Page](#11-list-page)
   - 1.2 [Detail Page](#12-detail-page)
   - 1.3 [Form Page (Create / Edit)](#13-form-page-create--edit)
   - 1.4 [Dashboard](#14-dashboard)
   - 1.5 [Settings Page](#15-settings-page)
   - 1.6 [Auth Pages](#16-auth-pages)
2. [Composition Rules](#2-composition-rules)
   - 2.1 [Form Layout Patterns](#21-form-layout-patterns)
   - 2.2 [Table + Filter + Pagination](#22-table--filter--pagination)
   - 2.3 [Entity Detail Header + Tabs + Content](#23-entity-detail-header--tabs--content)
   - 2.4 [Dialog Content Patterns](#24-dialog-content-patterns)
   - 2.5 [Empty State Placement](#25-empty-state-placement)
3. [Spacing Rhythm](#3-spacing-rhythm)
4. [Density Variants](#4-density-variants)
5. [Cross-Reference Index](#5-cross-reference-index)

---

## 1. Page Templates

All app pages share the `AppShell` wrapper: fixed `TopBar` (h-14 / 56px) + collapsible `Sidebar`. Page content is offset with `pt-[--topbar-height]` and a dynamic `padding-left` matching the current sidebar width.

**App shell offset:**

```
// Main content container
"flex-1 pt-[var(--topbar-height)] transition-[padding-left] duration-[200ms] ease-[cubic-bezier(0.65,0,0.35,1)]"

// Padding-left applied via inline style (controlled by useSidebar hook):
// Expanded: var(--sidebar-width-open) = 14rem
// Collapsed: var(--sidebar-width-collapsed) = 3rem
```

---

### 1.1 List Page

**Pages:** `/persons`, `/events`, `/sources`, `/relations`, `/settings/event-types`, `/settings/relation-types`

**HTML landmark structure:**

```html
<main aria-label="Persons">
  <div class="page-container">
    <!-- p-6 space-y-6 max-w-7xl mx-auto -->
    <header class="page-header">
      <!-- flex items-center justify-between -->
      <h1>Personen</h1>
      <button variant="default">+ Neue Person</button>
    </header>

    <section aria-label="Filters">
      <DataTableSearch />
      <FilterControls />
      <!-- entity-specific: EventFilters etc. -->
      <FilterChipRow />
      <!-- active filters as removable chips -->
    </section>

    <section aria-label="Person list">
      <DataTable />
      <DataTablePagination />
    </section>
  </div>
</main>
```

**Tailwind class structure:**

```
// Page container
"p-6 space-y-6 max-w-7xl mx-auto"

// Page header
"flex items-center justify-between"

// h1
"text-3xl font-semibold tracking-[-0.02em] text-foreground"

// Filter section
"flex flex-col gap-2"

// Filter row (controls)
"flex flex-wrap items-center gap-3"

// Filter chips row
"flex flex-wrap items-center gap-2"  // only rendered when filters are active

// Table + pagination wrapper
"space-y-4"
```

**Responsive reflow:**

| Breakpoint | Behavior                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------- |
| ≥1024px    | Full DataTable with all columns                                                                   |
| 768–1023px | Priority columns only; secondary columns hidden; column toggle in table header                    |
| <768px     | Card stack: each row becomes a `<article>` card; `DataTablePagination` becomes "Load more" button |

**Spacing rhythm:**

- Page outer padding: `p-6` (24px) all sides.
- PageHeader to filters: `space-y-6` gap (24px) — major section break.
- Filter controls to filter chips: `gap-2` (8px) — they are logically one unit.
- Filter chips to DataTable: `space-y-4` (16px) — minor section break.
- DataTable to pagination: `space-y-4` (16px).

**Content density variants:**

On list pages, density affects row height and cell padding only (see Section 4). The page container padding does not change across density modes.

---

### 1.2 Detail Page

**Pages:** `/persons/[id]`, `/events/[id]`, `/sources/[id]`

**HTML landmark structure:**

```html
<main aria-label="{Entity name}">
  <div class="page-container">
    <!-- p-6 max-w-7xl mx-auto -->
    <nav aria-label="Breadcrumb">
      <!-- breadcrumb component -->
      …
    </nav>

    <header class="page-header">
      <!-- flex items-center justify-between pb-6 -->
      <h1>{Entity Name}</h1>
      <div class="action-buttons">
        <!-- flex items-center gap-2 -->
        <button variant="outline">Edit</button>
        <button variant="destructive">Delete</button>
      </div>
    </header>

    <!-- Desktop ≥1280px: two-column grid -->
    <div class="detail-layout">
      <section class="attributes-section" aria-label="Attributes">
        <AttributesCard />
      </section>

      <section class="tabs-section" aria-label="{Entity} details">
        <Tabs />
        <TabsContent />
      </section>
    </div>
  </div>
</main>
```

**Tailwind class structure:**

```
// Page container
"p-6 max-w-7xl mx-auto space-y-4"

// Page header (below breadcrumb)
"flex items-start justify-between pb-6"

// h1
"text-3xl font-semibold tracking-[-0.02em] text-foreground"

// Action buttons group
"flex items-center gap-2 shrink-0"

// Two-column layout (≥1280px)
"grid grid-cols-1 xl:grid-cols-[45%_55%] gap-6 items-start"

// AttributesCard column (sticky on large screens)
"xl:sticky xl:top-[calc(var(--topbar-height)+1.5rem)]"

// Tabs section
"min-w-0"  // prevents overflow in second column
```

**Responsive reflow:**

| Breakpoint | Layout                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------ |
| ≥1280px    | Two-column: AttributesCard (45%) left-sticky + TabBar/Content (55%)                              |
| 768–1279px | Single column: AttributesCard above TabBar above TabContent                                      |
| <768px     | Single column. Breadcrumb hidden (back arrow button). Tabs become horizontally scrollable strip. |

**Spacing rhythm:**

- Breadcrumb to page header: `space-y-1` (4px) — tightly grouped orientation block.
- Page header to detail layout: `pb-6` on header (24px) — clear break between identity and content.
- AttributesCard to TabBar: `gap-6` (24px) in two-column; `space-y-6` in single-column.
- TabBar to TabContent: `mt-4` (16px) — defined in Tabs component.
- TabContent internal padding: `p-0` — each tab content component manages its own padding.

**Note:** The `AttributesCard` sticky positioning allows the entity's primary attributes to remain visible while the user scrolls through tab content (Relations, Activity logs). This is the key ergonomic benefit of the two-column layout for Prof. Engel's data-dense research sessions.

---

### 1.3 Form Page (Create / Edit)

**Pages:** `/persons/new`, `/persons/[id]/edit`, `/events/new`, `/events/[id]/edit`, `/sources/new`, `/sources/[id]/edit`

**HTML landmark structure:**

```html
<main aria-label="Create Person">
  <div class="page-container">
    <!-- p-6 max-w-7xl mx-auto -->
    <nav aria-label="Breadcrumb">…</nav>

    <header class="page-header">
      <!-- pb-6 -->
      <h1>Neue Person</h1>
    </header>

    <form aria-label="Create person" class="form-container">
      <!-- max-w-2xl mx-auto: centered, narrower than page -->

      <fieldset class="field-group">
        <!-- Primary Information -->
        <legend>Grundlegende Informationen</legend>
        <!-- fields -->
      </fieldset>

      <fieldset class="field-group field-group-bordered">
        <!-- Date group -->
        <legend>Geburtsdatum</legend>
        <!-- PartialDateInput + CertaintySelector -->
      </fieldset>

      <details class="collapsible-group">
        <!-- Optional sections -->
        <summary>Namensvarianten</summary>
        <!-- PersonNameList -->
      </details>

      <footer class="form-footer">
        <!-- pt-6 border-t border-border -->
        <button variant="outline">Abbrechen</button>
        <button variant="default" type="submit">Person erstellen</button>
      </footer>
    </form>
  </div>
</main>
```

**Tailwind class structure:**

```
// Page container
"p-6 max-w-7xl mx-auto"

// Form container (centered, narrower)
"max-w-2xl mx-auto space-y-6"

// Standard FieldGroup (no border)
"space-y-4"

// Bordered FieldGroup (date groups, archival reference)
"rounded-md border border-border p-4 space-y-4"

// FieldGroup legend
"text-sm font-semibold text-foreground mb-4"

// Two-column field row (first name + last name)
"grid grid-cols-1 sm:grid-cols-2 gap-4"

// Form footer
"flex items-center justify-between pt-6 border-t border-border"
```

**Responsive reflow:**

| Breakpoint    | Behavior                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------- |
| ≥768px        | Two-column for short field pairs (first name + last name); date fields on one row             |
| <768px        | All fields stack single column                                                                |
| <768px footer | Sticky at viewport bottom: `fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4` |

**Spacing rhythm:**

- Page header to form: `pb-6` on header (24px).
- Between FieldGroups: `space-y-6` (24px) — major section breaks.
- Within FieldGroups: `space-y-4` (16px) — field-to-field.
- Label to input: `space-y-1.5` (6px) — tight coupling.
- Error message below input: `mt-1` (4px).
- Form footer separator: `pt-6 border-t border-border`.
- Cancel to Submit in footer: `justify-between` (Cancel left, Submit right).

**Progressive disclosure:**

| Section                               | Default state                         | Trigger                     |
| ------------------------------------- | ------------------------------------- | --------------------------- |
| Primary fields                        | Expanded                              | Always visible              |
| Date FieldGroups                      | Expanded                              | Always visible              |
| Name Variants / collapsible secondary | Collapsed (create) or Expanded (edit) | Click `<summary>` / chevron |
| Archival Reference (SourceForm)       | Expanded (create)                     | Click header                |

Maximum disclosure depth: one level. No nested disclosures.

---

### 1.4 Dashboard

**Pages:** `/dashboard`

**HTML landmark structure:**

```html
<main aria-label="Dashboard">
  <div class="page-container">
    <!-- p-6 max-w-7xl mx-auto space-y-8 -->
    <header>
      <h1>Dashboard</h1>
    </header>

    <section aria-label="Project statistics">
      <!-- 4-column stat card row -->
      <div class="stat-grid">…</div>
    </section>

    <div class="dashboard-columns">
      <!-- 2-column on desktop -->
      <section aria-label="Recent activity">
        <h2>Zuletzt bearbeitet</h2>
        <ActivityFeed />
      </section>

      <section aria-label="Quick actions">
        <h2>Schnellzugriff</h2>
        <QuickActionList />
      </section>
    </div>

    <!-- Future: Data Quality section -->
  </div>
</main>
```

**Tailwind class structure:**

```
// Page container
"p-6 max-w-7xl mx-auto space-y-8"

// Stat grid
"grid grid-cols-2 gap-4 md:grid-cols-4"

// Dashboard columns (activity + quick actions)
"grid grid-cols-1 gap-6 lg:grid-cols-2"

// Section heading (h2)
"text-xl font-semibold text-foreground mb-4"
```

**Responsive reflow:**

| Breakpoint | Layout                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------- |
| ≥1024px    | Stat cards 4-column; activity + quick actions side by side                                    |
| 768–1023px | Stat cards 2×2; activity above quick actions                                                  |
| <768px     | Stat cards 2×2; activity above quick actions; quick actions as horizontal scrollable chip row |

**Spacing rhythm:**

- Section-to-section: `space-y-8` (32px) — larger gap than other pages; dashboard is scanned not scrolled.
- Stat card internal: `p-5` (20px) — compact but not cramped.
- Stat card gap: `gap-4` (16px).

---

### 1.5 Settings Page

**Pages:** `/settings/event-types`, `/settings/relation-types`

**HTML landmark structure:**

```html
<main aria-label="Event Types Settings">
  <div class="page-container">
    <!-- p-6 max-w-7xl mx-auto -->
    <nav aria-label="Breadcrumb">…</nav>

    <header class="page-header pb-6">
      <h1>Ereignistypen</h1>
    </header>

    <section aria-label="Event types table">
      <InlineEditTable />
      <!-- DataTable variant with inline edit/delete -->
    </section>
  </div>
</main>
```

**Tailwind class structure:**

```
// Page container
"p-6 max-w-7xl mx-auto space-y-6"

// Page header
"flex items-center justify-between pb-6"
```

**Responsive reflow:** Settings tables remain tabular at all breakpoints (few columns, row-level actions). Action buttons stack vertically in table rows on mobile.

**Spacing rhythm:** Same as list page template. Settings pages have fewer sections so the `space-y-6` rhythm applies straightforwardly.

---

### 1.6 Auth Pages

**Pages:** `/auth/login`, `/auth/register`, `/auth/verify`, `/auth/forgot-password`, `/auth/reset-password`

**HTML landmark structure:**

```html
<body class="auth-layout">
  <!-- min-h-svh bg-background flex flex-col -->

  <div class="auth-controls">
    <!-- fixed top-4 right-4 flex gap-2 -->
    <LocaleSwitcher />
    <ThemeToggle />
  </div>

  <main class="auth-main">
    <!-- flex flex-1 items-center justify-center p-4 -->
    <div class="auth-card-wrapper">
      <!-- w-full max-w-sm space-y-6 -->
      <div class="brand-header">
        <!-- text-center -->
        <a href="/{locale}">
          <span class="brand-name">Evidoxa</span>
        </a>
      </div>

      <Card class="auth-card">
        <!-- p-8 rounded-xl border border-border shadow-sm -->
        <h1>{Page title}</h1>
        <form>…</form>
      </Card>

      <p class="auth-footer-link">
        <!-- text-sm text-center text-muted-foreground -->
        Already have an account? <a>Sign in</a>
      </p>
    </div>
  </main>
</body>
```

**Tailwind class structure:**

```
// Auth layout body
"min-h-svh bg-background flex flex-col"

// Locale/theme controls (fixed top-right)
"fixed top-4 right-4 z-50 flex items-center gap-2"

// Main centering wrapper
"flex flex-1 items-center justify-center p-4"

// Card + heading wrapper
"w-full max-w-sm space-y-6"

// Brand name heading
"text-2xl font-bold tracking-tight text-foreground text-center"

// Auth card
"w-full rounded-xl border border-border bg-card p-8 shadow-sm"

// Auth h1 (inside card)
"text-xl font-semibold text-foreground"

// Card description below h1
"text-sm text-muted-foreground mt-1 mb-6"

// Form inside card
"space-y-4"

// Submit button (full width)
"w-full"

// Footer link text
"text-center text-sm text-muted-foreground"
```

**Responsive reflow:** Auth pages are effectively mobile-first. The `max-w-sm` card (384px) scales to full viewport width on mobile with `p-4` outer padding. No responsive changes needed — the card is already narrow enough for all viewports.

**Spacing rhythm:**

- Brand name to card: `space-y-6` (24px).
- Card internal: `p-8` (32px) — more generous than app cards to create visual calm.
- Fields within card form: `space-y-4` (16px).
- h1 to description: `mt-1` (4px) — tight heading group.
- Description to first field: `mb-6` (24px) — clear break from intro text.
- Card to footer link: `space-y-6` (24px).

---

## 2. Composition Rules

### 2.1 Form Layout Patterns

**The canonical form grammar** applies to all entity forms (PersonForm, EventForm, SourceForm, RelationFormDialog):

```
FormContainer (max-w-2xl mx-auto space-y-6)
  ├── FieldGroup: Primary Information (space-y-4)
  │     ├── Two-column grid: [Short field] [Short field]
  │     └── Full-width: [Notes textarea]
  │
  ├── FieldGroup: Date (rounded-md border border-border p-4 space-y-4)
  │     └── Row: [Year input] [Month select] [Day input] [CertaintySelector]
  │
  ├── FieldGroup: Secondary Date (same pattern, for death date)
  │
  ├── CollapsibleSection: Name Variants / Archival Reference
  │     └── (collapsed by default in edit mode; expanded in create mode)
  │
  └── FormFooter (pt-6 border-t border-border)
        ├── [Cancel button — variant="outline", left]
        └── [Submit button — variant="default", right]
```

**Field grouping rules:**

- Group related fields under a `<fieldset>` with `<legend>`.
- Date fields (year + month + day + certainty) always live in a bordered `FieldGroup`: `rounded-md border border-border p-4`.
- Archival reference fields (archive, fond, series, item, folio) group in a collapsible bordered `FieldGroup`.
- Short field pairs (first name + last name; start year + end year) use a two-column grid on ≥768px.
- Long fields (notes, transcription, description) span the full width always.

**Label placement:**

- Label always above the field (never inline or placeholder-only).
- Label-to-field gap: `space-y-1.5` (6px) — tight coupling.
- Required indicator: `*` in `text-destructive`, `aria-hidden="true"`, after the label text.

**Error placement:**

- Field-level error: `mt-1 text-xs text-destructive flex items-center gap-1` directly below the field.
- The error message includes a `XCircle` icon (14px) for dual-channel encoding.
- The field border changes to `border-destructive ring-1 ring-destructive` simultaneously.
- Form-level server error: An `Alert variant="destructive"` above the first field, before any `FieldGroup`. Each error links to the offending field via fragment.

**Help text:**

- `text-xs text-muted-foreground mt-1` directly below the field (but above where error would appear).
- When an error is present, help text is hidden to prevent redundancy.
- Maximum one sentence (≤80 chars German).

**FormFooter:**

- `pt-6 border-t border-border mt-6` separates actions from form content.
- Cancel is left-aligned, Submit is right-aligned: `flex items-center justify-between`.
- On mobile (<768px): footer becomes `fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4`.

---

### 2.2 Table + Filter + Pagination

**The canonical list composition:**

```
ListPage
  ├── PageHeader (flex items-center justify-between)
  │     ├── h1
  │     └── Primary action button (+ New {Entity})
  │
  ├── FilterSection (flex flex-col gap-2)
  │     ├── FilterRow: [DataTableSearch] [Type Select] [Date inputs]
  │     └── FilterChipRow: [Type: Letter ×] [Clear all]  (only when filters active)
  │
  ├── DataTable
  │     ├── Header: [☐] [Column A] [Column B] [Column C] [Column D]
  │     └── Body rows (10 per page default)
  │
  └── DataTablePagination
        ├── [Left: "47 Personen" or "12 von 47 Personen"]
        └── [Right: [← Prev] [1 / 12] [Next →]]
```

**Composition rules:**

- `DataTableSearch` is always the first (leftmost) filter control.
- Entity-specific filter controls follow search, ordered by importance/frequency of use.
- When filters are active, a chip row appears below the filter controls — not inline. Each chip shows "FieldName: Value ×". A "Clear all" link ends the row.
- Filter state is persisted in URL search params (`?search=&type=letter&reliability=HIGH`) so searches are bookmarkable.
- The count text in pagination updates when filters are active: "12 von 47 Personen" / "12 of 47 Persons".
- Column sort indicators use 14px chevron icons: `text-muted-foreground` for the inactive direction, `text-foreground` for the active sort direction.
- Bulk selection toolbar appears as a floating overlay at the bottom of the viewport when ≥1 row is selected. It does not replace the pagination row.
- No zebra striping. Row separation via `border-b border-border` only.

---

### 2.3 Entity Detail Header + Tabs + Content

**The canonical detail page composition:**

```
DetailPage
  ├── Breadcrumb (nav)
  ├── PageHeader (flex items-start justify-between pb-6)
  │     ├── h1: {Entity name}
  │     └── [Edit button] [Delete button]
  │
  ├── DetailLayout (grid xl:grid-cols-[45%_55%] gap-6)
  │     ├── AttributesCard (xl:sticky xl:top-[calc(topbar-height+24px)])
  │     │     └── <dl> grid with <dt>/<dd> pairs + PropertyEvidence badges
  │     │
  │     └── TabsSection (min-w-0)
  │           ├── TabList: [Attributes] [Names] [Events] [Relations 12] [Evidence 5] [Activity]
  │           └── TabContent (mt-4)
  │                 └── (content of active tab)
  │
  └── (no outer footer — actions are in page header)
```

**Composition rules:**

- PageHeader always contains the `<h1>` (entity name) and action buttons (Edit, Delete).
- Edit and Delete are always in the top-right of the PageHeader — never at the bottom or inside the AttributesCard.
- AttributesCard always appears before the TabBar in DOM order (for keyboard and screen reader access in single-column layout).
- Tab order is fixed across all entity types (see components.md Section 14, canonical tab order table).
- Count badges on tab triggers are always visible, even when count is 0. Zero-count badges use `opacity-60`.
- The first tab (Attributes) is active by default. The active tab is reflected in the URL hash (`#relations`) for direct linking.
- Expanding a PropertyEvidence popover does not change tab state.
- The `AttributesCard` sticky top offset accounts for both `TopBar` height and 24px page padding: `calc(var(--topbar-height) + 1.5rem)`.

**Page header action button rules:**

- Edit button: `variant="outline"` — secondary prominence.
- Delete button: `variant="destructive"` — clear destructive intent.
- On mobile, buttons may be replaced by a "More actions" dropdown (ellipsis icon button) containing both actions.

---

### 2.4 Dialog Content Patterns

**Standard form dialog:**

```
Dialog (max-w-lg)
  ├── DialogHeader
  │     ├── DialogTitle: "Beziehung erstellen"
  │     └── DialogDescription: "Verknüpfen Sie zwei Entitäten mit einem typisierten Verhältnis."
  │
  ├── DialogBody (space-y-4)
  │     ├── [RelationTypeSelector]
  │     ├── [FromEntityDisplay or EntitySelector]
  │     ├── [ToEntitySelector]
  │     ├── [CertaintySelector]
  │     ├── [Notes input]
  │     └── CollapsibleSection: Evidence (collapsed by default)
  │
  └── DialogFooter (pt-6 border-t border-border flex justify-end gap-3)
        ├── [Cancel — variant="outline"]
        └── [Create Relation — variant="default"]
```

**Dialog content rules:**

- Dialog body: `space-y-4` between fields.
- Dialog footer: `flex justify-end gap-3` — right-aligned, Cancel before Submit.
- For dialogs with optional sections (temporal validity, evidence): use collapsible `<details>` / disclosure pattern, not separate tabs.
- Maximum dialog nesting: zero. A dialog must not open from within another dialog. If the workflow requires it, navigate to a full-page route instead.
- `Escape` closes the dialog. If the form is dirty, show an inline confirmation within the dialog: "You have unsaved changes. Discard?" — do not open a second AlertDialog.
- On successful submission, close the dialog first, then show the Sonner success toast.

**AlertDialog (destructive) content rules:**

```
AlertDialog (max-w-md)
  ├── AlertDialogHeader
  │     ├── AlertDialogTitle: "3 Personen löschen?"
  │     └── AlertDialogDescription: "Diese Aktion kann innerhalb von 30 Tagen rückgängig gemacht werden."
  │
  └── AlertDialogFooter (flex justify-end gap-3)
        ├── [Cancel — variant="outline", receives initial focus]
        └── [Delete — variant="destructive"]
```

- Body text names the count (n items), the entity type, and the recovery path explicitly.
- Cancel receives initial focus (keyboard safety).
- The destructive action button label is the verb only ("Löschen", "Delete") — never "Ja", "OK", "Confirm".

---

### 2.5 Empty State Placement

**In DataTable (no items / search returns zero):**

- The empty state renders inside the table's `<tbody>` area, replacing the rows.
- Outer container: `<tr><td colspan="{columnCount}"><EmptyState /></td></tr>`.
- Use the "table" variant: no illustration, heading + description + action button, `py-12 px-4 text-center`.
- For search-filtered empty: echo the query. "Keine Personen für 'Johann von Dal…'" with "Suche löschen" / "Clear search" link.
- For filter-combination empty: "Keine Ergebnisse für diese Filter." with "Alle Filter löschen" / "Clear all filters" link.

**In Tab content (tab has zero linked items):**

- The empty state renders inside the `TabsContent` panel, centered.
- Use the "tab panel" variant: no illustration, shorter heading + description + action button, `py-8 text-center`.
- Example: Relations tab, no relations. Heading: "Keine Beziehungen". Action: "Beziehung hinzufügen".

**In entity list page (no entities of this type yet):**

- The empty state renders as a full-page variant centered in the main content area below the PageHeader and filter section.
- Use the "full page" variant: illustration + heading + description + action button, `py-16 px-6 text-center`.
- The filter section is hidden when the empty state is active (no point filtering zero items). The PageHeader "New" button remains visible.

**Vertical centering rules:**

- In a table or tab panel with a fixed height: use `flex items-center justify-center` on the parent container to vertically center the empty state.
- In a full-page list: `py-16` provides ample breathing room without requiring explicit vertical centering.

---

## 3. Spacing Rhythm

Evidoxa uses a **4px base unit** throughout. All spacing values are multiples of 4px. The Tailwind default scale is used directly — no custom spacing tokens are defined.

### 3.1 The 4px Grid

| Tailwind class                | Value    | Pixels | Use                                                           |
| ----------------------------- | -------- | ------ | ------------------------------------------------------------- |
| `gap-1` / `space-y-1` / `p-1` | 0.25rem  | 4px    | Tightest coupling: icon-to-text in badge, list item indicator |
| `gap-1.5` / `space-y-1.5`     | 0.375rem | 6px    | Label to input (form fields)                                  |
| `gap-2` / `space-y-2`         | 0.5rem   | 8px    | Badge internal padding (py-0.5 px-2), filter chips row        |
| `gap-3` / `space-y-3`         | 0.75rem  | 12px   | Dialog footer gap between buttons                             |
| `gap-4` / `space-y-4`         | 1rem     | 16px   | Within-section field spacing, stat card gap                   |
| `gap-6` / `space-y-6`         | 1.5rem   | 24px   | Between sections, card padding, primary vertical rhythm       |
| `gap-8` / `space-y-8`         | 2rem     | 32px   | Dashboard section-to-section spacing                          |
| `p-3`                         | 0.75rem  | 12px   | Compact card padding (bulk toolbar, relation row)             |
| `p-4`                         | 1rem     | 16px   | FieldGroup border padding, compact card                       |
| `p-5`                         | 1.25rem  | 20px   | Stat card padding                                             |
| `p-6`                         | 1.5rem   | 24px   | Standard card padding, page container padding                 |
| `p-8`                         | 2rem     | 32px   | Auth card (generous, calm)                                    |

### 3.2 Padding Inside Cards

| Container                                        | Padding         | Token       |
| ------------------------------------------------ | --------------- | ----------- |
| Standard `Card` (AttributesCard, settings table) | `p-6`           | 24px        |
| Compact `Card` (stat card, relation row)         | `p-4`           | 16px        |
| `FieldGroup` (bordered date/reference sections)  | `p-4`           | 16px        |
| Auth `Card`                                      | `p-8`           | 32px        |
| DataTable cells                                  | `py-3 px-4`     | 12px / 16px |
| DataTable header cells                           | `py-3 px-4`     | 12px / 16px |
| Tooltip                                          | `px-3 py-1.5`   | 12px / 6px  |
| Badge (pill)                                     | `px-2 py-0.5`   | 8px / 2px   |
| Badge (chip)                                     | `px-1.5 py-0.5` | 6px / 2px   |

### 3.3 Between-Section Spacing

| Context                             | Class            | Gap  | Rationale                                     |
| ----------------------------------- | ---------------- | ---- | --------------------------------------------- |
| Dashboard top sections              | `space-y-8`      | 32px | Dashboard is scanned, not scrolled — more air |
| Form FieldGroup to FieldGroup       | `space-y-6`      | 24px | Major logical section break                   |
| List page: PageHeader to filters    | `space-y-6`      | 24px | Major section break                           |
| List page: filters to table         | `space-y-4`      | 16px | Minor section break                           |
| List page: table to pagination      | `space-y-4`      | 16px | Minor section break                           |
| Detail: PageHeader to detail layout | `pb-6` on header | 24px | Clear identity break                          |
| Detail: AttributesCard to Tabs      | `gap-6`          | 24px | Equivalent section weight                     |
| Field label to input                | `space-y-1.5`    | 6px  | Tight pairing — label belongs to input        |
| Input to error message              | `mt-1`           | 4px  | Error is a footnote to the field              |
| Tab bar to tab content              | `mt-4`           | 16px | Defined by Tabs component                     |

### 3.4 Typography Spacing

All typography utilities are defined as `@layer utilities` classes in `globals.css`. These classes should be applied via Tailwind's `text-*` scale utilities. Key spacing relationships:

| Style                                                       | Used for               | Size | Line height | Gap context               |
| ----------------------------------------------------------- | ---------------------- | ---- | ----------- | ------------------------- |
| `text-3xl font-semibold`                                    | Page `<h1>`            | 30px | 1.267       | `pb-6` below              |
| `text-2xl font-semibold`                                    | Card title `<h2>`      | 24px | 1.333       | `mb-4` below              |
| `text-xl font-medium`                                       | Section heading `<h3>` | 20px | 1.5         | `mb-3` below              |
| `text-sm font-medium`                                       | Labels, table headers  | 14px | 1.5         | `space-y-1.5` above input |
| `text-xs text-muted-foreground uppercase tracking-[0.08em]` | Overline (dt labels)   | 12px | 1.5         | `space-y-1` above value   |
| `text-xs text-muted-foreground`                             | Timestamps, captions   | 12px | 1.5         | `mt-1` below parent       |

---

## 4. Density Variants

Evidoxa supports three density modes: **Comfortable** (default), **Compact**, and **Spacious**. Density is toggled via a user preference stored in `localStorage` and applied as a data attribute on `<html>` (`data-density="compact|comfortable|spacious"`).

Density affects only **content density** (row heights, cell padding, form field heights), never structural spacing (page padding, between-section gaps, or card padding). This ensures the spatial grammar of the page remains consistent regardless of density.

### 4.1 Comfortable (default)

The baseline density. All specifications in this document describe comfortable mode.

| Element          | Height / Padding                      |
| ---------------- | ------------------------------------- |
| DataTable row    | `py-3 px-4` (28px row height approx.) |
| Button default   | `h-10 px-4` (40px)                    |
| Input            | `h-10 px-3 py-2.5` (40px)             |
| Sidebar nav item | `py-2.5 px-3` (10px / 12px)           |
| Tab trigger      | `py-2.5 px-4`                         |

### 4.2 Compact

For users who need maximum data density (e.g., Lukas's rapid post-archive data entry sessions reviewing hundreds of records).

| Element          | Comfortable → Compact      | Class change                |
| ---------------- | -------------------------- | --------------------------- |
| DataTable row    | `py-3` → `py-2`            | Row height reduces by ~8px  |
| DataTable cell   | `py-3 px-4` → `py-2 px-3`  |                             |
| Button default   | `h-10` → `h-8`             | Smaller height; `size="sm"` |
| Input            | `h-10 py-2.5` → `h-9 py-2` | 36px height                 |
| Sidebar nav item | `py-2.5` → `py-2`          |                             |
| Tab trigger      | `py-2.5` → `py-2`          |                             |
| Card default     | `p-6` → `p-4`              |                             |

Implementation: `data-density="compact"` on `<html>` triggers CSS overrides in `@layer base`:

```css
[data-density="compact"] .data-table-row {
  @apply px-3 py-2;
}
[data-density="compact"] .form-input {
  @apply h-9 py-2;
}
```

### 4.3 Spacious

For users who need larger touch targets or work in a more relaxed reading-oriented context (e.g., Prof. Engel reviewing student data on a large monitor).

| Element                 | Comfortable → Spacious    | Class change                 |
| ----------------------- | ------------------------- | ---------------------------- |
| DataTable row           | `py-3` → `py-4`           | Row height increases by ~8px |
| DataTable cell          | `py-3 px-4` → `py-4 px-5` |                              |
| Button default          | `h-10` → `h-11`           | 44px — minimum touch target  |
| Input                   | `h-10` → `h-11`           | 44px                         |
| Sidebar nav item        | `py-2.5` → `py-3`         |                              |
| Card default            | `p-6` → `p-8`             |                              |
| Form field-to-field gap | `space-y-4` → `space-y-5` |                              |

Implementation: `data-density="spacious"` on `<html>`.

### 4.4 What Density Does NOT Change

- Page container padding (`p-6`) — always 24px.
- Between-section gaps (`space-y-6`, `space-y-8`) — layout rhythm is constant.
- Typography scale — text sizes do not change across density modes.
- Card border radius — always `--radius-lg`.
- Color or shadow tokens — no visual hierarchy changes.

---

## 5. Cross-Reference Index

### 5.1 Page-to-Component Map

| Page / Feature             | Primary components                                                                                                              | Patterns used                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `/auth/login`              | `Card`, `Input`, `Button`, `Label`                                                                                              | Auth page template (1.6)                                |
| `/auth/register`           | `Card`, `Input`, `Button`, `Label`, `PasswordStrengthIndicator`                                                                 | Auth page template (1.6)                                |
| `/auth/verify`             | `Card`, `Button`, `Alert`                                                                                                       | Auth page template (1.6)                                |
| `/auth/forgot-password`    | `Card`, `Input`, `Button`, `Label`                                                                                              | Auth page template (1.6)                                |
| `/auth/reset-password`     | `Card`, `Input`, `Button`, `Label`, `PasswordStrengthIndicator`                                                                 | Auth page template (1.6)                                |
| `/dashboard`               | `Card`, `Avatar`, `Separator`, `Button`                                                                                         | Dashboard template (1.4)                                |
| `/persons`                 | `DataTable`, `DataTableSearch`, `DataTablePagination`, `Checkbox`, `Button`, `Badge`, `Empty State`, `Skeleton`                 | List page template (1.1), Table+Filter+Pagination (2.2) |
| `/persons/new`             | `Input`, `Textarea`, `Select`, `CertaintySelector`, `Button`, `Card`, `Alert`                                                   | Form page template (1.3), Form layout (2.1)             |
| `/persons/[id]`            | `EntityCard`, `Tabs`, `Badge`, `PropertyEvidence Badge`, `CertaintySelector`, `Button`, `Breadcrumb`, `Skeleton`, `Empty State` | Detail page template (1.2), Detail composition (2.3)    |
| `/persons/[id]/edit`       | Same as create form                                                                                                             | Form page template (1.3), Form layout (2.1)             |
| `/events`                  | Same as `/persons`                                                                                                              | List page template (1.1)                                |
| `/events/new`              | `Input`, `Textarea`, `Select`, `CertaintySelector`, `Button`, `Card` — adds EventType combobox                                  | Form page template (1.3), Form layout (2.1)             |
| `/events/[id]`             | Same as person detail + sub-event list                                                                                          | Detail page template (1.2)                              |
| `/sources`                 | `DataTable`, `Select` (reliability filter), `Button`, `Badge`, `Empty State`                                                    | List page template (1.1)                                |
| `/sources/new`             | `Input`, `Textarea`, `Select`, `Button`, `Card` — adds archival reference FieldGroup                                            | Form page template (1.3), Form layout (2.1)             |
| `/sources/[id]`            | Same as person detail                                                                                                           | Detail page template (1.2)                              |
| `/relations`               | `DataTable`, `Select` (type/certainty filters), `Badge` (certainty), `Empty State`                                              | List page template (1.1)                                |
| `/settings/event-types`    | `DataTable` (inline edit), `Input`, `Button`, `Breadcrumb`                                                                      | Settings page template (1.5)                            |
| `/settings/relation-types` | `DataTable`, `Dialog` (`RelationTypeFormDialog`), `Input`, `Button`, `Breadcrumb`                                               | Settings page template (1.5), Dialog content (2.4)      |
| `RelationFormDialog`       | `Dialog`, `Select`, `Combobox` (EntitySelector), `CertaintySelector`, `Input`, `Textarea`, `Button`                             | Dialog content patterns (2.4)                           |
| `BulkDeleteDialog`         | `AlertDialog`, `Button`                                                                                                         | Dialog content patterns (2.4)                           |
| Command palette            | `Command`, `Tooltip`, overlay scrim                                                                                             | Command palette component (components.md §12)           |
| AppShell                   | `Sidebar`, `TopBar`, `Separator`, `Tooltip`, `Avatar`                                                                           | Sidebar (§15), TopBar (§16)                             |

### 5.2 Token-to-Component Dependency Map

| CSS variable                      | Components consuming it                                                                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--color-primary`                 | Button (default), Tabs (active indicator), Sidebar (active border), CertaintySelector (focus ring), TopBar (focus ring), all focus rings              |
| `--color-primary-foreground`      | Button (default text)                                                                                                                                 |
| `--color-background`              | Auth page bg, Tooltip text                                                                                                                            |
| `--color-foreground`              | Body text everywhere, h1/h2/h3, Tooltip bg, DataTable cell text                                                                                       |
| `--color-card`                    | Card, DataTable rows, TopBar bg, Dialog close button hover                                                                                            |
| `--color-card-foreground`         | Text within cards                                                                                                                                     |
| `--color-popover`                 | Dialog, Popover, Command palette, Tooltip                                                                                                             |
| `--color-border`                  | All card borders, DataTable container border, Dialog border, Separator, Form footer top border, FieldGroup border                                     |
| `--color-input-border`            | Input, Textarea, Select trigger, Checkbox (unchecked), CertaintySelector (inactive button)                                                            |
| `--color-muted`                   | DataTable header bg, Skeleton, Badge (count), CertaintySelector (inactive bg)                                                                         |
| `--color-muted-foreground`        | Placeholders, captions, dt overline labels, inactive tab triggers, breadcrumb links, pagination count text, separator color, empty state illustration |
| `--color-accent`                  | Sidebar item hover/active bg, DataTable row hover, Command palette active item, Combobox option hover                                                 |
| `--color-accent-foreground`       | Text on accent backgrounds                                                                                                                            |
| `--color-ring`                    | Focus rings on all interactive elements                                                                                                               |
| `--color-destructive`             | Button (destructive variant), Alert (destructive), AlertDialog confirm button, Form field error border                                                |
| `--color-destructive-background`  | Alert banner, NetworkStatusIndicator (offline), Toast (error)                                                                                         |
| `--color-success-background`      | Toast (success), Alert (success)                                                                                                                      |
| `--color-warning-background`      | Toast (warning), Alert (warning), PropertyEvidence badge (warning state), NetworkStatusIndicator (degraded)                                           |
| `--color-info-background`         | Toast (info), Alert (info)                                                                                                                            |
| `--color-certainty-certain-*`     | CertaintySelector, CertaintyBadge (Certain level), PropertyEvidence badge background                                                                  |
| `--color-certainty-probable-*`    | CertaintySelector, CertaintyBadge (Probable level)                                                                                                    |
| `--color-certainty-possible-*`    | CertaintySelector, CertaintyBadge (Possible level)                                                                                                    |
| `--color-certainty-unknown-*`     | CertaintySelector, CertaintyBadge (Unknown level)                                                                                                     |
| `--color-certainty-unevidenced-*` | CertaintyBadge (Unevidenced level) — display only, never in selector                                                                                  |
| `--color-sidebar`                 | Sidebar bg                                                                                                                                            |
| `--color-sidebar-accent`          | Sidebar item active/hover                                                                                                                             |
| `--color-sidebar-border`          | Sidebar right border, Sidebar separators                                                                                                              |
| `--color-sidebar-ring`            | Sidebar nav item focus rings                                                                                                                          |
| `--radius-md`                     | Button, Input, Select trigger, Checkbox, Tooltip, Combobox option                                                                                     |
| `--radius-lg`                     | Card, Popover, standard Dialog content                                                                                                                |
| `--radius-xl`                     | Dialog (wider containers), Command palette, Auth card                                                                                                 |
| `--radius-full`                   | Avatar, Badge (pill), PropertyEvidence badge                                                                                                          |
| `--shadow-sm`                     | Auth card                                                                                                                                             |
| `--shadow-md`                     | Popover, Combobox dropdown, bulk toolbar                                                                                                              |
| `--shadow-lg`                     | Dialog, Command palette                                                                                                                               |
| `--sidebar-width-open`            | AppShell `padding-left` (expanded)                                                                                                                    |
| `--sidebar-width-collapsed`       | AppShell `padding-left` (collapsed)                                                                                                                   |
| `--topbar-height`                 | AppShell `padding-top`, Sidebar `top`, AttributesCard sticky `top`                                                                                    |
| `--duration-fast`                 | Hover backgrounds, focus ring appearance, tooltip delay                                                                                               |
| `--duration-normal`               | Sidebar collapse/expand, theme switch, tab panel transitions                                                                                          |
| `--duration-slow`                 | Dialog open, toast enter, popover appear                                                                                                              |
| `--ease-enter`                    | All enter animations (Dialog, Popover, Toast)                                                                                                         |
| `--ease-exit`                     | All exit animations                                                                                                                                   |
| `--ease-move`                     | Sidebar width transition, layout shifts                                                                                                               |

### 5.3 Related Patterns and Alternatives

| Pattern                   | Use this when                                                            | Alternative                                                        |
| ------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `Dialog`                  | Form that needs isolated focus; destructive confirmation                 | Full page route (when content is too large)                        |
| `Popover`                 | Field-level inline annotation (PropertyEvidence); entity search dropdown | Dialog (when content is a full form)                               |
| `Tooltip`                 | Supplementary label for icon; absolute timestamp                         | Popover (when content is interactive)                              |
| `DataTable`               | Paginated sortable entity list                                           | Simple `<ul>` list (when ≤8 items, no sort/pagination needed)      |
| `CertaintySelector`       | Certainty input in a form                                                | `CertaintyBadge` (for read-only display only)                      |
| `PropertyEvidence Badge`  | Field-level evidence annotation trigger                                  | `Alert` (for page-level evidence gaps, not field-level)            |
| `Skeleton`                | Initial page load placeholder                                            | `opacity-60` on existing content (for pagination/sort transitions) |
| `Empty State` (full page) | Entity list with zero items                                              | `Empty State` (tab panel) for secondary content areas              |
| `AlertDialog`             | Irreversible destructive action                                          | `Toast with Undo` (for reversible soft-delete operations)          |
| `Toast / Sonner`          | Completed action confirmation; undo opportunity                          | `Alert` (when status must persist; not auto-dismissing)            |
| Two-column detail layout  | ≥1280px entity detail page                                               | Single-column stacked (768–1279px)                                 |
| Breadcrumb                | Pages depth ≥2 (detail, edit, create)                                    | Back arrow button (mobile <768px)                                  |
| Sidebar (expanded)        | Desktop ≥1024px navigation                                               | Overlay drawer (tablet/mobile); bottom tab bar (mobile)            |
