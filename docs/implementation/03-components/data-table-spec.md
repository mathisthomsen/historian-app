# DataTable Component — Implementation Spec

**Date:** 2026-04-03
**Component files:**

- `src/components/ui/table.tsx` — shadcn primitives (TableHeader, TableHead, TableRow, TableCell, TableBody, TableFooter, TableCaption)
- `src/components/research/DataTable.tsx` — generic DataTable wrapper
- `src/components/research/DataTablePagination.tsx` — pagination controls
- `src/components/research/DataTableSearch.tsx` — debounced search input
- `src/components/research/PersonsListClient.tsx` — persons list consumer
- `src/components/research/SourceTable.tsx` — sources list consumer
- `src/app/[locale]/(app)/relations/_components/RelationsDataTable.tsx` — relations consumer
  **Design system source:** `docs/design-system/04-design-system/components.md` §13

---

## 1. Visual Spec

### 1.1 Table Container

The DataTable is wrapped by a container `<div>` inside the list-client components. That outer wrapper uses:

```
rounded-lg border border-border overflow-hidden
```

The `Table` primitive itself renders `<div class="relative w-full overflow-auto">` around a `<table class="w-full caption-bottom text-sm">`. No `bg-card` is applied at the primitive level; the card surface comes from the page/card component that hosts it.

### 1.2 TableHeader / TableHead (header row)

| Property           | Value                   | Token                      |
| ------------------ | ----------------------- | -------------------------- |
| Background         | `bg-muted/50`           | `--color-muted`            |
| Text color         | `text-muted-foreground` | `--color-muted-foreground` |
| Font size          | `text-xs`               | 12px                       |
| Font weight        | `font-medium`           | 500                        |
| Text transform     | `uppercase`             | —                          |
| Letter spacing     | `tracking-wide`         | ~0.05em                    |
| Cell height        | `h-10`                  | 40px                       |
| Horizontal padding | `px-4`                  | 16px                       |

The `TableHeader` already applies `[&_tr]:border-b` (border below the header row). The header row background `bg-muted/50` is applied to `TableHeader` (on `<thead>`), which covers the full row via CSS table layout.

### 1.3 TableRow (body rows)

| State      | Classes                                             |
| ---------- | --------------------------------------------------- |
| Default    | `border-b border-border`                            |
| Hover      | `hover:bg-muted/30`                                 |
| Selected   | `data-[state=selected]:bg-primary/10`               |
| Last row   | `[&:last-child]:border-0` (applied via `TableBody`) |
| Transition | `transition-colors`                                 |

### 1.4 TableCell (body cells)

| Property       | Value          |
| -------------- | -------------- |
| Padding        | `p-4`          |
| Vertical align | `align-middle` |

### 1.5 TableCaption

```
mt-4 text-sm text-muted-foreground
```

### 1.6 Sort Icons

| State             | Class                                                 |
| ----------------- | ----------------------------------------------------- |
| Inactive          | `text-muted-foreground opacity-30` (ChevronDown icon) |
| Active ascending  | `text-foreground` (ChevronUp icon)                    |
| Active descending | `text-foreground` (ChevronDown icon)                  |

### 1.7 Pagination Controls

`DataTablePagination` uses `Button variant="outline" size="sm"` for Prev/Next controls. Count text: `text-sm text-muted-foreground`.

### 1.8 Bulk Action Toolbar

When rows are selected, the selection toolbar appears inline (above the table). Token recipe per spec:

```
// Bulk toolbar container (inline variant, not fixed)
"flex items-center gap-2"

// Count label
"text-sm text-muted-foreground"

// Delete button: Button variant="destructive" size="sm"
```

The floating fixed toolbar recipe (for future implementation):

```
"fixed bottom-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-md"
```

### 1.9 Empty State

When `data.length === 0` and a `search` query is active, a centered paragraph is rendered:

```
py-8 text-center text-muted-foreground
```

When there is no search at all, a full empty-state block with action link is rendered.

### 1.10 Mobile (card stack)

Below the `sm` breakpoint (< 768px), the design spec calls for a card-stack layout. This is a future responsive variant; the current implementation uses `overflow-auto` on the table wrapper to allow horizontal scroll. No behavioral change in this implementation pass.

### 1.11 Striped Variant (optional)

When a `striped` prop is true, alternate body rows should receive `even:bg-muted/20`. This is additive to the default row classes.

### 1.12 Dark Theme

All tokens (`muted`, `muted-foreground`, `border`, `primary`) have dark-theme values defined in `globals.css @theme`. No additional dark-mode classes are needed; Tailwind v4 resolves via CSS custom properties.

---

## 2. Behavioral Spec

### 2.1 Keyboard Interaction

| Key      | Behavior                                                                          |
| -------- | --------------------------------------------------------------------------------- |
| `Tab`    | Moves focus into the table; focuses checkboxes, sort buttons, action links        |
| `Space`  | Toggles row checkbox when focused                                                 |
| `Enter`  | Navigates to entity detail page when row has `onRowClick` and focus is on the row |
| `Escape` | No built-in behavior at primitive level (handled by consuming component)          |

### 2.2 Screen Reader Announcements

- `<table>` should receive `aria-label` from the consuming component (e.g., `aria-label="Persons"`).
- Column header `<th scope="col">` with `aria-sort="ascending|descending|none"` for sorted columns.
- Row checkboxes: `aria-label="Select row {entity name}"`.
- Header checkbox: `aria-label="Select all"` (currently "Select all" — adequate).
- Selected rows: `aria-selected="true"` on `<tr>` (currently set via `data-state="selected"`; ARIA needs explicit attribute).

### 2.3 Focus Management

- Sort buttons inside `<th>` are focusable `<button type="button">` elements.
- Row checkboxes stop click propagation to prevent unintended row navigation.
- Row click targets exclude checkboxes (guarded by `target.tagName !== "INPUT"` check).

---

## 3. Integration Spec

### 3.1 Composition

```tsx
// Consumer pattern (PersonsListClient, SourceTable)
<div className="rounded-lg border border-border overflow-hidden">
  <DataTable
    data={rows}
    columns={columns}
    selectedIds={selectedIds}
    onSelectionChange={setSelectedIds}
    onRowClick={(id) => router.push(`/${locale}/persons/${id}`)}
  />
</div>

// Pagination below container
<DataTablePagination
  page={page}
  totalPages={totalPages}
  onPageChange={handlePageChange}
/>
```

Note: The current code renders `<DataTable>` directly without the `rounded-lg border border-border overflow-hidden` wrapper div. That wrapper should be added in the consuming components, but since it is present at the container level via `space-y-4`, the border+rounded treatment is the target state per spec.

### 3.2 Column Definition

```ts
interface ColumnDef<TData> {
  key: string;
  header: string;
  cell: (row: TData) => React.ReactNode;
  sortable?: boolean;
  currentSort?: string;
  currentOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
}
```

### 3.3 CSS Class API

Consumers may pass `className` to any primitive:

- `TableHead` — for custom column widths
- `TableCell` — for custom alignment or truncation
- `TableRow` — for striped alternate rows (add `even:bg-muted/20`)

---

## 4. Acceptance Criteria

### Primitives (`src/components/ui/table.tsx`)

- [ ] **AC-DT-01** `TableHeader` has `[&_tr]:border-b` class
- [ ] **AC-DT-02** `TableHead` has `h-10` class
- [ ] **AC-DT-03** `TableHead` has `px-4` class (not `px-2`)
- [ ] **AC-DT-04** `TableHead` has `text-left align-middle` classes
- [ ] **AC-DT-05** `TableHead` has `font-medium text-muted-foreground` classes
- [ ] **AC-DT-06** `TableHead` has `text-xs uppercase tracking-wide` classes
- [ ] **AC-DT-07** `TableRow` has `border-b` class
- [ ] **AC-DT-08** `TableRow` has `border-border` class (not just `border-b` without color)
- [ ] **AC-DT-09** `TableRow` has `hover:bg-muted/30` class
- [ ] **AC-DT-10** `TableRow` has `data-[state=selected]:bg-primary/10` class
- [ ] **AC-DT-11** `TableRow` has `transition-colors` class
- [ ] **AC-DT-12** `TableCell` has `p-4` class (not `p-2`)
- [ ] **AC-DT-13** `TableCell` has `align-middle` class
- [ ] **AC-DT-14** `TableCaption` has `mt-4 text-sm text-muted-foreground` classes
- [ ] **AC-DT-15** `TableHeader` background visually appears as `bg-muted/50` (applied to `<thead>`)

### DataTable component (`src/components/research/DataTable.tsx`)

- [ ] **AC-DT-16** Sort button has `inline-flex items-center gap-1` layout classes
- [ ] **AC-DT-17** Inactive sort icon has `opacity-30` class
- [ ] **AC-DT-18** Active sort icon does NOT have `opacity-30` class
- [ ] **AC-DT-19** Row with `onRowClick` gets `cursor-pointer` class
- [ ] **AC-DT-20** Row `data-state="selected"` is applied when row id is in `selectedIds`

### DataTablePagination (`src/components/research/DataTablePagination.tsx`)

- [ ] **AC-DT-21** Prev/Next buttons use `variant="outline"` (already correct — no change needed)
- [ ] **AC-DT-22** Page count uses `text-sm text-muted-foreground` (already correct)

### Accessibility

- [ ] **AC-DT-23** `<table>` passes axe-core with `aria-label` provided
- [ ] **AC-DT-24** Sort `<button>` elements inside `<th>` are keyboard focusable
- [ ] **AC-DT-25** Header checkbox has `aria-label="Select all"`
- [ ] **AC-DT-26** Row checkboxes have `aria-label` with row id
