# User Journey Assessment

**Generated:** 2026-03-31

Status key:

- ✅ Works end-to-end as specified
- ⚠️ Works but with notable gaps or friction
- ❌ Broken or impossible to complete

---

## Journey 1: Register, verify email, and log in for the first time

**Steps:** Visit app → Register → Receive verification email → Click link → Log in → Arrive at dashboard

**Status: ✅**

The full flow is implemented and tested. Email delivery via Resend, token verification, bcrypt password hashing, next-auth v5 session, and locale-aware redirects all work. Rate limiting protects the login and register endpoints.

**One note:** After landing on the dashboard the user sees only a welcome message and a logout button — no orientation, no entity counts, no quick links. The session is valid and the user is authenticated; the app just doesn't offer them anything to do next. See Journey 8.

---

## Journey 2: Create a person and record their birth and death details

**Steps:** Persons list → "Neu" → Fill form (name, birth/death partial dates, certainty) → Save → Arrive at person detail page

**Status: ✅**

The `PersonForm` with react-hook-form + Zod handles partial dates (year-only, year-month, or full), `CertaintySelector` for both birth and death certainty, and name variants. The server action calls `POST /api/persons` with sanitised input. The detail page opens with the Attributes tab showing `PersonDetailCard` with all fields and their `PropertyEvidenceBadge` buttons.

---

## Journey 3: Navigate to Locations or Literature

**Steps:** Click "Locations" or "Literature" in the sidebar

**Status: ❌**

Both sidebar links lead to a 404. The routes `/[locale]/locations` and `/[locale]/literature` do not exist. The catch-all `page.tsx` calls `notFound()`. A real user encounters an error page with no recovery path other than using the browser back button.

See GAP-1.1-A.

---

## Journey 4: Annotate a person's birth year with a source citation (PropertyEvidence)

**Steps:** Open a person → Attributes tab → Click the badge next to "Geburtsjahr" → "Nachweis hinzufügen" → Select source, fill quote/confidence → Save

**Status: ✅**

The `PropertyEvidenceBadge` popover is implemented on all five person fields. The `EntityEvidenceForm` inside the popover posts to `POST /api/property-evidence`. The badge count updates immediately (optimistic / refetch on mutation). The Nachweise tab in the same person's detail page shows all evidence grouped by field.

---

## Journey 5: Link two people with a typed relation and set a date range

**Steps:** Open person A → Relations tab → "Verknüpfung erstellen" → Select relation type, select person B, set certainty, set valid_from/valid_to → Save

**Status: ⚠️**

Creating the relation and choosing the type, target entity, and certainty all work. The `RelationFormDialog` accepts `valid_from_year` and `valid_to_year` inputs (these are in the form schema). However, after saving, the `RelationRow` on the Relations tab does not display the date range. The data is stored in the database but never rendered.

A researcher who records "was married to (1923–1948)" sees the relation but not the temporal bounds. The information is not lost, but it is invisible in the UI.

See GAP-2.4-C.

---

## Journey 6: Find all relations of type "was a student of" across the entire project

**Steps:** Navigate to Relations in sidebar → Use the [Relation Type] filter to select "was a student of" → Browse results

**Status: ⚠️**

The global `/relations` page loads and shows all relations with a free-text search. But the [Relation Type] dropdown specified in the Epic 2.4 spec does not exist. The user must type a fragment of the relation type name into the search box as a workaround — which works only if the relation type name appears in the displayed text, and does not allow for exact-type selection or combining with a Certainty filter.

See GAP-2.4-A.

---

## Journey 7: Review all evidence attached to an event (Nachweise tab)

**Steps:** Open an event → Click "Nachweise" tab → See all PropertyEvidence entries grouped by field

**Status: ✅**

The Nachweise tab is implemented on EventDetailTabs, rendering `EntityEvidenceTab` with `eventFieldLabels`. Evidence is grouped by field (start_date, end_date, location, description, notes). The form inside each group allows adding new evidence. The tab also triggers the `activityRefreshKey` via `handleRefresh` so the Activity tab stays current.

---

## Journey 8: Get an overview of the project after logging in (Dashboard)

**Steps:** Log in → Arrive at dashboard → Understand at a glance what is in the project

**Status: ⚠️**

The dashboard page (`src/app/[locale]/(app)/dashboard/page.tsx`) renders a welcome heading, the user's name, and a sign-out button. There are no entity counts (persons, events, sources, relations), no recent activity list, no quick-create buttons, and no navigation shortcuts. A researcher returning after a break has no indication of the state of their data and must manually navigate to each entity list to find out.

This is not a broken feature — no 404 or crash occurs — but it is a stub that provides no value. Most standard research applications provide at minimum a summary of record counts on the home screen.

---

## Summary

| #   | Journey                                            | Status | Primary Gap                                |
| --- | -------------------------------------------------- | ------ | ------------------------------------------ |
| 1   | Register → verify email → log in                   | ✅     | —                                          |
| 2   | Create a person with birth/death detail            | ✅     | —                                          |
| 3   | Navigate to Locations or Literature                | ❌     | GAP-1.1-A: 404                             |
| 4   | Annotate a field with a source citation            | ✅     | —                                          |
| 5   | Link two people with a typed relation + date range | ⚠️     | GAP-2.4-C: temporal validity not displayed |
| 6   | Find all relations of a specific type              | ⚠️     | GAP-2.4-A: filter dropdowns absent         |
| 7   | Review all evidence for an event                   | ✅     | —                                          |
| 8   | Get an overview of the project on the dashboard    | ⚠️     | Dashboard is a stub                        |
