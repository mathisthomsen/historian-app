# Spec: Event Detail Page — Bug Fixes & Feature Completion

**Scope:** Cleanup of the Event detail page to reach feature parity with the Person detail page
**Date:** 2026-03-24
**Status:** Draft

---

## Background

A review of the event detail page against the completed person detail page (see `docs/specs/2-1_2-4 cleanup/specification.md`) revealed the same categories of gaps: placeholder tabs not wired to the relations engine, missing evidence infrastructure, and no activity logging on edits. This spec documents all issues and their fixes. It also covers the shared `EntityEvidenceTab` generalisation that unblocks the evidence tab for both Events and Sources.

Root cause categories (same taxonomy as persons cleanup):

- **Group A — Incomplete implementation:** Features partially built; backend exists but frontend not wired
- **Group D — Activity log accuracy:** Missing logging, missing field paths, no refresh trigger

---

## Section 1 — EntityEvidenceTab Generalisation (shared prerequisite)

**Type:** Bug fix (Group A)

**Problem:** `EntityEvidenceTab` was built for persons only. Three hardcoded person-specific assumptions block its reuse for Events and Sources:

1. `FIELD_LABEL_KEYS` only maps person property names (`first_name`, `birth_year`, etc.)
2. `useTranslations("persons.fields")` is hardcoded — EVENT and SOURCE fields live in different namespaces
3. The empty-state copy reads "Keine Nachweise für diese Person vorhanden." — person-specific

The component already accepts `entityType: EntityType` as a prop and passes it correctly to the API call. Only the label-resolution and empty-state copy need updating.

**Fix — optional `fieldLabels` prop:**

Add a `fieldLabels?: Record<string, string>` prop to `EntityEvidenceTab`. When provided, it is used as the label lookup instead of the internal `FIELD_LABEL_KEYS` map + `useTranslations("persons.fields")` combination.

```ts
interface EntityEvidenceTabProps {
  projectId: string;
  entityType: EntityType;
  entityId: string;
  fieldLabels?: Record<string, string>;
}
```

Rendering logic (unchanged structure, updated lookup):

```ts
const labelKey = FIELD_LABEL_KEYS[property];
const label = fieldLabels
  ? (fieldLabels[property] ?? property)
  : labelKey
    ? t(labelKey as Parameters<typeof t>[0])
    : property;
```

This is fully backwards-compatible — `PersonDetailTabs` passes no `fieldLabels` prop and continues to work exactly as before using the existing internal map.

**Empty state:** Change the hardcoded string to the generic `"Keine Nachweise vorhanden."` (no entity type in the copy).

**Callers:** `EventDetailTabs` and `SourceDetailTabs` resolve their own field labels using their existing translation instances and pass them as `fieldLabels`. `PersonDetailTabs` passes nothing (unchanged).

**Affected files:**

- `src/components/research/EntityEvidenceTab.tsx` — add `fieldLabels` prop, update label lookup, update empty state copy

---

## Section 2 — Filtered Entity Tabs (Personen / Quellen)

**Type:** Feature completion (Group A)

**Problem:** `EventDetailTabs` has "Personen" and "Quellen" tabs in the `TabsList` but both render a placeholder paragraph:

```tsx
<TabsContent value="persons" className="mt-4">
  <p className="text-sm text-muted-foreground">{t("relations_placeholder")}</p>
</TabsContent>
<TabsContent value="sources" className="mt-4">
  <p className="text-sm text-muted-foreground">{t("relations_placeholder")}</p>
</TabsContent>
```

**Fix:** Replace both `TabsContent` bodies with filtered `RelationsTab` instances, following the exact pattern from `PersonDetailTabs`:

```tsx
<TabsContent value="persons" className="mt-4">
  <RelationsTab
    projectId={projectId}
    entityType="EVENT"
    entityId={event.id}
    entityLabel={event.title}
    filterToEntityType="PERSON"
    onRefresh={handleRefresh}
  />
</TabsContent>
<TabsContent value="sources" className="mt-4">
  <RelationsTab
    projectId={projectId}
    entityType="EVENT"
    entityId={event.id}
    entityLabel={event.title}
    filterToEntityType="SOURCE"
    onRefresh={handleRefresh}
  />
</TabsContent>
```

The existing unfiltered "Relationen" tab stays as-is — it catches Event→Event and any other relation types.

`handleRefresh` and `activityRefreshKey` are introduced in Section 6. The `onRefresh` prop is already defined on `RelationsTabProps`.

**Scoped create button:** `RelationsTab` already passes `prefillToEntityType` to `RelationFormDialog` when `filterToEntityType` is set (implemented in persons cleanup Section 3). No additional work needed.

**Affected files:**

- `src/components/research/EventDetailTabs.tsx`

---

## Section 3 — Nachweise Tab

**Type:** Feature completion (Group A)

**Problem:** `EventDetailTabs` has no "Nachweise" tab — it is absent from both `TabsList` and the tab content area. The backend already supports it: `GET /api/property-evidence` accepts `entityType=EVENT` and the `ALLOWED_PROPERTIES` map includes EVENT fields (`title`, `description`, `start_year`, `start_month`, `start_day`, `end_year`, `end_month`, `end_day`, `location`, `notes`).

**Fix:**

1. Add `<TabsTrigger value="evidence">{t("tabs.evidence")}</TabsTrigger>` to `TabsList` (after "Relationen", before "Verlauf").

2. Add the corresponding `TabsContent`:

```tsx
<TabsContent value="evidence" className="mt-4">
  <EntityEvidenceTab
    projectId={projectId}
    entityType="EVENT"
    entityId={event.id}
    fieldLabels={eventFieldLabels}
  />
</TabsContent>
```

3. Resolve `eventFieldLabels` inside `EventDetailTabs` using the already-imported `useTranslations("events.fields")` translation instance (note: the component currently uses `useTranslations("events.detail")` — add a second call for `"events.fields"`):

```ts
const tFields = useTranslations("events.fields");

const eventFieldLabels: Record<string, string> = {
  title: tFields("title"),
  description: tFields("description"),
  start_year: tFields("start_date"),
  start_month: tFields("start_date"),
  start_day: tFields("start_date"),
  end_year: tFields("end_date"),
  end_month: tFields("end_date"),
  end_day: tFields("end_date"),
  location: tFields("location"),
  notes: tFields("notes"),
};
```

4. Add the missing translation keys. Under `events.detail.tabs` in `messages/de.json`:

```json
"evidence": "Nachweise"
```

And in `messages/en.json`:

```json
"evidence": "Evidence"
```

5. The `events.fields` namespace does not currently include a `"notes"` key. Add it:

In `messages/de.json` under `events.fields`:

```json
"notes": "Notizen"
```

In `messages/en.json` under `events.fields`:

```json
"notes": "Notes"
```

**Affected files:**

- `src/components/research/EventDetailTabs.tsx`
- `messages/de.json` — add `events.detail.tabs.evidence` and `events.fields.notes`
- `messages/en.json` — add `events.detail.tabs.evidence` and `events.fields.notes`

---

## Section 4 — PropertyEvidence Badges on EventDetailCard

**Type:** Feature completion (Group A)

**Problem:** `EventDetailCard` renders no `PropertyEvidenceBadge` components on any field. The backend fully supports evidence on EVENT fields.

**Design decision — date field grouping:** Same convention as persons cleanup. `EventDetailCard` renders start and end dates as composite single-line displays using `formatPartialDate`. Use one badge per displayed date row anchored to the `_year` property. The badge for the start date row uses property `start_year`; for end date, `end_year`. Sub-fields (`start_month`, `start_day`, etc.) are accessible via the Nachweise tab but do not get individual inline badges.

**Fields getting badges in EventDetailCard:**

- `start_year` (covers start date row — new)
- `end_year` (covers end date row — new)
- `location` (new)
- `description` (new)
- `notes` (new)

`title` lives in the page header (`page.tsx`) — out of scope, same reasoning as `first_name`/`last_name` for persons.

**`projectId` prop:** `EventDetailCard` currently receives `event: EventDetail` and `locale: string`. Add `projectId: string` prop. `EventDetailTabs` passes it down.

**Badge placement pattern** (mirroring `PersonDetailCard`):

```tsx
<div className="space-y-1">
  <dt className="text-xs font-medium text-muted-foreground">{t("start_date")}</dt>
  <dd className="flex items-center gap-2 text-sm">
    {startDate}
    {startDate !== "—" && event.start_date_certainty !== "UNKNOWN" && (
      <span className="ml-1 text-xs text-muted-foreground">
        ({tCertainty(event.start_date_certainty)})
      </span>
    )}
    <PropertyEvidenceBadge
      projectId={projectId}
      entityType="EVENT"
      entityId={event.id}
      property="start_year"
    />
  </dd>
</div>
```

Apply the same pattern to end date (`end_year`), location, description, and notes rows. `location`, `description`, and `notes` are rendered conditionally in `EventDetailCard` (only when non-null). The badge renders inside the conditional block — it only appears when the field is displayed, same as the `PersonDetailCard` pattern.

**Badge refresh:** The `PropertyEvidenceBadge` component already manages its own internal `refreshKey` state (implemented in persons cleanup Section 5b). No external threading needed.

**Affected files:**

- `src/components/research/EventDetailCard.tsx` — add `projectId` prop, add badges
- `src/components/research/EventDetailTabs.tsx` — pass `projectId` to `EventDetailCard`

---

## Section 5 — Activity Logging on Event Updates

**Type:** Bug fix (Group D)

**Problem:** `PUT /api/events/[id]` has no `logActivity` call. `logActivity` is not imported. Event field edits are therefore never recorded and the Activity tab remains empty after editing.

**Fix — mirrors persons cleanup Section 7b exactly:**

- Import `logActivity` from `@/lib/activity`
- The `existing` record is already fetched before the update (lines ~197–205) — reuse it as the old-values snapshot
- After `prisma.event.update(...)`, add per-field comparison and logging:

```ts
const loggableFields = [
  "title",
  "description",
  "event_type_id",
  "start_year",
  "start_month",
  "start_day",
  "start_date_certainty",
  "end_year",
  "end_month",
  "end_day",
  "end_date_certainty",
  "location",
  "parent_id",
  "notes",
] as const;

for (const field of loggableFields) {
  if (!(field in data)) continue;
  const oldVal = existing[field];
  const newVal = updated[field];
  if (oldVal !== newVal) {
    await logActivity({
      project_id: existing.project_id,
      entity_type: "EVENT",
      entity_id: id,
      user_id: user.id,
      action: "UPDATE",
      field_path: field,
      old_value: oldVal,
      new_value: newVal,
    }).catch(console.error);
  }
}
```

Place this block after `prisma.event.update(...)` and before `cache.invalidateByPrefix(...)`.

**Affected files:**

- `src/app/api/events/[id]/route.ts` — add logActivity import + per-field logging

---

## Section 6 — Activity Log Refresh in EventDetailTabs

**Type:** Bug fix (Group D)

**Problem:** `EventDetailTabs` passes no `refreshKey` to `ActivityLog` and no `onRefresh` to `RelationsTab`. Changes made in-page (creating/deleting/editing relations, adding/removing evidence) do not update the Activity tab without a page reload.

**Fix — mirrors persons cleanup Section 7a:**

Add `activityRefreshKey` state and a `handleRefresh` function to `EventDetailTabs`:

```ts
const [activityRefreshKey, setActivityRefreshKey] = useState(0);

function handleRefresh() {
  setActivityRefreshKey((k) => k + 1);
}
```

Wire up:

- Pass `onRefresh={handleRefresh}` to the "Personen" and "Quellen" filtered `RelationsTab` instances (Section 2) and to the unfiltered "Relationen" `RelationsTab`.
- Pass `refreshKey={activityRefreshKey}` to `<ActivityLog>`.

**Note on event field edits:** `EditEventClient` lives at `/events/[id]/edit`. On save it calls `router.push()` back to the detail page, causing a full navigation. `ActivityLog` remounts on return and fetches fresh data automatically. No `refreshKey` threading to the edit page is needed.

**Affected files:**

- `src/components/research/EventDetailTabs.tsx`

---

## Acceptance Criteria

- [ ] `EntityEvidenceTab` accepts an optional `fieldLabels` prop; callers passing it get resolved labels; callers omitting it (PersonDetailTabs) continue to work unchanged
- [ ] `EntityEvidenceTab` empty state reads "Keine Nachweise vorhanden." (no entity-specific copy)
- [ ] EventDetailTabs "Personen" tab shows only relations where the other entity is a Person
- [ ] EventDetailTabs "Quellen" tab shows only relations where the other entity is a Source
- [ ] Filtered tabs pass `filterToEntityType` to the create dialog, restricting the to-entity type
- [ ] EventDetailTabs has a "Nachweise" tab rendering all PropertyEvidence for the event grouped by field
- [ ] EventDetailCard fields have PropertyEvidence badges: start_year (covers start date row), end_year (covers end date row), location, description, notes
- [ ] PropertyEvidence badge count updates immediately after adding/removing evidence (no reload required)
- [ ] ActivityLog refreshes after the user saves a change in-page without a page reload
- [ ] Event field edits are logged as "UPDATE" with the correct `field_path` and old/new values
