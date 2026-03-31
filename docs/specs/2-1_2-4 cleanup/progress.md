# Progress: Person Detail Page — Bug Fixes & Feature Completion

**Status:** ✅ Complete

---

## Sections

- [x] **Section 1** — Evidence Count Mapping Fix (API responses: `_count.evidence` → `evidence_count`)
- [x] **Section 2** — RelationFormDialog Fix (entity selector blank in edit/prefill)
- [x] **Section 3** — Filtered Entity Tabs (Ereignisse / Personen / Quellen)
- [x] **Section 4** — Nachweise Tab (EntityEvidenceTab component)
- [x] **Section 5** — PropertyEvidence Badges on All Person Fields + badge refresh
- [x] **Section 6** — Evidence UI on Relations (RelationRow expandable panel + logActivity)
- [x] **Section 7** — Activity Log Accuracy & Refresh (refreshKey + person field logging)
- [x] **Section 8** — Technical Debt Documentation (already exists)

---

## Acceptance Criteria

| #   | Criterion                                                                                                     | Status |
| --- | ------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | RelationRow evidence badge displays correct count (not `undefined`)                                           | ✅     |
| 2   | Editing a relation shows current from/to entity names in disabled selectors                                   | ✅     |
| 3   | Creating a relation from a person page shows the person in the prefilled from-selector                        | ✅     |
| 4   | Ereignisse tab shows only relations where the other entity is an Event                                        | ✅     |
| 5   | Personen tab shows only relations where the other entity is a Person                                          | ✅     |
| 6   | Quellen tab shows only relations where the other entity is a Source                                           | ✅     |
| 7   | Filtered tabs pass `filterToEntityType` to the create dialog, restricting the to-entity type                  | ✅     |
| 8   | Nachweise tab renders all PropertyEvidence for the person grouped by field                                    | ✅     |
| 9   | PersonDetailCard fields have PropertyEvidence badges: birth_year, death_year, birth_place, death_place, notes | ✅     |
| 10  | PropertyEvidence badge count updates immediately after adding/removing evidence                               | ✅     |
| 11  | RelationRow always shows a "Quellen" trigger; panel expands inline with add/delete                            | ✅     |
| 12  | ActivityLog refreshes after user saves a change without a page reload                                         | ✅     |
| 13  | Person field edits are logged as UPDATE with correct field_path and old/new values                            | ✅     |
| 14  | `docs/technical-debt.md` documents known refactoring opportunities                                            | ✅     |
