# Test Plan — 2-1/2-4 Cleanup: Person Detail Bug Fixes & Feature Completion

## Scope

Covers all 13 acceptance criteria from the spec. Tests the person detail page on Chromium.

## Test Environment

- Browser: Chromium
- Base URL: http://localhost:3000/de
- Seed user: admin@evidoxa.dev / Demo1234!
- Required state: at least one person, one event, one source, and at least one relation type in the project

---

## Test Cases

### TC-01: Evidence count badge shows correct number

**Objective:** RelationRow evidence badge displays the real count, not `undefined`
**Preconditions:** A relation exists with at least one piece of evidence attached via `/api/relations/[id]/evidence`
**Steps:**

1. Navigate to a person detail page
2. Click the "Relationen" tab
3. Inspect a RelationRow
   **Expected:** A small button shows e.g. "2 Belege" (or "0 Belege" if none). NOT "undefined Belege".
   **Linked AC:** AC-1

---

### TC-02: Edit relation shows entity names in disabled selectors

**Objective:** When editing a relation, the from/to entity names appear in the disabled selectors
**Preconditions:** A relation exists on the person
**Steps:**

1. Navigate to person detail → Relationen tab
2. Click the pencil icon on any relation to open the edit dialog
3. Inspect the "Von" and "Zu" fields
   **Expected:** Both selectors show the current entity names as badges (not blank). Both are non-interactive (disabled).
   **Linked AC:** AC-2

---

### TC-03: New relation from person page pre-fills from-entity

**Objective:** Creating a new relation shows the person in the disabled from-selector
**Preconditions:** On a person detail page with the Relationen tab
**Steps:**

1. Navigate to person detail → Relationen tab
2. Click "Relation hinzufügen"
3. Inspect the "Von" field
   **Expected:** The "Von" field shows the current person's name in a badge. The selector is disabled (no clear button).
   **Linked AC:** AC-3

---

### TC-04: Ereignisse tab shows only Event relations

**Objective:** The Ereignisse tab filters to only event-linked relations
**Preconditions:** Person has at least one relation to an event and one to another entity type
**Steps:**

1. Navigate to person detail → Ereignisse tab
2. Inspect all shown relations
   **Expected:** Only relations where the other entity is an Event (Ereignis) are shown. No Person or Source relations.
   **Linked AC:** AC-4

---

### TC-05: Personen tab shows only Person relations

**Objective:** The Personen tab filters to only person-linked relations
**Steps:**

1. Navigate to person detail → Personen tab
   **Expected:** Only relations to other Person entities appear.
   **Linked AC:** AC-5

---

### TC-06: Quellen tab shows only Source relations

**Objective:** The Quellen tab filters to only source-linked relations
**Steps:**

1. Navigate to person detail → Quellen tab
   **Expected:** Only relations to Source entities appear.
   **Linked AC:** AC-6

---

### TC-07: Filtered tab create button restricts to-entity type

**Objective:** "Relation hinzufügen" from a filtered tab only allows selecting the relevant entity type
**Preconditions:** On the Ereignisse tab
**Steps:**

1. Navigate to person detail → Ereignisse tab
2. Click "Relation hinzufügen"
3. Inspect the "Zu" entity selector
   **Expected:** The type selector in the "Zu" field is restricted to "Ereignis" only. Other entity types are not selectable.
   **Linked AC:** AC-7

---

### TC-08: Nachweise tab shows grouped property evidence

**Objective:** The Nachweise tab renders all PropertyEvidence grouped by field
**Preconditions:** At least one PropertyEvidence record exists for the person (e.g. on `birth_year`)
**Steps:**

1. Navigate to person detail → Nachweise tab
   **Expected:** Evidence items appear, grouped under field labels (e.g. "Geburtsdatum"). Each group shows source title, page reference, quote, and confidence.
   **Linked AC:** AC-8

---

### TC-09: PersonDetailCard has evidence badges for all fields

**Objective:** birth_year, death_year, birth_place, death_place, notes all show PropertyEvidence badges
**Steps:**

1. Navigate to person detail → Attribute tab
2. Inspect the detail card
   **Expected:** Next to birth date, death date, birth place, death place, and notes rows: a small badge (e.g. "0 Quellen") is visible for each field.
   **Linked AC:** AC-9

---

### TC-10: PropertyEvidence badge updates immediately after change

**Objective:** Badge count refreshes without page reload after adding/deleting evidence
**Preconditions:** A person with a birth_year badge showing "0 Quellen"
**Steps:**

1. Navigate to person detail → Attribute tab
2. Click the "0 Quellen" badge next to the birth date
3. Add a piece of evidence (select a source, submit)
4. Without reloading, observe the badge
   **Expected:** The badge updates to "1 Quelle" immediately after the evidence is saved.
   **Linked AC:** AC-10

---

### TC-11: RelationRow Quellen trigger always visible

**Objective:** Every RelationRow has a "0 Belege" (or "N Belege") button that expands an evidence panel
**Preconditions:** A relation exists (even with 0 evidence)
**Steps:**

1. Navigate to person detail → Relationen tab
2. Find a relation with 0 evidence
3. Click the "0 Belege" button
   **Expected:** An evidence panel expands inline. The "Beleg hinzufügen" button is available. Can add evidence via the form.
   **Linked AC:** AC-11

---

### TC-12: ActivityLog refreshes after in-page save

**Objective:** Activity tab shows new entries after saving a relation without reloading
**Preconditions:** On a person detail page with the Activity tab
**Steps:**

1. Navigate to person detail → Relationen tab
2. Create a new relation
3. Switch to the Verlauf tab
   **Expected:** The newly created relation appears in the activity log without a page reload.
   **Linked AC:** AC-12

---

### TC-13: Person field edits appear in activity log

**Objective:** Editing a person's fields creates UPDATE entries in the activity log
**Steps:**

1. Navigate to a person detail page
2. Click "Person bearbeiten" (edit)
3. Change the birth year and notes, save
4. Return to person detail → Verlauf tab
   **Expected:** Two UPDATE entries appear (one for birth_year, one for notes), each showing the old and new values.
   **Linked AC:** AC-13

---

### TC-14: Technical debt documentation exists

**Objective:** docs/technical-debt.md contains known refactoring opportunities
**Steps:**

1. Open docs/technical-debt.md
   **Expected:** File exists and documents known technical debt items from the Epic 2.1/2.4 review.
   **Linked AC:** AC-14
