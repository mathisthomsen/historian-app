# Progress — Source Detail Page Cleanup

**Status:** 🚧 In Progress
**Branch:** `feat/epic-2-1-person-management`

---

## Prerequisite

- [ ] events-cleanup Section 1 (EntityEvidenceTab generalisation) must be applied first

## Phases

### Section 1 — Filtered Entity Tabs (Personen / Ereignisse)

- [ ] Add "Personen" filtered `RelationsTab` (filterToEntityType="PERSON")
- [ ] Add "Ereignisse" filtered `RelationsTab` (filterToEntityType="EVENT")
- [ ] Remove stale `totalLinks` counter from "Verknüpfungen" tab
- [ ] Add `sources.tab_persons` + `sources.tab_events` translation keys (de + en)

### Section 2 — Nachweise Tab

- [ ] Add "Nachweise" `TabsTrigger` to `SourceDetailTabs`
- [ ] Add `EntityEvidenceTab` content with `sourceFieldLabels`
- [ ] Add `sources.tab_evidence` translation key (de + en)

### Section 3 — PropertyEvidence Badges and SourceDetailCard Extraction

- [ ] Create `src/components/research/SourceDetailCard.tsx`
- [ ] Extract inline field grid from `SourceDetailTabs` into `SourceDetailCard`
- [ ] Add `PropertyEvidenceBadge` to title, author, date, repository, call_number, url, notes
- [ ] Replace inline grid in `SourceDetailTabs` with `<SourceDetailCard>`

### Section 4 — Activity Logging on Source Updates

- [ ] Import `logActivity` in `PUT /api/sources/[id]`
- [ ] Add per-field comparison loop after `prisma.source.update`
- [ ] Add `@/lib/activity` mock to route.test.ts

### Section 5 — Activity Log Refresh in SourceDetailTabs

- [ ] Add `activityRefreshKey` state + `handleRefresh` function
- [ ] Pass `onRefresh={handleRefresh}` to all three `RelationsTab` instances
- [ ] Pass `refreshKey={activityRefreshKey}` to `<ActivityLog>`

---

## Acceptance Criteria

| #   | Criterion                                                              | Status |
| --- | ---------------------------------------------------------------------- | ------ |
| 1   | SourceDetailTabs has "Personen" tab (PERSON filter)                    | ⬜     |
| 2   | SourceDetailTabs has "Ereignisse" tab (EVENT filter)                   | ⬜     |
| 3   | Filtered tabs pass `filterToEntityType` to create dialog               | ⬜     |
| 4   | Stale `totalLinks` counter removed                                     | ⬜     |
| 5   | SourceDetailTabs has "Nachweise" tab with field-grouped evidence       | ⬜     |
| 6   | `SourceDetailCard` component exists and used for Details tab           | ⬜     |
| 7   | SourceDetailCard has PropertyEvidence badges on 7 fields               | ⬜     |
| 8   | Badge count updates immediately (no reload)                            | ⬜     |
| 9   | ActivityLog refreshes after in-page changes without reload             | ⬜     |
| 10  | Source field edits logged as UPDATE with field_path and old/new values | ⬜     |
