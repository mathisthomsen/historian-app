# Progress — Epic 2.2 Event Management

**Status:** ✅ Complete
**Branch:** `feat/epic-2-1-person-management` (continuing)

---

## Phases

### Phase 1: Database & Foundation

- ✅ Update `prisma/schema.prisma` — add `EventType` model, update `Event` (drop `event_type`, add `event_type_id` FK)
- ✅ Run migration: `add_event_types`
- ✅ Verify `src/lib/db.ts` event soft-delete extension (already present)
- ✅ Update `prisma/seed.ts` — add `seedDefaultEventTypes()`
- ✅ Create `src/types/event.ts` — EventSummary, EventDetail, CreateEventInput
- ✅ Create `src/types/event-type.ts` — EventType
- ✅ Add i18n strings: `messages/de.json` and `messages/en.json`

### Phase 2: API Routes

- ✅ `src/app/api/events/route.ts` — GET (list + filters), POST (create)
- ✅ `src/app/api/events/[id]/route.ts` — GET, PUT, DELETE
- ✅ `src/app/api/events/bulk/route.ts` — POST bulk delete
- ✅ `src/app/api/event-types/route.ts` — GET list, POST create
- ✅ `src/app/api/event-types/[id]/route.ts` — PUT, DELETE

### Phase 3: UI Components

- ✅ `src/components/research/EventTypeColorPicker.tsx`
- ✅ `src/components/research/EventTypeCombobox.tsx`
- ✅ `src/components/research/EventFilters.tsx`
- ✅ `src/components/research/DateRangeFilterInfo.tsx`
- ✅ `src/components/research/EventForm.tsx`
- ✅ `src/components/research/EventDetailCard.tsx`
- ✅ `src/components/research/EventDetailTabs.tsx`
- ✅ `src/components/research/EventTypeSettingsTable.tsx`
- ✅ `src/components/shell/sidebar.tsx` — add settings section

### Phase 4: Pages

- ✅ `src/app/[locale]/(app)/events/page.tsx` — event list
- ✅ `src/app/[locale]/(app)/events/new/page.tsx`
- ✅ `src/app/[locale]/(app)/events/[id]/page.tsx` — detail
- ✅ `src/app/[locale]/(app)/events/[id]/edit/page.tsx`
- ✅ `src/app/[locale]/(app)/settings/event-types/page.tsx`

### Phase 5: Unit Tests

- ✅ API route tests (events, events/[id], events/bulk, event-types, event-types/[id])
- ✅ Component tests (EventTypeCombobox, EventFilters)

### Phase 6: Build & E2E

- ✅ `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- ✅ Write `docs/specs/2-2-event-management/testplan.md`
- ✅ Write `e2e/events.spec.ts`
- ✅ Run E2E tests (Chromium + Firefox) — 16/16 each
- ✅ Live browser verification (all ACs)

---

## Acceptance Criteria

| AC    | Description                                                               | Status |
| ----- | ------------------------------------------------------------------------- | ------ |
| AC-01 | EventType table with 12-swatch color palette                              | ✅     |
| AC-02 | Event model uses event_type_id FK                                         | ✅     |
| AC-03 | Seed 8 default event types                                                | ✅     |
| AC-04 | GET /api/events with pagination, search, sort                             | ✅     |
| AC-05 | GET /api/events filter by typeIds (multi)                                 | ✅     |
| AC-06 | GET /api/events filter by date range (overlap)                            | ✅     |
| AC-07 | GET /api/events?topLevelOnly=true                                         | ✅     |
| AC-08 | POST /api/events with depth limit validation                              | ✅     |
| AC-09 | DELETE /api/events/[id] blocks if has sub-events                          | ✅     |
| AC-10 | POST /api/events/bulk soft-deletes, skips events with sub-events          | ✅     |
| AC-11 | CRUD for EventTypes (GET, POST, PUT, DELETE)                              | ✅     |
| AC-12 | DELETE event-type blocked if in use (with filter_url)                     | ✅     |
| AC-13 | Event list page with all filters                                          | ✅     |
| AC-14 | Create/edit event form with type combobox, partial dates, parent selector | ✅     |
| AC-15 | EventType inline create from form combobox                                | ✅     |
| AC-16 | Event detail page with tabs (attributes, sub-events, persons, sources)    | ✅     |
| AC-17 | Sub-events tab shows count + list                                         | ✅     |
| AC-18 | EventType settings page with inline edit                                  | ✅     |
| AC-19 | Sidebar settings section with separator                                   | ✅     |
| AC-20 | All unit tests green                                                      | ✅     |
| AC-21 | All 16 E2E tests green (Chromium + Firefox)                               | ✅     |
