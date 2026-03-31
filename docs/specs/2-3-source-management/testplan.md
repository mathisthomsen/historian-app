# Test Plan — Epic 2.3 Source Management

## Scope
Full CRUD for primary sources (archival documents, letters, records) including reliability scoring, filtering, and detail page with evidence counts. Tests cover the entire user journey from creating a source through searching, filtering, editing, and deletion.

Out of scope: populated Relations tab (Epic 2.4), PropertyEvidence UI (Epic 2.4), BibTeX import (Epic 3.3).

## Test Environment
- Browser: Chromium (primary), Firefox (secondary)
- Base URL: http://localhost:3000
- Required seed: Logged-in user (`admin@evidoxa.dev` / `Demo1234!`) with an active project

---

## Test Cases

### TC-SRC-01: Create source with all fields
**Objective:** Verify a source can be created with all fields including reliability badge
**Preconditions:** Logged in as admin; sources list is accessible
**Steps:**
1. Navigate to `/de/sources/new`
2. Fill Title = "Test Archivbrief 1848"
3. Select type = "letter" (from dropdown)
4. Fill Author = "Johann Müller"
5. Click "Hoch" reliability button
6. Fill Date = "ca. März 1848"
7. Fill Repository = "Staatsarchiv München"
8. Fill Call Number = "NL-123"
9. Fill URL = "https://example.com/doc"
10. Fill Notes = "Wichtiger Fund"
11. Click "Quelle erstellen"
**Expected:** Redirects to detail page for the new source; detail shows all filled fields; green "Hoch" badge visible
**Linked AC:** AC-2, AC-3

### TC-SRC-02: Edit source title and reliability
**Objective:** Verify editing a source updates the detail page
**Preconditions:** At least one source exists (from TC-SRC-01)
**Steps:**
1. Navigate to the source detail page
2. Click "Quelle bearbeiten"
3. Change Title to "Test Archivbrief 1848 (bearbeitet)"
4. Click "Mittel" reliability button
5. Click "Änderungen speichern"
**Expected:** Redirected to detail page; title shows "(bearbeitet)" suffix; badge shows yellow "Mittel"
**Linked AC:** AC-4

### TC-SRC-03: Delete source from detail page
**Objective:** Verify soft-delete removes source from list
**Preconditions:** At least one source exists
**Steps:**
1. Navigate to source detail page
2. Click "Quelle löschen"
3. Confirm deletion in dialog
**Expected:** Redirected to `/de/sources`; deleted source no longer in table; navigating directly to `/de/sources/{id}` shows 404 page
**Linked AC:** AC-5, AC-15

### TC-SRC-04: Bulk delete 2 sources
**Objective:** Verify selecting and bulk-deleting multiple sources
**Preconditions:** At least 2 sources exist
**Steps:**
1. Navigate to `/de/sources`
2. Check the checkbox on row 1
3. Check the checkbox on row 2
4. Click "Löschen" bulk delete button
5. Confirm in dialog
**Expected:** Both sources disappear from the table; success toast shown; count in footer decreases by 2
**Linked AC:** AC-6

### TC-SRC-05: Search by title
**Objective:** Verify search filters sources by title substring
**Preconditions:** Multiple sources exist; at least one with "Brief" in title
**Steps:**
1. Navigate to `/de/sources`
2. Type "Brief" in the search field
**Expected:** Only sources with "Brief" in title are shown; sources without "Brief" are not visible
**Linked AC:** AC-7

### TC-SRC-06: Search by author
**Objective:** Verify search filters sources by author name
**Preconditions:** Multiple sources; at least one with author "Müller"
**Steps:**
1. Navigate to `/de/sources`
2. Type "Müller" in the search field
**Expected:** Only sources with "Müller" in author field are shown
**Linked AC:** AC-8

### TC-SRC-07: Filter by reliability=HIGH
**Objective:** Verify reliability filter shows only HIGH sources
**Preconditions:** Sources with different reliability levels exist
**Steps:**
1. Navigate to `/de/sources`
2. Click "HIGH" in the reliability filter
**Expected:** Only sources with HIGH reliability (green badge) are shown
**Linked AC:** AC-9

### TC-SRC-08: Source detail page shows all attributes
**Objective:** Verify detail page renders all fields correctly
**Preconditions:** A source exists with all fields filled
**Steps:**
1. Navigate to the source detail page
2. Verify Title, Type pill, Author, Reliability badge
3. Verify Date, Repository, Call Number
4. Verify URL is a clickable link
5. Verify Notes
6. Verify Created at and Updated at timestamps
**Expected:** All fields visible; URL is an `<a>` tag with href; timestamps are formatted dates
**Linked AC:** AC-11

### TC-SRC-09: Relations tab renders placeholder without error
**Objective:** Verify Relations tab shows placeholder content
**Preconditions:** On a source detail page
**Steps:**
1. Navigate to source detail page
2. Click "Verknüpfungen" tab
**Expected:** Placeholder text visible ("Verknüpfungen werden nach Abschluss von Epic 2.4 angezeigt."); no JavaScript errors in console
**Linked AC:** AC-12

### TC-SRC-10: URL validation inline error
**Objective:** Verify malformed URL shows inline validation error
**Preconditions:** On the new source form
**Steps:**
1. Navigate to `/de/sources/new`
2. Fill Title = "Test"
3. Fill Type = "other"
4. Fill URL = "not-a-url"
5. Click "Quelle erstellen"
**Expected:** Form does NOT submit; inline error appears under URL field; source is NOT created
**Linked AC:** AC-13

### TC-SRC-11: Custom type entry
**Objective:** Verify typing a custom type not in suggestions saves correctly
**Preconditions:** On the new source form
**Steps:**
1. Navigate to `/de/sources/new`
2. Fill Title = "Manuskript Test"
3. Open the Type combo-box
4. Type "manuscript" (not in suggestion list)
5. Select/confirm "manuscript" as value
6. Click "Quelle erstellen"
**Expected:** Source created with type = "manuscript"; detail page shows "manuscript" as type
**Linked AC:** AC-14

### TC-SRC-12: Sidebar navigation
**Objective:** Verify Sources link in sidebar navigates correctly
**Preconditions:** Logged in, viewing any app page
**Steps:**
1. Open sidebar (if collapsed)
2. Click "Quellen" in sidebar
**Expected:** Navigates to `/de/sources`; page title "Quellen" or "Alle Quellen" visible
**Linked AC:** AC-17

### TC-SRC-13: i18n locale switching
**Objective:** Verify all labels switch between German and English
**Preconditions:** On the sources list page
**Steps:**
1. Navigate to `/de/sources`
2. Verify German labels ("Quellen", "Titel oder Autor suchen…")
3. Switch to English locale
4. Verify English labels ("Sources", "Search by title or author…")
**Expected:** All visible text updates to the selected language
**Linked AC:** AC-16
