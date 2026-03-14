# Progress — Epic 2.4 — Universal Relationship Engine

**Status:** 🚧 In Progress
**Started:** 2026-03-14

---

## Phases

### Phase 1 — Database Migrations
- [ ] Add `quote`, `raw_transcription`, `confidence` to `PropertyEvidence`
- [ ] Add `ActivityAction` enum + `EntityActivity` model
- [ ] Add `entity_activity` relation to `User` and `Project` in schema
- [ ] Run `prisma migrate dev` and apply migration to Neon

### Phase 2 — Server-side Helpers
- [ ] `src/lib/activity.ts` — `logActivity()` helper
- [ ] `src/lib/entity-validation.ts` — `validateEntityExists()` helper

### Phase 3 — RelationType API
- [ ] `GET/POST /api/relation-types`
- [ ] `PUT/DELETE /api/relation-types/[id]`

### Phase 4 — Relation CRUD API
- [ ] `GET/POST /api/relations`
- [ ] `GET/PUT/DELETE /api/relations/[id]`
- [ ] `POST /api/relations/bulk` (bulk delete)

### Phase 5 — Relation Evidence API
- [ ] `GET/POST /api/relations/[id]/evidence`
- [ ] `DELETE /api/relations/[id]/evidence/[evidenceId]`

### Phase 6 — PropertyEvidence API
- [ ] `GET/POST /api/property-evidence`
- [ ] `DELETE /api/property-evidence/[id]`

### Phase 7 — EntityActivity Read API
- [ ] `GET /api/entities/[type]/[id]/activity`

### Phase 8 — Frontend Components
- [ ] `EntitySelector` component
- [ ] `RelationTypeSelector` component
- [ ] `RelationFormDialog` component
- [ ] `RelationDeleteButton` component
- [ ] `RelationRow` component
- [ ] `EvidenceList` + `EvidenceForm` components
- [ ] `PropertyEvidenceBadge` + `PropertyEvidencePanel` components
- [ ] `ActivityLog` component
- [ ] `useRelationTypes` hook

### Phase 9 — Pages
- [ ] `/relations` — global relations list page
- [ ] `/settings/relation-types` — relation type management
- [ ] Update `PersonDetailTabs` → add Relations, Nachweise, Verlauf tabs
- [ ] Update `EventDetailTabs` → add Relations, Nachweise, Verlauf tabs
- [ ] Update `SourceDetailTabs` → add Relations, Nachweise, Verlauf tabs

### Phase 10 — i18n
- [ ] Add `relations.*`, `relationTypes.*`, `propertyEvidence.*`, `entityActivity.*` to `de.json`
- [ ] Add same keys to `en.json`

### Phase 11 — Seed Updates
- [ ] Add ≥1 more RelationType to reach ≥5 total

### Phase 12 — Tests & Verification
- [ ] Unit tests
- [ ] E2E test spec
- [ ] Browser verification (all 15 ACs)

---

## Acceptance Criteria

| AC | Description | Status |
|----|-------------|--------|
| AC-01 | POST /api/relations creates relation, GET returns it | ⬜ |
| AC-02 | POST /api/relations with missing from_id → 404 ENTITY_NOT_FOUND | ⬜ |
| AC-03 | POST /api/relations with invalid from_type → 422 INVALID_ENTITY_TYPE | ⬜ |
| AC-04 | DELETE /api/relation-types/[id] in use → 409 IN_USE | ⬜ |
| AC-05 | POST /api/property-evidence bad property → 422 INVALID_PROPERTY | ⬜ |
| AC-06 | After creating Relation, GET activity returns CREATE entry | ⬜ |
| AC-07 | GET activity returns 200; no POST/PUT/DELETE (405) | ⬜ |
| AC-08 | POST property-evidence with confidence/quote/raw_transcription saves all | ⬜ |
| AC-09 | Person detail Relations tab shows outgoing/incoming with inverse_name | ⬜ |
| AC-10 | PropertyEvidence badge shows 0, increments to 1 after add | ⬜ |
| AC-11 | RelationType settings page with CRUD, ≥5 seeded types | ⬜ |
| AC-12 | Global /relations page with paginated table + filters | ⬜ |
| AC-13 | RelationFormDialog pre-fills from entity (prefillFrom) | ⬜ |
| AC-14 | Soft-delete Relation does not cascade to RelationEvidence | ⬜ |
| AC-15 | PropertyEvidence table has quote, raw_transcription, confidence columns | ⬜ |
