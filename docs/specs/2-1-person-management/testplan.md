# Test Plan — Epic 2.1 Person Management

## Scope

Full CRUD for persons: create, read, update, soft-delete, search, pagination, bulk delete. Covers list view, detail view, create form, edit form, name variants, certainty selector, partial dates, and i18n.

## Out of Scope

- Location FK linking (Epic 3.2)
- Relations tab full content (Epic 2.4)
- PostgreSQL full-text search (Epic 4.1)

## Test Environment

- Browser: Chromium (primary), Firefox
- Base URL: http://localhost:3000
- Locale: de (default)
- Seed user: admin@evidoxa.dev / Demo1234! (must be a member of a default project)

---

## Test Cases

### TC-P-01: Create person with year-only birth date and PROBABLE certainty

**Objective:** Creating a person with partial date (year only) and PROBABLE certainty stores and displays correctly
**Preconditions:** Logged in as admin. At least one project exists.
**Steps:**

1. Navigate to `/de/persons/new`
2. Enter first_name="Karl", last_name="Maier"
3. In Geburtsdaten section, enter year=1848
4. Click "Wahrscheinlich" certainty button
5. Click "Person speichern"
   **Expected:** Redirected to `/de/persons/[id]` — detail page shows "Karl Maier" as title. Toast "Person gespeichert." appears.
   **Linked AC:** AC-02

### TC-P-02: Create person with full birth date (year+month+day)

**Objective:** All three date parts are stored and displayed
**Preconditions:** Logged in
**Steps:**

1. Navigate to `/de/persons/new`
2. Enter last_name="Müller"
3. Enter birth year=1872, select month=März, enter day=15
4. Save
   **Expected:** Detail page shows "15. März 1872" for birth date
   **Linked AC:** AC-03

### TC-P-03: Create person with name variant (Latin, language=la)

**Objective:** Name variants are stored and displayed in Weitere Namen tab
**Preconditions:** Logged in, test person from TC-P-01 exists
**Steps:**

1. Navigate to `/de/persons/[karl-maier-id]/edit`
2. Click "Name hinzufügen"
3. Enter name="Carolus Magnus", language="la"
4. Save
   **Expected:** Detail page "Weitere Namen" tab shows "Carolus Magnus" with "la" badge
   **Linked AC:** AC-04

### TC-P-04: Search by last name finds correct person

**Objective:** Search filters persons by last name
**Preconditions:** At least one person with last_name="Maier" exists
**Steps:**

1. Navigate to `/de/persons`
2. Type "Maier" in search box
3. Wait for table to update (debounce ~300ms)
   **Expected:** Table shows only persons matching "Maier". Other persons not visible.
   **Linked AC:** AC-05

### TC-P-05: Search by name variant finds person

**Objective:** Search covers PersonName.name field too
**Preconditions:** Person with name variant "Carolus Magnus" exists
**Steps:**

1. Navigate to `/de/persons`
2. Type "Carolus" in search box
3. Wait for table to update
   **Expected:** Karl Maier appears in results (matched via name variant)
   **Linked AC:** AC-06

### TC-P-06: Edit person — change death date certainty from UNKNOWN to CERTAIN

**Objective:** Editing certainty persists correctly
**Preconditions:** A person exists with no death date certainty set (default UNKNOWN)
**Steps:**

1. Click "Person bearbeiten" on detail page
2. In Sterbedaten section, click "Sicher"
3. Save
   **Expected:** Detail page shows certainty label updated. Toast "Person gespeichert." shown.
   **Linked AC:** AC-08

### TC-P-07: Delete single person from detail page

**Objective:** Soft-delete removes person from list
**Preconditions:** A person exists
**Steps:**

1. Navigate to person detail page
2. Click "Person löschen"
3. Confirm in dialog
   **Expected:** Redirected to `/de/persons`. Person no longer visible in list. Toast "Person gelöscht." shown.
   **Linked AC:** AC-09

### TC-P-08: Bulk select 2 persons → confirm delete → both removed

**Objective:** Bulk soft-delete works correctly
**Preconditions:** At least 2 persons exist
**Steps:**

1. Navigate to `/de/persons`
2. Check checkboxes for 2 persons
3. Click "Löschen" bulk button
4. Confirm in dialog
   **Expected:** Both persons disappear from list. Toast shows count deleted.
   **Linked AC:** AC-10

### TC-P-09: Person detail page shows correct attribute values

**Objective:** All person fields display correctly
**Preconditions:** A person with all fields populated exists
**Steps:**

1. Navigate to `/de/persons/[id]`
2. Check Attribute tab content
   **Expected:** Birth date, birth place, death date, death place, notes all visible. "—" for null fields.
   **Linked AC:** AC-03

### TC-P-10: Person detail name variants tab shows alternate names

**Objective:** PersonName records display in correct tab
**Preconditions:** Person with name variants exists
**Steps:**

1. Navigate to `/de/persons/[id]`
2. Click "Weitere Namen" tab
   **Expected:** Name variants list with language badges visible
   **Linked AC:** AC-04

### TC-P-11: Sort list by first name asc/desc

**Objective:** Column header click toggles sort direction and updates URL
**Preconditions:** Multiple persons exist
**Steps:**

1. Navigate to `/de/persons`
2. Click "Vorname" column header
3. Observe sort order
4. Click "Vorname" again
   **Expected:** URL params `?sort=first_name&order=asc` then `?sort=first_name&order=desc`. Table order changes.
   **Linked AC:** AC-01

### TC-P-12: Pagination: 26 persons → navigate to page 2

**Objective:** Pagination works with default pageSize=25
**Preconditions:** 26+ persons exist in the project
**Steps:**

1. Navigate to `/de/persons`
2. Verify "Seite 1 / 2" shown
3. Click "Weiter >"
   **Expected:** URL changes to `?page=2`. Second page of persons shown.
   **Linked AC:** AC-01

### TC-P-13: Empty state message

**Objective:** Empty state shows correct message and link
**Preconditions:** No persons in project (or fresh project)
**Steps:**

1. Navigate to `/de/persons` with empty project
   **Expected:** "Noch keine Personen." text and "Erste Person anlegen" link visible
   **Linked AC:** AC-01

### TC-P-14: i18n — English persons page

**Objective:** All UI text renders in English when locale is en
**Preconditions:** Logged in
**Steps:**

1. Navigate to `/en/persons`
   **Expected:** "Persons" as page title, "New Person" button, English column headers
   **Linked AC:** AC-14

### TC-P-15: API — GET /api/persons returns empty paginated response

**Objective:** API returns correct shape for empty project
**Preconditions:** Logged in, no persons in project
**Steps:**

1. GET /api/persons
   **Expected:** `{ data: [], pagination: { page: 1, pageSize: 25, total: 0, totalPages: 0 } }`
   **Linked AC:** AC-11

### TC-P-16: API validation — POST without name returns 400

**Objective:** Validation rejects person with no name
**Steps:**

1. POST /api/persons with `{ project_id: "..." }` (no first_name, last_name, names)
   **Expected:** HTTP 400 with validation error details
   **Linked AC:** AC-12

### TC-P-17: API validation — POST with birth_month but no birth_year returns 400

**Objective:** Cross-field date validation works
**Steps:**

1. POST /api/persons with `{ project_id: "...", last_name: "X", birth_month: 3 }`
   **Expected:** HTTP 400 with `month_requires_year` error
   **Linked AC:** AC-13
