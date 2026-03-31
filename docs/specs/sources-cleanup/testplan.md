# Test Plan — Source Detail Page Cleanup

## Scope

Covers all acceptance criteria from `docs/specs/sources-cleanup/specification.md`:
filtered Personen/Ereignisse tabs, stale counter removal, Nachweise tab,
SourceDetailCard extraction with PropertyEvidence badges, activity logging on
source updates, and ActivityLog refresh wiring.

## Test Environment

- Browser: Chromium (primary), Firefox
- Base URL: http://localhost:3000
- Required seed data: at least one project with one source, one person, one event,
  and RelationTypes covering SOURCE→PERSON and SOURCE→EVENT combinations.

---

## Test Cases

### TC-SRC-01: "Personen" tab shows filtered relations (PERSON only)

**Objective:** Only relations where the other entity is a Person appear
**Preconditions:** Source has at least one PERSON relation and one EVENT relation
**Steps:**

1. Navigate to `/de/sources/[id]`
2. Click the "Personen" tab
3. Inspect the relations table
   **Expected:** Only Person-type relations shown; Event relations absent
   **Linked AC:** AC-1

### TC-SRC-02: "Ereignisse" tab shows filtered relations (EVENT only)

**Objective:** Only relations where the other entity is an Event appear
**Preconditions:** Same as TC-SRC-01
**Steps:**

1. Navigate to `/de/sources/[id]`
2. Click the "Ereignisse" tab
3. Inspect the relations table
   **Expected:** Only Event-type relations shown; Person relations absent
   **Linked AC:** AC-2

### TC-SRC-03: Filtered tab restricts create dialog entity type

**Objective:** Create dialog from "Personen" tab pre-fills to-entity type as PERSON
**Preconditions:** At least one RelationType covering SOURCE→PERSON
**Steps:**

1. Navigate to `/de/sources/[id]`
2. Click "Personen" tab
3. Click "Relation hinzufügen"
4. Observe the "Zu" entity selector
   **Expected:** "Zu" selector only shows Person entities
   **Linked AC:** AC-3

### TC-SRC-04: Stale totalLinks counter is removed

**Objective:** No "(X Verknüpfungen • Y Quellenbelege)" paragraph below "Verknüpfungen" tab
**Preconditions:** Source with at least one relation_evidence and property_evidence record
**Steps:**

1. Navigate to `/de/sources/[id]`
2. Click "Verknüpfungen" tab
3. Observe the area below the relations table
   **Expected:** No counter paragraph present; relations table appears without footnote
   **Linked AC:** AC-4

### TC-SRC-05: "Nachweise" tab appears and renders evidence by field

**Objective:** SourceDetailTabs has a "Nachweise" tab with field-grouped evidence
**Preconditions:** Source with at least one PropertyEvidence record (e.g., on `author`)
**Steps:**

1. Navigate to `/de/sources/[id]`
2. Observe the tab list — "Nachweise" should be visible
3. Click "Nachweise"
4. Observe grouped evidence
   **Expected:** Tab exists; evidence grouped by field with translated label (e.g., "Autor")
   **Linked AC:** AC-5

### TC-SRC-06: Details tab renders via SourceDetailCard

**Objective:** The "Details" tab content is rendered by the extracted SourceDetailCard component
**Preconditions:** A source with title, author, type, and date populated
**Steps:**

1. Navigate to `/de/sources/[id]`
2. Observe the "Details" tab (default)
3. Check that all fields are visible: title, type, author, reliability, date, repository, call_number, url
   **Expected:** All fields rendered correctly in the grid layout
   **Linked AC:** AC-6

### TC-SRC-07: PropertyEvidence badges visible on all 7 fields

**Objective:** Badges appear on title, author, date, repository, call_number, url, notes
**Preconditions:** Source with all 7 fields populated
**Steps:**

1. Navigate to `/de/sources/[id]`
2. Observe the "Details" tab
3. Check each of: title, author, date, repository, call_number, url, notes rows
   **Expected:** Each row shows a PropertyEvidence badge ("0 Quellen" or count > 0)
   **Linked AC:** AC-7

### TC-SRC-08: Badge count updates immediately after adding evidence

**Objective:** Adding evidence via badge popover updates count without page reload
**Preconditions:** Source with at least one field visible; a source (citation) available
**Steps:**

1. Navigate to `/de/sources/[id]`
2. Click a "0 Quellen" badge on the "Autor" row
3. Add a new evidence entry in the popover
4. Observe the badge count
   **Expected:** Badge updates to "1 Quelle" immediately without reload
   **Linked AC:** AC-8

### TC-SRC-09: ActivityLog refreshes after in-page relation change

**Objective:** ActivityLog updates when a relation is created without a page reload
**Preconditions:** Source with the ActivityLog tab visible
**Steps:**

1. Navigate to `/de/sources/[id]`
2. Click "Verlauf" tab; note current entry count
3. Click "Verknüpfungen" tab; add a new relation
4. Click "Verlauf" tab again without reloading
   **Expected:** New relation activity entry appears
   **Linked AC:** AC-9

### TC-SRC-10: Source field edits are logged in ActivityLog

**Objective:** PUT /api/sources/[id] logs UPDATE entries for changed fields
**Preconditions:** A logged-in user with editor access to the source
**Steps:**

1. Navigate to `/de/sources/[id]/edit`
2. Change the author field and save
3. Return to `/de/sources/[id]`
4. Click "Verlauf" tab
   **Expected:** Activity entry shows action "aktualisiert", field "author", with old and new values
   **Linked AC:** AC-10

### TC-SRC-11: Locale switch (en) — tab labels correct

**Objective:** Tabs show English labels in English locale
**Preconditions:** None
**Steps:**

1. Navigate to `/en/sources/[id]`
2. Observe the tab list
   **Expected:** "Persons", "Events", "Evidence" tabs visible (not "Personen", "Ereignisse", "Nachweise")
   **Linked AC:** AC-1, AC-2, AC-5
