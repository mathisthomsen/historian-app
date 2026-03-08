# Test Plan — Epic 1.1 Project Bootstrap

## Scope
Browser-based E2E verification of the bootstrapped Next.js application using Playwright against Chrome.

---

## Test Environment
- Browser: Chromium (Desktop Chrome profile)
- Base URL: http://localhost:3000
- App state: Clean dev server (`pnpm dev`)

---

## Test Cases

### TC-01: Root redirect
**Objective:** Verify `/` redirects to `/de`
**Steps:**
1. Navigate to `http://localhost:3000/`
**Expected:** URL becomes `http://localhost:3000/de` (or `/de/...`)

---

### TC-02: German locale loads app shell
**Objective:** Verify `/de` renders the full app shell
**Steps:**
1. Navigate to `/de`
**Expected:**
- Page title includes "Evidoxa"
- TopBar visible with logo text "Evidoxa"
- Sidebar visible with nav items (Dashboard, Personen, etc.)
- Content area rendered

---

### TC-03: English locale loads app shell
**Objective:** Verify `/en` renders the full app shell in English
**Steps:**
1. Navigate to `/en`
**Expected:**
- Sidebar contains "Persons" (not "Personen")
- Sidebar contains "Events" (not "Ereignisse")

---

### TC-04: Language switcher DE → EN
**Objective:** Verify switching to EN changes visible text
**Steps:**
1. Navigate to `/de`
2. Click the "EN" button in the TopBar
**Expected:**
- URL changes to `/en`
- `NEXT_LOCALE` cookie set to `en`
- Sidebar text changes from German to English

---

### TC-05: Language switcher EN → DE
**Objective:** Verify switching back to DE works
**Steps:**
1. Navigate to `/en`
2. Click the "DE" button
**Expected:**
- URL changes to `/de`
- `NEXT_LOCALE` cookie set to `de`
- Sidebar text changes back to German

---

### TC-06: Cookie persistence
**Objective:** Verify `NEXT_LOCALE` cookie persists locale across page refresh
**Steps:**
1. Navigate to `/de`, click "EN"
2. Reload the page
**Expected:** Stays on `/en` (cookie drives routing)

---

### TC-07: Dev showcase page renders
**Objective:** Verify `/de/dev/showcase` renders all components without errors
**Steps:**
1. Navigate to `/de/dev/showcase`
**Expected:**
- Page title "Komponentenübersicht" visible
- Sections: Buttons, Inputs, Badges, Cards, Dialogs, Tabs, Tables, Avatars, Skeletons, Theme, Locale
- No console errors
- All button variants visible
- Table with 5 rows of sample data visible

---

### TC-08: Dialog opens and closes
**Objective:** Verify the Dialog component in showcase works
**Steps:**
1. Navigate to `/de/dev/showcase`
2. Click "Open Dialog"
3. Verify dialog is visible
4. Click Close (×) button
**Expected:** Dialog opens then closes

---

### TC-09: Dark mode toggle
**Objective:** Verify dark mode applies `dark` class to `<html>`
**Steps:**
1. Navigate to `/de`
2. Note current theme
3. Click the theme toggle button in the TopBar
**Expected:**
- `<html>` element has `dark` class (or it is removed if was dark)
- Background color visibly changes

---

### TC-10: Dark mode toggle in showcase
**Objective:** Verify dark mode toggle in showcase also works
**Steps:**
1. Navigate to `/de/dev/showcase`
2. Click the ThemeToggle button in the showcase
**Expected:** `<html>` class changes to/from `dark`

---

### TC-11: Sidebar collapse
**Objective:** Verify sidebar collapses to icon rail on toggle
**Steps:**
1. Navigate to `/de`
2. Note sidebar is expanded (w-56)
3. Click the hamburger toggle button in TopBar
**Expected:**
- Sidebar width shrinks (icon rail, w-12)
- Nav labels hidden
- Icons still visible

---

### TC-12: Sidebar state persists across navigation
**Objective:** Verify sidebar collapse state persists via localStorage
**Steps:**
1. Navigate to `/de`
2. Collapse the sidebar
3. Navigate to `/de/dev/showcase`
**Expected:** Sidebar remains collapsed

---

### TC-13: 404 page
**Objective:** Verify navigating to non-existent route shows styled 404
**Steps:**
1. Navigate to `/de/does-not-exist-at-all`
**Expected:**
- "404" heading visible
- "Seite nicht gefunden" or similar text
- "Zur Startseite" link present

---

### TC-14: Tabs interaction in showcase
**Objective:** Verify Tabs component works in showcase
**Steps:**
1. Navigate to `/de/dev/showcase`
2. Click "Tab Two"
**Expected:** "Content of tab two." is visible; "Content of tab one." is not

---

### TC-15: Locale switcher in showcase
**Objective:** Verify locale switcher in showcase changes language
**Steps:**
1. Navigate to `/de/dev/showcase`
2. Click "EN" locale button
**Expected:**
- URL changes to `/en/dev/showcase`
- Page title changes to "Component Showcase"

---

## Checklist Summary

| TC | Description | Priority |
|---|---|---|
| TC-01 | Root redirect to /de | High |
| TC-02 | DE shell renders | High |
| TC-03 | EN shell renders | High |
| TC-04 | Switch DE→EN | High |
| TC-05 | Switch EN→DE | High |
| TC-06 | Cookie persistence | Medium |
| TC-07 | Showcase page renders | High |
| TC-08 | Dialog opens/closes | Medium |
| TC-09 | Dark mode toggle | High |
| TC-10 | Dark mode in showcase | Medium |
| TC-11 | Sidebar collapse | High |
| TC-12 | Sidebar persistence | Medium |
| TC-13 | 404 page | Medium |
| TC-14 | Tabs interaction | Low |
| TC-15 | Locale switcher in showcase | Medium |
