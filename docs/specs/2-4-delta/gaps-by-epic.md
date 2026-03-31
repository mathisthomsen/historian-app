# Gaps by Epic — Detailed Analysis

**Generated:** 2026-03-31

Severity scale:

- **Critical** — Causes a broken/unusable experience right now (404, crash, data not shown at all)
- **Important** — Spec-promised feature is absent; user cannot accomplish a stated goal
- **Minor** — Polish detail; the feature works but not exactly as specified

---

## Epic 1.1 — Project Bootstrap / App Shell

### GAP-1.1-A: Sidebar "Locations" and "Literature" links go to 404 [Critical]

**File:** `src/components/shell/sidebar.tsx`

The `primaryNavItems` array in `Sidebar` includes entries for `locations` and `literature`:

```tsx
{ key: "locations", href: `/${locale}/locations`, icon: MapPin }
{ key: "literature", href: `/${locale}/literature`, icon: BookMarked }
```

Neither `src/app/[locale]/(app)/locations/` nor `src/app/[locale]/(app)/literature/` exists in the file system. Clicking either link triggers the catch-all `[...catchAll]/page.tsx` which calls `notFound()`, producing a 404.

The sidebar also has `{ key: "settings", href: ... }` as a primary nav item pointing to `/[locale]/settings`. That path is also not a real page; only `/settings/event-types` and `/settings/relation-types` exist. The `settingsNavItems` children correctly link to those working routes, so a user who clicks the expander can still reach settings — but clicking the parent "Settings" label produces a 404.

**Spec reference:** Epic 1.1 Section 2 — Navigation items list includes Locations and Literature as future modules. The spec anticipates these as stubs or placeholders; the implementation adds real links before the routes exist.

**Fix options:**

- Add `disabled` styling and `pointer-events-none` to unimplemented links, or
- Add minimal placeholder pages at those routes, or
- Remove the items from the sidebar until the epics are implemented.

---

### GAP-1.1-B: Per-route loading.tsx skeletons absent [Minor]

**File:** `src/app/[locale]/loading.tsx` (only one exists)

Epic 1.1 specifies per-route loading files with appropriate skeleton variants:

| Route           | Expected variant |
| --------------- | ---------------- |
| `/persons`      | `list`           |
| `/persons/[id]` | `detail`         |
| `/events`       | `list`           |
| `/events/[id]`  | `detail`         |
| `/sources`      | `list`           |
| `/sources/[id]` | `detail`         |
| `/relations`    | `list`           |

Currently only `src/app/[locale]/loading.tsx` exists and uses the `card-grid` variant for all routes. During navigation, every route shows the card-grid skeleton regardless of the destination page's layout.

**Fix:** Add `loading.tsx` next to each list and detail `page.tsx` calling `<PageSkeleton variant="list" />` or `<PageSkeleton variant="detail" />` as appropriate.

---

## Epic 1.2 — Database Schema

No gaps. All 15 tables are present in `prisma/schema.prisma` matching the specification, including `PropertyEvidence` (with `quote`, `raw_transcription`, `confidence`), `EntityActivity` (with `ActivityAction` enum), `EventType`, `RelationEvidence`, and all soft-delete `deleted_at` columns.

---

## Epic 1.3 — Authentication

No gaps. All auth flows (register → verify-email → login → dashboard → logout, forgot/reset password) are implemented and tested.

---

## Epic 1.4 — Security & CI/CD

No gaps. Upstash Redis rate limiting, security headers, CSP, and CI pipeline are all confirmed.

---

## Epic 2.1 — Person Management

### GAP-2.1-A: `created_by` rendered as raw CUID [Minor]

**File:** `src/components/research/PersonDetailCard.tsx` (line ~90)

```tsx
<dd className="text-sm font-mono text-xs">{person.created_by_id}</dd>
```

The raw CUID (e.g. `cm8z1abc2def3...`) is displayed directly. The spec implies a human-readable identifier (user name or email). The same pattern appears in `EventDetailCard.tsx`.

The `Person` type does not currently include a joined `created_by` user object, so resolving this requires either:

- Joining the `User` table in the API route and including `created_by { name, email }` in the response type, or
- Displaying a truncated ID with a tooltip (lower effort, acceptable compromise).

**Impact:** Low — researchers see a meaningless string where they expect "Lily" or similar. Does not block any workflow.

---

## Epic 2.2 — Event Management

No functional gaps. EventType CRUD works, EventDetailTabs has all 7 tabs including the Nachweise tab. Sub-events list and navigation work.

---

## Epic 2.3 — Source Management

No functional gaps. SourceDetailCard with all 7 PropertyEvidence badges is implemented. SourceDetailTabs has all 6 tabs.

---

## Epic 2.4 — Universal Relationship Engine

### GAP-2.4-A: Global Relations List missing three filter controls [Important]

**File:** `src/app/[locale]/(app)/relations/_components/RelationsDataTable.tsx`

The Epic 2.4 spec (Section 4 — Global Relations List) defines four filter controls above the relations table:

1. [Entity Type ▾] — filter to relations where either entity is of the selected type (PERSON / EVENT / SOURCE)
2. [Relation Type ▾] — filter to a specific relation type
3. [Certainty ▾] — filter by certainty level (CERTAIN / PROBABLE / SPECULATIVE / UNKNOWN)
4. Free-text search (implemented ✅)

Only the free-text search input exists. The three dropdown filters are absent. The API endpoint at `/api/relations` already supports `fromType`, `toType`, and `certainty` query parameters (based on the spec), but the UI does not expose them.

**Impact:** Medium — a researcher with many relations cannot narrow by type or certainty. The free-text search partially compensates but does not serve the same purpose.

---

### GAP-2.4-B: Global Relations List — pagination strings not i18n'd [Minor]

**File:** `src/app/[locale]/(app)/relations/_components/RelationsDataTable.tsx`

The component renders literal German strings:

- `"gesamt"` (total count label)
- `"Zurück"` (previous page button)
- `"Weiter"` (next page button)

All other UI text in the app passes through `useTranslations`. These three strings break the English locale.

**Fix:** Add keys under `relations.list.*` in `messages/de.json` and `messages/en.json`, and call `t(...)` for these labels.

---

### GAP-2.4-C: RelationRow does not display temporal validity [Important]

**File:** `src/components/relations/RelationRow.tsx`

The `Relation` schema has `valid_from_year` (Int?) and `valid_to_year` (Int?). The Epic 2.4 spec (Section 3 — Relation Row) shows these displayed as a date range on the row: "1920 – 1945" or "ab 1920" / "bis 1945".

The fields are stored in the database (confirmed in schema) and returned by the API (present in the `RelationSummary` type). They are not rendered anywhere in `RelationRow.tsx`.

**Impact:** Medium — temporal context is a core feature of historical research. A relation like "was married to (1923–1948)" loses half its meaning without the date range.

---

### GAP-2.4-D: Relation counts hardcoded to 0 in detail page server components [Important]

**Files:**

- `src/app/[locale]/(app)/persons/[id]/page.tsx`
- `src/app/[locale]/(app)/events/[id]/page.tsx`

Both server components include this pattern in the Prisma query:

```ts
_count: {
  select: {
    relations_from: true,
    relations_to: true,
  }
}
```

but then immediately override the result by hardcoding `relations_from: 0, relations_to: 0` before passing the object to the detail component. (The source detail page may have the same issue — not confirmed.)

The `RelationsTab` component uses these counts to determine whether to show a "no relations" empty state vs. a spinner while fetching. With counts hardcoded to 0 the tab always shows the empty state even for entities that have relations, until the client-side fetch completes and overwrites the state.

**Impact:** Medium — brief flash of "no relations" on every detail page even for entities that have relations. Tab count badge (if ever added) will always show 0.

**Fix:** Remove the `relations_from: 0, relations_to: 0` override and use the actual Prisma `_count` result.

---

### GAP-2.4-E: Tab count badges not shown on detail pages [Minor]

**Files:** `PersonDetailTabs.tsx`, `EventDetailTabs.tsx`, `SourceDetailTabs.tsx`

The Epic 2.4 spec mockup shows relation tabs with count badges:

```
[Relationen ★3]  [Personen ★2]  [Quellen ★1]
```

No count badges appear on any tab. The `_count` data is available on the entity (when not hardcoded to 0 — see GAP-2.4-D above). The `TabsTrigger` components currently render plain strings without badges.

**Impact:** Low — decorative but spec-specified feature that helps researchers see at a glance whether an entity has related items before clicking a tab.

---

### GAP-2.4-F: Evidence attachment during relation creation — needs verification [Minor]

**File:** `src/components/relations/RelationFormDialog.tsx`

The Epic 2.4 spec describes an "Add evidence" section inside the creation dialog, allowing a source to be attached as `RelationEvidence` at the time the relation is created (not just after). The component was read only to line 80; the dialog JSX was not inspected past the form fields.

This item is marked as **needs verification** — it may be fully implemented and not visible in the portion of the file that was read. If the dialog's final rendered form does not include an evidence section in create mode, this is an Important gap.

**Recommended action:** Open the component in full and confirm whether an "Add evidence" section appears in non-edit mode.

---

## Cleanup Specs (2-1_2-4, events-cleanup, sources-cleanup)

All three cleanup specs are verified complete. No gaps found. All 34 acceptance criteria (14 + 10 + 10) are genuinely implemented in the codebase:

- `PersonDetailTabs` — 8 tabs, filtered RelationsTab, EntityEvidenceTab, activityRefreshKey
- `EventDetailTabs` — 7 tabs, filtered RelationsTab, EntityEvidenceTab, activityRefreshKey
- `SourceDetailTabs` — 6 tabs, SourceDetailCard, EntityEvidenceTab, activityRefreshKey
- `logActivity` confirmed called in PUT handlers for persons, events, and sources
- `PropertyEvidence` badges on all specified fields across PersonDetailCard (5), EventDetailCard (5), SourceDetailCard (7)
- `RelationRow` evidence expandable panel with EvidenceList and add/delete

---

## Summary Table

| ID        | Epic | Severity                   | Title                                                      |
| --------- | ---- | -------------------------- | ---------------------------------------------------------- |
| GAP-1.1-A | 1.1  | **Critical**               | Sidebar Locations/Literature/Settings links go to 404      |
| GAP-1.1-B | 1.1  | Minor                      | Per-route loading skeletons absent                         |
| GAP-2.1-A | 2.1  | Minor                      | `created_by` shown as raw CUID                             |
| GAP-2.4-A | 2.4  | **Important**              | Global relations list missing 3 filter controls            |
| GAP-2.4-B | 2.4  | Minor                      | Relations list pagination not i18n'd                       |
| GAP-2.4-C | 2.4  | **Important**              | RelationRow does not display temporal validity             |
| GAP-2.4-D | 2.4  | **Important**              | Relation counts hardcoded to 0 in detail server components |
| GAP-2.4-E | 2.4  | Minor                      | Tab count badges not shown                                 |
| GAP-2.4-F | 2.4  | Minor (needs verification) | Evidence attachment during relation creation               |
