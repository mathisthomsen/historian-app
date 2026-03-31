# Test Plan — Epic 2.2 Event Management

## Scope

Full CRUD for Events and EventTypes including hierarchical sub-events, date filtering with overlap semantics, EventType color taxonomy, bulk delete, and the settings page.

**Out of scope:** Person/Source relation linking (Epic 2.4), location geocoding (Epic 3.2).

## Test Environment

- Browser: Chromium (primary), Firefox (secondary)
- Base URL: `http://localhost:3000/de`
- Seed data: `admin@evidoxa.dev` / `Demo1234!` — demo project with 8 default EventTypes, 4 seed events

---

## Test Cases

### TC-E-01: Create a top-level event

**Objective:** Create an event with title, EventType, and start year with certainty
**Preconditions:** Logged in as admin
**Steps:**

1. Navigate to `/de/events`
2. Click "+ Neues Ereignis"
3. Fill title "Erster Weltkrieg"
4. Select type "Krieg" from the combobox
5. Enter start year 1914
6. Set start certainty to "Wahrscheinlich"
7. Click "Ereignis speichern"
   **Expected:** Redirected to event detail page showing "Erster Weltkrieg", type "Krieg" with orange dot, start "1914 (Wahrscheinlich)". Toast "Ereignis gespeichert." shown.
   **Linked AC:** AC-08, AC-14

### TC-E-02: Create a sub-event from parent detail page

**Objective:** Create a sub-event linked to parent
**Preconditions:** TC-E-01 completed; on WWI detail page
**Steps:**

1. Click "Unterereignisse" tab
2. Click "+ Unterereignis hinzufügen"
3. Verify "Übergeordnetes Ereignis" is pre-filled with "Erster Weltkrieg"
4. Fill title "Schlacht an der Somme"
5. Enter start year 1916, month Juli
6. Click "Ereignis speichern"
   **Expected:** Redirected to "Schlacht an der Somme" detail. Parent shows "Erster Weltkrieg" link.
   **Linked AC:** AC-14, AC-17

### TC-E-03: View parent detail — sub-events tab shows count

**Objective:** Sub-events tab shows correct count and list
**Preconditions:** TC-E-02 completed
**Steps:**

1. Navigate to "Erster Weltkrieg" detail page
2. Click "Unterereignisse" tab
   **Expected:** Tab label shows "Unterereignisse (1)". Table shows "Schlacht an der Somme".
   **Linked AC:** AC-17

### TC-E-04: View sub-event detail — parent link works

**Objective:** Sub-event shows parent link in Attribute tab
**Preconditions:** TC-E-02 completed; on "Schlacht an der Somme" detail
**Steps:**

1. View "Attribute" tab
2. Verify "Übergeordnet" row shows "Erster Weltkrieg" as a link
3. Click the link
   **Expected:** Navigate to "Erster Weltkrieg" detail page.
   **Linked AC:** AC-16

### TC-E-05: Edit event — change type and certainty

**Objective:** Editing an event updates data correctly
**Preconditions:** "Erster Weltkrieg" exists
**Steps:**

1. Open "Erster Weltkrieg" detail
2. Click "Bearbeiten"
3. Change start certainty from "Wahrscheinlich" to "Sicher"
4. Click "Ereignis speichern"
   **Expected:** Detail page shows "1914 (Sicher)". Toast shown.
   **Linked AC:** AC-14

### TC-E-06: Delete event — blocked if has sub-events

**Objective:** Cannot delete parent with sub-events; confirm soft-delete works for sub-events
**Preconditions:** "Erster Weltkrieg" has 1 sub-event
**Steps:**

1. Open "Erster Weltkrieg" detail
2. Click "Löschen"
3. Verify warning about sub-events is shown and delete button is disabled
4. Navigate to "Schlacht an der Somme", click "Löschen"
5. Confirm deletion
   **Expected:** "Erster Weltkrieg" delete is blocked. "Schlacht an der Somme" is deleted and removed from list.
   **Linked AC:** AC-09

### TC-E-07: Bulk delete two events

**Objective:** Bulk select and delete events
**Preconditions:** At least 2 events in list (no sub-events)
**Steps:**

1. Navigate to `/de/events`
2. Check two top-level events
3. Click "Löschen" in bulk action bar
4. Confirm in dialog
   **Expected:** Both events removed from list. Toast "{count} Ereignisse gelöscht." shown.
   **Linked AC:** AC-10

### TC-E-08: Filter list by EventType

**Objective:** Type filter narrows event list
**Preconditions:** "Erster Weltkrieg" (type: Krieg) exists; other events with different types exist
**Steps:**

1. Navigate to `/de/events`
2. Click "Typ" filter dropdown
3. Select "Krieg"
   **Expected:** Only events with type "Krieg" shown. Badge on Typ button shows "1".
   **Linked AC:** AC-13

### TC-E-09: Filter by date range — overlap semantics + tooltip

**Objective:** Date range filter uses overlap logic; tooltip visible
**Preconditions:** "Erster Weltkrieg" (1914–1918) exists
**Steps:**

1. Navigate to `/de/events`
2. Enter "Von Jahr" = 1900, "Bis Jahr" = 1920
3. Hover over the info (⊕) icon next to date range
   **Expected:** "Erster Weltkrieg" appears in results. Tooltip shows overlap explanation text.
   **Linked AC:** AC-06, AC-13

### TC-E-10: Filter "Nur Hauptereignisse"

**Objective:** Sub-events are hidden when top-level-only is checked
**Preconditions:** "Erster Weltkrieg" (parent) and "Schlacht an der Somme" (sub-event) both exist
**Steps:**

1. Navigate to `/de/events`
2. Check "Nur Hauptereignisse"
   **Expected:** "Schlacht an der Somme" disappears from list. "Erster Weltkrieg" remains.
   **Linked AC:** AC-07, AC-13

### TC-E-11: Search by title

**Objective:** Title search filters results
**Preconditions:** Multiple events in list
**Steps:**

1. Navigate to `/de/events`
2. Type "Somme" in search box
   **Expected:** Only "Schlacht an der Somme" shown (or events containing "Somme" in title).
   **Linked AC:** AC-04

### TC-E-12: EventType inline create from event form combobox

**Objective:** User can create a new EventType directly from the form
**Preconditions:** Creating a new event
**Steps:**

1. Navigate to `/de/events/new`
2. In Typ combobox, type "Belagerung" (non-existing)
3. Click "Neu erstellen: 'Belagerung'"
   **Expected:** Type "Belagerung" created and selected in combobox. Link "Farbe zuweisen →" visible.
   **Linked AC:** AC-15

### TC-E-13: EventType settings page — full lifecycle

**Objective:** CRUD for EventTypes on settings page
**Preconditions:** Logged in as admin
**Steps:**

1. Navigate to `/de/settings/event-types`
2. Verify 8 default types listed
3. Click "+ Neuer Ereignistyp", type "Expedition", select blue color, save
4. Click "Bearbeiten" on "Expedition", rename to "Forschung", save
5. Click ✕ on "Krieg" (in-use type): verify toast "Dieser Typ wird von X Ereignissen verwendet." with link — NO dialog
6. Click ✕ on "Forschung" (0 events): confirm AlertDialog → deleted
   **Expected:** All above steps work correctly. "Forschung" is removed from list.
   **Linked AC:** AC-11, AC-12, AC-18

### TC-E-14: Pagination — page 2 navigation

**Objective:** Pagination works when more events than pageSize exist
**Preconditions:** 26+ events in DB (may need to create manually or use seed)
**Steps:**

1. Navigate to `/de/events`
2. If fewer than 26 events: create events until page 2 exists
3. Navigate to page 2
   **Expected:** Page 2 shows different events. "Seite 2" shown in pagination.
   **Linked AC:** AC-04

### TC-E-15: Sort by title

**Objective:** Column sort works
**Preconditions:** Multiple events in list
**Steps:**

1. Navigate to `/de/events`
2. Click "Titel" column header
3. Click again to reverse
   **Expected:** Events ordered alphabetically A→Z then Z→A.
   **Linked AC:** AC-04

### TC-E-16: Sub-event as parent — inline error

**Objective:** Depth limit enforced client-side and server-side
**Preconditions:** "Erster Weltkrieg" exists with "Schlacht an der Somme" as sub-event
**Steps:**

1. Navigate to `/de/events/new`
2. Fill title "Test Event"
3. In "Übergeordnetes Ereignis", select "Schlacht an der Somme" (a sub-event)
4. Try to save
   **Expected:** Inline error shown below parent field: "Ereignis 'Schlacht an der Somme' ist selbst ein Unterereignis...". Other fields retain their values.
   **Linked AC:** AC-08
