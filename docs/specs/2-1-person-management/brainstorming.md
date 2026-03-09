# Epic 2.1 — Person Management

## Brainstorming

**Goal:** Define every implementation detail so the specification leaves no ambiguity.

---

## Schema Delta Analysis (vs. Roadmap)

Before brainstorming begins, the following divergences between the roadmap and the actual
implemented schema (prisma/schema.prisma) must be resolved:

| Roadmap field                          | Actual schema                                                             | Impact on Epic 2.1                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `birth_date: DateTime`                 | `birth_year: Int?, birth_month: Int?, birth_day: Int?`                    | Form input and display completely different — no date picker, need partial-date UX |
| `name_variants: String[]` (JSON array) | Separate `PersonName` table (`id, person_id, name, language, is_primary`) | CRUD for name variants is a sub-feature, not a simple array field                  |
| `birth_place: String`                  | `birth_place: String?` + `birth_location_id: String?` FK                  | Dual fields; Location FK is Epic 3.2 scope — free text is primary for Epic 2.1     |
| _(not in roadmap)_                     | `PropertyEvidence` table                                                  | Decide scope: expose in Epic 2.1 or defer to Epic 2.4                              |
| `name_variants` full-text search       | Must search `PersonName.name` via JOIN                                    | Search query is more complex than a simple column scan                             |

---

## Round 1 — Partial Date UX & Storage

### Q1 — Partial date input component design

The schema stores dates as `year/month/day` integer triples. A standard date picker forces a full date. Historical research routinely has year-only or year+month records.

```
Option A — Three separate inputs (year text, month select, day text)
Option B — Single smart text input ("1848", "März 1848", "15.3.1848") with parser
Option C — Year required + optional month select + optional day input (hybrid)
```

- [ ] Option A — Three separate inputs — most explicit, hardest to get wrong, but visually verbose
- [x] Option C — **recommended** — Year required (number input, 1–2100), optional month dropdown (Jan–Dec), optional day number input. Graceful degradation: day only enabled when month is set. Clearest semantic for historical research where year-only is the most common partial case.
- [ ] Option B — Single smart input — elegant but requires a fuzzy parser; introduces i18n complexity and edge-case bugs (German "März" vs. English "March")

### Q2 — Partial date display formatting

When displaying a partial date (e.g. year=1848, month=3, day=null), what string do we render?

| Stored                     | DE display    | EN display     |
| -------------------------- | ------------- | -------------- |
| year=1848 only             | 1848          | 1848           |
| year=1848, month=3         | März 1848     | March 1848     |
| year=1848, month=3, day=15 | 15. März 1848 | March 15, 1848 |
| all null                   | —             | —              |

- [x] **Recommended** — Build a shared `formatPartialDate(year, month, day, locale)` utility in `src/lib/date.ts` that returns a locale-aware string using `Intl.DateTimeFormat`. Used server-side (SSR) and client-side identically. Display "—" when all fields null.
- [ ] Option B — Format per-component inline — leads to inconsistency and duplication

### Q3 — Certainty selector component

The four-state certainty selector (CERTAIN / PROBABLE / POSSIBLE / UNKNOWN) is reusable across the entire app. Where does it live and what does it look like?

```
[◉ Certain] [◎ Probable] [◯ Possible] [? Unknown]
```

- [x] **Recommended** — Standalone `<CertaintySelector>` client component in `src/components/research/CertaintySelector.tsx`. Renders as a segmented button group (4 buttons, single-select). Accepts `value: Certainty`, `onChange: (v: Certainty) => void`, `disabled?: boolean`. Used in all forms across Phase 2.
- [ ] Option B — shadcn Select dropdown — less scannable at a glance; certainty is a constant-width 4-option choice better suited to button groups

---

## Round 2 — PersonName Table Management

### Q4 — PersonName CRUD scope in Epic 2.1

The schema has a `PersonName` table with `name`, `language` (ISO 639-1), and `is_primary`. The roadmap listed `name_variants` as a simple array field. Should Epic 2.1 expose the full `PersonName` table management UI?

- [x] **Recommended** — Yes, expose in-form. The create/edit person form includes a dynamic name list section: one row per `PersonName` with name input, optional language selector, and primary toggle. Minimum one name (the primary). Add/remove rows inline. No separate CRUD page needed — it's always in context of a person.
- [ ] Option B — Defer to a later epic, use only first_name + last_name — but `first_name`/`last_name` on Person are already separate columns; the name variants table is for additional historical name forms (maiden name, Latin name, nickname). Both are needed.

### Q5 — Person display name derivation

The `Person` model has both `first_name`/`last_name` (direct columns) AND `PersonName` records. What is the canonical display name?

```
Option A — Primary PersonName.name is the display name (first_name/last_name are redundant)
Option B — first_name + last_name are the canonical display; PersonName is for variants only
Option C — first_name + last_name are canonical; primary PersonName is an alternate rendered form (e.g. "Maier, Karl" vs "Karl Maier")
```

- [x] **Recommended** — Option B: `first_name` + `last_name` are the canonical editable fields; `PersonName` records store historical/alternate name forms (e.g. "Carolus Magnus", "Marie-Antoinette d'Autriche", maiden names). Display name = `last_name, first_name` or `first_name last_name` depending on context. PersonName records appear as "Also known as" in the profile view.
- [ ] Option A — Merging display name into PersonName creates confusion since the schema has both; first_name/last_name drive the list columns.

### Q6 — Language selector for PersonName

PersonName has a `language` field (ISO 639-1). Should Epic 2.1 support language selection for name variants?

- [x] **Recommended** — Yes, include a simple text input (or small searchable select with common codes: de, en, la, fr, it, cs, hu, pl, ru, ...). Not required (nullable). Shown as a small secondary field next to the name input. Does not block save.
- [ ] Option B — Defer language to Epic 5.3 — but the column exists now; leaving it always null wastes the schema design.

---

## Round 3 — SSR Architecture & Data Flow

### Q7 — Person list: SSR vs. CSR

The roadmap calls for server-side pagination, search, and column sort on the list. With Next.js 15 App Router, how do we implement this?

```
Option A — Full CSR: client fetches /api/persons with query params
Option B — Full SSR: searchParams from URL → server component → Prisma query → render table
Option C — Hybrid: SSR for initial render, client-side state for subsequent interactions
```

- [x] **Recommended** — Option B (Full SSR): The person list page is a Server Component. URL search params drive the query: `?page=1&search=Müller&sort=last_name&order=asc`. Navigating (clicking sort headers, pagination, typing search) updates the URL via `router.push` (shallow). Next.js re-renders the server component automatically. No client-side state for list data. Search input is a Client Component that debounces and pushes URL params.
- [ ] Option A — CSR — requires duplicating auth/project scope checks; harder to share/bookmark results
- [ ] Option C — unnecessary complexity for this scale

### Q8 — Create/Edit form: server action vs. API route

For person mutations (create, update, delete), should we use Next.js Server Actions or API routes?

- [x] **Recommended** — API routes (`/api/persons`, `/api/persons/[id]`). Reasons: (a) API-first design is locked in the roadmap; (b) the same routes will be consumed by future export/import features; (c) React Hook Form integrates naturally with fetch calls; (d) API routes simplify E2E testing with explicit HTTP contracts.
- [ ] Option B — Server Actions — simpler form wiring but couples the form to server implementation; harder to test independently; less aligned with the API-first roadmap lock.

### Q9 — Person detail page SSR

The person detail page has tabs: Attributes, Related Events, Related Persons, Related Sources. How do we handle tabs with SSR?

```
Option A — All tab content loaded at once (single SSR fetch, tabs just toggle visibility)
Option B — Each tab is a URL segment (/persons/[id]/events, /persons/[id]/persons, etc.)
Option C — Tab content lazy-loaded client-side when tab is selected
```

- [x] **Recommended** — Option A for Epic 2.1: all person attributes and relation counts loaded SSR in one page. Tab panels are rendered server-side but only Relations tabs show "N relations — managed in Epic 2.4". This avoids premature complexity. Epic 2.4 populates those tabs fully.
- [ ] Option B — URL segments — better for deep linking but over-engineered for MVP
- [ ] Option C — CSR lazy load — adds complexity, breaks SSR story

---

## Round 4 — API Design & Caching

### Q10 — API pagination shape

What does the paginated persons list API response look like?

- [x] **Recommended** — Standard envelope:

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
```

Page size default: 25. Max: 100. Query params: `page`, `pageSize`, `search`, `sort` (`first_name|last_name|created_at`), `order` (`asc|desc`).

### Q11 — Redis cache strategy for person list

The roadmap specifies Redis cache for list queries with invalidation on write. What is the cache key structure and TTL?

- [x] **Recommended** — Cache key: `person-list:{project_id}:{page}:{pageSize}:{search}:{sort}:{order}`. TTL: 60 seconds. On any create/update/delete for a person in a project, invalidate ALL keys matching `person-list:{project_id}:*` using SCAN + DEL. Use the existing `cache.ts` from Epic 1.4.
- [ ] Option B — No cache for MVP — roadmap explicitly calls for cache; skip only if Redis is unavailable (fail-open pattern already in place)

### Q12 — Full-text search implementation

The roadmap says "PostgreSQL full-text on person names". With the PersonName table, this means joining two tables for search. How?

- [x] **Recommended** — Prisma `findMany` with `where` clause combining:
  1. `OR: [ { first_name: { contains: q, mode: 'insensitive' } }, { last_name: { contains: q, mode: 'insensitive' } }, { names: { some: { name: { contains: q, mode: 'insensitive' } } } } ]`
     For MVP, case-insensitive ILIKE is sufficient. Add PostgreSQL `tsvector` index in Epic 4.1 (Full-Text Discovery). This keeps Epic 2.1 simple while leaving the upgrade path clear.
- [ ] Option B — Full PostgreSQL tsvector now — premature; adds migration complexity; belongs in Epic 4.1

---

## Round 5 — PropertyEvidence & Scope Boundaries

### Q13 — PropertyEvidence exposure in Epic 2.1

The schema has a `PropertyEvidence` table that lets users attach source evidence to specific person properties (e.g., "Source X says birth_year=1848"). Should Epic 2.1 expose this?

- [ ] Option A — Full PropertyEvidence UI in Epic 2.1 (attach sources to birth_year, birth_place, etc.)
- [x] Option B — **recommended** — **Defer to Epic 2.4** (Universal Relationship Engine). PropertyEvidence is deeply related to source management and the relation engine. Epic 2.1 should deliver clean CRUD for persons without the evidence UI. The schema is already in place; Epic 2.4 will wire the UI.
- [ ] Option C — Read-only display only (show attached evidence but no ability to add)

### Q14 — Soft-delete handling

The Person model has `deleted_at`. The roadmap mentions a Prisma middleware extension was deferred to Epic 2.2. How should Epic 2.1 handle soft-delete?

- [x] **Recommended** — Add a Prisma client extension in `src/lib/db.ts` that auto-filters `deleted_at: null` for `findMany` and `findFirst` on Person, Event, Source, Relation. Implement this in Epic 2.1 since it's the first entity with soft-delete to be exposed in the UI. This is the "Soft delete note" from Epic 2.2 that says "deferred to Epic 2.1".
- [ ] Option B — Manual `where: { deleted_at: null }` on every query — fragile, will be forgotten

### Q15 — Bulk delete implementation

The roadmap specifies "Bulk delete (checkbox selection + confirm dialog)". How is this implemented?

- [x] **Recommended** — Client-side checkbox state in the DataTable (Client Component row selection). Confirm dialog shows count. POST to `/api/persons/bulk` with `{ ids: string[], action: 'delete' }`. Soft-deletes all records. Returns `{ deleted: number }`. Cache invalidated after bulk operation.
- [ ] Option B — Hard delete — roadmap doesn't specify; soft-delete is already in schema; use soft-delete for consistency

---

## Round 6 — UI Components, i18n, Testing

### Q16 — DataTable component strategy

The roadmap calls for a shadcn Table + server-side pagination. Is there an existing DataTable component or must it be built?

- [x] **Recommended** — Build a reusable `<DataTable>` wrapper in `src/components/research/DataTable.tsx` using shadcn `Table` primitives. The component receives typed columns and data. Sorting headers are links that update URL params. Pagination is a separate `<DataTablePagination>` component. This DataTable is reused by Events (Epic 2.2), Sources (Epic 2.3), etc.
- [ ] Option B — One-off table per entity — violates DRY; the roadmap explicitly calls for a shared pattern

### Q17 — i18n keys for person domain

What namespaces/keys need to be added to `de.json` and `en.json`?

- [x] **Recommended** — Add a `persons` namespace with sub-keys: `persons.title`, `persons.create`, `persons.edit`, `persons.delete`, `persons.fields.*` (first_name, last_name, birth_date, birth_date_certainty, birth_place, death_date, death_date_certainty, death_place, notes, names), `persons.names.*` (title, add, remove, primary, language), `persons.certainty.*` (CERTAIN, PROBABLE, POSSIBLE, UNKNOWN), `persons.search.placeholder`, `persons.list.empty`, `persons.bulk.*`, `persons.detail.*` (tabs: attributes, events, persons, sources). Also add shared `common.certainty.*` reused across entities.

### Q18 — Testing scope for Epic 2.1

What tests must this epic deliver?

- [x] **Recommended** — Unit tests (Vitest):
  - `formatPartialDate()` utility: all combinations of year/month/day, both locales
  - `CertaintySelector` component: renders 4 options, fires onChange
  - Person form validation schema: required fields, date field validation
  - API route handlers: mock Prisma, test list pagination, create, update, delete, bulk delete
  - Soft-delete extension: verify `findMany` excludes deleted records

  E2E tests (Playwright):
  - Create a person with partial birth date (year + month only) and PROBABLE certainty
  - Search by name finds the person
  - Edit person, change death date certainty
  - Add a name variant with language code
  - Bulk select + delete two persons
  - Person detail page shows correct data

### Q19 — sanitize-html upgrade

The roadmap for Epic 2.1 says: "Replace the `sanitize()` stub from Epic 1.4 with `sanitize-html` library." Is this in scope?

- [x] **Recommended** — Yes, include it. Install `sanitize-html` + `@types/sanitize-html`. Update `src/lib/sanitize.ts` to use it. Apply to all text fields at DB write boundaries (notes, first_name, last_name, birth_place, death_place). The upgrade is small and isolated.
- [ ] Option B — Defer — the roadmap explicitly assigns this to Epic 2.1

---

## Round 7 — Out of Scope & Boundaries

### Q20 — What is explicitly OUT of scope for Epic 2.1?

Confirming boundaries to prevent scope creep:

- [ ] Location FK linking (`birth_location_id`, `death_location_id`) — Epic 3.2
- [ ] PropertyEvidence UI — Epic 2.4
- [ ] Relations tab full content — Epic 2.4
- [ ] Person-to-person relation creation — Epic 2.4
- [ ] Event participation links in person profile — Epic 2.4
- [ ] Full PostgreSQL tsvector search — Epic 4.1
- [ ] Import from CSV — Epic 3.4
- [ ] Export as CSV — Epic 5.1
- [ ] EventType table (event_type is still a free string) — Epic 2.2

All confirmed out of scope.

---

**All questions answered. Writing the full specification now.**
