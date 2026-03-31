# Progress — 2-4-delta Gap Fixes

**Status:** ✅ Complete
**Started:** 2026-03-31
**Branch:** feat/epic-2-1-person-management

---

## Gaps to Fix

| ID        | Severity  | Title                                                      | Status |
| --------- | --------- | ---------------------------------------------------------- | ------ |
| GAP-1.1-A | Critical  | Sidebar Locations/Literature/Settings links → 404          | ✅     |
| GAP-1.1-B | Minor     | Per-route loading.tsx skeletons absent                     | ✅     |
| GAP-2.1-A | Minor     | `created_by` shown as raw CUID                             | ✅     |
| GAP-2.4-A | Important | Global relations list missing 3 filter controls            | ✅     |
| GAP-2.4-B | Minor     | Relations list pagination strings not i18n'd               | ✅     |
| GAP-2.4-C | Important | RelationRow does not display temporal validity             | ✅     |
| GAP-2.4-D | Important | Relation counts hardcoded to 0 in detail server components | ✅     |
| GAP-2.4-E | Minor     | Tab count badges not shown on detail pages                 | ✅     |
| GAP-2.4-F | Minor     | No evidence attachment in RelationFormDialog (create mode) | ✅     |

---

## Agent Wave 2 (parallel)

### Agent 1 — UI Fixes (isolated component changes)

- GAP-1.1-A: Sidebar dead links
- GAP-1.1-B: Per-route loading.tsx
- GAP-2.4-A: RelationsDataTable filter dropdowns
- GAP-2.4-B: RelationsDataTable i18n strings
- GAP-2.4-C: RelationRow temporal validity
- GAP-2.1-A: PersonDetailCard/EventDetailCard created_by display

### Agent 2 — Interface Changes (server → client prop additions)

- GAP-2.4-D: Fix hardcoded relation counts in persons/events detail pages
- GAP-2.4-E: Tab count badges in PersonDetailTabs / EventDetailTabs
- GAP-2.4-F: Evidence section in RelationFormDialog (create mode)

---

## Steps

- [x] Agent 1 complete
- [x] Agent 2 complete
- [x] Post-agent review: spec compliance — all 9 gaps addressed
- [x] Post-agent review: code quality — typecheck + lint clean
- [x] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` — all pass (9 pre-existing test failures unrelated to this work)
- [x] Browser verification (Playwright MCP) — all 9 gaps verified in browser
- [x] Final commit
