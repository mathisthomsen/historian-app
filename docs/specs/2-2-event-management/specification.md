# Epic 2.2 — Event Management

## Specification

**Phase:** 2 — Core Research Loop
**Deliverable:** Full CRUD for events with hierarchical sub-events, EventType taxonomy, date uncertainty, and location fields.
**Verifiable:** Create a parent event (WWI), add a sub-event with a color-coded event type, filter the list by type and date range, view hierarchy, bulk delete.

---

## 1. Technology Stack

No new packages required. All dependencies (shadcn/ui, react-hook-form, zod, next-intl, prisma, sanitize-html) are already installed from Epics 2.1 and earlier.

---

## 2. Data Model / Schema

### 2.1 New table: `EventType`

```prisma
model EventType {
  id         String @id @default(cuid())
  project_id String
  name       String
  color      String? // one of the 12 predefined palette hex values
  icon       String? // Lucide icon name (optional)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  project Project   @relation(fields: [project_id], references: [id], onDelete: Cascade)
  events  Event[]

  @@unique([project_id, name]) // no duplicate names within a project
  @@index([project_id])
  @@map("event_types")
}
```

Add to `Project` model relations:

```prisma
event_types EventType[]
```

### 2.2 Migration: replace `event_type String?` with FK

Single migration (no intermediate step — seed data is reset):

1. Create `event_types` table.
2. Add `event_type_id String?` to `events`.
3. Add FK: `event_type_id → event_types.id` with `onDelete: Restrict`.
4. Drop column `event_type String?` from `events`.

Updated `Event` model (relevant diff):

```prisma
model Event {
  // ... existing fields ...

  // REMOVED: event_type  String?
  // ADDED:
  event_type_id String?

  // ... rest unchanged ...

  event_type EventType? @relation(fields: [event_type_id], references: [id], onDelete: Restrict)
}
```

### 2.3 Soft-delete extension

Activate the `event` model stub in the Prisma client extension in `src/lib/db.ts`. This is the only change to `db.ts` — the stub pattern was established in Epic 2.1:

```typescript
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

### 2.4 Seed data

Add to `prisma/seed.ts`:

```typescript
export async function seedDefaultEventTypes(projectId: string) {
  const defaults = [
    { name: "Schlacht", color: "#dc2626" }, // red
    { name: "Vertrag", color: "#2563eb" }, // blue
    { name: "Geburt", color: "#16a34a" }, // green
    { name: "Tod", color: "#4b5563" }, // gray
    { name: "Herrschaft", color: "#7c3aed" }, // violet
    { name: "Krieg", color: "#ea580c" }, // orange
    { name: "Krönung", color: "#ca8a04" }, // yellow
    { name: "Versammlung", color: "#0891b2" }, // cyan
  ];
  for (const d of defaults) {
    await db.eventType.upsert({
      where: { project_id_name: { project_id: projectId, name: d.name } },
      update: {},
      create: { project_id: projectId, ...d },
    });
  }
}
```

Call `seedDefaultEventTypes(demoProject.id)` from the main seed script.
**Epic 3.1** calls the same function on every new project creation.

### 2.5 Predefined color palette

The 12 palette hex values available in the EventType form:

| Swatch | Hex       | Tailwind approx |
| ------ | --------- | --------------- |
| Red    | `#dc2626` | red-600         |
| Orange | `#ea580c` | orange-600      |
| Amber  | `#d97706` | amber-600       |
| Yellow | `#ca8a04` | yellow-600      |
| Green  | `#16a34a` | green-600       |
| Teal   | `#0d9488` | teal-600        |
| Cyan   | `#0891b2` | cyan-600        |
| Blue   | `#2563eb` | blue-600        |
| Indigo | `#4338ca` | indigo-700      |
| Violet | `#7c3aed` | violet-600      |
| Pink   | `#db2777` | pink-600        |
| Gray   | `#4b5563` | gray-600        |

---

## 3. API Contract

All API routes:

- Require valid session (`requireUser()`)
- Return `Content-Type: application/json`
- Return `Cache-Control: no-store`
- Apply `sanitize()` to all user-supplied text fields before DB write

### 3.1 Events

#### `GET /api/events`

**Query params:**

```typescript
interface EventListQuery {
  page?: string; // default "1"
  pageSize?: string; // default "25", max 100
  search?: string; // ILIKE match on title
  sort?: "title" | "start_year" | "created_at"; // default "start_year"
  order?: "asc" | "desc"; // default "asc"
  typeIds?: string; // comma-separated EventType IDs (multi-select filter)
  fromYear?: string; // integer; date range filter start
  toYear?: string; // integer; date range filter end
  topLevelOnly?: string; // "true" → exclude sub-events (parent_id IS NOT NULL)
}
```

**Date range filter (overlap semantics):**

```sql
WHERE start_year <= :toYear
  AND (end_year IS NULL OR end_year >= :fromYear)
```

Only applied when `fromYear` or `toYear` is present. If only one is provided, filter on that bound only.

**Response `200`:**

```typescript
interface EventListResponse {
  data: EventSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface EventSummary {
  id: string;
  title: string;
  event_type: { id: string; name: string; color: string | null } | null;
  start_year: number | null;
  start_month: number | null;
  start_day: number | null;
  start_date_certainty: "CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";
  end_year: number | null;
  end_month: number | null;
  end_day: number | null;
  end_date_certainty: "CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";
  location: string | null;
  parent: { id: string; title: string } | null; // null if top-level event
  _count: { sub_events: number };
  created_at: string; // ISO 8601
}
```

**Cache key:** `event-list:{projectId}:{page}:{pageSize}:{search}:{sort}:{order}:{sortedTypeIds}:{fromYear}:{toYear}:{topLevelOnly}`

- `sortedTypeIds`: `typeIds` array sorted alphabetically then joined with `,` (prevents cache fragmentation)
- TTL: 60 s
- Invalidated on any write to `events` or `event_types` for this project

**Errors:** `401`, `400` (invalid params)

---

#### `POST /api/events`

**Request body:**

```typescript
interface CreateEventInput {
  project_id: string;
  title: string;
  description?: string;
  event_type_id?: string;
  start_year?: number;
  start_month?: number; // 1–12; requires start_year
  start_day?: number; // 1–31; requires start_month
  start_date_certainty?: "CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";
  end_year?: number;
  end_month?: number; // 1–12; requires end_year
  end_day?: number; // 1–31; requires end_month
  end_date_certainty?: "CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";
  location?: string; // free text
  parent_id?: string; // FK to another event; depth validated at API
  notes?: string;
}
```

**Validation rules:**

- `title` must be non-empty (min 1 char after trim)
- `start_month` only valid if `start_year` is present
- `start_day` only valid if `start_month` is present
- Same constraints for `end_*`
- `parent_id` validation: fetch the referenced event; if it has a non-null `parent_id`, return `400` with:
  ```json
  {
    "error": "DEPTH_LIMIT_EXCEEDED",
    "message": "Das gewählte Ereignis ist selbst ein Unterereignis und kann keine eigenen Unterereignisse haben.",
    "parent_title": "<title of the selected parent>"
  }
  ```
  The form must display this error inline (not as a toast) next to the parent selector field, leaving all other field values intact.
- `event_type_id` must belong to the same project; return `400` if not.

**Response `201`:** Full `EventDetail` object (see `GET /api/events/[id]`).
**Side-effects:** Invalidate `event-list:{project_id}:*`.
**Errors:** `400`, `401`, `403`

---

#### `GET /api/events/[id]`

**Response `200`:**

```typescript
interface EventDetail extends EventSummary {
  description: string | null;
  notes: string | null;
  created_by_id: string | null;
  updated_at: string;
  sub_events: EventSummary[]; // populated list (depth 1 only)
  // Relation counts — content populated by Epic 2.4
  _count: {
    relations_from: number;
    relations_to: number;
  };
}
```

**Errors:** `401`, `403`, `404` (not found or soft-deleted)

---

#### `PUT /api/events/[id]`

Accepts same shape as `CreateEventInput` (all fields optional). Same validation rules as POST.

**Response `200`:** Updated `EventDetail`.
**Side-effects:** Invalidate `event-list:{project_id}:*`.
**Errors:** `400`, `401`, `403`, `404`

---

#### `DELETE /api/events/[id]`

Soft-delete (`deleted_at = now()`). Cannot delete a parent event if it has active sub-events — return `409` with:

```json
{
  "error": "HAS_SUB_EVENTS",
  "message": "Dieses Ereignis hat {count} Unterereignisse. Bitte diese zuerst löschen oder einem anderen Ereignis zuordnen.",
  "count": 3
}
```

**Response `200`:** `{ "deleted": true }`.
**Side-effects:** Invalidate `event-list:{project_id}:*`.
**Errors:** `401`, `403`, `404`, `409`

---

#### `POST /api/events/bulk`

```typescript
interface BulkEventInput {
  ids: string[];
  action: "delete";
}
```

If any ID belongs to a parent event with active sub-events, that ID is skipped and reported in the response (not a hard failure):

```typescript
interface BulkEventResponse {
  deleted: number;
  skipped: { id: string; reason: "HAS_SUB_EVENTS" }[];
}
```

**Validation:** `ids` non-empty, max 500, all from same project.
**Side-effects:** Invalidate `event-list:{project_id}:*`.
**Errors:** `400`, `401`, `403`

---

### 3.2 EventTypes

#### `GET /api/event-types`

```typescript
// Query params
{ projectId?: string } // derived from session if omitted

// Response 200
interface EventTypeListResponse {
  data: EventType[];
}
interface EventType {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  event_count: number; // number of non-deleted events using this type
}
```

No pagination (event types per project are expected to be < 100). No cache (settings page; always fresh).

---

#### `POST /api/event-types`

```typescript
interface CreateEventTypeInput {
  name: string; // required; trimmed; unique per project
  color?: string; // must be one of the 12 predefined hex values
  icon?: string; // Lucide icon name; optional
}
```

**Validation:** `name` non-empty; `color` must be in the palette (if provided); `@@unique([project_id, name])` violation → `409`.

**Response `201`:** `EventType` object.
**Errors:** `400`, `401`, `403`, `409` (duplicate name)

---

#### `PUT /api/event-types/[id]`

Same shape as `CreateEventTypeInput`. Full update.
**Response `200`:** Updated `EventType`.
**Errors:** `400`, `401`, `403`, `404`, `409`

---

#### `DELETE /api/event-types/[id]`

**Restriction:** If `event_count > 0`, return:

```json
{
  "error": "TYPE_IN_USE",
  "message": "Dieser Ereignistyp wird von {count} Ereignissen verwendet. Bitte diese Ereignisse zuerst einem anderen Typ zuordnen.",
  "count": 5,
  "filter_url": "/events?typeIds={id}"
}
```

`filter_url` is returned so the client can navigate directly to the filtered event list.

**Response `200`:** `{ "deleted": true }`.
**Errors:** `401`, `403`, `404`, `409`

---

## 4. Component Architecture

```
src/
  app/[locale]/(app)/
    events/
      page.tsx                          # Server Component — event list
      new/
        page.tsx                        # Server Component shell
      [id]/
        page.tsx                        # Server Component — event detail
        edit/
          page.tsx                      # Server Component shell

    settings/
      event-types/
        page.tsx                        # Server Component — EventType management

  app/api/
    events/
      route.ts                          # GET list, POST create
      [id]/
        route.ts                        # GET, PUT, DELETE
      bulk/
        route.ts                        # POST bulk delete
    event-types/
      route.ts                          # GET list, POST create
      [id]/
        route.ts                        # PUT, DELETE

  components/
    research/
      # REUSED UNCHANGED from Epic 2.1:
      CertaintySelector.tsx
      PartialDateInput.tsx
      DataTable.tsx
      DataTablePagination.tsx
      DataTableSearch.tsx
      BulkDeleteDialog.tsx

      # NEW for Epic 2.2:
      EventForm.tsx                     # Client — create/edit form
      EventDetailCard.tsx               # Server — attribute display
      EventDetailTabs.tsx               # Client — tab switcher
      EventTypeCombobox.tsx             # Client — searchable type selector with inline create
      EventTypeColorPicker.tsx          # Client — 12-swatch palette picker
      EventFilters.tsx                  # Client — type + date range + top-level-only filters
      DateRangeFilterInfo.tsx           # Client — info icon + tooltip (overlap semantics)
      EventTypeSettingsTable.tsx        # Client — CRUD table on settings page

    shell/
      AppShell.tsx                      # MODIFIED — add settings section to sidebar

  types/
    event.ts                            # EventSummary, EventDetail, CreateEventInput
    event-type.ts                       # EventType
```

### Component interfaces

```typescript
// EventForm.tsx
interface EventFormProps {
  mode: "create" | "edit";
  initial?: EventDetail;
  projectId: string;
  defaultParentId?: string; // pre-filled when opened from parent detail page
  onSuccess: (event: EventDetail) => void;
}

// EventTypeCombobox.tsx
interface EventTypeComboboxProps {
  projectId: string;
  value: string | null; // selected EventType ID
  onChange: (id: string | null) => void;
  onTypeCreated?: (type: EventType) => void;
}

// EventTypeColorPicker.tsx
interface EventTypeColorPickerProps {
  value: string | null; // hex
  onChange: (hex: string) => void;
}

// EventFilters.tsx
interface EventFiltersProps {
  typeIds: string[];
  fromYear: number | null;
  toYear: number | null;
  topLevelOnly: boolean;
  availableTypes: EventType[];
  onChange: (filters: EventFilterState) => void;
}
interface EventFilterState {
  typeIds: string[];
  fromYear: number | null;
  toYear: number | null;
  topLevelOnly: boolean;
}

// EventDetailTabs.tsx
interface EventDetailTabsProps {
  event: EventDetail;
  locale: string;
}
```

### Server vs. Client boundary

| Component                       | Type   | Reason                                      |
| ------------------------------- | ------ | ------------------------------------------- |
| `events/page.tsx`               | Server | Reads searchParams; calls Prisma directly   |
| `events/new/page.tsx`           | Server | Shell; passes projectId + optional parentId |
| `events/[id]/page.tsx`          | Server | Fetches event data SSR                      |
| `events/[id]/edit/page.tsx`     | Server | Prefetches event, passes to form            |
| `settings/event-types/page.tsx` | Server | Fetches event type list SSR                 |
| `EventForm.tsx`                 | Client | react-hook-form requires browser            |
| `EventDetailTabs.tsx`           | Client | Tab state                                   |
| `EventTypeCombobox.tsx`         | Client | Combobox state + inline create fetch        |
| `EventTypeColorPicker.tsx`      | Client | Swatch selection state                      |
| `EventFilters.tsx`              | Client | Filter state → URL params                   |
| `EventDetailCard.tsx`           | Server | Static attribute display                    |
| `EventTypeSettingsTable.tsx`    | Client | Inline edit/delete with optimistic UI       |
| `DateRangeFilterInfo.tsx`       | Client | Tooltip (requires browser)                  |

---

## 5. UI/UX Specification

### 5.1 Sidebar — Settings Section

The AppShell sidebar is modified to add a visually separated settings section. Settings nav items are pushed to the bottom using `mt-auto` and separated from primary data navigation by a `<Separator />` (shadcn).

```
┌────────────────────┐
│ Evidoxa            │  ← project name / logo
├────────────────────┤
│ 👥 Personen        │  ← primary data nav (top section)
│ 📅 Ereignisse      │
│ 📄 Quellen         │
│ 🔗 Beziehungen     │
│                    │
│ (flex-grow space)  │
├────────────────────┤  ← <Separator /> divides primary from settings
│ ⚙ Ereignistypen   │  ← settings nav (bottom section)
└────────────────────┘
```

On mobile (bottom navigation sheet): same divider pattern — data items first, settings items below the divider.

This pattern is established in Epic 2.2 as the canonical sidebar structure. Epic 3.1 extends it with more settings items (project settings, member management).

---

### 5.2 Event List Page (`/[locale]/events`)

URL params: `?page=1&search=&sort=start_year&order=asc&typeIds=&fromYear=&toYear=&topLevelOnly=false`

```
┌──────────────────────────────────────────────────────────────────────┐
│ AppShell                                                             │
├──────────────────────────────────────────────────────────────────────┤
│ Ereignisse                                         [+ Neues Ereignis]│
│                                                                      │
│ [🔍 Nach Titel suchen...    ] [Typ ▼] [Zeitraum: von — bis] [⊕] [☰]│
│                                                       ↑ info tooltip  │
│ [☐ Nur Hauptereignisse]                                              │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ ☐ │ Titel ↑ │ Typ       │ Beginn    │ Ende │ Übergeordnet │ … │ │
│ ├──────────────────────────────────────────────────────────────────┤ │
│ │ ☐ │ Weltkrieg I │ 🟠 Krieg │ 1914     │ 1918 │ —           │ … │ │
│ │ ☐ │ Verdun      │ 🔴 Schla.│ Feb 1916 │ Dez … │ Weltkrieg I│ … │ │
│ │ ☐ │ Versailles  │ 🔵 Vertr.│ 1919     │ —    │ —           │ … │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│                       [< Zurück]  Seite 1 / 4  [Weiter >]           │
└──────────────────────────────────────────────────────────────────────┘
```

**Date range filter tooltip (⊕ info icon):**
Hovering/clicking the info icon next to the date range filter shows a tooltip:

> "Zeigt Ereignisse, die sich zeitlich mit dem gewählten Bereich überschneiden. Ereignisse ohne Enddatum gelten als Einzelereignisse." (EN: "Shows events that overlap with the selected date range. Events without an end date are treated as point-in-time events.")

The tooltip uses the shadcn `Tooltip` component pattern already used in the app.

**EventType column:** Colored dot (filled circle in the type's color) + type name, truncated to 10 chars with ellipsis.

**"Übergeordnet" column:** Parent event title as a link to the parent detail page. "—" for top-level events.

**Filters:**

- **Typ:** shadcn Popover with checkboxes for each EventType (multi-select). Shows colored dot + name. Badge shows count if any types selected.
- **Zeitraum:** Two number inputs (Von / Bis) for year range. Changes update URL params. The `⊕` info icon triggers tooltip explaining overlap semantics (see above).
- **Nur Hauptereignisse:** Checkbox (unchecked = show all; checked = `topLevelOnly=true`).

**Empty state:** "Noch keine Ereignisse. [Erstes Ereignis anlegen]"
**Loading:** Table skeleton (5 placeholder rows).

---

### 5.3 Create / Edit Event Form

Max-width 2xl, centered.

```
┌──────────────────────────────────────────────────────────────┐
│ Neues Ereignis anlegen                                        │
├──────────────────────────────────────────────────────────────┤
│ Titel [                                            ]         │
│                                                              │
│ Beschreibung [ textarea                            ]         │
│                                                              │
│ Typ  [ Krieg  ▼ 🔴                  ]                        │
│       (combobox — type to filter; "Neu erstellen" option)    │
│                                                              │
│ ─── Beginn ─────────────────────────────────────────────── │
│ Jahr [    ]  Monat [── Kein ──▼]  Tag [  ]                  │
│ Sicherheit: [● Sicher] [◎ Wahrschl.] [◯ Möglich] [?]       │
│                                                              │
│ ─── Ende ───────────────────────────────────────────────── │
│ (same structure, independent from Beginn)                    │
│                                                              │
│ Ort [ free text                             ]                │
│                                                              │
│ Übergeordnetes Ereignis  [ Weltkrieg I  ▼ ]                  │
│  (combobox — searchable; only top-level events selectable)   │
│                                                              │
│ ─── Notizen ─────────────────────────────────────────────── │
│ [ textarea                                              ]    │
│                                                              │
│                         [Abbrechen]  [Ereignis speichern]   │
└──────────────────────────────────────────────────────────────┘
```

**Parent selector behavior:**

- Combobox showing only top-level events (events where `parent_id IS NULL`) from the project
- If `defaultParentId` is provided (from the "Add sub-event" button), the field is pre-filled and **not locked** (user may still change or clear it)
- On selecting a parent, the form validates client-side that the selected event is indeed top-level (API enforces this too)
- If the API returns `DEPTH_LIMIT_EXCEEDED`:
  - Show inline field error below the parent selector: "Ereignis '[parent_title]' ist selbst ein Unterereignis und kann keinen eigenen Unterereignissen haben. Bitte ein anderes Ereignis wählen."
  - All other field values are preserved (form stays open, no data loss)
  - No toast is shown for this specific error (inline is sufficient)

**EventType Combobox inline create:**

- User types a name not matching any existing type
- A "Neu erstellen: '[typed name]'" option appears at the bottom of the dropdown
- Clicking it: sends `POST /api/event-types` with just the name (no color/icon yet)
- On success: the new type is selected; a follow-up link "Farbe zuweisen" appears inline, linking to the event type settings page
- On error: show toast "Ereignistyp konnte nicht erstellt werden."

**Validation errors:** Shown inline below each field.
**On success:** Redirect to event detail page; toast "Ereignis gespeichert."
**On error (non-depth):** Toast with error message; form stays open.

---

### 5.4 Event Detail Page (`/[locale]/events/[id]`)

```
┌──────────────────────────────────────────────────────────────┐
│ Weltkrieg I                            [Bearbeiten] [Löschen] │
├──────────────────────────────────────────────────────────────┤
│ [Attribute] [Unterereignisse (12)] [Personen] [Quellen]      │
├──────────────────────────────────────────────────────────────┤
│ ATTRIBUTE TAB (default)                                      │
│                                                              │
│ Typ              🟠 Krieg                                    │
│ Beginn           1914  (Sicher)                              │
│ Ende             1918  (Sicher)                              │
│ Ort              Westfront                                   │
│ Übergeordnet     —                                           │  ← link if sub-event
│ Beschreibung     [text]                                      │
│ Notizen          [text]                                      │
│ Erstellt am      08.03.2026  von admin@evidoxa.dev           │
│                                                              │
│ UNTEREREIGNISSE TAB                                          │
│ [+ Unterereignis hinzufügen]                                 │
│ ┌──────────────────────────────────────────────┐             │
│ │ Verdun     │ 🔴 Schlacht │ Feb 1916 – Dez 1916 │ →  │     │
│ │ Somme      │ 🔴 Schlacht │ Jul 1916 – Nov 1916 │ →  │     │
│ └──────────────────────────────────────────────┘             │
│                                                              │
│ PERSONEN / QUELLEN TABS                                      │
│ "Beziehungen werden in einem späteren Update verfügbar."     │
└──────────────────────────────────────────────────────────────┘
```

**"Übergeordnet" row:** Shown only on sub-events. Displays parent event title as a link to the parent detail page.

**"Unterereignisse" tab:** Shows a table of sub-events (title, type badge, date range, link arrow). Count displayed in the tab label: "Unterereignisse (12)". Empty state: "Keine Unterereignisse. [Unterereignis hinzufügen]". The "Unterereignis hinzufügen" button opens `/events/new?parentId=[id]`.

**Delete behavior:** If the event has sub-events, the delete confirm dialog changes to a warning:

> "Dieses Ereignis hat 12 Unterereignisse. Löschen Sie zuerst die Unterereignisse oder ordnen Sie sie neu zu."

A [Liste anzeigen] link navigates to `/events?topLevelOnly=false&search=<title>`. The delete button is disabled in this state.

**Tab badge:** The "Unterereignisse" tab always shows the count in parentheses, even at 0.

---

### 5.5 EventType Settings Page (`/[locale]/settings/event-types`)

Accessible from sidebar settings section.

```
┌──────────────────────────────────────────────────────────────┐
│ Ereignistypen                        [+ Neuer Ereignistyp]   │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Farbe │ Name           │ Ereignisse │ Aktionen         │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │ 🔴    │ Schlacht       │ 12         │ [Bearbeiten] [✕] │   │
│ │ 🔵    │ Vertrag        │ 3          │ [Bearbeiten] [✕] │   │
│ │ ⚪    │ Mein Typ       │ 0          │ [Bearbeiten] [✕] │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Inline edit:** Clicking "Bearbeiten" opens an inline row editor (not a modal) with a text input and color picker.

**Delete:** Clicking "✕" on a type with `event_count > 0` shows a toast (not a modal):

> "Dieser Typ wird von 3 Ereignissen verwendet. [Ereignisse anzeigen ↗]"
> The link navigates to `/events?typeIds=[id]`.

**Delete on unused type:** Opens a shadcn `AlertDialog` confirm: "Ereignistyp '[name]' löschen?" → confirm.

**Create:** "Neuer Ereignistyp" button opens an inline form row at the top of the table (name input + color picker + Save/Cancel).

---

### 5.6 Bulk Delete Dialog

Reuses `BulkDeleteDialog` from Epic 2.1, parameterized with entity name. If some events are skipped (have sub-events), show a post-delete summary toast:

> "2 Ereignisse gelöscht. 1 Ereignis übersprungen (hat Unterereignisse)."

---

## 6. State & Data Flow

```
URL searchParams ──► Server Component (events/page.tsx)
                           │
                           ▼ check Redis cache
                    cache HIT ──► return cached JSON
                           │
                    cache MISS ──► Prisma query
                           │   WHERE deleted_at IS NULL  (soft-delete extension)
                           │   AND overlap filter (if date range)
                           │   AND event_type_id IN [...]  (if type filter)
                           │   AND parent_id IS NULL  (if topLevelOnly)
                           │   include: { event_type, parent }
                           ▼ store in Redis (60s TTL)
                     EventSummary[]  ──► DataTable (SSR HTML)

Filter changes (client):
  EventFilters (Client)
    │ updates URL params via router.push()
    ▼ SSR re-render with new searchParams

Create/edit event:
  EventForm (Client)
    │ react-hook-form + Zod validation
    │ client-side: parent combobox filters to top-level only
    ▼
  fetch POST/PUT /api/events
    │ API: validate depth limit (parent_id → check parent.parent_id IS NULL)
    │   → if violation: 400 DEPTH_LIMIT_EXCEEDED → form shows inline error
    │ sanitize() text fields
    │ Prisma create/update
    ▼
  Invalidate Redis cache (event-list:{projectId}:*)
    ▼
  Redirect to /events/[id] with toast

EventType inline create (from EventTypeCombobox):
  POST /api/event-types
    │ creates EventType with name only (no color yet)
    ▼
  EventTypeCombobox selects new type
  "Farbe zuweisen" link → /settings/event-types
```

---

## 7. i18n

### German (`de.json`) — `events.*` namespace

```json
{
  "events": {
    "title": "Ereignisse",
    "create": "Neues Ereignis",
    "edit_title": "Ereignis bearbeiten",
    "create_title": "Neues Ereignis anlegen",
    "save": "Ereignis speichern",
    "delete": "Ereignis löschen",
    "delete_confirm_title": "Ereignis löschen?",
    "delete_confirm_body": "Dieses Ereignis wird als gelöscht markiert.",
    "delete_has_sub_events": "Dieses Ereignis hat {count} Unterereignisse. Bitte diese zuerst löschen oder einem anderen Ereignis zuordnen.",
    "saved_toast": "Ereignis gespeichert.",
    "deleted_toast": "Ereignis gelöscht.",
    "fields": {
      "title": "Titel",
      "description": "Beschreibung",
      "event_type": "Typ",
      "start_date": "Beginn",
      "start_date_certainty": "Sicherheit Beginn",
      "end_date": "Ende",
      "end_date_certainty": "Sicherheit Ende",
      "location": "Ort",
      "parent": "Übergeordnetes Ereignis",
      "notes": "Notizen",
      "created_at": "Erstellt am",
      "created_by": "Erstellt von"
    },
    "date": {
      "year": "Jahr",
      "month": "Monat",
      "day": "Tag",
      "no_month": "Kein Monat",
      "months": {
        "1": "Januar",
        "2": "Februar",
        "3": "März",
        "4": "April",
        "5": "Mai",
        "6": "Juni",
        "7": "Juli",
        "8": "August",
        "9": "September",
        "10": "Oktober",
        "11": "November",
        "12": "Dezember"
      }
    },
    "certainty": {
      "CERTAIN": "Sicher",
      "PROBABLE": "Wahrscheinlich",
      "POSSIBLE": "Möglich",
      "UNKNOWN": "Unbekannt"
    },
    "list": {
      "search_placeholder": "Nach Titel suchen…",
      "empty": "Noch keine Ereignisse.",
      "empty_action": "Erstes Ereignis anlegen",
      "top_level_only": "Nur Hauptereignisse",
      "date_range_from": "Von Jahr",
      "date_range_to": "Bis Jahr",
      "date_range_tooltip": "Zeigt Ereignisse, die sich zeitlich mit dem gewählten Bereich überschneiden. Ereignisse ohne Enddatum gelten als Einzelereignisse.",
      "type_filter_label": "Typ",
      "columns": {
        "title": "Titel",
        "event_type": "Typ",
        "start_date": "Beginn",
        "end_date": "Ende",
        "parent": "Übergeordnet"
      }
    },
    "bulk": {
      "selected": "{count} ausgewählt",
      "delete_button": "Löschen",
      "confirm_title": "{count} Ereignisse löschen?",
      "confirm_body": "Diese Aktion löscht {count} Ereignisse. Kontaktieren Sie den Administrator zur Wiederherstellung.",
      "deleted_toast": "{count} Ereignisse gelöscht.",
      "skipped_toast": "{deleted} Ereignisse gelöscht. {skipped} übersprungen (hat Unterereignisse)."
    },
    "detail": {
      "tabs": {
        "attributes": "Attribute",
        "sub_events": "Unterereignisse ({count})",
        "persons": "Personen",
        "sources": "Quellen"
      },
      "add_sub_event": "Unterereignis hinzufügen",
      "sub_events_empty": "Keine Unterereignisse.",
      "relations_placeholder": "Beziehungen werden in einem späteren Update verfügbar."
    },
    "errors": {
      "title_required": "Bitte einen Titel eingeben.",
      "month_requires_year": "Monat erfordert ein Jahr.",
      "day_requires_month": "Tag erfordert einen Monat.",
      "invalid_month": "Ungültiger Monat (1–12).",
      "invalid_day": "Ungültiger Tag (1–31).",
      "depth_limit": "Ereignis '{parent_title}' ist selbst ein Unterereignis und kann keine eigenen Unterereignisse haben. Bitte ein anderes Ereignis wählen.",
      "not_found": "Ereignis nicht gefunden.",
      "save_failed": "Speichern fehlgeschlagen. Bitte erneut versuchen.",
      "delete_has_sub_events": "Hat {count} Unterereignisse"
    }
  },
  "event_types": {
    "title": "Ereignistypen",
    "create": "Neuer Ereignistyp",
    "inline_create": "Neu erstellen: \"{name}\"",
    "assign_color": "Farbe zuweisen",
    "save": "Speichern",
    "delete_confirm_title": "Ereignistyp \"{name}\" löschen?",
    "delete_confirm_body": "Diese Aktion kann nicht rückgängig gemacht werden.",
    "in_use_toast": "Dieser Typ wird von {count} Ereignissen verwendet.",
    "view_events": "Ereignisse anzeigen",
    "deleted_toast": "Ereignistyp gelöscht.",
    "saved_toast": "Ereignistyp gespeichert.",
    "duplicate_error": "Ein Typ mit diesem Namen existiert bereits.",
    "fields": {
      "name": "Name",
      "color": "Farbe",
      "event_count": "Ereignisse"
    }
  }
}
```

### English (`en.json`) — equivalent values

```json
{
  "events": {
    "title": "Events",
    "create": "New Event",
    "edit_title": "Edit Event",
    "create_title": "Create New Event",
    "save": "Save Event",
    "delete": "Delete Event",
    "delete_confirm_title": "Delete event?",
    "delete_confirm_body": "This event will be marked as deleted.",
    "delete_has_sub_events": "This event has {count} sub-events. Please delete or reassign them first.",
    "saved_toast": "Event saved.",
    "deleted_toast": "Event deleted.",
    "fields": {
      "title": "Title",
      "description": "Description",
      "event_type": "Type",
      "start_date": "Start",
      "start_date_certainty": "Start Certainty",
      "end_date": "End",
      "end_date_certainty": "End Certainty",
      "location": "Location",
      "parent": "Parent Event",
      "notes": "Notes",
      "created_at": "Created at",
      "created_by": "Created by"
    },
    "date": {
      "year": "Year",
      "month": "Month",
      "day": "Day",
      "no_month": "No Month",
      "months": {
        "1": "January",
        "2": "February",
        "3": "March",
        "4": "April",
        "5": "May",
        "6": "June",
        "7": "July",
        "8": "August",
        "9": "September",
        "10": "October",
        "11": "November",
        "12": "December"
      }
    },
    "certainty": {
      "CERTAIN": "Certain",
      "PROBABLE": "Probable",
      "POSSIBLE": "Possible",
      "UNKNOWN": "Unknown"
    },
    "list": {
      "search_placeholder": "Search by title…",
      "empty": "No events yet.",
      "empty_action": "Create first event",
      "top_level_only": "Top-level events only",
      "date_range_from": "From Year",
      "date_range_to": "To Year",
      "date_range_tooltip": "Shows events that overlap with the selected date range. Events without an end date are treated as point-in-time events.",
      "type_filter_label": "Type",
      "columns": {
        "title": "Title",
        "event_type": "Type",
        "start_date": "Start",
        "end_date": "End",
        "parent": "Parent"
      }
    },
    "bulk": {
      "selected": "{count} selected",
      "delete_button": "Delete",
      "confirm_title": "Delete {count} events?",
      "confirm_body": "This will delete {count} events. Contact an administrator to restore them.",
      "deleted_toast": "{count} events deleted.",
      "skipped_toast": "{deleted} events deleted. {skipped} skipped (has sub-events)."
    },
    "detail": {
      "tabs": {
        "attributes": "Attributes",
        "sub_events": "Sub-events ({count})",
        "persons": "Persons",
        "sources": "Sources"
      },
      "add_sub_event": "Add sub-event",
      "sub_events_empty": "No sub-events.",
      "relations_placeholder": "Relations will be available in a future update."
    },
    "errors": {
      "title_required": "Please enter a title.",
      "month_requires_year": "Month requires a year.",
      "day_requires_month": "Day requires a month.",
      "invalid_month": "Invalid month (1–12).",
      "invalid_day": "Invalid day (1–31).",
      "depth_limit": "Event '{parent_title}' is itself a sub-event and cannot have its own sub-events. Please choose a different event.",
      "not_found": "Event not found.",
      "save_failed": "Failed to save. Please try again.",
      "delete_has_sub_events": "Has {count} sub-events"
    }
  },
  "event_types": {
    "title": "Event Types",
    "create": "New Event Type",
    "inline_create": "Create new: \"{name}\"",
    "assign_color": "Assign color",
    "save": "Save",
    "delete_confirm_title": "Delete event type \"{name}\"?",
    "delete_confirm_body": "This action cannot be undone.",
    "in_use_toast": "This type is used by {count} events.",
    "view_events": "View events",
    "deleted_toast": "Event type deleted.",
    "saved_toast": "Event type saved.",
    "duplicate_error": "A type with this name already exists.",
    "fields": {
      "name": "Name",
      "color": "Color",
      "event_count": "Events"
    }
  }
}
```

---

## 8. Testing Plan

### Unit Tests (Vitest + RTL) — target 80%+ on new code

**`src/lib/date.test.ts`** — extend existing file

- `formatPartialDate` with start/end: both null → "—"
- `formatPartialDate(1914, null, null, 'de')` → `"1914"`

**`src/components/research/EventTypeCombobox.test.tsx`**

- Renders existing types in dropdown
- Typing a non-matching name shows "Neu erstellen: '[name]'" option
- Typing an exact match does NOT show "Neu erstellen" option
- Selecting "Neu erstellen" fires POST and calls `onTypeCreated`

**`src/components/research/EventFilters.test.tsx`**

- DateRangeFilterInfo tooltip text is present in DOM
- Selecting a type triggers `onChange` with correct `typeIds`
- Toggling "topLevelOnly" checkbox triggers `onChange`

**`src/app/api/events/route.test.ts`** (mock Prisma via `vi.mock`)

- `GET /api/events` — returns paginated list with event_type included
- `GET /api/events?topLevelOnly=true` — Prisma called with `parent_id: null`
- `GET /api/events?fromYear=1900&toYear=1950` — correct overlap WHERE clause
- `GET /api/events?typeIds=a,b` — `event_type_id: { in: ["a","b"] }`
- `POST /api/events` — creates event, invalidates cache
- `POST /api/events` missing title → 400
- `POST /api/events` with `start_month` but no `start_year` → 400
- `POST /api/events` with `parent_id` pointing to a sub-event → 400 `DEPTH_LIMIT_EXCEEDED`; form field error shape verified

**`src/app/api/events/[id]/route.test.ts`**

- `DELETE` with active sub-events → 409 `HAS_SUB_EVENTS`
- `DELETE` soft-deletes; invalidates cache

**`src/app/api/events/bulk/route.test.ts`**

- Events with sub-events are skipped; others deleted; response includes `skipped[]`

**`src/app/api/event-types/route.test.ts`**

- `GET` returns list with `event_count`
- `POST` creates type with name + color; rejects invalid hex
- `POST` duplicate name → 409

**`src/app/api/event-types/[id]/route.test.ts`**

- `DELETE` type in use → 409 with `filter_url`
- `DELETE` unused type → 200

**`src/lib/db.test.ts`** — extend existing

- `findMany` on Event excludes records with `deleted_at` set (soft-delete extension active)

### E2E Tests (Playwright) — `e2e/events.spec.ts`

```
TC-E-01: Create a top-level event with title, EventType (Krieg), start year 1914 (PROBABLE)
TC-E-02: Create a sub-event (Battle of Verdun) linked to WWI as parent from detail page
TC-E-03: View parent detail — Unterereignisse tab shows Battle of Verdun with count (1)
TC-E-04: View sub-event detail — "Übergeordnetes Ereignis" row links to WWI
TC-E-05: Edit event — change EventType, update start date certainty to CERTAIN
TC-E-06: Delete event from detail page → soft-deleted, not in list; attempt delete of parent with sub-events → error message shown
TC-E-07: Bulk select 2 events → confirm delete → both removed from list
TC-E-08: Filter list by EventType "Krieg" → only Krieg events shown
TC-E-09: Filter by date range 1900–1920 → WWI shown; verify tooltip text visible on hover of info icon
TC-E-10: Filter "Nur Hauptereignisse" → Battle of Verdun hidden; WWI visible
TC-E-11: Search by title "Verdun" → only Battle of Verdun shown
TC-E-12: Create EventType inline from event form combobox → type created and selected; "Farbe zuweisen" link visible
TC-E-13: EventType settings page — create type, rename, attempt delete (blocked with toast, link to filtered events), delete unused type (confirm dialog)
TC-E-14: Pagination — 26 events → navigate to page 2
TC-E-15: Sort by title asc/desc — order changes in table
TC-E-16: Try to set sub-event as parent of another event via form → inline error shown; all other field values preserved
```

16 E2E tests.

---

## 9. File Structure

New files:

```
src/
  app/[locale]/(app)/
    events/
      page.tsx
      new/
        page.tsx
      [id]/
        page.tsx
        edit/
          page.tsx
    settings/
      event-types/
        page.tsx

  app/api/
    events/
      route.ts
      [id]/
        route.ts
      bulk/
        route.ts
    event-types/
      route.ts
      [id]/
        route.ts

  components/research/
    EventForm.tsx
    EventDetailCard.tsx
    EventDetailTabs.tsx
    EventTypeCombobox.tsx
    EventTypeColorPicker.tsx
    EventFilters.tsx
    DateRangeFilterInfo.tsx
    EventTypeSettingsTable.tsx

  types/
    event.ts
    event-type.ts

  test/
    components/
      EventTypeCombobox.test.tsx
      EventFilters.test.tsx
    api/
      events.route.test.ts
      events-id.route.test.ts
      events-bulk.route.test.ts
      event-types.route.test.ts
      event-types-id.route.test.ts

e2e/
  events.spec.ts

prisma/
  migrations/
    YYYYMMDD_add_event_types/   # add EventType table, event_type_id FK, drop event_type String

messages/
  de.json   # events.* and event_types.* namespaces added
  en.json   # same
```

Modified files:

| File                                | Change                                                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `prisma/schema.prisma`              | Add `EventType` model; update `Event` (drop `event_type`, add `event_type_id`); add `event_types` to `Project` |
| `src/lib/db.ts`                     | Activate `event` model in soft-delete extension                                                                |
| `prisma/seed.ts`                    | Add `seedDefaultEventTypes()` + call for demo project                                                          |
| `src/components/shell/AppShell.tsx` | Add settings section (Separator + settings nav items at bottom)                                                |
| `messages/de.json`                  | Add `events.*` and `event_types.*` namespaces                                                                  |
| `messages/en.json`                  | Same                                                                                                           |

---

## 10. Implementation Notes

### Zod schema for events

```typescript
const eventSchema = z
  .object({
    title: z.string().min(1, "title_required"),
    description: z.string().optional(),
    event_type_id: z.string().cuid().optional().nullable(),
    start_year: z.number().int().min(1).max(2100).optional().nullable(),
    start_month: z.number().int().min(1).max(12).optional().nullable(),
    start_day: z.number().int().min(1).max(31).optional().nullable(),
    start_date_certainty: z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]).default("UNKNOWN"),
    end_year: z.number().int().min(1).max(2100).optional().nullable(),
    end_month: z.number().int().min(1).max(12).optional().nullable(),
    end_day: z.number().int().min(1).max(31).optional().nullable(),
    end_date_certainty: z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]).default("UNKNOWN"),
    location: z.string().optional().nullable(),
    parent_id: z.string().cuid().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.start_month && !data.start_year) {
      ctx.addIssue({ code: "custom", path: ["start_month"], message: "month_requires_year" });
    }
    if (data.start_day && !data.start_month) {
      ctx.addIssue({ code: "custom", path: ["start_day"], message: "day_requires_month" });
    }
    if (data.end_month && !data.end_year) {
      ctx.addIssue({ code: "custom", path: ["end_month"], message: "month_requires_year" });
    }
    if (data.end_day && !data.end_month) {
      ctx.addIssue({ code: "custom", path: ["end_day"], message: "day_requires_month" });
    }
    // No constraint between start and end — end without start is valid.
  });
```

### Depth limit enforcement in API

```typescript
if (input.parent_id) {
  const parent = await db.event.findUnique({
    where: { id: input.parent_id },
    select: { parent_id: true, title: true },
  });
  if (!parent) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (parent.parent_id !== null) {
    return NextResponse.json(
      {
        error: "DEPTH_LIMIT_EXCEEDED",
        message: `...`,
        parent_title: parent.title,
      },
      { status: 400 },
    );
  }
}
```

The form interprets `DEPTH_LIMIT_EXCEEDED` as a field-level error on `parent_id` (not a toast), using `form.setError("parent_id", { message: t("errors.depth_limit", { parent_title }) })`. All other field values remain intact because `setError` does not reset the form.

### Date range filter SQL (via Prisma)

```typescript
const where: Prisma.EventWhereInput = {
  project_id: projectId,
};
if (fromYear || toYear) {
  where.AND = [
    ...(toYear ? [{ start_year: { lte: toYear } }] : []),
    ...(fromYear
      ? [
          {
            OR: [
              { end_year: null }, // point-in-time: include if start_year >= fromYear handled above
              { end_year: { gte: fromYear } },
            ],
          },
        ]
      : []),
  ];
  // Also: if only fromYear, include events where start_year >= fromYear OR end_year >= fromYear
  // Correct full overlap: start_year <= toYear AND (end_year IS NULL OR end_year >= fromYear)
}
```

Use `db.$queryRaw` only if Prisma's typed where cannot express the overlap cleanly. Prefer typed where for type safety.

### Parent combobox: only top-level events

The parent selector combobox must fetch events where `parent_id IS NULL` from the project:

```typescript
// GET /api/events?topLevelOnly=true&pageSize=100&sort=title
// Used client-side to populate the combobox. No cache dependency.
```

A separate lightweight endpoint is not needed — reuse the existing `GET /api/events` with `topLevelOnly=true`.

### AppShell sidebar modification

Add a settings section using Tailwind `mt-auto` and shadcn `Separator`:

```tsx
<nav className="flex flex-col h-full">
  <div className="flex-1 space-y-1 px-2 py-4">
    <NavItem href="/persons">Personen</NavItem>
    <NavItem href="/events">Ereignisse</NavItem>
    <NavItem href="/sources">Quellen</NavItem>
    {/* Relations — added in Epic 2.4 */}
  </div>

  <div className="px-2 pb-4 mt-auto">
    <Separator className="mb-3" />
    <NavItem href="/settings/event-types">Ereignistypen</NavItem>
    {/* Epic 3.1 adds: Project Settings, Members */}
  </div>
</nav>
```

### EventType color validation

```typescript
const PALETTE_COLORS = [
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#ca8a04",
  "#16a34a",
  "#0d9488",
  "#0891b2",
  "#2563eb",
  "#4338ca",
  "#7c3aed",
  "#db2777",
  "#4b5563",
] as const;

const eventTypeSchema = z.object({
  name: z.string().min(1),
  color: z
    .enum(PALETTE_COLORS as unknown as [string, ...string[]])
    .optional()
    .nullable(),
  icon: z.string().optional().nullable(),
});
```

### Cache invalidation for event types

Writing to `event_types` (create/update/delete) does NOT invalidate `event-list:*` caches directly (event type changes don't change which events exist). However, since `EventSummary` includes `{ event_type: { name, color } }`, a color/name change on an EventType would show stale data for up to 60 s. This is acceptable for Phase 2 MVP. Add event-type cache invalidation in the Epic 3.1 full-cache-management pass.

---

## 11. Acceptance Criteria

1. **AC-01:** Navigating to `/de/events` renders a table with Title, Typ, Beginn, Ende, Übergeordnet columns.
2. **AC-02:** Creating an event with title "Weltkrieg I", Typ "Krieg" (colored orange), start_year=1914, start_date_certainty=CERTAIN saves and redirects to the detail page showing "1914 (Sicher)".
3. **AC-03:** From the detail page of "Weltkrieg I", clicking "Unterereignis hinzufügen" opens the event form with "Weltkrieg I" pre-filled in the parent selector.
4. **AC-04:** Creating a sub-event "Battle of Verdun" linked to "Weltkrieg I" succeeds. The "Unterereignisse (1)" tab on WWI's detail page lists "Battle of Verdun".
5. **AC-05:** Attempting to create a sub-event of "Battle of Verdun" (which is itself a sub-event) shows an inline error on the parent field — NOT a toast — and all other form fields remain filled.
6. **AC-06:** The event list shows a "Übergeordnet" column: "Battle of Verdun" shows "Weltkrieg I" as a link; "Weltkrieg I" shows "—".
7. **AC-07:** Filtering by EventType "Krieg" shows only events of that type. Removing the filter shows all events.
8. **AC-08:** Filtering by date range 1914–1918 shows "Weltkrieg I" (1914–1918). An info icon next to the filter shows a tooltip explaining overlap semantics.
9. **AC-09:** Checking "Nur Hauptereignisse" hides "Battle of Verdun" from the list; "Weltkrieg I" remains.
10. **AC-10:** Searching "Verdun" finds "Battle of Verdun".
11. **AC-11:** Typing a new type name "Belagerung" in the EventType combobox in the event form shows "Neu erstellen: 'Belagerung'". Clicking it creates the type and selects it. A "Farbe zuweisen" link is shown.
12. **AC-12:** The `/de/settings/event-types` page lists all event types with their color swatches and event counts. It is accessible from the sidebar settings section (below the divider).
13. **AC-13:** Attempting to delete an EventType that is in use shows a toast with the count and a link to the filtered event list; the type is NOT deleted.
14. **AC-14:** Deleting an unused EventType via the settings page shows an AlertDialog confirm; on confirm, the type disappears from the list.
15. **AC-15:** Attempting to delete an event that has sub-events shows an error message in the delete dialog; the delete button is disabled.
16. **AC-16:** Soft-deleting an event removes it from the list. `GET /api/events` does not return soft-deleted events.
17. **AC-17:** Bulk selecting 2 events and deleting: both disappear. If one has sub-events it is skipped; the success toast shows how many were deleted and how many skipped.
18. **AC-18:** Switching locale to `/en/events` shows all UI text in English.
19. **AC-19:** All Vitest unit tests pass (`pnpm test`).
20. **AC-20:** All 16 E2E tests in `events.spec.ts` pass on Chromium.
21. **AC-21:** `GET /api/health` still returns `status: "ok"` after this epic is deployed.

---

## 12. Out of Scope

| Item                                                           | Moved to             |
| -------------------------------------------------------------- | -------------------- |
| Location FK wiring (`event.location_id` autocomplete)          | Epic 3.2             |
| Relations tabs full content (Personen/Quellen on event detail) | Epic 2.4             |
| PropertyEvidence UI for event fields                           | Epic 2.4             |
| PostgreSQL `tsvector` full-text search on events               | Epic 4.1             |
| Timeline visualization                                         | Epic 4.2             |
| CSV/XLSX import of events                                      | Epic 3.4             |
| CSV export of events                                           | Epic 5.1             |
| Duplicate detection for events                                 | Epic 5.2             |
| Activity log for event CRUD actions                            | Epic 4.4             |
| Full project settings panel (merges event-types page)          | Epic 3.1             |
| Free hex color input for EventType                             | Epic 5.3 (UI polish) |
| EventType "Reassign & delete" bulk flow                        | Epic 5.2             |
| Location text filter on event list                             | Epic 3.2             |
| Certainty filter on event list                                 | Epic 5.2             |
| LiteratureEvidence                                             | Epic 3.3             |
| Storybook documentation                                        | Epic 5.4             |
