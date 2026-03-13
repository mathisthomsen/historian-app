# Epic 2.3 — Source Management (Primary Sources)
## Specification

**Phase:** 2 — Core Research Loop
**Deliverable:** Full CRUD for primary sources (archival documents, letters, records) with reliability scoring, filtering, and a detail page showing evidence counts.
**Verifiable:** Create a source (archival letter), set reliability to HIGH, view detail page, edit title and reliability, search by author, filter list by reliability, bulk delete two sources.

---

## 1. Technology Stack

No new packages required. All dependencies are already installed from Epics 2.1/2.2.

| Concern | Solution (already installed) |
|---|---|
| Forms | react-hook-form + @hookform/resolvers |
| Validation | zod |
| Sanitization | sanitize-html (upgraded in Epic 2.1) |
| Caching | @upstash/redis via `src/lib/cache.ts` |
| Auth guard | `src/lib/auth-guard.ts` |
| Soft-delete | Prisma extension in `src/lib/db.ts` (extend to source) |

---

## 2. Data Model / Schema

### Existing `Source` model (no migration needed)

```prisma
model Source {
  id            String @id @default(cuid())
  project_id    String
  created_by_id String?

  title       String
  type        String            // free-text; seeded suggestions provided
  author      String?
  date        String?           // free-text archival date: "c. March 1848"
  repository  String?
  call_number String?
  url         String?
  reliability SourceReliability @default(UNKNOWN)
  notes       String?

  deleted_at DateTime?
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt

  project           Project            @relation(...)
  created_by        User?              @relation(...)
  relation_evidence RelationEvidence[]
  property_evidence PropertyEvidence[] @relation(...)
}

enum SourceReliability {
  HIGH
  MEDIUM
  LOW
  UNKNOWN
}
```

### Soft-delete extension

Extend the Prisma client extension in `src/lib/db.ts` to add `source` alongside the existing `person` and `event` models. The extension automatically filters `deleted_at: null` on `findMany` and `findFirst` calls via the `db` extended client. The raw `prisma` client remains unfiltered (for admin/count queries).

```typescript
// src/lib/db.ts — extend the existing xprisma definition:
const xprisma = prisma.$extends({
  query: {
    person: { ... },   // existing
    event:  { ... },   // existing
    source: {          // NEW in Epic 2.3
      async findMany({ args, query }) {
        args.where = { deleted_at: null, ...args.where };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { deleted_at: null, ...args.where };
        return query(args);
      },
    },
  },
});
```

### Seeded source type suggestions (no DB table — purely UI-side constants)

```typescript
// src/lib/source-types.ts
export const SOURCE_TYPE_SUGGESTIONS = [
  "archival_document",
  "letter",
  "newspaper",
  "official_record",
  "photograph",
  "other",
] as const;
```

---

## 3. API Contract

### `GET /api/sources`

**Auth:** Required
**Cache:** Redis, 60s TTL, key: `source-list:{projectId}:{page}:{pageSize}:{search}:{sort}:{order}:{reliability}:{type}`
**Cache-Control response header:** `no-store`

Query parameters (all optional except inferred `projectId`):

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int ≥ 1 | `1` | Page number |
| `pageSize` | int 1–100 | `25` | Results per page |
| `search` | string | — | ILIKE match on `title` OR `author` |
| `reliability` | comma-sep enum | — | Filter by `SourceReliability` values |
| `type` | string | — | Exact (case-insensitive) match on `type` field |
| `sort` | `title\|author\|created_at` | `created_at` | Sort column |
| `order` | `asc\|desc` | `desc` | Sort direction |
| `projectId` | string | session default | Override project (Epic 3.1 replaces this) |

Response `200`:
```typescript
interface SourceListResponse {
  data: SourceSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface SourceSummary {
  id: string;
  title: string;
  type: string;
  author: string | null;
  reliability: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  created_at: string; // ISO 8601
}
```

Errors: `401` Unauthorized, `400` Invalid query params, `403` No project.

---

### `POST /api/sources`

**Auth:** Required (OWNER or EDITOR role on project)
**Cache-Control:** `no-store`
**Cache invalidation:** `source-list:{projectId}:` prefix on success

Request body:
```typescript
interface CreateSourceInput {
  project_id: string;      // required
  title: string;           // required, min 1
  type: string;            // required, min 1
  author?: string | null;
  date?: string | null;
  repository?: string | null;
  call_number?: string | null;
  url?: string | null;     // validated as URL if present
  reliability?: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN"; // default UNKNOWN
  notes?: string | null;
}
```

Response `201`: Full `SourceDetail` object (see GET /api/sources/[id] shape).

Errors: `401`, `400` Validation failed, `403` Not OWNER/EDITOR.

Sanitization: `sanitize()` applied to `title`, `author`, `date`, `repository`, `call_number`, `notes` before DB write. `url` stored as-is (validated by Zod, not sanitized).

---

### `GET /api/sources/[id]`

**Auth:** Required (project member)
**Cache-Control:** `no-store`

Response `200`:
```typescript
interface SourceDetail {
  id: string;
  title: string;
  type: string;
  author: string | null;
  date: string | null;
  repository: string | null;
  call_number: string | null;
  url: string | null;
  reliability: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  notes: string | null;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
  _count: {
    relation_evidence: number;
    property_evidence: number;
  };
}
```

Errors: `401`, `403` Not a project member, `404` Not found or deleted.

---

### `PUT /api/sources/[id]`

**Auth:** Required (OWNER or EDITOR)
**Cache-Control:** `no-store`
**Cache invalidation:** `source-list:{projectId}:` prefix on success

Request body: same fields as `CreateSourceInput` minus `project_id` (all optional for partial update).

Response `200`: Updated `SourceDetail`.

Errors: `401`, `400` Validation, `403`, `404`.

---

### `DELETE /api/sources/[id]`

**Auth:** Required (OWNER or EDITOR)
**Cache-Control:** `no-store`
**Cache invalidation:** `source-list:{projectId}:` prefix

Behavior: soft-delete — sets `deleted_at = now()`. Does **not** cascade-delete `RelationEvidence` or `PropertyEvidence` rows (those are preserved as orphaned evidence, consistent with the schema's `onDelete: Cascade` behavior only for hard deletes).

Response `200`: `{ success: true }`.

Errors: `401`, `403`, `404`.

---

### `POST /api/sources/bulk`

**Auth:** Required (OWNER or EDITOR)
**Cache-Control:** `no-store`
**Cache invalidation:** `source-list:{projectId}:` prefix

Request body:
```typescript
interface BulkDeleteInput {
  ids: string[];      // min 1, max 100
  project_id: string;
}
```

Behavior: soft-delete all `ids` that belong to `project_id` and are not already deleted. Silently skips IDs not found or already deleted.

Response `200`: `{ deleted: number }` — count of actually deleted records.

Errors: `401`, `400`, `403`.

---

## 4. Component Architecture

### New files

```
src/
  types/
    source.ts                          # SourceSummary, SourceDetail, CreateSourceInput, SourceFilterState
  lib/
    source-types.ts                    # SOURCE_TYPE_SUGGESTIONS constant
  components/research/
    SourceForm.tsx                     # client — react-hook-form create/edit form
    SourceTable.tsx                    # client — DataTable with search, filters, bulk delete
    SourceDetailTabs.tsx               # client — Details tab + Relations placeholder tab
    DeleteSourceButton.tsx             # client — confirm dialog + DELETE call
    ReliabilityBadge.tsx               # client — color-coded badge for SourceReliability
  app/[locale]/(app)/sources/
    page.tsx                           # server — source list page
    new/
      page.tsx                         # server — new source page (renders SourceForm)
    [id]/
      page.tsx                         # server — source detail page
      edit/
        page.tsx                       # server — edit source page (renders SourceForm)
  app/api/sources/
    route.ts                           # GET (list) + POST (create)
    route.test.ts
    [id]/
      route.ts                         # GET + PUT + DELETE
      route.test.ts
    bulk/
      route.ts                         # POST (bulk delete)
      route.test.ts
```

### Component props interfaces

```typescript
// SourceForm.tsx
interface SourceFormProps {
  projectId: string;
  locale: string;
  initial?: SourceDetail; // undefined = create mode
}

// SourceTable.tsx
interface SourceTableProps {
  projectId: string;
  locale: string;
}

// SourceDetailTabs.tsx
interface SourceDetailTabsProps {
  source: SourceDetail;
  locale: string;
}

// DeleteSourceButton.tsx
interface DeleteSourceButtonProps {
  id: string;
  locale: string;
  label: string;
}

// ReliabilityBadge.tsx
interface ReliabilityBadgeProps {
  reliability: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
}
```

### Server vs. client

| Component | Type | Reason |
|---|---|---|
| `sources/page.tsx` | Server | SSR data fetch, session check |
| `sources/new/page.tsx` | Server | Thin wrapper; gets projectId from session |
| `sources/[id]/page.tsx` | Server | SSR detail fetch |
| `sources/[id]/edit/page.tsx` | Server | SSR prefetch of existing source |
| `SourceForm` | Client | react-hook-form requires interactivity |
| `SourceTable` | Client | Search input, filter state, row selection |
| `SourceDetailTabs` | Client | Tab switching state |
| `DeleteSourceButton` | Client | Confirm dialog, mutation |
| `ReliabilityBadge` | Client (or RSC) | Pure display; no interactivity needed — can be RSC |

---

## 5. UI/UX Specification

### Source list page — `/[locale]/sources`

**Layout:** full-width DataTable with toolbar above.

**Toolbar:**
```
[ Search: "Titel oder Autor suchen…" ]  [ Type ▼ ]  [ Reliability ▼ ]  [ + Neue Quelle ]
```
- Search input triggers debounced URL param update (same pattern as events/persons list)
- Type filter: dropdown of known source type suggestions + "All types"
- Reliability filter: multi-select checkboxes (HIGH / MEDIUM / LOW / UNKNOWN)
- All filters and pagination state live in URL search params (SSR-compatible)

**Table columns:**

| Column | Sortable | Notes |
|---|---|---|
| Checkbox | — | Row selection for bulk delete |
| Title | ✓ | Link to detail page |
| Type | — | Displayed as small tag/pill |
| Author | — | Truncated to 40 chars |
| Reliability | — | `<ReliabilityBadge>` |
| Created | ✓ | Localized date |
| Actions | — | Edit icon, delete icon |

**Bulk delete:** Appears when ≥1 row selected. Shows "N Quelle(n) löschen" button → confirm dialog.

**Empty state:** Illustration + "Noch keine Quellen angelegt. Erste Quelle erstellen →"

**Loading state:** Skeleton rows (same as persons/events table skeleton).

**Pagination:** Same shadcn Pagination component as persons/events.

---

### Source form — `/[locale]/sources/new` and `/[locale]/sources/[id]/edit`

Two-column layout on md+ screens; single column on mobile.

**Left column (primary fields):**
- Title `*` — text input
- Type `*` — shadcn Command+Popover combo-box; shows `SOURCE_TYPE_SUGGESTIONS` as options; user can type a custom value; selected value displayed as a tag
- Author — text input
- Reliability — four-button selector (same component style as CertaintySelector; maps HIGH/MEDIUM/LOW/UNKNOWN to green/yellow/red/grey)

**Right column (archival metadata):**
- Date — text input with hint: "z. B. ca. März 1848, Sommer 1790"
- Repository — text input
- Call Number — text input
- URL — text input; inline error if not a valid URL

**Full width (bottom):**
- Notes — textarea

**Submit / Cancel buttons:**
- Create: "Quelle erstellen" / "Source erstellen"
- Edit: "Änderungen speichern" / "Save changes"
- Cancel: navigates back to list or detail page

Validation errors shown inline beneath each field (react-hook-form + Zod).

---

### Source detail page — `/[locale]/sources/[id]`

**Header:**
```
[ ← Zurück zu Quellen ]
Source Title                              [ Bearbeiten ]  [ Löschen ]
```

**Tabs:**

**Tab 1 — Details:**
All attributes displayed in a two-column grid:
- Title, Type (tag), Author, Reliability (badge)
- Date, Repository, Call Number, URL (clickable link)
- Notes (full width)
- Created by, Created at, Updated at (footer metadata row)

**Tab 2 — Verknüpfungen (Relations):**
Placeholder content:
```
[Info icon]  Verknüpfungen werden nach Abschluss von Epic 2.4 hier angezeigt.
             ({N} Verknüpfungen • {M} Quellenbelege)
```
Where N = `_count.relation_evidence` and M = `_count.property_evidence` from the API response. If both are 0, omit the counts line.

---

### `ReliabilityBadge` visual spec

```
HIGH    → variant="outline" className="border-green-600 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300"
MEDIUM  → variant="outline" className="border-yellow-600 text-yellow-700 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-300"
LOW     → variant="outline" className="border-red-600 text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300"
UNKNOWN → variant="secondary" (default muted style)
```

---

## 6. State & Data Flow

```
URL params (page, search, reliability, type, sort, order)
    ↓ SSR fetch (server component)
    → GET /api/sources → Redis cache or Prisma query
    ↓
SourceTable (client) renders rows
    → User edits search/filter → updates URL params → triggers RSC re-render
    → User clicks "New" → navigates to /sources/new
    → User clicks row → navigates to /sources/[id]
    → User selects rows + bulk delete → POST /api/sources/bulk → cache.invalidateByPrefix → revalidatePath

SourceForm (client):
    → react-hook-form state
    → POST /api/sources (create) or PUT /api/sources/[id] (edit)
    → On success: router.push to detail page (create) or detail page (edit)
    → Cache invalidated server-side on write

DeleteSourceButton (client):
    → Dialog confirm → DELETE /api/sources/[id]
    → On success: router.push to /sources list
    → Cache invalidated server-side
```

---

## 7. i18n

New keys in `messages/de.json` and `messages/en.json` under the `sources` namespace:

| Key | German | English |
|---|---|---|
| `sources.title` | Quellen | Sources |
| `sources.list_title` | Alle Quellen | All Sources |
| `sources.new_title` | Neue Quelle | New Source |
| `sources.edit_title` | Quelle bearbeiten | Edit Source |
| `sources.delete` | Quelle löschen | Delete Source |
| `sources.delete_confirm` | Diese Quelle wirklich löschen? | Really delete this source? |
| `sources.bulk_delete_confirm` | {count} Quelle(n) löschen? | Delete {count} source(s)? |
| `sources.search_placeholder` | Titel oder Autor suchen… | Search by title or author… |
| `sources.empty_state` | Noch keine Quellen angelegt. | No sources yet. |
| `sources.field_title` | Titel | Title |
| `sources.field_type` | Typ | Type |
| `sources.field_author` | Autor | Author |
| `sources.field_date` | Datum | Date |
| `sources.field_date_hint` | z. B. ca. März 1848 | e.g. c. March 1848 |
| `sources.field_repository` | Archiv / Repository | Repository / Archive |
| `sources.field_call_number` | Signatur | Call Number |
| `sources.field_url` | URL | URL |
| `sources.field_reliability` | Zuverlässigkeit | Reliability |
| `sources.field_notes` | Notizen | Notes |
| `sources.reliability_high` | Hoch | High |
| `sources.reliability_medium` | Mittel | Medium |
| `sources.reliability_low` | Niedrig | Low |
| `sources.reliability_unknown` | Unbekannt | Unknown |
| `sources.type_archival_document` | Archivdokument | Archival Document |
| `sources.type_letter` | Brief | Letter |
| `sources.type_newspaper` | Zeitung | Newspaper |
| `sources.type_official_record` | Amtliche Urkunde | Official Record |
| `sources.type_photograph` | Fotografie | Photograph |
| `sources.type_other` | Sonstiges | Other |
| `sources.type_placeholder` | Typ auswählen oder eingeben… | Select or type a source type… |
| `sources.tab_details` | Details | Details |
| `sources.tab_relations` | Verknüpfungen | Relations |
| `sources.relations_placeholder` | Verknüpfungen werden nach Abschluss von Epic 2.4 angezeigt. | Relations will be populated in Epic 2.4. |
| `sources.sidebar_link` | Quellen | Sources |

Also add "Quellen" / "Sources" to the sidebar navigation translation keys (same namespace as existing `nav.*` keys).

---

## 8. Testing Plan

### Unit tests (`src/app/api/sources/`)

**`route.test.ts` (GET /api/sources):**
- Returns paginated list for authenticated user
- `search` filters on title (case-insensitive)
- `search` filters on author (case-insensitive)
- `reliability=HIGH,MEDIUM` filters correctly
- `type=letter` filters correctly
- Unauthenticated request returns 401
- Invalid `pageSize` returns 400
- Returns cached result on second call (mock `cache.get`)

**`[id]/route.test.ts` (GET/PUT/DELETE):**
- GET returns full SourceDetail with `_count`
- GET returns 404 for soft-deleted source
- GET returns 403 for non-member
- PUT updates fields; sanitizes text inputs
- PUT validates URL format
- DELETE soft-deletes (sets `deleted_at`)
- DELETE returns 404 for already-deleted source

**`bulk/route.test.ts`:**
- Bulk deletes 2 sources; returns `{ deleted: 2 }`
- Silently skips IDs not belonging to project
- Returns 400 for empty `ids` array

**`ReliabilityBadge.test.tsx`:**
- Renders correct className for each reliability level
- Renders translated label text

**`SourceForm` validation (unit):**
- Zod schema rejects missing `title`
- Zod schema rejects missing `type`
- Zod schema rejects malformed URL
- Zod schema accepts empty `url` (treated as null)

### E2E tests (`e2e/sources.spec.ts`)

```
TC-SRC-01: Create source with all fields → appears in list with correct reliability badge
TC-SRC-02: Edit source title and reliability → detail page shows updated values
TC-SRC-03: Delete source from detail page → redirects to list, source gone
TC-SRC-04: Bulk delete 2 sources → both removed from list
TC-SRC-05: Search by title → list filtered to matching sources
TC-SRC-06: Search by author → list filtered to matching sources
TC-SRC-07: Filter by reliability=HIGH → only HIGH sources shown
TC-SRC-08: Source detail page shows all attributes correctly
TC-SRC-09: Relations tab renders placeholder text without error
```

---

## 9. File Structure

```
src/
  types/
    source.ts                              NEW
  lib/
    source-types.ts                        NEW
    db.ts                                  MODIFY (extend soft-delete to source)
  components/research/
    SourceForm.tsx                         NEW
    SourceTable.tsx                        NEW
    SourceDetailTabs.tsx                   NEW
    DeleteSourceButton.tsx                 NEW
    ReliabilityBadge.tsx                   NEW
  app/
    [locale]/(app)/
      sources/
        page.tsx                           NEW
        new/
          page.tsx                         NEW
        [id]/
          page.tsx                         NEW
          edit/
            page.tsx                       NEW
    api/
      sources/
        route.ts                           NEW
        route.test.ts                      NEW
        [id]/
          route.ts                         NEW
          route.test.ts                    NEW
        bulk/
          route.ts                         NEW
          route.test.ts                    NEW
messages/
  de.json                                  MODIFY (add sources.* keys)
  en.json                                  MODIFY (add sources.* keys)
e2e/
  sources.spec.ts                          NEW
```

**Sidebar navigation:** Add Sources link to the sidebar (`src/components/shell/Sidebar.tsx`) — positioned after Events, before any settings items.

---

## 10. Implementation Notes

### Soft-delete extension ordering
Extend `db.ts` before touching any source API routes. The `db` extended client must filter `deleted_at: null` or the list endpoint will return soft-deleted records.

### Type combo-box implementation
The combo-box is a `<Popover>` wrapping a `<Command>` with `<CommandInput>` and `<CommandList>`. The `SOURCE_TYPE_SUGGESTIONS` list is filtered client-side. When the user types a value not in the list, it's accepted as-is and saved verbatim. The label displayed uses `t("sources.type_" + value)` with a fallback to the raw value if no translation key exists (for user-defined custom types).

### URL field normalization
In the form, an empty string in the URL field should be coerced to `null` before submission — Zod does this via `.or(z.literal("")).transform(v => v === "" ? null : v)` before the `.url()` check.

Exact Zod snippet:
```typescript
url: z.union([z.string().url(), z.literal(""), z.null()]).optional()
  .transform(v => (v === "" ? null : v ?? null)),
```

### Cache key construction
Type filter value should be URL-encoded in the cache key to handle spaces or special characters in user-defined type strings:
```typescript
const cacheKey = `source-list:${projectId}:${page}:${pageSize}:${search ?? ""}:${sort}:${order}:${reliability}:${encodeURIComponent(type ?? "")}`;
```

### `prisma` vs `db` in API routes
- Use `db.source.findMany()` (soft-delete filtered) for list and detail endpoints.
- Use `prisma.source.count({ where: { ...where, deleted_at: null } })` for pagination total (matches the event pattern).
- Use `prisma.source.update()` for soft-delete writes (direct client; extension only filters reads).

### Sidebar link
Add Sources to the Sidebar navigation items array between Events and any settings divider. Use the `Database` or `BookOpen` Lucide icon (choose `BookOpen` — semantically appropriate for primary source documents).

---

## 11. Acceptance Criteria

1. **List:** Navigating to `/[locale]/sources` shows a paginated table of sources scoped to the active project.
2. **Create:** Submitting the new source form with title "Test Letter" and type "letter" creates a record and redirects to its detail page.
3. **Reliability badge:** A source with `reliability=HIGH` shows a green badge in the list and on the detail page.
4. **Edit:** Changing the title and reliability of an existing source and saving reflects on the detail page.
5. **Delete:** Deleting a source from its detail page removes it from the list (does not appear after reload).
6. **Bulk delete:** Selecting 2 sources and clicking bulk delete removes both after confirmation.
7. **Search — title:** Entering a title substring in the search box shows only matching sources.
8. **Search — author:** Entering an author name substring shows only sources with that author.
9. **Filter — reliability:** Selecting "HIGH" in the reliability filter shows only HIGH sources.
10. **Filter — type:** Selecting "letter" in the type filter shows only sources of type "letter".
11. **Detail — all fields:** The detail page displays title, type, author, date, repository, call number, URL (clickable), reliability badge, notes, and timestamps.
12. **Detail — Relations tab:** The Relations tab renders the placeholder message without a runtime error. If evidence counts > 0, they appear in the placeholder.
13. **URL validation:** Submitting a malformed URL shows an inline validation error; the form does not submit.
14. **Custom type:** Typing "manuscript" (not in the suggestion list) in the type combo-box and submitting saves "manuscript" as the source type.
15. **Soft-delete:** A deleted source does not appear in the list. Navigating directly to `/sources/[id]` returns a 404 page.
16. **i18n:** All labels, placeholders, and error messages are present in both German and English; switching locale updates all visible strings.
17. **Sidebar:** "Quellen" / "Sources" link appears in the sidebar and navigates to the sources list.
18. **Unit tests:** ≥ 15 unit tests pass for API routes and components.
19. **E2E tests:** TC-SRC-01 through TC-SRC-09 pass on Chromium and Firefox.

---

## 12. Out of Scope

| Excluded | Covered in |
|---|---|
| Populated Relations tab (showing actual linked relations) | Epic 2.4 |
| PropertyEvidence UI (attaching sources as property evidence) | Epic 2.4 |
| Source-to-source linking (e.g. "this letter cites that document") | Epic 2.4 |
| SourceType as a separate DB table | Schema decision: `String` type; not revisited |
| Literature entity (secondary scholarly references) | Epic 3.3 |
| RIS / BibTeX import | Epic 3.3 |
| Bulk reliability update | Epic 5.2 (Data Quality) |
| Column visibility toggle in DataTable | Epic 2.5 (UI Polish) |
| Full-text search (tsvector) | Epic 4.1 |
