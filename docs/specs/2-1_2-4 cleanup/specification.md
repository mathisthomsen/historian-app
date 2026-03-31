# Spec: Person Detail Page — Bug Fixes & Feature Completion

**Scope:** Cleanup of Epics 2.1 (Person Management) and 2.4 (Universal Relationship Engine)
**Date:** 2026-03-15
**Status:** Draft

---

## Background

A review of the person detail pages revealed a mix of data mapping bugs, incomplete feature wiring, and UX gaps. This spec documents all issues, their root causes, and the agreed fixes. The work is grouped into 8 sections.

Root cause categories:

- **Group A — Incomplete implementation:** Features partially built; backend exists but frontend not wired
- **Group B — Data mapping bug:** API response shape mismatches type expectations
- **Group C — Form state bugs:** Dialog pre-population missing in edit/prefill scenarios
- **Group D — Activity log accuracy:** Missing logging, missing field paths, no refresh trigger

---

## Section 1 — Evidence Count Mapping Fix

**Type:** Bug fix (Group B)

**Problem:** All relation API responses return `_count: { evidence: n }` but the `RelationWithDetails` type and `RelationRow` component expect a flat `evidence_count: n` field. The badge always reads `undefined Quellen`.

**Affected files:**

- `src/app/api/relations/route.ts` — GET response (line ~257), POST response (line ~417)
- `src/app/api/relations/[id]/route.ts` — GET response (~line 81), PUT response (~line 187)

**Fix:** In all 4 response mappings, change:

```ts
_count: {
  evidence: r._count.evidence;
}
```

to:

```ts
evidence_count: r._count.evidence;
```

No type changes needed — `RelationWithDetails` already defines `evidence_count: number`. The `[id]` GET fix also unblocks the relation evidence panel added in Section 6, which reads `evidence_count` from the single-item response.

---

## Section 2 — RelationFormDialog Fix

**Type:** Bug fix (Group C)

### 2a — Edit mode: entity selectors blank

**Problem:** When `editRelation` is passed, the form correctly disables entity changes but entity selectors render blank instead of showing the current values. Root cause: `RelationFormDialog` initialises `fromEntity` / `toEntity` state from `prefillFrom` / `prefillTo`, which are both `undefined` in edit mode (set explicitly to `undefined` by `RelationsTab` when opening the edit dialog). `editRelation` data is never used to seed that state.

**Fix — two-part:**

1. **State initialisation:** In `RelationFormDialog`, when `editRelation` is present, seed `fromEntity` and `toEntity` from the relation data:

   ```ts
   const [fromEntity, setFromEntity] = useState(
     editRelation
       ? { type: editRelation.from_type, id: editRelation.from_id, label: editRelation.from_label }
       : (prefillFrom ?? null),
   );
   const [toEntity, setToEntity] = useState(
     editRelation
       ? { type: editRelation.to_type, id: editRelation.to_id, label: editRelation.to_label }
       : (prefillTo ?? null),
   );
   ```

2. **EntitySelector display label:** `EntitySelector` currently has no mechanism to display a label for a pre-set value without a search interaction. Add a `displayLabel?: string` prop. When provided, `displayLabel` unconditionally seeds the `selectedLabel` state on mount (regardless of `disabled`), so the selected-badge rendering path is reached immediately. This covers both the edit mode (disabled selector showing current entity) and any future editable-prefill case. In `RelationFormDialog`, pass `displayLabel={fromEntity?.label ?? undefined}` and `displayLabel={toEntity?.label ?? undefined}` to the respective selectors.

3. **Disabled condition in edit mode:** The current `disabled` condition on entity selectors is `disabled={!!prefillFrom}` (from) and `disabled={!!prefillTo}` (to). In edit mode `prefillFrom`/`prefillTo` are both `undefined`, so this evaluates to `false` — leaving selectors editable. Update to: `disabled={isEdit || !!prefillFrom}` and `disabled={isEdit || !!prefillTo}`, where `isEdit = !!editRelation`.

### 2b — New relation: prefilled entity appears blank

**Problem:** When creating from a person detail page, `prefillFrom` is passed and the from-selector is disabled. `EntitySelector` doesn't render the selected-badge state because `selectedLabel` is initialised as `null` and only populated by user interaction or a search result — never from the initial `value` prop in a disabled state.

**Fix:** The `displayLabel` prop added in 2a also solves this case. In `RelationFormDialog`, `prefillFrom` already includes a `label` string. Pass it as `displayLabel` to the from `EntitySelector`. The selector renders the badge immediately.

**Affected files:**

- `src/components/relations/RelationFormDialog.tsx`
- `src/components/relations/EntitySelector.tsx` — add `displayLabel?: string` prop

---

## Section 3 — Filtered Entity Tabs (Ereignisse / Personen / Quellen)

**Type:** Feature completion (Group A)

**Problem:** The three tabs show a placeholder: "Beziehungen werden in einem späteren Update verfügbar." They should show filtered views of the relations engine.

**Design:** Add a `filterToEntityType?: EntityType` prop to `RelationsTab`. When set, the component filters the already-fetched relations client-side, showing only those where the other entity is of the specified type.

- Outgoing: `to_type === filterToEntityType`
- Incoming: `from_type === filterToEntityType`

No new API calls. The existing endpoint returns all relations with type info.

In `PersonDetailTabs`, the three placeholder tabs become (using the existing `personLabel` prop):

```tsx
<RelationsTab
  entityType="PERSON" entityId={id} entityLabel={personLabel}
  filterToEntityType="EVENT"
/>
<RelationsTab
  entityType="PERSON" entityId={id} entityLabel={personLabel}
  filterToEntityType="PERSON"
/>
<RelationsTab
  entityType="PERSON" entityId={id} entityLabel={personLabel}
  filterToEntityType="SOURCE"
/>
```

**Filter application order:** `filterToEntityType` is applied after the existing `outgoing`/`incoming` split. That is: `outgoing` is filtered to relations where `to_type === filterToEntityType`; `incoming` is filtered to relations where `from_type === filterToEntityType`. Both filtered arrays are then passed to the existing rendering logic unchanged.

**Scoped create button:** When `filterToEntityType` is set, the "Neue Relation" button passes `prefillToEntityType={filterToEntityType}` to `RelationFormDialog`. `RelationFormDialog` forwards this as `allowedTypes={[prefillToEntityType]}` (a single-element array) to the to-entity `EntitySelector`. This restricts the to-entity picker so only entities of the relevant type can be selected. The `RelationTypeSelector` then narrows available types once the user selects a to-entity (since it filters on both `fromType` and `toType`). Add `prefillToEntityType?: EntityType` to `RelationFormDialogProps`.

**Acceptance note:** A filtered tab with no matching relations shows the existing "Keine Relationen" empty state — no separate empty state needed.

**Affected files:**

- `src/components/relations/RelationsTab.tsx`
- `src/components/relations/RelationFormDialog.tsx` — add `prefillToEntityType` prop
- `src/components/research/PersonDetailTabs.tsx`

---

## Section 4 — Nachweise Tab (Entity-wide Evidence View)

**Type:** Feature completion (Group A)

**Problem:** `PersonDetailTabs` renders `{t("tabs.evidence")}` (the translation string) where a component should be. Nothing was wired up.

### Backend

`GET /api/property-evidence` already supports an optional `property` parameter (the Zod schema marks it optional and the where-clause conditionally applies it). **No backend change needed.**

The endpoint called without a `property` param returns all evidence for the entity, which is exactly what the Nachweise tab needs. Default sort is `created_at: "desc"` — sufficient for this view.

### Frontend: EntityEvidenceTab component

A new `EntityEvidenceTab` component fetches all PropertyEvidence for the entity in a single call to `GET /api/property-evidence?projectId=...&entityType=...&entityId=...` (no `property` param). Renders evidence grouped by field name as collapsible sections (e.g. "Geburtsjahr", "Vorname") using human-readable field label translations. Uses existing `PropertyEvidenceItem` display components. Shows an empty state if no evidence exists.

This tab is read-only — evidence is added/managed via field badges on the Attribute tab.

**Translation keys for field labels:** Use the `persons.fields` namespace already used in `PersonDetailCard` (e.g. `t("persons.fields.birth_date")`). This keeps field label rendering consistent across the Attribute and Nachweise tabs.

**Affected files:**

- `src/components/research/EntityEvidenceTab.tsx` — new component
- `src/components/research/PersonDetailTabs.tsx` — replace `{t("tabs.evidence")}` with `<EntityEvidenceTab>`

---

## Section 5 — PropertyEvidence Badges on All Person Fields

**Type:** Feature completion (Group A) + Bug fix (Group B)

### 5a — Add badges to displayed field rows

**Problem:** Only `birth_year` has a `PropertyEvidenceBadge`. All other fields are inconsistent.

**Scope — PersonDetailCard only.** `PersonDetailCard` renders: birth date (composite), birth place, death date (composite), death place, and notes. It does **not** render `first_name` or `last_name` — those appear only in the page header (`page.tsx` line 62). Adding badges to the page header is out of scope for this spec. `first_name`/`last_name` badges can be addressed when the Namen tab is built out.

**Design decision — date field grouping:** `PersonDetailCard` renders birth and death dates as composite single-line displays using `formatPartialDate`. Decomposing these into per-sub-field rows would require a layout restructure. Instead, use one badge per displayed date row anchored to the `_year` property (the primary field), which is already the established pattern for `birth_year`. The badge for the birth date row uses property `birth_year`; for death date, property `death_year`. Individual sub-fields (`birth_month`, `birth_day`, etc.) are accessible via the Nachweise tab but do not get individual inline badges. This keeps the Attribute tab layout clean.

**Fields getting badges in PersonDetailCard:**

- `birth_year` (covers birth date row — already exists, refresh fix in 5b)
- `death_year` (covers death date row — new)
- `birth_place` (new)
- `death_place` (new)
- `notes` (new)

All map directly to properties in `ALLOWED_PROPERTIES` for `PERSON` — no backend changes needed.

### 5b — Badge refresh after evidence change

**Problem:** `PropertyEvidenceBadge` fetches count once on mount. After adding evidence, the badge still shows the stale count until the page reloads.

**Fix — callback threading:**

- `PropertyEvidencePanel` receives an `onEvidenceChange?: () => void` prop. It calls this after a successful add or delete.
- `PropertyEvidenceBadge` renders `PropertyEvidencePanel` inside its `PopoverContent`. It passes a callback that increments an internal `refreshKey` state, which triggers a re-fetch of the count via `useEffect([refreshKey])`.
- No external prop threading needed — the callback stays within the `PropertyEvidenceBadge` component boundary.

**Affected files:**

- `src/components/research/PersonDetailCard.tsx`
- `src/components/relations/PropertyEvidenceBadge.tsx`
- `src/components/relations/PropertyEvidencePanel.tsx`

### Future consideration — Bulk source assignment

It is laborious to assign a source individually to every field when one source covers all data. Two options for a future iteration:

**Option A (recommended first step):** "Apply to all fields" shortcut — when adding evidence to any field, a checkbox "Als Quelle für alle Felder dieser Person verwenden" creates `PropertyEvidence` records for all `ALLOWED_PROPERTIES` in one batch POST. No schema changes required.

**Option B:** Primary source per entity — a `Hauptquelle` concept at the entity level that auto-covers all fields, with per-field overrides. Cleaner semantically but requires schema design work.

---

## Section 6 — Evidence UI on Relations

**Type:** Feature completion (Group A)

**Problem:** `GET/POST /api/relations/[id]/evidence` exists and works but there is no UI to use it.

### Frontend

Extend `RelationRow` with an inline expandable evidence panel. The trigger affordance is always visible — a small "Quellen" link/button — and shows the count when `evidence_count > 0`. This ensures the panel is accessible even when no evidence exists yet (count = 0). Clicking the trigger toggles the panel open/closed.

The panel shows:

- List of attached evidence items (source title, page ref, quote, confidence)
- "Quelle hinzufügen" using the existing `EvidenceForm` component pointing to `POST /api/relations/[id]/evidence`
- Per-item delete via `DELETE /api/relations/[id]/evidence/[evidenceId]`

When evidence is added or deleted, the local evidence count re-fetches via the same `onEvidenceChange` callback pattern as Section 5.

### Backend gap

`POST /api/relations/[id]/evidence` currently has no activity logging (`logActivity` is not imported). The relation select at line ~32 currently fetches only `{ id, project_id }`. To support activity logging, extend the select to also include `from_type` and `from_id`.

Then add a `logActivity()` call with:

- `action: "CREATE"`
- `entity_type`: `relation.from_type`
- `entity_id`: `relation.from_id`
- `field_path: "evidence"`

This follows the convention established in `POST /api/relations/route.ts` (line ~388), which logs relation creation against the from-entity. Using the from-entity as the anchor is the agreed convention for relation-scoped activity.

**Affected files:**

- `src/components/relations/RelationRow.tsx`
- `src/app/api/relations/[id]/evidence/route.ts`

---

## Section 7 — Activity Log Accuracy & Refresh

**Type:** Bug fix (Group D)

### 7a — Stale display

**Problem:** `ActivityLog` fetches on mount only. Changes made by the user don't appear until the page is reloaded.

**Fix:** `ActivityLog` accepts a `refreshKey?: number` prop. When `refreshKey` changes, the component re-triggers its fetch effect. Parent state management:

The `refreshKey` lives in `PersonDetailTabs`. Save events from **in-page actions** increment it:

- Relation save in `RelationFormDialog` — on successful POST/PUT response via the existing `onSuccess` callback prop (line 32 of the component)
- Evidence add/delete in `PropertyEvidencePanel` and relation evidence panel — via `onEvidenceChange` callback

**Note on person field edits:** `EditPersonClient` lives at a separate route (`/persons/[id]/edit`). On save it calls `router.push()` back to the detail page, causing a full navigation. `ActivityLog` is remounted on return and fetches fresh data automatically. No `refreshKey` threading to `EditPersonClient` is needed or possible.

`PersonDetailTabs` threads `refreshKey` down to `<ActivityLog>` and provides an `onRefresh` callback to child components that trigger in-page saves.

### 7b — Missing activity logging on person updates

**Problem:** `PUT /api/persons/[id]` has no `logActivity` call at all — `logActivity` is not imported. The Activity tab therefore never shows person field edits.

**Fix:**

- Import `logActivity` in `src/app/api/persons/[id]/route.ts`
- Before updating, fetch the current person record to capture old values
- After updating, compare old vs new values field by field
- Log one `logActivity()` call per changed field: `action: "UPDATE"`, `entity_type: "PERSON"`, `entity_id: id`, `field_path: <fieldName>`, `old_value`, `new_value`
- Fields to log: `first_name`, `last_name`, `birth_year`, `birth_month`, `birth_day`, `birth_place`, `birth_date_certainty`, `death_year`, `death_month`, `death_day`, `death_place`, `death_date_certainty`, `notes`

**Affected files:**

- `src/components/relations/ActivityLog.tsx` — add `refreshKey?: number` prop
- `src/app/api/persons/[id]/route.ts` — add logActivity import + per-field logging
- `src/components/research/PersonDetailTabs.tsx` — manage `refreshKey` state, thread to children

---

## Section 8 — Technical Debt Documentation

**Type:** Documentation

`docs/technical-debt.md` records known improvement opportunities discovered during this analysis. See that file for details.

---

## Acceptance Criteria

- [ ] RelationRow evidence badge displays correct count (not `undefined`)
- [ ] Editing a relation shows current from/to entity names in disabled selectors
- [ ] Creating a relation from a person page shows the person in the prefilled from-selector
- [ ] Ereignisse tab shows only relations where the other entity is an Event
- [ ] Personen tab shows only relations where the other entity is a Person
- [ ] Quellen tab shows only relations where the other entity is a Source
- [ ] Filtered tabs pass `filterToEntityType` to the create dialog, restricting the to-entity type
- [ ] Nachweise tab renders all PropertyEvidence for the person grouped by field
- [ ] PersonDetailCard fields have PropertyEvidence badges: birth_year (existing), death_year, birth_place, death_place, notes
- [ ] PropertyEvidence badge count updates immediately after adding/removing evidence (no reload required)
- [ ] RelationRow always shows a "Quellen" trigger (even at count 0); panel expands inline with add/delete
- [ ] ActivityLog refreshes after the user saves a change without a page reload
- [ ] Person field edits are logged as "UPDATE" with the correct `field_path` and old/new values
- [ ] `docs/technical-debt.md` documents known refactoring opportunities
