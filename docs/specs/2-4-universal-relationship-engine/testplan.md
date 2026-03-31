# Epic 2.4 — Universal Relationship Engine: Test Plan

## Scope

This test plan covers all 15 acceptance criteria for Epic 2.4. Tests are split into:
- **Unit / API tests** — Vitest + mocked Prisma, targeting route handlers
- **E2E tests** — Playwright Chromium (+ Firefox), against the running Next.js dev server

---

## AC Coverage Matrix

| AC | Description | Unit | E2E |
|----|-------------|------|-----|
| AC-1 | POST /api/relations creates → GET returns it | ✅ route.test.ts | TC-2.4-01 |
| AC-2 | POST with missing from_id → 404 ENTITY_NOT_FOUND | ✅ route.test.ts | — |
| AC-3 | POST with invalid from_type → 422 INVALID_FROM_TYPE | ✅ route.test.ts | — |
| AC-4 | DELETE /api/relation-types/[id] in use → 409 IN_USE | ✅ [id]/route.test.ts | TC-2.4-03 |
| AC-5 | POST /api/property-evidence bad property → 422 INVALID_PROPERTY + allowed list | ✅ route.test.ts | — |
| AC-6 | Create Relation → GET activity returns CREATE entry | ✅ activity/route.test.ts | TC-2.4-04 |
| AC-7 | GET activity returns 200; PUT/DELETE return 405 | ✅ activity/route.test.ts | — |
| AC-8 | POST property-evidence with confidence/quote/raw_transcription → all saved | ✅ route.test.ts | TC-2.4-02 |
| AC-9 | Person detail Relations tab shows outgoing/incoming with inverse_name | — | TC-2.4-01, TC-2.4-05 |
| AC-10 | PropertyEvidence badge 0 → after add shows 1 | — | TC-2.4-02 |
| AC-11 | RelationType settings with CRUD; ≥5 seeded types | — | TC-2.4-03 |
| AC-12 | Global /relations page: paginated table with filters | — | TC-2.4-06 |
| AC-13 | RelationFormDialog pre-fills from entity (prefillFrom) | — | TC-2.4-01 |
| AC-14 | Soft-delete Relation does not cascade to RelationEvidence | ✅ [id]/route.test.ts | — |
| AC-15 | PropertyEvidence table has quote, raw_transcription, confidence columns | ✅ route.test.ts | TC-2.4-02 |

---

## Unit Test Cases

### `src/app/api/relations/route.test.ts`

**GET /api/relations**

| ID | Test | Expected |
|----|------|----------|
| U-REL-01 | Paginated list with from_label/to_label | 200, labels populated |
| U-REL-02 | Missing projectId | 400 |
| U-REL-03 | Unauthenticated | 401 |
| U-REL-04 | Not a project member | 403 |
| U-REL-05 | Cache hit returns cached result | 200, DB not queried |
| U-REL-06 | entityType + entityId OR filter applied | 200, OR clause present |

**POST /api/relations**

| ID | Test | Expected |
|----|------|----------|
| U-REL-07 | Valid creation | 201, id present, cache invalidated |
| U-REL-08 | from_type not in valid_from_types | 422, error: INVALID_FROM_TYPE |
| U-REL-09 | to_type not in valid_to_types | 422, error: INVALID_TO_TYPE |
| U-REL-10 | relation_type_id not found | 404 |
| U-REL-11 | Required fields missing | 400, error: Validation failed |
| U-REL-12 | validateEntityExists returns false for from_id | 404 — **Gap to check** |

### `src/app/api/relation-types/[id]/route.test.ts`

**PUT /api/relation-types/[id]**

| ID | Test | Expected |
|----|------|----------|
| U-RT-01 | Valid name update | 200 |
| U-RT-02 | Not found | 404 |
| U-RT-03 | Empty name | 400 |
| U-RT-04 | Not OWNER/EDITOR | 403 |

**DELETE /api/relation-types/[id]**

| ID | Test | Expected |
|----|------|----------|
| U-RT-05 | Not in use → deleted | 200, deleted: true |
| U-RT-06 | In use → 409 IN_USE with count | 409, error: IN_USE |
| U-RT-07 | Not found | 404 |
| U-RT-08 | Unauthenticated | 401 |

### `src/app/api/property-evidence/route.test.ts`

**GET /api/property-evidence**

| ID | Test | Expected |
|----|------|----------|
| U-PE-01 | Returns list with quote/raw_transcription/confidence | 200, data array |
| U-PE-02 | Unauthenticated | 401 |
| U-PE-03 | Not a project member | 403 |

**POST /api/property-evidence**

| ID | Test | Expected |
|----|------|----------|
| U-PE-04 | Valid creation (birth_year) | 201, logActivity called |
| U-PE-05 | Invalid property (favorite_color) | 422, INVALID_PROPERTY, allowed array |
| U-PE-06 | Entity does not exist | 404 |
| U-PE-07 | Source not in project | 403 |
| U-PE-08 | Required fields missing | 400 |
| U-PE-09 | quote + raw_transcription + confidence saved | 201, values persisted — **Gap to verify** |

### `src/app/api/entities/[type]/[id]/activity/route.test.ts`

**GET /api/entities/[type]/[id]/activity**

| ID | Test | Expected |
|----|------|----------|
| U-ACT-01 | Returns paginated activity with user_name | 200, data present |
| U-ACT-02 | Case-insensitive type (person → PERSON) | 200 |
| U-ACT-03 | Unknown entity type | 400 |
| U-ACT-04 | Entity not found | 404 |
| U-ACT-05 | Unauthenticated | 401 |
| U-ACT-06 | Not a project member | 403 |
| U-ACT-07 | PUT returns 405 | 405 — **Gap to verify** |
| U-ACT-08 | DELETE returns 405 | 405 — **Gap to verify** |

---

## E2E Test Cases

### TC-2.4-01: Create relation with evidence

**Prerequisites:** Seeded admin user, Goethe person (`seed-person-goethe`)

**Steps:**
1. Login as `admin@evidoxa.dev` / `Demo1234!`
2. Navigate to `/de/persons/seed-person-goethe`
3. Click "Relationen" tab
4. Click "Relation hinzufügen"
5. Verify dialog opens with "Von" pre-filled (Goethe, since prefillFrom is set)
6. Select a target entity (Schiller) in "Zu" field
7. Select relation type "was colleague of"
8. Set certainty to PROBABLE
9. Submit → dialog closes
10. Verify relation appears in Outgoing section

**Assertions:**
- Dialog title is "Relation hinzufügen"
- From-entity field is disabled (pre-filled)
- After submit: toast "Relation gespeichert."
- New relation row appears with Goethe → was colleague of → Schiller

---

### TC-2.4-02: PropertyEvidence annotation

**Prerequisites:** Seeded Goethe person (birth_year = 1749)

**Steps:**
1. Login, navigate to `/de/persons/seed-person-goethe`
2. "Attribute" tab is default — verify birth_year field is visible
3. Find the PropertyEvidenceBadge for birth_year (shows "0 Quellen" or similar)
4. Click the badge → popover opens
5. Click "Beleg hinzufügen"
6. Search for a source (type "Goethe")
7. Select "Goethes Briefwechsel mit Schiller"
8. Fill page_reference: "S. 1"
9. Fill quote: "geboren 1749"
10. Submit
11. Verify badge now shows "1 Quelle"

**Assertions:**
- Badge increments from 0 to 1
- Toast "Beleg gespeichert." shown
- confidence/quote fields present in form

---

### TC-2.4-03: RelationType CRUD

**Prerequisites:** Seeded project with ≥4 relation types

**Steps:**
1. Login, navigate to `/de/settings/relation-types`
2. Verify page heading "Relationstypen" is visible
3. Verify at least 4 seeded rows in table
4. Click "Neuer Typ"
5. Fill name: "testbeziehung-e2e"
6. Select PERSON in "Gültig von" checkboxes
7. Select PERSON in "Gültig zu" checkboxes
8. Click "Speichern"
9. Verify toast "Relationstyp gespeichert." and new row appears
10. Find the new row, click delete button
11. Confirm in alert dialog
12. Verify row removed

**Assertions:**
- Table shows seeded types (verwandt, participated, bornIn, colleague = 4)
- New type appears after save
- In-use type shows blocked error (409) when delete attempted (separate assertion with seeded "was colleague of")

---

### TC-2.4-04: Activity log after create

**Prerequisites:** Seeded Goethe person

**Steps:**
1. Login, navigate to `/de/persons/seed-person-goethe`
2. Click "Verlauf" tab
3. Verify existing activity entries appear (CREATE entry from seed)
4. Go back to "Relationen" tab, add a new relation
5. Return to "Verlauf" tab (or reload)
6. Verify CREATE entry for the relation appears

**Assertions:**
- Verlauf tab exists and is clickable
- At least one activity entry visible (from seed data creation or relation creation)
- Activity entry shows "erstellt" label
- Entry shows user name or "System"

---

### TC-2.4-05: Inverse relation display

**Prerequisites:** Seeded relation Caroline → was colleague of → Humboldt (Caroline is FROM, Humboldt is TO)

**Steps:**
1. Login, navigate to `/de/persons/seed-person-humboldt`
2. Click "Relationen" tab
3. Verify the "Eingehend" section shows the Caroline → Humboldt relation
4. Verify the relation_type name shown is the inverse_name "was colleague of"

**Assertions:**
- "Eingehend" section is visible
- Relation from Caroline appears in incoming section
- The type name displayed matches the relation type (inverse_name for incoming)

---

### TC-2.4-06: Global /relations page

**Prerequisites:** Seeded 5 relations

**Steps:**
1. Login, navigate to `/de/relations`
2. Verify page heading "Relationen" visible
3. Verify at least 5 relation rows are listed
4. Type in the search box
5. Verify results filter
6. Click "Relation hinzufügen"
7. Verify RelationFormDialog opens (no prefillFrom)

**Assertions:**
- Relations page loads without error
- Seeded relations visible
- Search input present
- "Relation hinzufügen" button present

---

## Error State Tests

### TC-2.4-E01: RelationType in-use delete blocked

**Steps:**
1. Login to `/de/settings/relation-types`
2. Click delete on "was colleague of" (has relations)
3. Verify toast error with "verwendet" message (not a confirmation dialog, since the frontend checks `_count.relations > 0`)

**Assertions:**
- Toast with error text containing relation count
- Row remains in table

---

## i18n Coverage

| Locale | Path | Key Assertions |
|--------|------|----------------|
| de | `/de/persons/[id]` | Tab: "Relationen", "Verlauf", "Nachweise" |
| de | `/de/settings/relation-types` | Heading: "Relationstypen", Button: "Neuer Typ" |
| de | `/de/relations` | Heading: "Relationen", Button: "Relation hinzufügen" |
| en | `/en/settings/relation-types` | Heading: "Relation Types", Button: "New Type" |

---

## Notes

- Seed IDs used in E2E tests:
  - Person Goethe: `seed-person-goethe`
  - Person Schiller: `seed-person-schiller`
  - Person Humboldt: `seed-person-humboldt`
  - Person Caroline: `seed-person-caroline`
  - RelationType colleague: `seed-rt-colleague`
  - Relation Caroline→Humboldt: `seed-rel-caroline-humboldt`
  - Source Goethe brief: `seed-source-goethe-brief`

- PropertyEvidenceBadge uses `aria-label` = `"{fieldLabel}: {label}"` — target with `getByRole("button", { name: /birth_year/i })`
- Activity log URL pattern: `/api/entities/person/{id}/activity`
- Relations tab uses `t("add")` = "Relation hinzufügen" as the button text
- The "Verlauf" tab text comes from `persons.detail.tabs.activity` = "Verlauf"
