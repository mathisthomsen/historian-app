# Progress — Event Detail Page Cleanup

**Status:** ✅ Complete
**Branch:** `feat/epic-2-1-person-management`

---

## Phases

### Section 1 — EntityEvidenceTab Generalisation

- [x] Add `fieldLabels?: Record<string, string>` prop to `EntityEvidenceTab`
- [x] Update label lookup to use `fieldLabels` when provided
- [x] Change empty state copy to "Keine Nachweise vorhanden."

### Section 2 — Filtered Entity Tabs (Personen / Quellen)

- [x] Replace "Personen" placeholder with filtered `RelationsTab` (filterToEntityType="PERSON")
- [x] Replace "Quellen" placeholder with filtered `RelationsTab` (filterToEntityType="SOURCE")

### Section 3 — Nachweise Tab

- [x] Add "Nachweise" `TabsTrigger` to `EventDetailTabs`
- [x] Add `EntityEvidenceTab` content with `eventFieldLabels`
- [x] Add `events.detail.tabs.evidence` translation key (de + en)
- [x] Confirm `events.fields.notes` exists (already present)

### Section 4 — PropertyEvidence Badges on EventDetailCard

- [x] Add `projectId` prop to `EventDetailCard`
- [x] Pass `projectId` from `EventDetailTabs` to `EventDetailCard`
- [x] Add `PropertyEvidenceBadge` to start date row (`start_year`)
- [x] Add `PropertyEvidenceBadge` to end date row (`end_year`)
- [x] Add `PropertyEvidenceBadge` to location row
- [x] Add `PropertyEvidenceBadge` to description row
- [x] Add `PropertyEvidenceBadge` to notes row

### Section 5 — Activity Logging on Event Updates

- [x] Import `logActivity` in `PUT /api/events/[id]`
- [x] Add per-field comparison loop after `prisma.event.update`

### Section 6 — Activity Log Refresh in EventDetailTabs

- [x] Add `activityRefreshKey` state + `handleRefresh` function
- [x] Pass `onRefresh={handleRefresh}` to all three `RelationsTab` instances
- [x] Pass `refreshKey={activityRefreshKey}` to `<ActivityLog>`

---

## Acceptance Criteria

| #   | Criterion                                                                      | Status |
| --- | ------------------------------------------------------------------------------ | ------ |
| 1   | `EntityEvidenceTab` accepts optional `fieldLabels`; PersonDetailTabs unchanged | ✅     |
| 2   | Empty state reads "Keine Nachweise vorhanden."                                 | ✅     |
| 3   | EventDetailTabs "Personen" tab shows only Person relations                     | ✅     |
| 4   | EventDetailTabs "Quellen" tab shows only Source relations                      | ✅     |
| 5   | Filtered tabs pass `filterToEntityType` to create dialog                       | ✅     |
| 6   | EventDetailTabs has "Nachweise" tab rendering PropertyEvidence by field        | ✅     |
| 7   | EventDetailCard has PropertyEvidence badges on 5 fields                        | ✅     |
| 8   | Badge count updates immediately after add/remove (no reload)                   | ✅     |
| 9   | ActivityLog refreshes after in-page changes without reload                     | ✅     |
| 10  | Event field edits logged as UPDATE with field_path and old/new values          | ✅     |
