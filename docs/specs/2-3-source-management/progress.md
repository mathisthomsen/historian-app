# Progress — Epic 2.3 Source Management

**Status:** ✅ Complete
**Branch:** `feat/epic-2-1-person-management`

---

## Phases

### Phase 1 — Foundation
- [x] Create `src/types/source.ts`
- [x] Create `src/lib/source-types.ts`
- [x] Verify `src/lib/db.ts` soft-delete extension for source (already done)
- [x] Add i18n keys to `messages/de.json` and `messages/en.json`

### Phase 2 — API Routes
- [x] `src/app/api/sources/route.ts` (GET list + POST create)
- [x] `src/app/api/sources/route.test.ts`
- [x] `src/app/api/sources/[id]/route.ts` (GET + PUT + DELETE)
- [x] `src/app/api/sources/[id]/route.test.ts`
- [x] `src/app/api/sources/bulk/route.ts` (POST bulk delete)
- [x] `src/app/api/sources/bulk/route.test.ts`

### Phase 3 — Components
- [x] `src/components/research/ReliabilityBadge.tsx`
- [x] `src/components/research/ReliabilityBadge.test.tsx`
- [x] `src/components/research/SourceForm.tsx`
- [x] `src/components/research/SourceTable.tsx`
- [x] `src/components/research/SourceDetailTabs.tsx`
- [x] `src/components/research/DeleteSourceButton.tsx`

### Phase 4 — Pages
- [x] `src/app/[locale]/(app)/sources/page.tsx`
- [x] `src/app/[locale]/(app)/sources/new/page.tsx`
- [x] `src/app/[locale]/(app)/sources/[id]/page.tsx`
- [x] `src/app/[locale]/(app)/sources/[id]/edit/page.tsx`

### Phase 5 — E2E + Verification
- [x] Write `e2e/sources.spec.ts`
- [x] `pnpm typecheck && pnpm lint && pnpm test` — all pass (175 tests)
- [x] `pnpm build` — production build succeeds
- [x] Browser verification (Playwright MCP) — all ACs verified green

---

## Acceptance Criteria

| # | Criterion | Status |
|---|---|---|
| AC-1 | List: `/[locale]/sources` shows paginated table | ✅ |
| AC-2 | Create: form creates record, redirects to detail | ✅ |
| AC-3 | Reliability badge: HIGH shows green badge | ✅ |
| AC-4 | Edit: changes saved and shown on detail page | ✅ |
| AC-5 | Delete: from detail page, source removed | ✅ |
| AC-6 | Bulk delete: 2 sources deleted after confirm | ✅ |
| AC-7 | Search by title: filtered list | ✅ |
| AC-8 | Search by author: filtered list | ✅ |
| AC-9 | Filter by reliability: only matching shown | ✅ |
| AC-10 | Filter by type: only matching type shown | ✅ |
| AC-11 | Detail page: all fields shown | ✅ |
| AC-12 | Relations tab: placeholder renders without error | ✅ |
| AC-13 | URL validation: malformed URL shows inline error | ✅ (Zod schema) |
| AC-14 | Custom type: user-defined type saved correctly | ✅ (combobox accepts custom input) |
| AC-15 | Soft-delete: deleted source not in list, 404 on direct URL | ✅ |
| AC-16 | i18n: all labels in both German and English | ✅ |
| AC-17 | Sidebar: "Quellen"/"Sources" link navigates to sources list | ✅ |
| AC-18 | Unit tests: ≥ 15 passing | ✅ (25 tests) |
| AC-19 | E2E tests: TC-SRC-01 through TC-SRC-09 written | ✅ |
