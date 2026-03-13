# Epic 2.3 — Source Management (Primary Sources)
## Brainstorming

**Goal:** Define every implementation detail so the specification leaves no ambiguity.

---

## Round 1 — Source Type Field & Bulk Operations

### Q1 — Source type: string combo-box or fixed dropdown?

The roadmap says `type` is "user-extendable" and the schema stores it as a plain `String` (no `SourceType` table, unlike `EventType`). The seeded defaults from the roadmap are: `archival_document`, `letter`, `newspaper`, `official_record`, `photograph`, `other`.

```
Option A: Fixed dropdown (closed list)
  — Simple to implement; type always one of known values
  — Forces user to pick "other" for anything not in list

Option B: Combo-box (type to create, or pick a suggestion)
  — Matches "user-extendable" from roadmap; same intent as free-text
  — UI: input with datalist / shadcn Combobox showing known values as suggestions
  — Value saved as typed string; no server-side constraint beyond non-empty

Option C: Separate SourceType table (like EventType)
  — Normalized; reusable across project
  — Significant extra complexity vs. value; roadmap explicitly chose String
```

- [ ] Option A — fixed dropdown
- [x] Option B — **recommended** — combo-box with seeded suggestions; matches roadmap intent and schema (`String` type, no FK table)
- [ ] Option C — separate table (contradicts schema decision)

---

### Q2 — Bulk operations scope

Persons and Events both have bulk delete. Should Sources follow the same pattern?

- [x] Option A — **recommended** — bulk delete only (checkbox + confirm dialog), matching the pattern from Epics 2.1/2.2
- [ ] Option B — bulk delete + bulk reliability update — useful but out of scope for MVP; better in Epic 5.2 (Data Quality)
- [ ] Option C — no bulk operations — inconsistent with established patterns

---

### Q3 — Source detail: how to surface linked relations?

The roadmap says: "Source detail page: all attributes, list of all relations where this source is attached as evidence." The schema connects sources to relations via `RelationEvidence`. But relations are polymorphic — both sides reference any entity type.

In Epic 2.3, the Relation data is minimal (no full UI exists yet — that's Epic 2.4). What should the evidence list show?

```
Option A: Simple list — "Relation #id (type unknown)" with link
  — Relation type name requires joining RelationType; doable

Option B: Rendered relation summary — "Person A ─── [relation type] ─── Event B (PROBABLE)"
  — Requires resolving from_id/to_id entity names across Person/Event tables
  — Complex polymorphic fetch; likely unresolvable generically before Epic 2.4

Option C: Placeholder tab "Relations will appear here (Epic 2.4)"
  — Consistent with how Epic 2.1 handled the Relations tab on Person detail
```

- [ ] Option A — minimal list without entity names
- [x] Option C — **recommended** — placeholder tab matching the established Epic 2.1/2.2 pattern; Epic 2.4 populates it
- [ ] Option B — full rendered summary (too complex without Epic 2.4 groundwork)

Comment: If necessary make a note in the roadmap for Epic 2.4 to take that into account

---

### Q4 — `date` field: free-text or structured?

The schema has `date String?` — a free-text source date ("c. March 1848"). This is intentional for primary sources where dates are archival references, not machine-readable events.

- [x] Option A — **recommended** — keep as free-text `String?`; display a helper hint ("e.g. c. March 1848, Summer 1790") in the form. No parsing or validation.
- [ ] Option B — partial date integers (same as Person/Event) — overkill for a source date which is often a description, not a precise date
- [ ] Option C — ISO date picker — wrong for historical archival dates

---

### Q5 — Soft-delete for Source?

The schema has `deleted_at DateTime?` on `Source`. The Prisma soft-delete extension in `src/lib/db.ts` was built for `person` and extended to `event` in Epic 2.2.

- [x] Option A — **recommended** — extend the same soft-delete Prisma extension to cover `source` in Epic 2.3; no new pattern needed
- [ ] Option B — hard delete for sources — inconsistent with Person/Event; breaks potential relations evidence integrity
- [ ] Option C — defer soft-delete to Epic 3.x — inconsistent; schema already has deleted_at

---

## Round 2 — Form Fields, Validation & URL Handling

### Q6 — URL field validation

The schema has `url String?`. Should the API validate it as a URL?

- [x] Option A — **recommended** — `z.string().url().optional().nullable()` in Zod schema; display inline error if malformed. Empty string treated as null.
- [ ] Option B — any string (no validation) — inconsistent with data quality goals; bad URLs won't be detectable
- [ ] Option C — validate at display time only — confusing UX; better to catch at input

---

### Q7 — Required vs. optional fields in the create form

The schema requires only `title` and `type` (non-nullable strings). All other fields are optional. Should the form enforce any additional "soft required" fields?

```
Roadmap fields:
  - title        required (schema)
  - type         required (schema)
  - author       optional
  - date         optional (free-text)
  - repository   optional
  - call_number  optional
  - url          optional
  - reliability  enum, default UNKNOWN
  - notes        optional
```

- [x] Option A — **recommended** — only `title` and `type` are hard-required; all others optional. `reliability` defaults to `UNKNOWN` and is always shown (not optional from UX perspective, but pre-filled with UNKNOWN).
- [ ] Option B — also require `repository` — too strict for digital/online sources with no physical location
- [ ] Option C — require `author` — many archival documents are anonymous

---

### Q8 — Source type combo-box: implementation component

Given the choice of combo-box in Q1, which component pattern?

```
Option A: shadcn <Combobox> (Command + Popover pattern)
  — Already used in event form (event_type selector)
  — Allows typed input + selection from list
  — Consistent UX

Option B: <Input> with <datalist> HTML5
  — Simpler but less styled/controllable

Option C: react-select
  — Extra dependency; not used elsewhere in project
```

- [x] Option A — **recommended** — shadcn Command+Popover combo-box; consistent with existing patterns in the codebase
- [ ] Option B — datalist
- [ ] Option C — react-select

---

## Round 3 — API Contract

### Q9 — List endpoint query parameters

What filters/sort options should `GET /api/sources` support?

```
Confirmed from roadmap:
  - search: by title/author (ILIKE)
  - filter: by reliability tier

Additional candidates:
  - sort: title | author | created_at | reliability
  - order: asc | desc
  - pagination: page + pageSize
  - projectId: from session (same scaffold as 2.1/2.2)
```

- [ ] Option A — **recommended** — `page`, `pageSize`, `search` (title + author ILIKE), `reliability` (comma-separated enum values), `sort` (title|author|created_at), `order` (asc|desc), `projectId`. Matches roadmap exactly.
- [x] Option B — also include `type` filter — reasonable but not in roadmap; can add without discussion
- [ ] Option C — minimal: only search + page — too limited for a research tool

*(Note: `type` filter is a reasonable add-on to Option A — include it.)*

---

### Q10 — Source detail endpoint response shape

`GET /api/sources/[id]` — what does it include?

```
Option A: Full source fields + evidence count only
  {
    id, title, type, author, date, repository, call_number, url,
    reliability, notes, created_by_id, created_at, updated_at,
    _count: { relation_evidence: N, property_evidence: N }
  }

Option B: Full source + embedded relation_evidence list (with relation stubs)
  — Too complex without Epic 2.4; relation from_id/to_id can't be resolved yet

Option C: Full source fields only (no counts)
  — Sufficient for current detail page since Relations tab is a placeholder
```

- [x] Option A — **recommended** — full fields + `_count` for evidence counts (useful for the placeholder tab badge); no embedded evidence rows yet
- [ ] Option B — embedded evidence
- [ ] Option C — no counts

---

### Q11 — Cache key strategy

Sources follow the same Redis cache pattern as Persons and Events. Cache list queries, invalidate on write.

- [x] Option A — **recommended** — `source-list:{projectId}:{page}:{pageSize}:{search}:{sort}:{order}:{reliability}:{type}` with 60s TTL; invalidate by prefix `source-list:{projectId}:` on create/update/delete. Identical strategy to existing entities.
- [ ] Option B — no caching for sources — inconsistent; sources are a read-heavy list
- [ ] Option C — cache individual source records too — over-engineering for Epic 2.3

---

## Round 4 — UI/UX, Components & Detail Page

### Q12 — Source list columns

Which columns to show in the DataTable?

```
Candidate columns:
  Title         — always shown, sortable, primary identifier
  Type          — short badge/tag showing source type
  Author        — optional but useful for finding sources
  Date          — free-text, not sortable
  Repository    — optional; often blank for digital sources
  Reliability   — color-coded badge (HIGH=green, MEDIUM=yellow, LOW=red, UNKNOWN=grey)
  Created At    — sortable, useful for "recently added"
```

- [x] Option A — **recommended** — Title (sortable), Type (tag), Author, Reliability (badge), Created At (sortable). Repository is secondary — shown on detail page only. Date is non-sortable so doesn't add much to list view.
- [ ] Option B — all 7 columns — too wide for most screens; repository + date rarely useful at list level
- [ ] Option C — Title + Reliability only — too sparse; author is important for finding sources

Comment: Please add somehere in the roadmap where it is apropriate, that we extend Tables with the feature of hiding/showing columns.

---

### Q13 — Source detail page layout

How to structure the detail page given the Relations tab is a placeholder?

```
Option A: Tabs (matching Person/Event pattern)
  — Tab 1: "Details" (all form fields in read mode)
  — Tab 2: "Relations" (placeholder — "See Epic 2.4")

Option B: Single page (no tabs) with sidebar
  — Less consistent with Person/Event; creates UI divergence

Option C: Tabs with additional "Evidence" tab
  — PropertyEvidence is Epic 2.4 territory; tab would be another placeholder
```

- [x] Option A — **recommended** — two tabs: "Details" + "Relations" (placeholder). Consistent with Person/Event detail pages. PropertyEvidence tab added in Epic 2.4.
- [ ] Option B — single page
- [ ] Option C — three tabs (adds extra placeholder)

---

### Q14 — Reliability badge colors

Map `SourceReliability` enum values to visual styles:

```
HIGH    → green  (bg-green-100 text-green-800 / dark:bg-green-900 text-green-100)
MEDIUM  → yellow (bg-yellow-100 text-yellow-800)
LOW     → red    (bg-red-100 text-red-800)
UNKNOWN → grey   (bg-muted text-muted-foreground)
```

- [x] Option A — **recommended** — semantic color mapping above; reuse shadcn `<Badge>` variant or custom className. Consistent with EventType color badges.
- [ ] Option B — all badges same neutral color — loses the semantic reliability signal
- [ ] Option C — icon-only (no text) — loses accessibility

---

### Q15 — New components to create

Which components are new vs. shared?

```
New (Source-specific):
  SourceForm           — react-hook-form + Zod, all fields, combo-box type selector
  SourceTable          — DataTable with columns, search, filter, bulk delete
  SourceDetailTabs     — Tabs wrapper (Details + Relations placeholder)
  DeleteSourceButton   — matches DeleteEventButton/DeletePersonButton pattern
  ReliabilityBadge     — color-coded badge for SourceReliability enum

Possibly shared (already exist from 2.1/2.2):
  CertaintySelector    — already in @/components/research/
  DataTable            — generic, already exists
```

- [x] Option A — **recommended** — create the 5 source-specific components above; reuse existing CertaintySelector and DataTable. Keep `ReliabilityBadge` in `@/components/research/` alongside other research components.
- [ ] Option B — one mega SourceDetail component — violates component breakdown pattern
- [ ] Option C — inline all logic in pages — hard to test

---

## Round 5 — i18n, Testing & Out-of-Scope Boundaries

### Q16 — Translation namespace

Sources need a new `sources.*` namespace in `messages/de.json` and `messages/en.json`. What keys are needed?

```
sources:
  title                  — "Quellen" / "Sources"
  list_title             — "Alle Quellen" / "All Sources"
  new_title              — "Neue Quelle" / "New Source"
  edit_title             — "Quelle bearbeiten" / "Edit Source"
  delete                 — "Quelle löschen" / "Delete Source"
  delete_confirm         — "..." / "..."
  search_placeholder     — "Titel oder Autor suchen…" / "Search by title or author…"
  empty_state            — "Noch keine Quellen..." / "No sources yet..."
  field_title            — "Titel" / "Title"
  field_type             — "Typ" / "Type"
  field_author           — "Autor" / "Author"
  field_date             — "Datum" / "Date"
  field_date_hint        — "z. B. ca. März 1848" / "e.g. c. March 1848"
  field_repository       — "Archiv / Repository" / "Repository / Archive"
  field_call_number      — "Signatur" / "Call Number"
  field_url              — "URL" / "URL"
  field_reliability      — "Zuverlässigkeit" / "Reliability"
  field_notes            — "Notizen" / "Notes"
  reliability_high       — "Hoch" / "High"
  reliability_medium     — "Mittel" / "Medium"
  reliability_low        — "Niedrig" / "Low"
  reliability_unknown    — "Unbekannt" / "Unknown"
  type_archival_document — "Archivdokument" / "Archival Document"
  type_letter            — "Brief" / "Letter"
  type_newspaper         — "Zeitung" / "Newspaper"
  type_official_record   — "Amtliche Urkunde" / "Official Record"
  type_photograph        — "Fotografie" / "Photograph"
  type_other             — "Sonstiges" / "Other"
  tab_details            — "Details" / "Details"
  tab_relations          — "Verknüpfungen" / "Relations"
  relations_placeholder  — "Verknüpfungen werden in Epic 2.4 angezeigt." / "Relations will be shown in Epic 2.4."
  bulk_delete_confirm    — "{count} Quelle(n) löschen?" / "Delete {count} source(s)?"
  sidebar_link           — "Quellen" / "Sources"
```

- [x] Option A — **recommended** — full translation key set above; added to existing `messages/` files alongside `events.*` namespace.
- [ ] Option B — minimal (only required by current UI) — creates translation debt
- [ ] Option C — use events.* namespace — wrong namespace; sources are separate entities

---

### Q17 — E2E test scenarios

Which user flows warrant E2E coverage?

```
TC-SRC-01: Create source (all fields), verify in list
TC-SRC-02: Edit source (change reliability + title), verify updated
TC-SRC-03: Delete source, verify removed from list
TC-SRC-04: Bulk delete 2 sources, verify both removed
TC-SRC-05: Search by title, verify filtered results
TC-SRC-06: Search by author, verify filtered results
TC-SRC-07: Filter by reliability (HIGH only), verify filtered
TC-SRC-08: Source detail page shows all attributes correctly
TC-SRC-09: Relations tab is placeholder (not broken)
TC-SRC-10: Pagination works (requires seeded data)
```

- [x] Option A — **recommended** — TC-SRC-01 through TC-SRC-09 as E2E; TC-SRC-10 covered by unit test with mocked pagination
- [ ] Option B — only TC-SRC-01 through TC-SRC-05 — misses reliability filter which is a core differentiator
- [ ] Option C — full 10 E2E — TC-SRC-10 pagination is better as unit test

---

### Q18 — Out-of-scope boundaries for Epic 2.3

What explicitly does NOT belong in this epic?

- [ ] Option A: Include PropertyEvidence UI on source detail — NO; that's Epic 2.4
- [ ] Option B: Include populated Relations tab — NO; that's Epic 2.4
- [ ] Option C: Extend SourceType to a table — NO; schema decision is String type
- [ ] Option D: Source-to-source relations (e.g., "this letter cites that document") — NO; Epic 2.4 handles all relations
- [x] Option A (confirmed) — **recommended out-of-scope list:** PropertyEvidence UI, populated Relations tab, SourceType table, source-to-source linking, Literature entity, RIS/BibTeX import (Epic 3.3)

Comment: Make sure that all out of scope aspects are mentioned in future Epics of the Roadmap.
---
