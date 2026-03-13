# Progress — Epic 2.3 Source Management

**Status:** 🚧 In Progress
**Branch:** `feat/epic-2-1-person-management`

---

## Phases

### Phase 1 — Foundation
- [ ] Create `src/types/source.ts`
- [ ] Create `src/lib/source-types.ts`
- [ ] Verify `src/lib/db.ts` soft-delete extension for source (already done)
- [ ] Add i18n keys to `messages/de.json` and `messages/en.json`

### Phase 2 — API Routes
- [ ] `src/app/api/sources/route.ts` (GET list + POST create)
- [ ] `src/app/api/sources/route.test.ts`
- [ ] `src/app/api/sources/[id]/route.ts` (GET + PUT + DELETE)
- [ ] `src/app/api/sources/[id]/route.test.ts`
- [ ] `src/app/api/sources/bulk/route.ts` (POST bulk delete)
- [ ] `src/app/api/sources/bulk/route.test.ts`

### Phase 3 — Components
- [ ] `src/components/research/ReliabilityBadge.tsx`
- [ ] `src/components/research/ReliabilityBadge.test.tsx`
- [ ] `src/components/research/SourceForm.tsx`
- [ ] `src/components/research/SourceTable.tsx`
- [ ] `src/components/research/SourceDetailTabs.tsx`
- [ ] `src/components/research/DeleteSourceButton.tsx`

### Phase 4 — Pages
- [ ] `src/app/[locale]/(app)/sources/page.tsx`
- [ ] `src/app/[locale]/(app)/sources/new/page.tsx`
- [ ] `src/app/[locale]/(app)/sources/[id]/page.tsx`
- [ ] `src/app/[locale]/(app)/sources/[id]/edit/page.tsx`

### Phase 5 — E2E + Verification
- [ ] Write `e2e/sources.spec.ts`
- [ ] `pnpm typecheck && pnpm lint && pnpm test`
- [ ] `pnpm build`
- [ ] Browser verification (Playwright MCP)

---

## Acceptance Criteria

| # | Criterion | Status |
|---|---|---|
| AC-1 | List: `/[locale]/sources` shows paginated table | ⬜ |
| AC-2 | Create: form creates record, redirects to detail | ⬜ |
| AC-3 | Reliability badge: HIGH shows green badge | ⬜ |
| AC-4 | Edit: changes saved and shown on detail page | ⬜ |
| AC-5 | Delete: from detail page, source removed | ⬜ |
| AC-6 | Bulk delete: 2 sources deleted after confirm | ⬜ |
| AC-7 | Search by title: filtered list | ⬜ |
| AC-8 | Search by author: filtered list | ⬜ |
| AC-9 | Filter by reliability=HIGH: only HIGH shown | ⬜ |
| AC-10 | Filter by type: only matching type shown | ⬜ |
| AC-11 | Detail page: all fields shown | ⬜ |
| AC-12 | Relations tab: placeholder renders without error | ⬜ |
| AC-13 | URL validation: malformed URL shows inline error | ⬜ |
| AC-14 | Custom type: "manuscript" saved correctly | ⬜ |
| AC-15 | Soft-delete: deleted source not in list, 404 on direct URL | ⬜ |
| AC-16 | i18n: all labels in both German and English | ⬜ |
| AC-17 | Sidebar: "Quellen"/"Sources" link navigates to sources list | ⬜ |
| AC-18 | Unit tests: ≥ 15 passing | ⬜ |
| AC-19 | E2E tests: TC-SRC-01 through TC-SRC-09 on Chromium + Firefox | ⬜ |
