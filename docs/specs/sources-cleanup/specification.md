# Spec: Source Detail Page — Bug Fixes & Feature Completion

**Scope:** Cleanup of the Source detail page to reach feature parity with the Person detail page
**Date:** 2026-03-24
**Status:** Draft

**Prerequisite:** `docs/specs/events-cleanup/specification.md` Section 1 — the `EntityEvidenceTab` generalisation must be applied before implementing Section 2 of this spec.

---

## Background

The same gap categories found in the Person and Event detail pages are present on the Source detail page: placeholder tabs not wired to the relations engine, missing evidence infrastructure, and no activity logging on edits. This spec documents all issues and fixes specific to Sources.

Root cause categories:

- **Group A — Incomplete implementation:** Features partially built; backend exists but frontend not wired
- **Group D — Activity log accuracy:** Missing logging, no refresh trigger

---

## Section 1 — Filtered Entity Tabs (Personen / Ereignisse)

**Type:** Feature completion (Group A)

**Problem:** `SourceDetailTabs` currently has three tabs: "Details", "Verknüpfungen" (unfiltered `RelationsTab`), and "Verlauf". It has no filtered views for Persons or Events, unlike the fully implemented Person detail page. A researcher opening a source naturally wants to ask "which persons appear in this source?" and "which events does this document?" — the flat unfiltered view forces manual scanning of a mixed list.

**Design:** Add "Personen" and "Ereignisse" tabs. Keep the existing unfiltered "Verknüpfungen" tab — it correctly catches Source→Source relations and any other edge cases that don't fit the filtered views.

New tab order: Details → Personen → Ereignisse → Verknüpfungen → Nachweise → Verlauf.

**TabsList additions:**

```tsx
<TabsTrigger value="persons">{t("tab_persons")}</TabsTrigger>
<TabsTrigger value="events">{t("tab_events")}</TabsTrigger>
```

**New TabsContent:**

```tsx
<TabsContent value="persons" className="mt-4">
  <RelationsTab
    projectId={projectId}
    entityType="SOURCE"
    entityId={source.id}
    entityLabel={source.title}
    filterToEntityType="PERSON"
    onRefresh={handleRefresh}
  />
</TabsContent>
<TabsContent value="events" className="mt-4">
  <RelationsTab
    projectId={projectId}
    entityType="SOURCE"
    entityId={source.id}
    entityLabel={source.title}
    filterToEntityType="EVENT"
    onRefresh={handleRefresh}
  />
</TabsContent>
```

**Stale counter removal:** The current "Verknüpfungen" tab body contains a `totalLinks` counter below the `RelationsTab`:

```tsx
{
  totalLinks > 0 && (
    <p className="mt-2 text-sm text-muted-foreground">
      ({source._count.relation_evidence} Verknüpfungen • {source._count.property_evidence}{" "}
      Quellenbelege)
    </p>
  );
}
```

This mixes `relation_evidence` (how many relation-level evidence items this source is cited in) with `property_evidence` (how many field-level evidence items). It is confusing, stale-prone, and redundant now that the tabs show live counts directly. Remove `totalLinks`, the `const totalLinks = ...` variable, and this paragraph.

**`handleRefresh`** is introduced in Section 5.

**New translation keys** — add to `messages/de.json` under `sources`:

```json
"tab_persons": "Personen",
"tab_events": "Ereignisse"
```

And equivalents in `messages/en.json`:

```json
"tab_persons": "Persons",
"tab_events": "Events"
```

**Affected files:**

- `src/components/research/SourceDetailTabs.tsx`
- `messages/de.json`
- `messages/en.json`

---

## Section 2 — Nachweise Tab

**Type:** Feature completion (Group A)

**Prerequisite:** Events cleanup Section 1 (`EntityEvidenceTab` generalisation) must be applied first.

**Problem:** `SourceDetailTabs` has no "Nachweise" tab. The backend fully supports it: `GET /api/property-evidence` accepts `entityType=SOURCE` and `ALLOWED_PROPERTIES` includes SOURCE fields (`title`, `author`, `date`, `repository`, `call_number`, `url`, `notes`).

**Fix:**

1. Add `<TabsTrigger value="evidence">{t("tab_evidence")}</TabsTrigger>` to `TabsList` (after "Verknüpfungen", before "Verlauf").

2. Add the corresponding `TabsContent`:

```tsx
<TabsContent value="evidence" className="mt-4">
  <EntityEvidenceTab
    projectId={projectId}
    entityType="SOURCE"
    entityId={source.id}
    fieldLabels={sourceFieldLabels}
  />
</TabsContent>
```

3. Resolve `sourceFieldLabels` inside `SourceDetailTabs` using the already-available `useTranslations("sources")` translation instance:

```ts
const sourceFieldLabels: Record<string, string> = {
  title: t("field_title"),
  author: t("field_author"),
  date: t("field_date"),
  repository: t("field_repository"),
  call_number: t("field_call_number"),
  url: t("field_url"),
  notes: t("field_notes"),
};
```

4. Add the missing translation key to `messages/de.json` under `sources`:

```json
"tab_evidence": "Nachweise"
```

And in `messages/en.json`:

```json
"tab_evidence": "Evidence"
```

**Affected files:**

- `src/components/research/SourceDetailTabs.tsx`
- `messages/de.json`
- `messages/en.json`

---

## Section 3 — PropertyEvidence Badges and SourceDetailCard Extraction

**Type:** Feature completion (Group A)

**Problem:** Source detail fields are rendered as an inline grid directly inside `SourceDetailTabs`. There is no `SourceDetailCard` component. Adding `PropertyEvidenceBadge` components inline would make `SourceDetailTabs` unwieldy — it already handles tab structure, relation counts, translation, and now will manage activity refresh state. Extracting the field display to a dedicated component keeps concerns separated and follows the `PersonDetailCard` / `EventDetailCard` pattern.

**Fix — two-part:**

### 3a — Extract SourceDetailCard

Create `src/components/research/SourceDetailCard.tsx` as a `"use client"` component. Move the entire inline field grid currently in the "Details" `TabsContent` of `SourceDetailTabs` into this new component.

Props:

```ts
interface SourceDetailCardProps {
  source: SourceDetail;
  locale: string;
  projectId: string;
}
```

In `SourceDetailTabs`, replace the inline grid with:

```tsx
<TabsContent value="details" className="mt-4">
  <SourceDetailCard source={source} locale={locale} projectId={projectId} />
</TabsContent>
```

### 3b — Add PropertyEvidence badges

Fields getting badges (from `ALLOWED_PROPERTIES` for `SOURCE`):

- `title`
- `author`
- `date`
- `repository`
- `call_number`
- `url`
- `notes`

**Badge placement pattern** (mirroring `PersonDetailCard` and `EventDetailCard`):

```tsx
<div className="space-y-1">
  <p className="text-xs font-medium text-muted-foreground">{t("field_author")}</p>
  <div className="flex items-center gap-2 text-sm">
    <span>{source.author ?? "—"}</span>
    <PropertyEvidenceBadge
      projectId={projectId}
      entityType="SOURCE"
      entityId={source.id}
      property="author"
    />
  </div>
</div>
```

Apply the same pattern to all seven fields listed above.

**Note on `title`:** Like `first_name`/`last_name` for persons, the source title may also appear in the page header. The badge for `title` belongs in `SourceDetailCard` on the detail row (not in the header), consistent with the established pattern.

**Badge refresh:** `PropertyEvidenceBadge` manages its own internal `refreshKey` state. No external threading needed.

**Affected files:**

- `src/components/research/SourceDetailCard.tsx` — new component
- `src/components/research/SourceDetailTabs.tsx` — replace inline grid with `<SourceDetailCard>`

---

## Section 4 — Activity Logging on Source Updates

**Type:** Bug fix (Group D)

**Problem:** `PUT /api/sources/[id]` has no `logActivity` call. `logActivity` is not imported. Source field edits are never recorded and the Activity tab remains empty after editing.

**Fix — mirrors persons cleanup Section 7b and events cleanup Section 5:**

- Import `logActivity` from `@/lib/activity`
- The `existing` record is already fetched before the update (lines ~102–110) — reuse it as the old-values snapshot
- After `prisma.source.update(...)`, add per-field comparison and logging:

```ts
const loggableFields = [
  "title",
  "type",
  "author",
  "date",
  "repository",
  "call_number",
  "url",
  "reliability",
  "notes",
] as const;

for (const field of loggableFields) {
  if (!(field in data)) continue;
  const oldVal = existing[field];
  const newVal = updated[field];
  if (oldVal !== newVal) {
    await logActivity({
      project_id: existing.project_id,
      entity_type: "SOURCE",
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

Place this block after `prisma.source.update(...)` and before `cache.invalidateByPrefix(...)`.

**Affected files:**

- `src/app/api/sources/[id]/route.ts` — add logActivity import + per-field logging

---

## Section 5 — Activity Log Refresh in SourceDetailTabs

**Type:** Bug fix (Group D)

**Problem:** `SourceDetailTabs` passes no `refreshKey` to `ActivityLog` and no `onRefresh` to the `RelationsTab`. In-page changes (relation creates/deletes, evidence adds/removes) do not update the Activity tab without a page reload.

**Fix — mirrors persons cleanup Section 7a:**

Add `activityRefreshKey` state and a `handleRefresh` function to `SourceDetailTabs`:

```ts
const [activityRefreshKey, setActivityRefreshKey] = useState(0);

function handleRefresh() {
  setActivityRefreshKey((k) => k + 1);
}
```

Wire up:

- Pass `onRefresh={handleRefresh}` to the "Personen" and "Ereignisse" filtered `RelationsTab` instances (Section 1) and to the unfiltered "Verknüpfungen" `RelationsTab`.
- Pass `refreshKey={activityRefreshKey}` to `<ActivityLog>`.

**Note on EntityEvidenceTab:** `EntityEvidenceTab` is read-only — evidence is added via `PropertyEvidenceBadge` in the Details tab, not from within the Nachweise tab. `EntityEvidenceTab` does not need `onRefresh`. When the user navigates to the Nachweise tab, the component remounts and re-fetches automatically.

**Note on source field edits:** `EditSourceClient` lives at `/sources/[id]/edit`. On save it calls `router.push()` back to the detail page, causing a full navigation and `ActivityLog` remount. No `refreshKey` threading to the edit page is needed.

**Affected files:**

- `src/components/research/SourceDetailTabs.tsx`

---

## Acceptance Criteria

- [ ] SourceDetailTabs has a "Personen" tab showing only relations where the other entity is a Person
- [ ] SourceDetailTabs has an "Ereignisse" tab showing only relations where the other entity is an Event
- [ ] Filtered tabs pass `filterToEntityType` to the create dialog, restricting the to-entity type
- [ ] The stale `totalLinks` counter below "Verknüpfungen" is removed
- [ ] SourceDetailTabs has a "Nachweise" tab rendering all PropertyEvidence for the source grouped by field with human-readable field labels
- [ ] A `SourceDetailCard` component exists and is used by `SourceDetailTabs` for the "Details" tab
- [ ] `SourceDetailCard` fields have PropertyEvidence badges: title, author, date, repository, call_number, url, notes
- [ ] PropertyEvidence badge count updates immediately after adding/removing evidence (no reload required)
- [ ] ActivityLog refreshes after the user saves a change in-page without a page reload
- [ ] Source field edits are logged as "UPDATE" with the correct `field_path` and old/new values
