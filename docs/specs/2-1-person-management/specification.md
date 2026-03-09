# Epic 2.1 — Person Management

## Specification

**Phase:** 2 — Core Research Loop
**Deliverable:** Full CRUD for persons with search, filtering, pagination, and a detail profile view.
**Verifiable:** Create a person with uncertain birth date and name variant, view the profile, edit, search by name, bulk delete.

---

## 1. Technology Stack

| Package                | Version   | Purpose                                  |
| ---------------------- | --------- | ---------------------------------------- |
| `sanitize-html`        | `^2.13.1` | HTML sanitization at DB write boundaries |
| `@types/sanitize-html` | `^2.13.0` | TypeScript types                         |

No other new dependencies. All other packages (shadcn, react-hook-form, zod, next-intl, prisma) are already installed.

---

## 2. Data Model / Schema

No schema changes required — the existing schema fully supports Epic 2.1.

### Relevant existing tables

**`persons`** table (already migrated):

```prisma
model Person {
  id            String    @id @default(cuid())
  project_id    String
  created_by_id String?
  first_name    String?
  last_name     String?
  birth_year           Int?
  birth_month          Int?
  birth_day            Int?
  birth_date_certainty Certainty @default(UNKNOWN)
  birth_place          String?
  birth_location_id    String?   // FK — not used in Epic 2.1 UI (Epic 3.2)
  death_year           Int?
  death_month          Int?
  death_day            Int?
  death_date_certainty Certainty @default(UNKNOWN)
  death_place          String?
  death_location_id    String?   // FK — not used in Epic 2.1 UI (Epic 3.2)
  notes      String?
  deleted_at DateTime?
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
}
```

**`person_names`** table (already migrated):

```prisma
model PersonName {
  id         String   @id @default(cuid())
  person_id  String
  name       String
  language   String?  // ISO 639-1 (nullable)
  is_primary Boolean  @default(false)
  created_at DateTime @default(now())
}
```

### Soft-delete Prisma extension

Add a Prisma client extension to `src/lib/db.ts` that transparently filters `deleted_at: null` for `findMany` and `findFirst` on the `person`, `event`, `source`, and `relation` models. This is the first entity with a soft-delete column exposed in the UI.

```typescript
// src/lib/db.ts — extend existing prismaClientSingleton
const prismaBase = new PrismaClient();

export const db = prismaBase.$extends({
  query: {
    person: {
      findMany({ args, query }) {
        args.where = { deleted_at: null, ...args.where };
        return query(args);
      },
      findFirst({ args, query }) {
        args.where = { deleted_at: null, ...args.where };
        return query(args);
      },
    },
    // Repeat for event, source, relation in their respective epics.
    // Add here now to establish the pattern.
  },
});
```

**Important:** The extension must NOT filter on `count`, `findUnique` (by ID), `aggregate` — those must remain unaffected.

---

## 3. API Contract

All API routes:

- Require a valid session (use `requireUser()` from `src/lib/auth-guard.ts`)
- Return `Content-Type: application/json`
- Return `Cache-Control: no-store`
- Apply `sanitize()` to all user-supplied text before DB write

**Project scoping:** All person operations are scoped to a `project_id`. For Epic 2.1, the project_id is read from the authenticated session's active project. Since multi-project workspace is Epic 3.1, a default project is used (the first project where the user is a member).

### GET /api/persons

List persons with server-side pagination, search, and sort.

**Query params:**

```typescript
interface PersonListQuery {
  page?: string; // default "1"
  pageSize?: string; // default "25", max 100
  search?: string; // searches first_name, last_name, PersonName.name (ILIKE)
  sort?: "first_name" | "last_name" | "created_at"; // default "last_name"
  order?: "asc" | "desc"; // default "asc"
  projectId?: string; // required; derived from session if omitted
}
```

**Response `200`:**

```typescript
interface PersonListResponse {
  data: PersonSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface PersonSummary {
  id: string;
  first_name: string | null;
  last_name: string | null;
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  birth_date_certainty: "CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";
  death_year: number | null;
  death_month: number | null;
  death_day: number | null;
  death_date_certainty: "CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";
  created_at: string; // ISO 8601
  names: { name: string; language: string | null; is_primary: boolean }[];
}
```

**Errors:** `401 Unauthorized`, `400 Bad Request` (invalid params).

**Cache:** Key `person-list:{project_id}:{page}:{pageSize}:{search}:{sort}:{order}`. TTL 60 s. Uses `cache.ts` from Epic 1.4.

### POST /api/persons

Create a new person.

**Request body:**

```typescript
interface CreatePersonInput {
  project_id: string;
  first_name?: string;
  last_name?: string;
  birth_year?: number;
  birth_month?: number; // 1–12
  birth_day?: number; // 1–31
  birth_date_certainty?: "CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";
  birth_place?: string;
  death_year?: number;
  death_month?: number;
  death_day?: number;
  death_date_certainty?: "CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";
  death_place?: string;
  notes?: string;
  names?: { name: string; language?: string; is_primary?: boolean }[];
}
```

**Validation rules:**

- At minimum one of `first_name`, `last_name`, or a non-empty `names` entry must be present
- `birth_month` only valid if `birth_year` is set
- `birth_day` only valid if `birth_month` is set
- Same constraints for `death_*`
- `birth_month` ∈ [1, 12] if set; `birth_day` ∈ [1, 31] if set
- At most one `names` entry may have `is_primary: true`

**Response `201`:** Full `PersonDetail` object (see GET /api/persons/[id]).

**Side-effects:** Invalidate `person-list:{project_id}:*` cache keys.

**Errors:** `400` (validation), `401`, `403` (not a project member).

### GET /api/persons/[id]

Fetch full person detail including all PersonName records.

**Response `200`:**

```typescript
interface PersonDetail extends PersonSummary {
  birth_place: string | null;
  death_place: string | null;
  notes: string | null;
  created_by_id: string | null;
  updated_at: string;
  // Relation counts — content populated by Epic 2.4
  _count: {
    relations_from: number;
    relations_to: number;
  };
}
```

**Errors:** `401`, `403`, `404` (not found or soft-deleted).

### PUT /api/persons/[id]

Full update. Accepts same shape as `CreatePersonInput` (all fields optional).

**Names array handling:** Replace existing `PersonName` records with the submitted array. Use a transaction: delete all existing `PersonName` records for this person, insert the new set.

**Response `200`:** Updated `PersonDetail`.

**Side-effects:** Invalidate `person-list:{project_id}:*`.

**Errors:** `400`, `401`, `403`, `404`.

### DELETE /api/persons/[id]

Soft-delete a person (`deleted_at = now()`).

**Response `200`:** `{ "deleted": true }`.

**Side-effects:** Invalidate `person-list:{project_id}:*`.

**Errors:** `401`, `403`, `404`.

### POST /api/persons/bulk

Bulk soft-delete.

**Request body:**

```typescript
interface BulkPersonInput {
  ids: string[];
  action: "delete";
}
```

**Validation:** `ids` must be non-empty, max 500 items, all must belong to the same project the user has access to.

**Response `200`:** `{ "deleted": number }`.

**Side-effects:** Invalidate `person-list:{project_id}:*`.

**Errors:** `400`, `401`, `403`.

---

## 4. Component Architecture

```
src/
  app/[locale]/(app)/
    persons/
      page.tsx                        # Server Component — person list
      new/
        page.tsx                      # Server Component shell; form is client
      [id]/
        page.tsx                      # Server Component — person detail
        edit/
          page.tsx                    # Server Component shell; form is client

  components/
    research/
      CertaintySelector.tsx           # Client Component — 4-state button group
      PartialDateInput.tsx            # Client Component — year/month/day inputs
      DataTable.tsx                   # Client Component — generic table wrapper
      DataTablePagination.tsx         # Client Component — prev/next + page display
      DataTableSearch.tsx             # Client Component — debounced search input
      PersonForm.tsx                  # Client Component — create/edit form
      PersonNameList.tsx              # Client Component — dynamic name variant rows
      BulkDeleteDialog.tsx            # Client Component — confirm dialog for bulk delete
      PersonDetailCard.tsx            # Server Component — attribute display card
      PersonDetailTabs.tsx            # Client Component — tab switcher (attributes/names/relations)

  lib/
    date.ts                           # formatPartialDate() utility (new)
    sanitize.ts                       # Upgraded with sanitize-html (replaces stub)

  types/
    person.ts                         # PersonSummary, PersonDetail, CreatePersonInput types
```

### Component interfaces

```typescript
// CertaintySelector.tsx
interface CertaintySelectorProps {
  value: Certainty;
  onChange: (value: Certainty) => void;
  disabled?: boolean;
  label?: string; // accessible label
}

// PartialDateInput.tsx
interface PartialDateInputProps {
  yearValue: number | null;
  monthValue: number | null;
  dayValue: number | null;
  onYearChange: (v: number | null) => void;
  onMonthChange: (v: number | null) => void;
  onDayChange: (v: number | null) => void;
  disabled?: boolean;
  label: string;
}

// DataTable.tsx — generic, typed per entity
interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

// PersonForm.tsx
interface PersonFormProps {
  mode: "create" | "edit";
  initial?: PersonDetail;
  projectId: string;
  onSuccess: (person: PersonDetail) => void;
}
```

### Server vs. Client boundary

| Component                    | Type   | Reason                                    |
| ---------------------------- | ------ | ----------------------------------------- |
| `persons/page.tsx`           | Server | Reads searchParams; calls Prisma directly |
| `persons/new/page.tsx`       | Server | Shell only; passes projectId to form      |
| `persons/[id]/page.tsx`      | Server | Fetches person data SSR                   |
| `persons/[id]/edit/page.tsx` | Server | Prefetches person data, passes to form    |
| `PersonForm.tsx`             | Client | react-hook-form requires browser          |
| `PersonNameList.tsx`         | Client | Dynamic add/remove rows                   |
| `CertaintySelector.tsx`      | Client | Interactive state                         |
| `PartialDateInput.tsx`       | Client | Controlled inputs                         |
| `DataTableSearch.tsx`        | Client | Debounce, router.push                     |
| `DataTablePagination.tsx`    | Client | router.push on page change                |
| `BulkDeleteDialog.tsx`       | Client | Dialog + checkbox state                   |
| `PersonDetailCard.tsx`       | Server | Static attribute display                  |
| `PersonDetailTabs.tsx`       | Client | Tab switching state                       |

---

## 5. UI/UX Specification

### 5.1 Person List Page (`/[locale]/persons`)

URL params: `?page=1&search=&sort=last_name&order=asc`

```
┌──────────────────────────────────────────────────────────────────┐
│ AppShell (TopBar + Sidebar)                                      │
├──────────────────────────────────────────────────────────────────┤
│ Personen                                           [+ Neue Person]│
│                                                                  │
│ [🔍 Nach Name suchen...        ]        [Bulk Delete (N selected)]│
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │ ☐ │ Nachname ↑ │ Vorname │ Geburtsdatum │ Sterbedatum │ … │  │
│ ├─────────────────────────────────────────────────────────────┤  │
│ │ ☐ │ Maier     │ Karl    │ 1848         │ 15. Jan 1905│ … │  │
│ │ ☐ │ Müller    │ Anna    │ März 1872    │ —           │ … │  │
│ │ ☐ │ Schmidt   │ —       │ —            │ —           │ … │  │
│ └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
│                    [< Zurück]  Seite 1 / 4  [Weiter >]          │
└──────────────────────────────────────────────────────────────────┘
```

- Sort by clicking column headers → updates URL param
- Search input debounces 300ms → updates URL param → SSR re-renders table
- Checkbox column → selecting any row shows "N ausgewählt" + [Löschen] button
- Row click → navigate to `/persons/[id]`
- Empty state: "Noch keine Personen. [Erste Person anlegen]"
- Loading state: table skeleton (5 placeholder rows)

### 5.2 Create / Edit Person Form

Full-width form, max-w-2xl centered.

```
┌────────────────────────────────────────────────────────────┐
│ Neue Person anlegen                                         │
├────────────────────────────────────────────────────────────┤
│ Vorname [                    ]  Nachname [               ]  │
│                                                             │
│ ─── Geburtsdaten ───────────────────────────────────────── │
│ Jahr [    ]  Monat [── Kein ──▼]  Tag [  ]                 │
│ Sicherheit:  [● Sicher] [◎ Wahrscheinl.] [◯ Möglich] [?]  │
│ Geburtsort [ free text                    ]                 │
│                                                             │
│ ─── Sterbedaten ────────────────────────────────────────── │
│ (same structure)                                            │
│                                                             │
│ ─── Weitere Namen ──────────────────────────────────────── │
│ Name [               ]  Sprache [de ▼]  [Primär ○]  [✕]   │
│ Name [               ]  Sprache [la ▼]  [Primär ○]  [✕]   │
│ [+ Name hinzufügen]                                         │
│                                                             │
│ ─── Notizen ────────────────────────────────────────────── │
│ [ textarea                                              ]   │
│                                                             │
│                                [Abbrechen]  [Person speichern] │
└────────────────────────────────────────────────────────────┘
```

- `birth_month` select: disabled until `birth_year` filled; options "Kein Monat" + Jan–Dec
- `birth_day` input: disabled until `birth_month` selected
- `CertaintySelector` is a 4-button row; default is UNKNOWN
- Names list: minimum 0 entries (first_name + last_name can be the only name)
- At most one primary radio checked at a time
- Validation errors shown inline below each field
- On success: redirect to person detail page; toast "Person gespeichert"
- On error: toast with error message; form stays open

### 5.3 Person Detail Page (`/[locale]/persons/[id]`)

```
┌────────────────────────────────────────────────────────────┐
│ Karl Maier                          [Bearbeiten]  [Löschen] │
├────────────────────────────────────────────────────────────┤
│ [Attribute] [Weitere Namen] [Ereignisse] [Personen] [Quellen]│
├────────────────────────────────────────────────────────────┤
│ ATTRIBUTE TAB (default)                                     │
│                                                             │
│ Geburtsdatum   1848  (Wahrscheinlich)                       │
│ Geburtsort     Wien                                         │
│ Sterbedatum    15. Januar 1905  (Sicher)                    │
│ Sterbeort      —                                            │
│ Notizen        [notes text]                                 │
│ Erstellt am    08.03.2026  von admin@evidoxa.dev            │
│                                                             │
│ WEITERE NAMEN TAB                                           │
│ Carolus Magnus  (Latein)                                    │
│ Karl von Österreich  (Deutsch)  [Primär]                    │
│                                                             │
│ EREIGNISSE TAB                                              │
│ 3 Beziehungen — vollständig in Epic 2.4 verfügbar           │
│                                                             │
│ PERSONEN / QUELLEN TABS (same placeholder)                  │
└────────────────────────────────────────────────────────────┘
```

- Delete button → inline confirm dialog (shadcn AlertDialog) → soft-delete → redirect to list with toast
- `PersonDetailTabs` is a Client Component (tab state); each tab panel content is server-rendered HTML passed as children
- Dates display using `formatPartialDate()` with certainty label in parentheses
- "—" for any null field

### 5.4 Bulk Delete Dialog

```
┌──────────────────────────────────────┐
│ ⚠ 3 Personen löschen?               │
│                                      │
│ Diese Aktion kann rückgängig gemacht │
│ werden, solange Sie die App nutzen.  │
│                                      │
│        [Abbrechen]  [Löschen]        │
└──────────────────────────────────────┘
```

---

## 6. State & Data Flow

```
URL searchParams ──► Server Component (persons/page.tsx)
                           │
                           ▼ check Redis cache
                    cache HIT ──► return cached JSON
                           │
                    cache MISS ──► Prisma query (with soft-delete extension)
                           │           │
                           │           ▼ store in Redis (60s TTL)
                           │
                           ▼
                     PersonSummary[]  ──► DataTable (SSR HTML)
                                                │
                     DataTableSearch (Client)  ◄─┤ (debounce 300ms)
                     router.push(?search=...)  ──► re-render Server Component
                     DataTablePagination        ──► router.push(?page=2)

User creates/edits person:
  PersonForm (Client)
    │ react-hook-form + Zod validation
    ▼
  fetch POST /api/persons
    │ sanitize() text fields
    │ Prisma create (transaction: person + person_names)
    ▼
  Invalidate Redis cache (person-list:{project_id}:*)
    ▼
  Redirect to /persons/[id] with toast
```

---

## 7. i18n

Add the following to `messages/de.json` and `messages/en.json`.

### German (`de.json`)

```json
{
  "persons": {
    "title": "Personen",
    "create": "Neue Person",
    "edit_title": "Person bearbeiten",
    "create_title": "Neue Person anlegen",
    "save": "Person speichern",
    "delete": "Person löschen",
    "delete_confirm_title": "Person löschen?",
    "delete_confirm_body": "Diese Person wird als gelöscht markiert.",
    "saved_toast": "Person gespeichert.",
    "deleted_toast": "Person gelöscht.",
    "fields": {
      "first_name": "Vorname",
      "last_name": "Nachname",
      "birth_date": "Geburtsdatum",
      "birth_date_certainty": "Sicherheit Geburtsdatum",
      "birth_place": "Geburtsort",
      "death_date": "Sterbedatum",
      "death_date_certainty": "Sicherheit Sterbedatum",
      "death_place": "Sterbeort",
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
    "names": {
      "section_title": "Weitere Namen",
      "add": "Name hinzufügen",
      "remove": "Entfernen",
      "name_placeholder": "Alternativer Name",
      "language": "Sprache",
      "language_placeholder": "de, la, en…",
      "is_primary": "Primär"
    },
    "certainty": {
      "CERTAIN": "Sicher",
      "PROBABLE": "Wahrscheinlich",
      "POSSIBLE": "Möglich",
      "UNKNOWN": "Unbekannt"
    },
    "list": {
      "search_placeholder": "Nach Name suchen…",
      "empty": "Noch keine Personen.",
      "empty_action": "Erste Person anlegen",
      "columns": {
        "last_name": "Nachname",
        "first_name": "Vorname",
        "birth_date": "Geburtsdatum",
        "death_date": "Sterbedatum"
      }
    },
    "bulk": {
      "selected": "{count} ausgewählt",
      "delete_button": "Löschen",
      "confirm_title": "{count} Personen löschen?",
      "confirm_body": "Diese Aktion löscht {count} Personen. Kontaktieren Sie den Administrator zur Wiederherstellung.",
      "deleted_toast": "{count} Personen gelöscht."
    },
    "detail": {
      "tabs": {
        "attributes": "Attribute",
        "names": "Weitere Namen",
        "events": "Ereignisse",
        "persons": "Personen",
        "sources": "Quellen"
      },
      "relations_placeholder": "Beziehungen werden in einem späteren Update verfügbar."
    },
    "errors": {
      "name_required": "Bitte Vor- oder Nachname eingeben.",
      "month_requires_year": "Monat erfordert ein Jahr.",
      "day_requires_month": "Tag erfordert einen Monat.",
      "invalid_month": "Ungültiger Monat (1–12).",
      "invalid_day": "Ungültiger Tag (1–31).",
      "not_found": "Person nicht gefunden.",
      "save_failed": "Speichern fehlgeschlagen. Bitte erneut versuchen."
    }
  }
}
```

### English (`en.json`) — equivalent values

```json
{
  "persons": {
    "title": "Persons",
    "create": "New Person",
    "edit_title": "Edit Person",
    "create_title": "Create New Person",
    "save": "Save Person",
    "delete": "Delete Person",
    "delete_confirm_title": "Delete person?",
    "delete_confirm_body": "This person will be marked as deleted.",
    "saved_toast": "Person saved.",
    "deleted_toast": "Person deleted.",
    "fields": {
      "first_name": "First Name",
      "last_name": "Last Name",
      "birth_date": "Birth Date",
      "birth_date_certainty": "Birth Date Certainty",
      "birth_place": "Birth Place",
      "death_date": "Death Date",
      "death_date_certainty": "Death Date Certainty",
      "death_place": "Death Place",
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
    "names": {
      "section_title": "Name Variants",
      "add": "Add Name",
      "remove": "Remove",
      "name_placeholder": "Alternate Name",
      "language": "Language",
      "language_placeholder": "de, la, en…",
      "is_primary": "Primary"
    },
    "certainty": {
      "CERTAIN": "Certain",
      "PROBABLE": "Probable",
      "POSSIBLE": "Possible",
      "UNKNOWN": "Unknown"
    },
    "list": {
      "search_placeholder": "Search by name…",
      "empty": "No persons yet.",
      "empty_action": "Create first person",
      "columns": {
        "last_name": "Last Name",
        "first_name": "First Name",
        "birth_date": "Birth Date",
        "death_date": "Death Date"
      }
    },
    "bulk": {
      "selected": "{count} selected",
      "delete_button": "Delete",
      "confirm_title": "Delete {count} persons?",
      "confirm_body": "This will delete {count} persons. Contact an administrator to restore them.",
      "deleted_toast": "{count} persons deleted."
    },
    "detail": {
      "tabs": {
        "attributes": "Attributes",
        "names": "Name Variants",
        "events": "Events",
        "persons": "Persons",
        "sources": "Sources"
      },
      "relations_placeholder": "Relations will be available in a future update."
    },
    "errors": {
      "name_required": "Please enter a first or last name.",
      "month_requires_year": "Month requires a year.",
      "day_requires_month": "Day requires a month.",
      "invalid_month": "Invalid month (1–12).",
      "invalid_day": "Invalid day (1–31).",
      "not_found": "Person not found.",
      "save_failed": "Failed to save. Please try again."
    }
  }
}
```

---

## 8. Testing Plan

### Unit Tests (Vitest + RTL) — target 80%+ on new code

**`src/lib/date.test.ts`**

- `formatPartialDate(1848, null, null, 'de')` → `"1848"`
- `formatPartialDate(1848, 3, null, 'de')` → `"März 1848"`
- `formatPartialDate(1848, 3, 15, 'de')` → `"15. März 1848"`
- `formatPartialDate(1848, 3, 15, 'en')` → `"March 15, 1848"`
- `formatPartialDate(null, null, null, 'de')` → `"—"`

**`src/lib/sanitize.test.ts`**

- Verifies `sanitize-html` strips `<script>` tags
- Verifies plain text is returned unchanged
- Verifies `<b>` is stripped (only plain text allowed for person fields)

**`src/components/research/CertaintySelector.test.tsx`**

- Renders 4 buttons
- Clicking "Probable" fires `onChange` with `"PROBABLE"`
- Correct button has `aria-pressed=true`
- `disabled` prop disables all buttons

**`src/components/research/PartialDateInput.test.tsx`**

- Month select is disabled when year is empty
- Day input is disabled when month is empty
- Changing year calls `onYearChange`
- Changing month to null clears day via `onDayChange(null)`

**`src/app/api/persons/route.test.ts`** (mock Prisma via `vi.mock`)

- `GET /api/persons` — returns paginated list
- `GET /api/persons` with `search=Maier` — calls `findMany` with correct `OR` clause
- `POST /api/persons` — validates body, calls `db.person.create`, invalidates cache
- `POST /api/persons` with missing name — returns `400`
- `POST /api/persons` with `birth_month` but no `birth_year` — returns `400`

**`src/app/api/persons/[id]/route.test.ts`**

- `GET` returns 404 for soft-deleted person
- `PUT` replaces `PersonName` records via transaction
- `DELETE` sets `deleted_at`

**`src/app/api/persons/bulk/route.test.ts`**

- Bulk delete sets `deleted_at` on all provided IDs
- Returns count of deleted records
- Rejects IDs from different project

**Soft-delete extension test (`src/lib/db.test.ts`)**

- `findMany` on Person excludes records with `deleted_at` set
- `findUnique` on Person still returns soft-deleted records (by design — for admin restore)

### E2E Tests (Playwright) — `e2e/persons.spec.ts`

```
TC-P-01: Create person with year-only birth date and PROBABLE certainty
TC-P-02: Create person with full birth date (year+month+day)
TC-P-03: Create person with name variant (Latin, language=la)
TC-P-04: Search by last name finds correct person
TC-P-05: Search by name variant finds person
TC-P-06: Edit person — change death date certainty from UNKNOWN to CERTAIN
TC-P-07: Delete single person from detail page → redirects to list
TC-P-08: Bulk select 2 persons → confirm delete → both removed from list
TC-P-09: Person detail page shows correct attribute values
TC-P-10: Person detail name variants tab shows alternate names
TC-P-11: Sort list by first name asc/desc
TC-P-12: Pagination: 26 persons → navigate to page 2
```

---

## 9. File Structure

New files created by this epic:

```
src/
  app/[locale]/(app)/
    persons/
      page.tsx
      new/
        page.tsx
      [id]/
        page.tsx
        edit/
          page.tsx

  app/api/
    persons/
      route.ts                   # GET list, POST create
      [id]/
        route.ts                 # GET, PUT, DELETE
      bulk/
        route.ts                 # POST bulk delete

  components/research/
    CertaintySelector.tsx
    PartialDateInput.tsx
    DataTable.tsx
    DataTablePagination.tsx
    DataTableSearch.tsx
    PersonForm.tsx
    PersonNameList.tsx
    BulkDeleteDialog.tsx
    PersonDetailCard.tsx
    PersonDetailTabs.tsx

  lib/
    date.ts                      # formatPartialDate() utility (new)

  types/
    person.ts                    # TypeScript interfaces for person domain

  test/ (unit tests)
    lib/
      date.test.ts
      sanitize.test.ts
    components/
      CertaintySelector.test.tsx
      PartialDateInput.test.tsx
    api/
      persons.route.test.ts
      persons-id.route.test.ts
      persons-bulk.route.test.ts

e2e/
  persons.spec.ts

messages/
  de.json                        # persons.* namespace added
  en.json                        # persons.* namespace added
```

### Modified files

| File                  | Change                                              |
| --------------------- | --------------------------------------------------- |
| `src/lib/db.ts`       | Add Prisma soft-delete extension for `person` model |
| `src/lib/sanitize.ts` | Replace strip-tags stub with `sanitize-html`        |
| `messages/de.json`    | Add `persons` namespace                             |
| `messages/en.json`    | Add `persons` namespace                             |
| `package.json`        | Add `sanitize-html`, `@types/sanitize-html`         |

---

## 10. Implementation Notes

### Partial date validation is cross-field

Zod's base `.object()` schema can't easily express cross-field constraints like "month requires year". Use `.superRefine()`:

```typescript
const personSchema = z
  .object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    birth_year: z.number().int().min(1).max(2100).optional(),
    birth_month: z.number().int().min(1).max(12).optional(),
    birth_day: z.number().int().min(1).max(31).optional(),
    // ...
  })
  .superRefine((data, ctx) => {
    if (!data.first_name && !data.last_name) {
      ctx.addIssue({ code: "custom", path: ["first_name"], message: "name_required" });
    }
    if (data.birth_month && !data.birth_year) {
      ctx.addIssue({ code: "custom", path: ["birth_month"], message: "month_requires_year" });
    }
    if (data.birth_day && !data.birth_month) {
      ctx.addIssue({ code: "custom", path: ["birth_day"], message: "day_requires_month" });
    }
    // repeat for death_*
  });
```

### PersonName replacement via transaction

```typescript
await db.$transaction([
  db.personName.deleteMany({ where: { person_id: id } }),
  db.personName.createMany({ data: names.map((n) => ({ ...n, person_id: id })) }),
]);
```

### Soft-delete extension in db.ts

The extension must be applied after `new PrismaClient()` and exported as `db`. Ensure all existing imports of `db` from `src/lib/db.ts` continue to work (no breaking export name change).

### Project scope for Epic 2.1 (pre-Epic 3.1)

Since the multi-project workspace is Epic 3.1, for Epic 2.1:

1. On new user registration, the seed script creates a default project and `UserProject` record.
2. The session JWT is extended with `projectId` — the first project where the user is OWNER/EDITOR.
3. API routes read `projectId` from the session. If absent, return `403`.

This is a **temporary scaffold** replaced by the project switcher in Epic 3.1. Document clearly with `// TODO: Epic 3.1 — replace with project switcher` comments.

### Cache invalidation pattern

```typescript
import { cache } from "@/lib/cache";

async function invalidatePersonListCache(projectId: string) {
  await cache.invalidatePattern(`person-list:${projectId}:*`);
}
```

### sanitize-html configuration for person text fields

Person text fields (notes, first_name, last_name, birth_place, death_place, name variants) should allow **no HTML at all** — plain text only:

```typescript
import sanitizeHtml from "sanitize-html";

export function sanitize(input: string): string {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
}
```

---

## 11. Acceptance Criteria

1. **AC-01:** Navigating to `/de/persons` renders a table of persons with Last Name, First Name, Birth Date, Death Date columns.
2. **AC-02:** Clicking "Neue Person" opens a form; saving with first_name="Karl", last_name="Maier", birth_year=1848, birth_date_certainty=PROBABLE creates the person and redirects to its detail page.
3. **AC-03:** The person detail page shows "1848 (Wahrscheinlich)" for the birth date.
4. **AC-04:** Adding a name variant "Carolus Magnus" with language "la" and saving: the detail page "Weitere Namen" tab shows the variant.
5. **AC-05:** Searching "Maier" in the list search box filters the table to show only persons whose name matches.
6. **AC-06:** Searching by a name variant value (not first/last name) finds the person.
7. **AC-07:** Clicking "Bearbeiten" on the detail page opens the form pre-populated with the person's data.
8. **AC-08:** Editing the death date certainty from UNKNOWN to CERTAIN and saving updates the detail page.
9. **AC-09:** Clicking "Person löschen" shows a confirm dialog; confirming soft-deletes the person and redirects to the list (person no longer visible).
10. **AC-10:** Selecting 2 persons via checkboxes and clicking "Löschen" shows a bulk confirm dialog; confirming soft-deletes both and they disappear from the list.
11. **AC-11:** `GET /api/persons` returns `{ data: [], pagination: { page: 1, pageSize: 25, total: 0, totalPages: 0 } }` for an empty project.
12. **AC-12:** `POST /api/persons` with no first_name, last_name, or names returns HTTP 400.
13. **AC-13:** `POST /api/persons` with birth_month=3 but no birth_year returns HTTP 400.
14. **AC-14:** Switching locale to `/en/persons` shows all UI text in English (column headers, buttons, empty state).
15. **AC-15:** The `/de/persons` page renders with no hydration mismatch errors in the browser console.
16. **AC-16:** All Vitest unit tests pass (`pnpm test`).
17. **AC-17:** All 12 E2E tests in `persons.spec.ts` pass on Chromium.
18. **AC-18:** `GET /api/health` still returns `status: "ok"` after this epic is deployed (no regressions).

---

## 12. Out of Scope

| Item                                                             | Moved to |
| ---------------------------------------------------------------- | -------- |
| Location FK linking (`birth_location_id`, `death_location_id`)   | Epic 3.2 |
| PropertyEvidence UI (attach sources to person properties)        | Epic 2.4 |
| Relations tabs full content (events, persons, sources of person) | Epic 2.4 |
| PostgreSQL `tsvector` full-text search index                     | Epic 4.1 |
| CSV/XLSX import of persons                                       | Epic 3.4 |
| CSV export of persons                                            | Epic 5.1 |
| Duplicate detection                                              | Epic 5.2 |
| Event type management (EventType table)                          | Epic 2.2 |
| Project switcher UI                                              | Epic 3.1 |
| Zotero / literature linking                                      | Epic 3.3 |
| Storybook documentation                                          | Epic 5.4 |
