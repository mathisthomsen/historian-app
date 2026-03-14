# Epic 2.4 — Universal Relationship Engine

## Brainstorming

**Goal:** Define every implementation detail so the specification leaves no ambiguity.

**Context sources:**

- `docs/specs/roadmap.md` — Epic 2.4 requirements
- `docs/specs/ai_aided_roadmap.md` — AX augmentations for Epic 2.4

**Schema already in place (from Epic 1.2):**

- `Relation`, `RelationType`, `RelationEvidence`, `PropertyEvidence` tables
- Composite indexes on `(from_type, from_id)` and `(to_type, to_id)`
- No `EntityActivity` model yet
- `PropertyEvidence` missing `confidence` and `source_scan_region` (AX additions)

---

## Round 1 — Schema & Migration

### Q1 — PropertyEvidence AX additions: include in this epic?

The ai_aided_roadmap.md explicitly assigns two new fields to `PropertyEvidence` as part of Epic 2.4:

- `confidence Certainty @default(UNKNOWN)` — per-evidence certainty level
- `source_scan_region String?` — JSON blob `{page, x, y, w, h}` for Source-First pixel anchoring (used by Epic 6.3)

The base `PropertyEvidence` is already in the schema (Epic 1.2 stub), but these two fields are missing.

- [ ] Option A — Defer both fields — add them only when needed (Epic 6.0/6.3 will add them)
- [x] Option B — **recommended** — Add `confidence` now, defer `source_scan_region` — `confidence` is actively useful in Epic 2.4's PropertyEvidence UI (show certainty per evidence item). `source_scan_region` is only used by the PDF viewer in Epic 6.3; adding a nullable column now is safe but adds zero value yet. Better: add the column in 6.3 when the viewer is built.
- [ ] Option C — Add both fields now — forward-compatibility, but `source_scan_region` is a null column with zero consumers until Epic 6.3

---

### Q2 — EntityActivity model: include in this epic?

The ai_aided_roadmap.md specifies that `EntityActivity` (append-only audit log) is introduced in Epic 2.4 as an AX Infrastructure pre-pull-forward. It requires:

- `GET /api/entities/[type]/[id]/activity` endpoint (read-only, no DELETE)
- Logged on: CREATE, UPDATE, DELETE, MERGE, SUGGEST, ACCEPT, REJECT
- `user_id` or `agent_name` (not both); project-scoped

This model is part of the AX roadmap and will be consumed by Epic 6.1's `<ActivityTimeline>` component, but it's designed to be populated by manual CRUD from Epic 2.4 onwards.

- [ ] Option A — Defer entirely to Epic 6.0 — keep Epic 2.4 focused on the relation UI
- [x] Option B — **recommended** — Create the schema + write-only logging in this epic, expose the read endpoint — The schema migration is small. Writing to EntityActivity on every Relation/PropertyEvidence CRUD gives us real data by the time Epic 6.1 builds the UI. No UI in this epic; just the model + a read-only GET endpoint. The immutability constraint (no DELETE endpoint) must be enforced now, not retrofitted.
- [ ] Option C — Schema only (no API) — Table exists but nothing writes to it yet; easy to forget later

---

### Q3 — PropertyEvidence: add `quote` field?

`RelationEvidence` already has `page_reference`, `quote`, `confidence`. `PropertyEvidence` currently only has `notes` and `page_reference`. Given that property evidence is also a citation (e.g., "Source X, p.42, line 3: 'born in 1848'"), should `PropertyEvidence` also get a `quote` field?

- [x] Option A — **recommended** — Yes, add `quote String?` to `PropertyEvidence` — Consistent with RelationEvidence. Historians will want to quote the verbatim source text when annotating a specific field value. Without it, they're forced to use `notes` for both the quote and their interpretation.
- [ ] Option B — No — use `notes` for everything; avoid schema creep

---

### Q4 — Soft-delete on Relation: already handled?

`Relation` already has `deleted_at DateTime?` in the schema. The Prisma client extension in Epic 2.1 filters `deleted_at: null` for Person; Epic 2.2 extended it to Event. This epic must extend it to cover `Relation` and `PropertyEvidence`.

- [x] Option A — **recommended** — Extend existing Prisma extension in `src/lib/db.ts` to cover `relation` and skip `property_evidence` (PropertyEvidence has no soft-delete; it's hard-deleted) — Consistent with existing pattern. PropertyEvidence cascade-deletes when its Source or Project is deleted.
- [ ] Option B — Separate extension file — unnecessary complexity

---

**Comment review — proposed DB additions:**

| Field                                           | Decision             | Rationale                                                                                                                   |
| ----------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `agent_version` + `system_prompt_hash`          | ❌ Defer to Epic 6.0 | Belong on `AgentSuggestion`, not `EntityActivity`. In this epic all entries are human actions — 100% null.                  |
| `raw_transcription String?` on PropertyEvidence | ✅ Add in this epic  | Genuine archival concept (diplomatic vs. normalized text). Adding in 6.x would leave existing records inconsistent.         |
| Structured JSON for `reasoning`                 | ❌ Defer to Epic 6.1 | No `reasoning` on PropertyEvidence; belongs on `AgentSuggestion`. Design after `<EvidenceStrip>` UI requirements are known. |

**Resolution:** `PropertyEvidence` gets `raw_transcription String?` added alongside `quote String?` in this epic's migration.

---

## Round 2 — Relation Creation UI

### Q5 — Where does relation creation live?

The user needs a way to create relations. The UI can be placed in different locations.

```
Option A: Global /relations/new page
Option B: Inline within entity detail page (Relations tab)
Option C: A dedicated modal triggered from any entity detail page
Option D: Both global list page + modal from entity detail
```

- [ ] Option A — Global page only — too far from context (user is looking at a Person)
- [ ] Option B — Inline form in the tab — clutters the tab; hard to handle the two-ended entity selector in a tab
- [ ] Option C — Modal only — no discoverability from a top-level Relations view
- [x] Option D — **recommended** — Global `/relations` list page with "Add relation" button + "Add relation" button on each entity's Relations tab that pre-fills the "from" side — Gives both global overview and contextual creation. The same `<RelationFormDialog>` component is used in both contexts.

---

### Q6 — Entity selector UX for relation creation

When creating a relation, the user must select both "from" and "to" entities (potentially across different entity types). The selector must handle thousands of entities efficiently.

```
[Entity Type Dropdown: Person ▾] [Search: "Müller___________] [Result: → Karl Müller (1820–1890)]
```

- [ ] Option A — Two free-text inputs with type-ahead — no explicit type selection; search across all types simultaneously
- [x] Option B — **recommended** — Type dropdown first, then debounced search within that type — Matches the RelationType `valid_from_types`/`valid_to_types` constraint: after the user picks types, we can filter the RelationType dropdown to only show valid types for that combination. Prevents invalid relations at the UI level.
- [ ] Option C — Full entity browser modal — heavy; too much friction for common relation creation

---

### Q7 — RelationType filtering

After both entity types are selected, the RelationType dropdown should show only types valid for that `from_type → to_type` combination.

Example: Person→Person shows "colleague", "spouse", "parent/child". Person→Event shows "participant", "organizer".

- [x] Option A — **recommended** — Client-side filter from a pre-fetched list of all project RelationTypes — The list is small (tens, not thousands). Fetch all at component mount, filter in memory. No extra API roundtrip per type-selection change.
- [ ] Option B — Server-side filter (re-fetch on each type change) — unnecessary latency for small lists
- [ ] Option C — Show all types unfiltered — defeats the purpose of `valid_from_types`/`valid_to_types`

---

### Q8 — Temporal validity fields in the creation form

`Relation` has `valid_from_year/month/cert` and `valid_to_year/month/cert`. These are important for historical research (e.g., "colleague from 1848 to 1852") but add form complexity.

- [ ] Option A — Always show all 6 temporal fields
- [x] Option B — **recommended** — Collapsed "Advanced / Temporal validity" section; hidden by default, expandable — Most relations won't need precise temporal bounds. Reduces cognitive load for the common case. Historians who need it can expand.
- [ ] Option C — Defer temporal fields entirely — violates the schema already defined

---

## Round 3 — Entity Relations Tab

### Q9 — Relations tab layout

Each entity detail page (Person, Event, Source) has a Relations tab. These tabs were placeholder in Epics 2.1–2.3.

```
[All | Person→Person | Person→Event | ...]  ← filter tabs or dropdown

FROM: Karl Müller ──[colleague, PROBABLE]──→ TO: Johann Schmidt
      Source: Staatsarchiv Wien, S.47 · PROBABLE
      [Edit] [Delete]
```

- [ ] Option A — Flat list, no filter — works for small datasets; breaks at 20+ relations
- [x] Option B — **recommended** — Grouped by relation direction (outgoing vs. incoming) with a filter by relation type — "Relations from this person" and "Relations to this person" are natural historian mental models. Filter dropdown for relation type. Each row shows: other entity, relation type badge, certainty badge, evidence count, edit/delete.
- [ ] Option C — Paginated table identical to the global relations list — less contextual

---

### Q10 — Inline vs. modal for relation edit/delete

Relations in the entity tab can be edited (change certainty, notes, evidence) or deleted.

- [x] Option A — **recommended** — Modal dialog for edit; inline confirm for delete — Consistent with how Person/Event/Source handle edits (modal forms). Delete with an inline confirm (no separate page).
- [ ] Option B — Navigate to /relations/[id]/edit page — breaks the "stay in context" principle
- [ ] Option C — Inline editable row — complex state management, confusing UX

---

## Round 4 — PropertyEvidence UI

### Q11 — Where does PropertyEvidence appear in the UI?

PropertyEvidence attaches a Source to a specific field on an entity. The roadmap says "surfaces on entity detail pages as a secondary annotation alongside each field."

```
Option A: Separate "Evidence" tab listing all PropertyEvidence for this entity
Option B: Inline annotation beneath each field value in the detail view
Option C: Both — inline "N sources" badge + separate Evidence tab
```

```
Birth Year:  1848   [CERTAIN]   [2 sources ▾]
                                  └─ Staatsarchiv Wien, S.12 · PROBABLE
                                  └─ Kirchenbuch Graz 1848 · CERTAIN
```

- [ ] Option A — Separate tab only — hides context; historian can't see evidence while viewing the field
- [ ] Option B — Inline only — clutters the detail view with too many UI elements
- [x] Option C — **recommended** — Inline "N sources" badge that opens a popover; plus an "Evidence" tab for full management — Badge gives at-a-glance provenance; popover shows a summary; the Evidence tab is where you add/remove evidence items. This anticipates the `<ProvenanceBadge>` and `<EvidenceStrip>` components from Epic 6.1 — we lay the groundwork now.

---

### Q12 — PropertyEvidence CRUD: which operations in this epic?

- [ ] Option A — Read-only (just display existing evidence)
- [ ] Option B — Full CRUD via dedicated API route
- [x] Option C — **recommended** — Full CRUD: add evidence (source + notes + page_reference + quote + confidence), view, delete — The roadmap explicitly says "Exposes: add evidence for a property, view all evidence for a property, remove evidence." No "edit" (delete + re-add is simpler for rare corrections).

---

## Round 5 — RelationType Management

### Q13 — Where does RelationType CRUD live in the UI?

RelationTypes are per-project. The roadmap mentions "project-level RelationType management (from Epic 2.4 lives here in the settings panel)" but that settings panel is Epic 3.1. In this epic we need somewhere to manage them.

- [ ] Option A — Modal accessible only from the relation creation form ("+ New type" link)
- [x] Option B — **recommended** — Dedicated settings sub-page `/settings/relation-types` (parallel to the existing `/settings/event-types` from Epic 2.2) — Consistent with the pattern already established. Navigation item in the settings sidebar section. Full CRUD: list, create, edit, delete. Delete blocked if any Relation uses this type (Prisma Restrict).
- [ ] Option C — Inline management in the global Relations list page — mixes data with configuration

---

### Q14 — Seeded RelationType defaults

The roadmap says "Seeded defaults per domain (family, professional, event participation, geographic)."

| Category     | name                           | inverse_name                         | valid_from | valid_to     |
| ------------ | ------------------------------ | ------------------------------------ | ---------- | ------------ |
| Family       | Elternteil von / Parent of     | Kind von / Child of                  | PERSON     | PERSON       |
| Family       | Ehepartner von / Spouse of     | Ehepartner von / Spouse of           | PERSON     | PERSON       |
| Family       | Geschwister von / Sibling of   | Geschwister von / Sibling of         | PERSON     | PERSON       |
| Professional | Kollege von / Colleague of     | Kollege von / Colleague of           | PERSON     | PERSON       |
| Professional | Vorgesetzter von / Superior of | Untergebener von / Subordinate of    | PERSON     | PERSON       |
| Event        | Teilnehmer an / Participant in | Hat Teilnehmer / Has participant     | PERSON     | EVENT        |
| Event        | Organisator von / Organizer of | Wurde organisiert von / Organized by | PERSON     | EVENT        |
| Geographic   | Lebte in / Lived in            | Bewohnt von / Inhabited by           | PERSON     | LOCATION     |
| Source       | Bezieht sich auf / References  | Wird referenziert in / Referenced in | SOURCE     | PERSON,EVENT |

- [x] Option A — **recommended** — Seed the above defaults in `prisma/seed.ts` scoped to the demo project only — Real projects start empty (user creates their own types) or can copy from the demo. Seeding into the demo project is consistent with existing seed behavior.
- [ ] Option B — Seed as "global templates" shared across projects — breaks project data isolation principle
- [ ] Option C — No defaults, user creates from scratch — poor onboarding experience

---

## Round 6 — API Design

### Q15 — Relations API: pagination and filtering

The `GET /api/relations` endpoint needs to return relations filterable by entity, type, certainty. What query params?

```
GET /api/relations?
  projectId=...
  &fromType=PERSON&fromId=...   // for entity Relations tab
  &toType=EVENT&toId=...        // for entity Relations tab (incoming)
  &relationTypeId=...
  &certainty=PROBABLE
  &page=1&pageSize=20
```

- [x] Option A — **recommended** — Support all the above query params; server-side pagination — The query pattern for the entity Relations tab (filter by one entity) and the global Relations list (all relations in project) are both covered by the same endpoint with different params.
- [ ] Option B — Separate endpoints for entity-scoped and global — duplicates logic

---

### Q16 — PropertyEvidence API: scoping

`GET /api/property-evidence` must be filterable by entity to load evidence for a specific entity's detail page.

```
GET /api/property-evidence?entityType=PERSON&entityId=...&property=birth_year
POST /api/property-evidence   { project_id, entity_type, entity_id, property, source_id, notes?, page_reference?, quote?, confidence }
DELETE /api/property-evidence/[id]
```

- [x] Option A — **recommended** — Three endpoints as above; GET also accepts omitting `property` to get all evidence for an entity — For the "Evidence" tab we want all evidence for a person; for the inline badge we want evidence for one property.
- [ ] Option B — Nested under entity route (`/api/persons/[id]/evidence`) — complicates routing for a polymorphic resource

---

### Q17 — EntityActivity API

The ai_aided_roadmap.md specifies `GET /api/entities/[type]/[id]/activity`. Should we also write a `POST` helper or write directly from server actions?

```
GET  /api/entities/[type]/[id]/activity   → paginated log, newest first
```

Writing to EntityActivity happens server-side (never exposed as a POST endpoint for external use).

- [x] Option A — **recommended** — GET endpoint only; writes happen via a `logActivity()` helper function called in API route handlers and server actions — Matches the AX constraint "no DELETE endpoint." The `logActivity()` function is internal and never exposed. It is called after successful CRUD on Relation, PropertyEvidence, and later by the suggestion/accept/reject flow.
- [ ] Option B — POST endpoint for writes — violates the append-only audit design; agents could call it

---

## Round 7 — Global Relations List Page

### Q18 — Global /relations page: needed in this epic?

In addition to the entity-specific Relations tabs, should there be a standalone `/relations` page listing all relations in a project?

- [x] Option A — **recommended** — Yes, a full DataTable page at `/[locale]/app/[projectId]/relations` with filters — Historians need to see "all colleague relations in the project" or "all uncertain relations." The global view also serves as the entry point for managing RelationType CRUD (settings link). Consistent with `/persons`, `/events`, `/sources`.
- [ ] Option B — Relations only accessible via entity tabs — loses the "cross-entity overview" use case

---

### Q19 — Relation detail page: separate page or modal?

Viewing full relation detail (all evidence, notes, temporal validity, edit form).

- [ ] Option A — Dedicated `/relations/[id]` page
- [x] Option B — **recommended** — Modal dialog (sheet) from the list or entity tab — Relations are secondary objects; historians don't bookmark individual relations. A sheet (right-side drawer) opened from the list row is consistent with the pattern used in Event detail popups in the timeline (Epic 4.2) and keeps context. Full edit form fits in a sheet.
- [ ] Option C — Inline expansion in the table row

---

## Round 8 — Testing & i18n

### Q20 — Test scope for this epic

What must be tested?

- API routes: GET/POST/PUT/DELETE for `/api/relations`, `/api/relations/[id]/evidence`, `/api/property-evidence`, `/api/relation-types`
- Entity activity: `logActivity()` called on mutations; GET endpoint returns correct entries
- RelationType validation: `valid_from_types`/`valid_to_types` constraint enforced at API layer
- UI: entity selector debounced search, RelationType filter, evidence badge count

- [x] Option A — **recommended** — Unit tests for API handlers + `logActivity()`, integration tests for evidence integrity (attach evidence to non-existent entity → 404), E2E for the full "create relation with evidence" flow — Same test pyramid used in Epics 2.1–2.3.
- [ ] Option B — E2E only — misses edge cases in API layer

---

### Q21 — i18n: which new keys are needed?

New namespaces: `relations.*`, `relationTypes.*`, `propertyEvidence.*`, `entityActivity.*`

Key i18n decisions:

- Relation type names/inverse_names are stored in DB (not i18n files) — multi-lingual by allowing historians to enter names in their language
- UI labels (tab headers, form labels, button text, empty states) go in messages/\*.json
- Certainty enum display uses the existing `certainty.*` keys from Epic 2.1

- [x] Option A — **recommended** — Add `relations.*`, `relationTypes.*`, `propertyEvidence.*`, `entityActivity.*` namespaces; relation type names remain in DB — Consistent with how Event types (names in DB, UI chrome in i18n) is handled.
- [ ] Option B — Hardcode German in component — violates i18n-from-day-one principle

---
