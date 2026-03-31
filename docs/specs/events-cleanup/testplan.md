# Test Plan — Event Detail Page Cleanup

## Scope

Covers all acceptance criteria from `docs/specs/events-cleanup/specification.md`:
EntityEvidenceTab generalisation, filtered Personen/Quellen tabs, Nachweise tab,
PropertyEvidence badges on EventDetailCard, activity logging on event updates,
and ActivityLog refresh wiring.

## Test Environment

- Browser: Chromium (primary), Firefox
- Base URL: http://localhost:3000
- Required seed data: at least one project with one event, one person, one source,
  and at least one RelationType that covers EVENT→PERSON and EVENT→SOURCE combinations.

---

## Test Cases

### TC-EV-01: EntityEvidenceTab empty state copy (generic)

**Objective:** Verify empty state reads "Keine Nachweise vorhanden." (not person-specific)
**Preconditions:** An event with no PropertyEvidence records
**Steps:**

1. Navigate to `/de/events/[id]`
2. Click the "Nachweise" tab
3. Observe the empty state paragraph
   **Expected:** Text reads "Keine Nachweise vorhanden." (no entity type in copy)
   **Linked AC:** AC-1, AC-2

### TC-EV-02: PersonDetailTabs unchanged (backwards compat)

**Objective:** Verify PersonDetailTabs evidence tab still shows person-field labels
**Preconditions:** A person with at least one PropertyEvidence record (e.g., on `birth_year`)
**Steps:**

1. Navigate to `/de/persons/[id]`
2. Click "Nachweise" tab
3. Observe the field group label for `birth_year`
   **Expected:** Label shows translated person field name (e.g., "Geburtsdatum")
   **Linked AC:** AC-1

### TC-EV-03: EventDetailTabs "Personen" tab shows filtered relations

**Objective:** Only relations where the other entity is a Person appear
**Preconditions:** Event has at least one PERSON relation and one SOURCE relation
**Steps:**

1. Navigate to `/de/events/[id]`
2. Click the "Personen" tab
3. Inspect the relations table
   **Expected:** Only Person-type relations shown; Source relations absent
   **Linked AC:** AC-3

### TC-EV-04: EventDetailTabs "Quellen" tab shows filtered relations

**Objective:** Only relations where the other entity is a Source appear
**Preconditions:** Same as TC-EV-03
**Steps:**

1. Navigate to `/de/events/[id]`
2. Click the "Quellen" tab
3. Inspect the relations table
   **Expected:** Only Source-type relations shown; Person relations absent
   **Linked AC:** AC-4

### TC-EV-05: Filtered tab "Personen" restricts create dialog entity type

**Objective:** Create dialog opened from "Personen" tab pre-fills to-entity type as PERSON
**Preconditions:** At least one RelationType covering EVENT→PERSON
**Steps:**

1. Navigate to `/de/events/[id]`
2. Click "Personen" tab
3. Click "Relation hinzufügen" button
4. Observe the "Zu" entity selector in the dialog
   **Expected:** "Zu" dropdown only offers Person entities (filterToEntityType="PERSON" applied)
   **Linked AC:** AC-5

### TC-EV-06: "Nachweise" tab appears and renders evidence

**Objective:** EventDetailTabs has a "Nachweise" tab that renders PropertyEvidence by field
**Preconditions:** Event with at least one PropertyEvidence record (e.g., on `start_year`)
**Steps:**

1. Navigate to `/de/events/[id]`
2. Observe the tab list — "Nachweise" should be visible
3. Click "Nachweise"
4. Observe grouped evidence display
   **Expected:** Tab exists; evidence grouped by field with translated label (e.g., "Beginn")
   **Linked AC:** AC-6

### TC-EV-07: PropertyEvidence badge on start date row

**Objective:** EventDetailCard shows a badge for `start_year` in the start date row
**Preconditions:** Event with a start year set
**Steps:**

1. Navigate to `/de/events/[id]`
2. Click "Attribute" tab (default)
3. Observe the start date row
   **Expected:** A "0 Quellen" badge (or count > 0 if evidence exists) visible next to start date
   **Linked AC:** AC-7

### TC-EV-08: PropertyEvidence badge on end date, location, description, notes

**Objective:** Badges appear on all specified fields
**Preconditions:** Event with end year, location, description, and notes all populated
**Steps:**

1. Navigate to `/de/events/[id]`
2. Click "Attribute" tab
3. Observe end date, location, description, and notes rows
   **Expected:** Each row shows a PropertyEvidence badge
   **Linked AC:** AC-7

### TC-EV-09: Badge count updates immediately after adding evidence

**Objective:** Adding evidence via badge popover updates count without page reload
**Preconditions:** Event with at least one field visible; a source available
**Steps:**

1. Navigate to `/de/events/[id]`
2. Click a "0 Quellen" badge on the start date row
3. In the popover, add a new evidence entry (select source, save)
4. Observe the badge
   **Expected:** Badge updates to "1 Quelle" immediately without reload
   **Linked AC:** AC-8

### TC-EV-10: ActivityLog refreshes after in-page relation change

**Objective:** ActivityLog updates when a relation is created via "Relationen" tab
**Preconditions:** Event with the ActivityLog tab visible
**Steps:**

1. Navigate to `/de/events/[id]`
2. Click "Verlauf" tab; note current entry count
3. Click "Relationen" tab; add a new relation
4. Click "Verlauf" tab again without reloading
   **Expected:** New relation activity entry appears in the log
   **Linked AC:** AC-9

### TC-EV-11: Event field edits are logged in ActivityLog

**Objective:** PUT /api/events/[id] logs UPDATE entries for changed fields
**Preconditions:** A logged-in user with editor access to the event
**Steps:**

1. Navigate to `/de/events/[id]/edit`
2. Change the title and save
3. Return to `/de/events/[id]`
4. Click "Verlauf" tab
   **Expected:** An activity entry shows action "aktualisiert", field "title", with old and new values
   **Linked AC:** AC-10

### TC-EV-12: Locale switch (en) — tab labels correct

**Objective:** "Nachweise" tab shows "Evidence" in English locale
**Preconditions:** None
**Steps:**

1. Navigate to `/en/events/[id]`
2. Observe the tab list
   **Expected:** Tabs show "Evidence" (not "Nachweise"), "Persons" (not "Personen"), "Sources" (not "Quellen")
   **Linked AC:** AC-6
