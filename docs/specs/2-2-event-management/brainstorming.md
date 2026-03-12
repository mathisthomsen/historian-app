# Epic 2.2 — Event Management

## Brainstorming

**Goal:** Define every implementation detail so the specification leaves no ambiguity.

---

## Round 1 — Schema Changes & EventType Migration

### Q1 — How to migrate `event_type String?` → FK on `EventType`

The current `events` table has `event_type String?` (free text stub). Epic 2.2 adds an `EventType` table and converts this column to a FK. The migration needs a safe path that doesn't lose data.

```
Option A — Two-step migration
  1. Add EventType table + event_type_id FK (nullable)
  2. Drop old event_type String column
  Pro: Clean. No data mapping needed for an empty DB.
  Con: Two migrations.

Option B — Single migration, add FK nullable, keep old column
  Add event_type_id FK, keep event_type String as deprecated,
  remove in Epic 3.x cleanup.
  Pro: Backward compat with Epic 2.1 data.
  Con: Schema bloat; confusing duplicate columns.

Option C — Single migration: add FK, drop old column
  Pro: Clean in one go. Since we're in early dev and the DB
  has only seed data, no data loss risk.
  Con: None for a dev/rebuild scenario.
```

- [ ] Option A — Two-step migration
- [ ] Option B — Keep old column temporarily
- [x] Option C — **recommended** — Single migration: add `event_type_id String?` FK to EventType, drop old `event_type String?` column. Seed data is reset anyway (early dev DB, no real data).

---

### Q2 — EventType table: project-scoped or shared?

The roadmap says "user-defined per project". Confirm scope and structure.

```prisma
// Option A — project-scoped (roadmap-locked)
model EventType {
  id         String  @id @default(cuid())
  project_id String
  name       String
  color      String? // hex, e.g. "#4f46e5"
  icon       String? // Lucide icon name
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  project Project   @relation(...)
  events  Event[]
  @@unique([project_id, name])  // no duplicate names per project
  @@map("event_types")
}

// Option B — global shared types + per-project overrides
// Much more complex; no use case yet.
```

- [x] Option A — **recommended** — Project-scoped only. Matches roadmap "user-defined per project". Add `@@unique([project_id, name])` to prevent duplicate type names within a project.
- [ ] Option B — Global shared — out of scope for Phase 2.

---

### Q3 — Seeded default EventType records: where and how?

The roadmap says "Seeded defaults provided (Battle, Treaty, Birth, Death, etc.)." These must be per-project (since EventType is project-scoped), which means they can't be seeded in the DB seed script at the schema level — they must be created when a project is created or when the seed user's project is initialized.

```
Option A — Seed script inserts defaults into the demo project only
  The existing prisma/seed.ts inserts defaults for the demo project.
  New projects get no defaults.
  Pro: Simple. Works for MVP.

Option B — Default types injected on project creation
  When a new project is created (Epic 3.1), a service function
  seeds default EventTypes for that project. For now (Epic 2.1 scaffold),
  the seed script handles it for the demo project.
  Pro: Consistent UX — every project starts with useful defaults.
  Con: Logic in project creation (Epic 3.1), so must stub it now.

Option C — No seeded defaults, user creates all types
  Pro: Simplest.
  Con: Bad UX; user sees empty event type selector on first use.
```

- [x] Option B — **recommended** — Seed the demo project's EventTypes in `prisma/seed.ts` for now. Add a `seedDefaultEventTypes(projectId)` helper function that Epic 3.1 calls on project creation. This epic defines and calls it for the seed project only.

---

### Q4 — Soft-delete extension: Event model activation

Epic 2.1 established the Prisma client extension in `src/lib/db.ts` with stubs for event/source/relation. Epic 2.2 must activate the `event` model filter. Confirm the pattern is identical to `person`.

```typescript
// Already in db.ts from Epic 2.1 (stub pattern):
event: {
  findMany({ args, query }) {
    args.where = { deleted_at: null, ...args.where };
    return query(args);
  },
  findFirst({ args, query }) {
    args.where = { deleted_at: null, ...args.where };
    return query(args);
  },
},
```

- [x] **Confirmed** — activate the existing `event` stub in the Prisma extension. No design decision needed; this is mechanical. Document in the spec as a one-line change to `src/lib/db.ts`.

---

### Q5 — Location field: free-text only or Location FK in Epic 2.2?

The schema has both `location_id String?` (FK to Location) and `location String?` (free-text fallback). Epic 3.2 "wires" the FK to a Location autocomplete. For Epic 2.2:

```
Option A — Free text only in UI (same as birth_place in Epic 2.1)
  The location_id column exists in DB but the form only shows
  a free-text input that populates the `location` field.
  Pro: Consistent with Epic 2.1 pattern for birth_place.
  Con: location_id never set in Epic 2.2, but that's by design.

Option B — Expose location_id FK with basic autocomplete
  Create a Location search as part of Epic 2.2.
  Pro: Richer data from day one.
  Con: Scope creep; Location management is explicitly Epic 3.2.
```

- [x] Option A — **recommended** — Free-text `location` field only. `location_id` column remains nullable and unused until Epic 3.2. Matches the same pattern as `birth_place`/`death_place` on Person.

---

## Round 2 — Sub-Event Hierarchy & List Display

### Q6 — Sub-event display in the event list

Events can have a `parent_id` referencing another event. How should the list surface this hierarchy?

```
Option A — Flat list with hierarchy indicators
  All events in one flat table. Sub-events show:
  - Indented name with "└─" prefix
  - "Übergeordnet: [Parent Event]" badge in a column
  Con: Hard to implement with server-side pagination across
       hierarchical data. Sub-events would need special ordering.

Option B — Flat list; parent column shows parent name
  No indentation. A "Parent" column shows the parent event name
  (or "—" if it's a top-level event). Clicking the parent name
  navigates to the parent detail page.
  Pro: Simple, works with server-side pagination. No tree complexity.
  Con: Hierarchy not visually obvious.

Option C — Collapsible tree in list view
  Top-level events are expandable; clicking expands to show sub-events
  inline. Sub-events do not appear in the flat list by default.
  Pro: Clean hierarchy UX.
  Con: Requires client-side tree state; complex pagination behavior.
       Sub-events are hidden until user expands parent.

Option D — Two modes: tree view + flat list (toggle)
  User can switch between a hierarchical tree and a flat list.
  Con: Too much complexity for Phase 2 MVP.
```

- [x] Option B — **recommended** — Flat list with a "Übergeordnet" (Parent) column showing the parent event's title (linked). Sub-events appear in the same flat list, sortable and searchable normally. This keeps server-side pagination simple and is achievable in Phase 2. Tree view deferred to Phase 4/5.

---

### Q7 — Sub-event creation flow: inline from parent or separate form?

When a user wants to create a sub-event (an event that has a parent), how do they specify the parent?

```
Option A — Parent selector in the Create/Edit form (dropdown/autocomplete)
  The event form has a "Übergeordnet" field that lets users search
  and select any event in the project as the parent.
  The field is optional (null = top-level event).
  Pro: Consistent with other FK-like fields. Works for both create
       and edit flows (changing or removing a parent).

Option B — "Add sub-event" button on the event detail page
  From a parent event's detail page, user clicks "Unterereignis hinzufügen".
  This opens the create form with the parent_id pre-filled and locked.
  Pro: Contextual — user knows what parent they're in.

Option C — Both A and B
  Parent selector in form (Option A) + quick-add button on detail page
  that pre-fills the parent (Option B).
  Pro: Best UX.
  Con: Slightly more implementation effort.
```

- [x] Option C — **recommended** — Parent selector field in the create/edit form (combobox with search, optional), PLUS a "Unterereignis hinzufügen" button on the event detail page that opens the form with `parent_id` pre-filled. Both paths must work.

---

### Q8 — Maximum sub-event nesting depth

The schema allows arbitrary nesting (`parent_id` self-referential). Should the UI or API enforce a depth limit?

```
Option A — No depth limit (arbitrary nesting)
  Pro: Maximum flexibility.
  Con: UI breadcrumb chain can become unwieldy. Recursive queries
       could be expensive.

Option B — Depth limit of 1 (events and sub-events only; no sub-sub-events)
  The parent field only accepts top-level events (events with no parent).
  A sub-event cannot itself be a parent.
  Pro: Simple. Covers 99% of use cases (Battle → Skirmish, Treaty → Clause).
  Con: Edge cases where deeper nesting is needed (wars → campaigns → battles).

Option C — Depth limit of 2 (events, sub-events, sub-sub-events)
  Pro: Covers most real-world nesting needs.
  Con: Breadcrumb chain display gets complex at 3 levels.
```

- [x] Option B — **recommended** — Depth limit of 1 (parent can only be a top-level event). Enforced at the API layer: if a user tries to set `parent_id` to an event that itself has a `parent_id`, return a `400` error. This keeps the tree to exactly 2 levels and keeps queries simple. Revisit if real-world data shows need for deeper nesting.

## Comment: In case of the 400 the users needs to be informed tranpsarently on why his entry was denied, with an alert or tooltip, and give him feedback on what happened to the rest of the dataset he put in.

### Q9 — Sub-event display on the parent event detail page

On an event's detail page, sub-events should be listed. How?

```
Option A — Inline list below the main attributes (outside tabs)
  Sub-events listed as a "Unterereignisse" section with title + dates.
  Each is a link to the sub-event detail.

Option B — "Unterereignisse" tab in the tabbed interface
  Same tab pattern as the person detail page (Attribute / Unterereignisse / ...).

Option C — Both: count badge on tabs + inline list in Attribute tab
  Show "Unterereignisse (3)" tab AND a brief list in the main attribute view.
```

- [x] Option B — **recommended** — "Unterereignisse" tab in the tabbed detail interface (alongside Attribute, Personen, Quellen). Consistent with the tab pattern established in Epic 2.1. Shows a list of sub-events with title, date range, and a link to each. Empty state: "Keine Unterereignisse."

---

## Round 3 — Filters, Search & API Design

### Q10 — Which filters to expose in the event list

The roadmap says "filter by type, date range, location". Specify exactly.

```
Filter options:
  A — EventType filter (multi-select: show events of selected types)
  B — Date range filter (from-year to to-year; affects start_date or either date)
  C — Location text filter (free-text substring match on location field)
  D — Has parent filter (show only top-level events OR only sub-events)
  E — Certainty filter (show only events with start_date_certainty = X)

Which to implement in Epic 2.2?
```

- [x] Implement A + B + D in Epic 2.2. Skip C (location search is Epic 3.2) and E (certainty filter is secondary; add in Epic 5.2 data quality pass). D (has parent filter) is useful for seeing only top-level events in the list.

---

### Q11 — Date range filter: which date field to filter on?

Events have both `start_date` and `end_date`. A date range filter of "1800–1850" — which field should it target?

```
Option A — Filter on start_year only
  Event is "in range" if start_year ∈ [from, to].
  Simple. Covers most use cases.

Option B — Filter on start_year OR end_year (overlap)
  Event is "in range" if it overlaps the range
  (start_year <= to AND end_year >= from).
  Pro: Catches long-running events (e.g., WWI 1914–1918 returned for "1915–1916" query).
  Con: Slightly more complex SQL.

Option C — User chooses which field to filter
  Con: Adds a filter sub-option; too complex for Phase 2.
```

- [x] Option B — **recommended** — Overlap semantics: event overlaps the filter range if `start_year <= to_year AND (end_year IS NULL OR end_year >= from_year)`. This is the most useful behavior for historical research. Events with no `end_year` are treated as point-in-time events.

Comment: Make that transparent to the users (for example with an icon and a tooltip or other pattern that is in line with the designsystem)

---

### Q12 — API cache key design for event list

Following the person cache pattern: `person-list:{project_id}:{page}:{pageSize}:{search}:{sort}:{order}`.

```typescript
// Proposed event cache key:
`event-list:${projectId}:${page}:${pageSize}:${search}:${sort}:${order}:${typeIds}:${fromYear}:${toYear}:${topLevelOnly}`;

// typeIds is a sorted, joined list of selected EventType IDs
// e.g., "event-list:proj1:1:25::title:asc:::false"
```

- [x] **Confirmed** — Use the pattern above. Sort `typeIds` array before joining to prevent cache fragmentation (`["a","b"]` vs `["b","a"]`). TTL 60 s. Invalidated on any event or event_type write.

---

### Q13 — Event form: start/end date cascade behavior

If a user clears start_date (sets year to null), should end_date be automatically cleared too?

```
Option A — No cascade; user clears fields manually
  Pro: Maximum flexibility. User can have an end date with no start date
  (e.g., "event ended 1850, start unknown").
  Con: Unusual; most events are anchored by start date.

Option B — Cascade: clearing start_year also clears end_year (with warning)
  Similar to how clearing birth_month clears birth_day in Epic 2.1.
  Pro: Prevents invalid states.
  Con: Annoying if user wants to set end_date without start_date.

Option C — Allow end_date without start_date (no cascade), but warn in UI
  Show a yellow hint "Kein Startdatum gesetzt" if end_date exists without start.
  Pro: Flexible + informative.
```

- [x] Option A — **recommended** — No cascade. Allow end_date without start_date (valid for "ended before X" research notes). The UI should show the dates independently. API validation only rejects structurally invalid dates (month without year, day without month), not the absence of start when end is present.

---

## Round 4 — EventType Management UI & CRUD

### Q14 — Where does EventType CRUD live in the UI?

The roadmap says "CRUD for event types in project settings." Since the project settings UI is mostly Epic 3.1, where does this land in Epic 2.2?

```
Option A — Event types managed from a dedicated settings page
  Route: /settings/event-types
  Pro: Clean separation from the event list.
  Con: Requires some settings shell/nav (partial Epic 3.1 work).

Option B — Inline management within the event create/edit form
  "+" button next to the EventType selector opens a mini-modal
  to create a new type on the fly.
  Pro: Contextual; user creates types as needed.
  Con: Managing existing types (edit/delete) is awkward inline.

Option C — Dedicated "Ereignistypen" management page under settings
  Full CRUD page at /settings/event-types accessible from
  a "Einstellungen" link in the sidebar.
  Pro: Full management surface. Reusable by Epic 3.1.
  Con: Needs basic settings nav added to AppShell.

Option D — Both B (inline create) + C (management page)
  Create inline in form, manage (edit/delete) in settings page.
  Pro: Best UX.
```

- [x] Option D — **recommended** — Inline quick-create in the EventType selector (a "Neu erstellen: [typed name]" option in the combobox), plus a dedicated `/settings/event-types` management page for full CRUD (rename, recolor, delete). This epic adds the basic settings nav item to the AppShell sidebar for the event types page; full settings overhaul is Epic 3.1.

Comment: i think we should visually separate the settings from the primary data pages in the UI. What do you think? I would probably align the settings and other meta navigation items in the sidebar to the bottom and on mobile seperate the with a devidider from the rest.

---

### Q15 — EventType delete behavior: what happens to events using that type?

If a user deletes an EventType that has events associated with it:

```
Option A — Cascade: delete all events of that type
  Very dangerous; not acceptable.

Option B — Restrict: block deletion if any events use that type
  Return 409 Conflict with count of affected events.
  Pro: Safe. Standard referential integrity approach.
  Con: User must reassign all events before deleting the type.

Option C — Nullify: set event_type_id = null on all affected events
  Pro: Non-destructive — events remain, just lose their type.
  Con: Silent data change; user may not notice.

Option D — Restrict by default, offer "Reassign & delete" flow
  If blocked, show "X Ereignisse verwenden diesen Typ. Bitte zuerst
  neu zuweisen." with a link to filtered list of those events.
  Pro: Clear guidance, non-destructive.
```

- [x] Option B (Restrict) as the primary mechanism, with guidance text showing how many events are affected. The Prisma relation uses `onDelete: Restrict` for `event_type_id`. "Reassign & delete" UX flow deferred to Epic 5.2 bulk operations.

---

### Q16 — EventType color picker: free hex or predefined palette?

```
Option A — Free hex input
  User types any CSS hex value (e.g., "#4f46e5").
  Pro: Maximum flexibility.
  Con: Requires hex validation; no visual preview without extra component.

Option B — Predefined color palette (8–12 colors)
  Show a grid of clickable color swatches. No free input.
  Pro: Simple to implement; always produces valid hex values;
       consistent visual style in the event list.
  Con: Limited choice.

Option C — Predefined palette + "Custom" option (color input)
  Pro: Good defaults + flexibility.
  Con: Slightly more complex.
```

- [x] Option B — **recommended** — Predefined palette of 12 colors (matching the shadcn/ui color system). No free hex input in Epic 2.2. If research shows users need custom colors, add in Epic 5.3 polish pass. Keep it simple.

---

## Round 5 — Detail Page, Breadcrumb & Reuse of Components

### Q17 — Event detail page tabs

The roadmap says: "all attributes, sub-events list, related persons tab, related sources tab."

```
Proposed tab structure:
  [Attribute] [Unterereignisse] [Personen] [Quellen]

- Attribute: title, description, type (badge), start/end date with certainty,
             location (free text), notes, parent event link, created/updated meta.
- Unterereignisse: list of sub-events (title + dates + link). Populated in this epic.
- Personen: placeholder "Beziehungen werden in Epic 2.4 verfügbar" (same as persons epic).
- Quellen: same placeholder.

Epic 2.4 populates Personen/Quellen tabs, same pattern as Epic 2.1.
```

- [x] **Confirmed** — 4 tabs. Unterereignisse tab is populated in this epic (real data). Personen and Quellen tabs are placeholder text until Epic 2.4. Matches the established pattern.

---

### Q18 — Breadcrumb chain for sub-events

Sub-events (max depth 1) need to show their parent in the detail view.

```
Option A — "Übergeordnet: [Parent Title]" label in the Attribute tab
  A simple row in the attribute card showing the parent event with a link.
  Pro: Simple; consistent with other FK fields.

Option B — Full breadcrumb component in the page header
  "Ereignisse > World War I > Battle of Verdun"
  Pro: Better navigation context.

Option C — Both: breadcrumb header + parent row in attributes
  Con: Redundant.
```

- [x] Option A — **recommended** — "Übergeordnetes Ereignis" row in the Attribute tab (link to parent). Breadcrumb at the page header is a global navigation concern deferred to Epic 3.1/5.3. Consistent with how birth_location is shown on Person detail.

---

### Q19 — Which components from Epic 2.1 are directly reused vs. extended?

Clarify what's reused unchanged vs. what needs modifications.

```
Component               | Reuse Status
------------------------|---------------------------
CertaintySelector       | Reuse unchanged ✓
PartialDateInput        | Reuse unchanged ✓ (for start/end dates)
DataTable               | Reuse unchanged ✓
DataTablePagination     | Reuse unchanged ✓
DataTableSearch         | Reuse unchanged ✓
BulkDeleteDialog        | Reuse unchanged ✓ (parameterized with entity name)
PersonDetailTabs        | NOT reused — create EventDetailTabs (same pattern, different tabs)
PersonDetailCard        | NOT reused — create EventDetailCard
PersonForm              | NOT reused — create EventForm (different fields)
PersonNameList          | NOT applicable for events
```

- [x] **Confirmed** — Research components (CertaintySelector, PartialDateInput, DataTable, Pagination, Search, BulkDeleteDialog) are reused as-is. Event-specific components (EventForm, EventDetailCard, EventDetailTabs) are new. The EventDetailTabs follows the same structural pattern as PersonDetailTabs.

---

### Q20 — EventType selector in the form: combobox or simple select?

```
Option A — Simple <select> / shadcn Select
  Dropdown of all event types for the project.
  Pro: Simple; works well when types are few (< 20).
  Con: No inline create; no search for long lists.

Option B — Combobox with search + inline create
  shadcn Combobox. Type to filter. "Neu erstellen: [typed]" option
  appears when typed value doesn't match existing type.
  Pro: Best UX for power users. Covers the inline-create need from Q14.
  Con: More implementation effort.
```

- [x] Option B — **recommended** — Combobox (shadcn Command + Popover pattern). Filter existing types by typing. Show "Neu erstellen: '[typed name]'" option at the bottom when the typed value has no exact match. Clicking it creates the EventType inline (POST /api/event-types) and selects it. This covers Q14's inline-create requirement.

---

## Round 6 — API Contract, Testing, i18n & Out-of-Scope

### Q21 — EventType API: separate router or nested under events?

```
Option A — Separate /api/event-types routes
  GET /api/event-types?projectId=          — list for project
  POST /api/event-types                    — create
  PUT /api/event-types/[id]               — update
  DELETE /api/event-types/[id]            — delete

Option B — Nested under events: /api/events/types/...
  Semantically correct (types belong to events) but unusual REST convention.

Option C — Under project settings: /api/projects/[id]/event-types
  More RESTfully correct; requires project ID in path.
  Con: Not how other routes are shaped in this app.
```

- [x] Option A — **recommended** — Flat `/api/event-types` routes. Consistent with how `/api/persons` is shaped. All routes scoped by `project_id` from session (same as person routes). No `projectId` in the path.

---

### Q22 — How many E2E tests for this epic?

Following Epic 2.1's pattern of 12 E2E tests, define the event-specific test cases.

```
Proposed test cases for e2e/events.spec.ts:
  TC-E-01: Create a top-level event with title, EventType, start year (PROBABLE)
  TC-E-02: Create a sub-event linked to a parent event
  TC-E-03: View event detail — breadcrumb/parent shown, sub-events tab populated
  TC-E-04: Edit event — change EventType, update start date certainty
  TC-E-05: Delete event from detail page → soft-deleted, not in list
  TC-E-06: Bulk select 2 events → confirm delete → both removed
  TC-E-07: Filter list by EventType → only events of that type shown
  TC-E-08: Filter list by date range (1800–1850) → correct events shown
  TC-E-09: Filter "only top-level" → sub-events hidden
  TC-E-10: Search by event title → matching event found
  TC-E-11: Create EventType inline from event form combobox
  TC-E-12: EventType settings page: create, rename, delete (blocked if in use)
  TC-E-13: Pagination: 26 events → navigate to page 2
  TC-E-14: Sort by title asc/desc
```

- [x] **14 E2E tests** — slightly more than Epic 2.1 due to EventType management and filter complexity.

---

### Q23 — i18n namespace: extend `persons.*` or new `events.*`?

- [x] New `events.*` namespace in `de.json` / `en.json`. Do NOT extend the persons namespace. Reuse `persons.certainty.*` values? No — duplicate them under `events.certainty.*` to allow independent translation. The `CertaintySelector` component takes labels as props, so the caller supplies translated strings. Similarly for `event_types.*` sub-namespace.

---

### Q24 — What is explicitly out of scope for Epic 2.2?

Confirm boundaries to prevent scope creep.

```
Out of scope:
  - Location FK wiring (event.location_id autocomplete) → Epic 3.2
  - Relations tabs (Personen/Quellen) full content → Epic 2.4
  - PropertyEvidence UI for event fields → Epic 2.4
  - PostgreSQL tsvector full-text search on events → Epic 4.1
  - Timeline visualization → Epic 4.2
  - CSV/XLSX import of events → Epic 3.4
  - CSV export of events → Epic 5.1
  - Duplicate detection for events → Epic 5.2
  - Activity log for event CRUD → Epic 4.4
  - Event type management UI full settings panel → Epic 3.1
    (basic /settings/event-types page IS in scope for Epic 2.2)
  - LiteratureEvidence → Epic 3.3
```

- [x] **Confirmed** — boundaries above are locked for this epic.

---
