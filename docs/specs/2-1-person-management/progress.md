# Progress — Epic 2.1 Person Management

**Status:** 🚧 In Progress
**Branch:** `feat/epic-2-1-person-management`

---

## Phases

### Phase 0 — Foundation

- [x] Create branch `feat/epic-2-1-person-management`
- [x] Install `sanitize-html` + `@types/sanitize-html`
- [ ] Create `docs/specs/2-1-person-management/progress.md`
- [ ] Create `src/types/person.ts`
- [ ] Update `messages/de.json` — add `persons` namespace
- [ ] Update `messages/en.json` — add `persons` namespace

### Phase 1 — Core Utilities

- [ ] Update `src/lib/sanitize.ts` — replace stub with sanitize-html
- [ ] Update `src/lib/db.ts` — add soft-delete extension for person model
- [ ] Create `src/lib/date.ts` — `formatPartialDate()` utility
- [ ] Extend session JWT with `projectId` (auth.ts + auth.config.ts + types)

### Phase 2 — API Routes

- [ ] `src/app/api/persons/route.ts` — GET list, POST create
- [ ] `src/app/api/persons/[id]/route.ts` — GET, PUT, DELETE
- [ ] `src/app/api/persons/bulk/route.ts` — POST bulk delete

### Phase 3 — UI Components

- [ ] `src/components/research/CertaintySelector.tsx`
- [ ] `src/components/research/PartialDateInput.tsx`
- [ ] `src/components/research/DataTable.tsx`
- [ ] `src/components/research/DataTablePagination.tsx`
- [ ] `src/components/research/DataTableSearch.tsx`
- [ ] `src/components/research/PersonNameList.tsx`
- [ ] `src/components/research/PersonForm.tsx`
- [ ] `src/components/research/BulkDeleteDialog.tsx`
- [ ] `src/components/research/PersonDetailCard.tsx`
- [ ] `src/components/research/PersonDetailTabs.tsx`

### Phase 4 — Pages

- [ ] `src/app/[locale]/(app)/persons/page.tsx`
- [ ] `src/app/[locale]/(app)/persons/new/page.tsx`
- [ ] `src/app/[locale]/(app)/persons/[id]/page.tsx`
- [ ] `src/app/[locale]/(app)/persons/[id]/edit/page.tsx`

### Phase 5 — Unit Tests

- [ ] `src/lib/date.test.ts`
- [ ] `src/lib/sanitize.test.ts` (update)
- [ ] `src/components/research/CertaintySelector.test.tsx`
- [ ] `src/components/research/PartialDateInput.test.tsx`
- [ ] `src/app/api/persons/route.test.ts`
- [ ] `src/app/api/persons/[id]/route.test.ts`
- [ ] `src/app/api/persons/bulk/route.test.ts`

### Phase 6 — E2E Tests

- [ ] `e2e/persons.spec.ts` (TC-P-01 through TC-P-12)

### Phase 7 — Build & Verification

- [ ] `pnpm typecheck` — exit 0
- [ ] `pnpm lint` — exit 0
- [ ] `pnpm test` — all passing
- [ ] `pnpm build` — success
- [ ] Browser verification of all ACs

---

## Acceptance Criteria

| AC    | Description                                                                 | Status |
| ----- | --------------------------------------------------------------------------- | ------ |
| AC-01 | `/de/persons` renders table with correct columns                            | ⬜     |
| AC-02 | Create person with name+birth year+PROBABLE certainty → redirects to detail | ⬜     |
| AC-03 | Detail page shows "1848 (Wahrscheinlich)"                                   | ⬜     |
| AC-04 | Name variant "Carolus Magnus" (la) shown in Weitere Namen tab               | ⬜     |
| AC-05 | Search "Maier" filters list                                                 | ⬜     |
| AC-06 | Search by name variant finds person                                         | ⬜     |
| AC-07 | Edit opens pre-populated form                                               | ⬜     |
| AC-08 | Edit certainty UNKNOWN→CERTAIN updates detail                               | ⬜     |
| AC-09 | Delete with confirm → soft-delete → redirect to list                        | ⬜     |
| AC-10 | Bulk delete 2 persons → both removed                                        | ⬜     |
| AC-11 | GET /api/persons returns empty paginated response                           | ⬜     |
| AC-12 | POST /api/persons with no name returns 400                                  | ⬜     |
| AC-13 | POST with birth_month but no birth_year returns 400                         | ⬜     |
| AC-14 | `/en/persons` shows all UI in English                                       | ⬜     |
| AC-15 | No hydration mismatch errors                                                | ⬜     |
| AC-16 | All unit tests pass                                                         | ⬜     |
| AC-17 | All 12 E2E tests pass on Chromium                                           | ⬜     |
| AC-18 | `/api/health` still returns `status: "ok"`                                  | ⬜     |
