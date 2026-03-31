# Progress — Event Detail Page Cleanup

**Status:** 🚧 In Progress
**Branch:** `feat/epic-2-1-person-management`

---

## Phases

### Section 1 — EntityEvidenceTab Generalisation

- [ ] Add `fieldLabels?: Record<string, string>` prop to `EntityEvidenceTab`
- [ ] Update label lookup to use `fieldLabels` when provided
- [ ] Change empty state copy to "Keine Nachweise vorhanden."

### Section 2 — Filtered Entity Tabs (Personen / Quellen)

- [ ] Replace "Personen" placeholder with filtered `RelationsTab` (filterToEntityType="PERSON")
- [ ] Replace "Quellen" placeholder with filtered `RelationsTab` (filterToEntityType="SOURCE")

### Section 3 — Nachweise Tab

- [ ] Add "Nachweise" `TabsTrigger` to `EventDetailTabs`
- [ ] Add `EntityEvidenceTab` content with `eventFieldLabels`
- [ ] Add `events.detail.tabs.evidence` translation key (de + en)
- [ ] Confirm `events.fields.notes` exists (already present)

### Section 4 — PropertyEvidence Badges on EventDetailCard

- [ ] Add `projectId` prop to `EventDetailCard`
- [ ] Pass `projectId` from `EventDetailTabs` to `EventDetailCard`
- [ ] Add `PropertyEvidenceBadge` to start date row (`start_year`)
- [ ] Add `PropertyEvidenceBadge` to end date row (`end_year`)
- [ ] Add `PropertyEvidenceBadge` to location row
- [ ] Add `PropertyEvidenceBadge` to description row
- [ ] Add `PropertyEvidenceBadge` to notes row

### Section 5 — Activity Logging on Event Updates

- [ ] Import `logActivity` in `PUT /api/events/[id]`
- [ ] Add per-field comparison loop after `prisma.event.update`

### Section 6 — Activity Log Refresh in EventDetailTabs

- [ ] Add `activityRefreshKey` state + `handleRefresh` function
- [ ] Pass `onRefresh={handleRefresh}` to all three `RelationsTab` instances
- [ ] Pass `refreshKey={activityRefreshKey}` to `<ActivityLog>`

---

## Acceptance Criteria

| #   | Criterion                                                                      | Status |
| --- | ------------------------------------------------------------------------------ | ------ |
| 1   | `EntityEvidenceTab` accepts optional `fieldLabels`; PersonDetailTabs unchanged | ⬜     |
| 2   | Empty state reads "Keine Nachweise vorhanden."                                 | ⬜     |
| 3   | EventDetailTabs "Personen" tab shows only Person relations                     | ⬜     |
| 4   | EventDetailTabs "Quellen" tab shows only Source relations                      | ⬜     |
| 5   | Filtered tabs pass `filterToEntityType` to create dialog                       | ⬜     |
| 6   | EventDetailTabs has "Nachweise" tab rendering PropertyEvidence by field        | ⬜     |
| 7   | EventDetailCard has PropertyEvidence badges on 5 fields                        | ⬜     |
| 8   | Badge count updates immediately after add/remove (no reload)                   | ⬜     |
| 9   | ActivityLog refreshes after in-page changes without reload                     | ⬜     |
| 10  | Event field edits logged as UPDATE with field_path and old/new values          | ⬜     |
