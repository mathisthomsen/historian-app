# Progress — Epic 2.1 Person Management

**Status:** ✅ Complete
**Branch:** `feat/epic-2-1-person-management`

---

## Phases

### Phase 0 — Foundation

- [x] Create branch `feat/epic-2-1-person-management`
- [x] Install `sanitize-html` + `@types/sanitize-html`
- [x] Create `docs/specs/2-1-person-management/progress.md`
- [x] Create `src/types/person.ts`
- [x] Update `messages/de.json` — add `persons` namespace
- [x] Update `messages/en.json` — add `persons` namespace

### Phase 1 — Core Utilities

- [x] Update `src/lib/sanitize.ts` — replace stub with sanitize-html
- [x] Update `src/lib/db.ts` — add soft-delete extension for person model
- [x] Create `src/lib/date.ts` — `formatPartialDate()` utility
- [x] Extend session JWT with `projectId` (auth.ts + auth.config.ts + types)

### Phase 2 — API Routes

- [x] `src/app/api/persons/route.ts` — GET list, POST create
- [x] `src/app/api/persons/[id]/route.ts` — GET, PUT, DELETE
- [x] `src/app/api/persons/bulk/route.ts` — POST bulk delete

### Phase 3 — UI Components

- [x] `src/components/research/CertaintySelector.tsx`
- [x] `src/components/research/PartialDateInput.tsx`
- [x] `src/components/research/DataTable.tsx`
- [x] `src/components/research/DataTablePagination.tsx`
- [x] `src/components/research/DataTableSearch.tsx`
- [x] `src/components/research/PersonNameList.tsx`
- [x] `src/components/research/PersonForm.tsx`
- [x] `src/components/research/BulkDeleteDialog.tsx`
- [x] `src/components/research/PersonDetailCard.tsx`
- [x] `src/components/research/PersonDetailTabs.tsx`

### Phase 4 — Pages

- [x] `src/app/[locale]/(app)/persons/page.tsx`
- [x] `src/app/[locale]/(app)/persons/new/page.tsx`
- [x] `src/app/[locale]/(app)/persons/[id]/page.tsx`
- [x] `src/app/[locale]/(app)/persons/[id]/edit/page.tsx`

### Phase 5 — Unit Tests

- [x] `src/lib/date.test.ts`
- [x] `src/lib/sanitize.test.ts` (updated)
- [x] `src/components/research/CertaintySelector.test.tsx`
- [x] `src/components/research/PartialDateInput.test.tsx`

### Phase 6 — E2E Tests

- [x] `e2e/persons.spec.ts` (TC-P-01 through TC-P-12) — 12/12 Chromium + Firefox

### Phase 7 — Build & Verification

- [x] `pnpm typecheck` — exit 0
- [x] `pnpm lint` — exit 0
- [x] `pnpm test` — 119 tests passing (20 files)
- [x] Browser verification of all ACs

---

## Acceptance Criteria

| AC    | Description                                                                 | Status |
| ----- | --------------------------------------------------------------------------- | ------ |
| AC-01 | `/de/persons` renders table with correct columns                            | ✅     |
| AC-02 | Create person with name+birth year+PROBABLE certainty → redirects to detail | ✅     |
| AC-03 | Detail page shows "1848 (Wahrscheinlich)"                                   | ✅     |
| AC-04 | Name variant "Carolus Magnus" (la) shown in Weitere Namen tab               | ✅     |
| AC-05 | Search "Maier" filters list                                                 | ✅     |
| AC-06 | Search by name variant finds person                                         | ✅     |
| AC-07 | Edit opens pre-populated form                                               | ✅     |
| AC-08 | Edit certainty UNKNOWN→CERTAIN updates detail                               | ✅     |
| AC-09 | Delete with confirm → soft-delete → redirect to list                        | ✅     |
| AC-10 | Bulk delete 2 persons → both removed                                        | ✅     |
| AC-11 | GET /api/persons returns empty paginated response                           | ✅     |
| AC-12 | POST /api/persons with no name returns 400                                  | ✅     |
| AC-13 | POST with birth_month but no birth_year returns 400                         | ✅     |
| AC-14 | `/en/persons` shows all UI in English                                       | ✅     |
| AC-15 | No hydration mismatch errors                                                | ✅     |
| AC-16 | All unit tests pass                                                         | ✅     |
| AC-17 | All 12 E2E tests pass on Chromium + Firefox                                 | ✅     |
| AC-18 | `/api/health` still returns `status: "ok"`                                  | ✅     |
