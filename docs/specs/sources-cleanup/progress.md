# Progress — Source Detail Page Cleanup

**Status:** ✅ Complete
**Branch:** `feat/epic-2-1-person-management`

---

## Prerequisite

- [x] events-cleanup Section 1 (EntityEvidenceTab generalisation) must be applied first

## Phases

### Section 1 — Filtered Entity Tabs (Personen / Ereignisse)

- [x] Add "Personen" filtered `RelationsTab` (filterToEntityType="PERSON")
- [x] Add "Ereignisse" filtered `RelationsTab` (filterToEntityType="EVENT")
- [x] Remove stale `totalLinks` counter from "Verknüpfungen" tab
- [x] Add `sources.tab_persons` + `sources.tab_events` translation keys (de + en)

### Section 2 — Nachweise Tab

- [x] Add "Nachweise" `TabsTrigger` to `SourceDetailTabs`
- [x] Add `EntityEvidenceTab` content with `sourceFieldLabels`
- [x] Add `sources.tab_evidence` translation key (de + en)

### Section 3 — PropertyEvidence Badges and SourceDetailCard Extraction

- [x] Create `src/components/research/SourceDetailCard.tsx`
- [x] Extract inline field grid from `SourceDetailTabs` into `SourceDetailCard`
- [x] Add `PropertyEvidenceBadge` to title, author, date, repository, call_number, url, notes
- [x] Replace inline grid in `SourceDetailTabs` with `<SourceDetailCard>`

### Section 4 — Activity Logging on Source Updates

- [x] Import `logActivity` in `PUT /api/sources/[id]`
- [x] Add per-field comparison loop after `prisma.source.update`
- [x] Add `@/lib/activity` mock to route.test.ts

### Section 5 — Activity Log Refresh in SourceDetailTabs

- [x] Add `activityRefreshKey` state + `handleRefresh` function
- [x] Pass `onRefresh={handleRefresh}` to all three `RelationsTab` instances
- [x] Pass `refreshKey={activityRefreshKey}` to `<ActivityLog>`

---

## Acceptance Criteria

| #   | Criterion                                                              | Status |
| --- | ---------------------------------------------------------------------- | ------ |
| 1   | SourceDetailTabs has "Personen" tab (PERSON filter)                    | ✅     |
| 2   | SourceDetailTabs has "Ereignisse" tab (EVENT filter)                   | ✅     |
| 3   | Filtered tabs pass `filterToEntityType` to create dialog               | ✅     |
| 4   | Stale `totalLinks` counter removed                                     | ✅     |
| 5   | SourceDetailTabs has "Nachweise" tab with field-grouped evidence       | ✅     |
| 6   | `SourceDetailCard` component exists and used for Details tab           | ✅     |
| 7   | SourceDetailCard has PropertyEvidence badges on 7 fields               | ✅     |
| 8   | Badge count updates immediately (no reload)                            | ✅     |
| 9   | ActivityLog refreshes after in-page changes without reload             | ✅     |
| 10  | Source field edits logged as UPDATE with field_path and old/new values | ✅     |
