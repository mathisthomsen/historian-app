# Gap Analysis — Evidoxa App (Epics 1.1–2.4 + Cleanup Specs)

**Generated:** 2026-03-31
**Branch:** `feat/epic-2-1-person-management`
**Scope:** All implemented epics through sources-cleanup, assessed against their specifications.

---

## Overall Completeness

All seven epics and three cleanup specs are marked ✅ Complete in their progress files, and the vast majority of their acceptance criteria are genuinely implemented. The gaps identified below are items where the specification describes behaviour that is absent or incomplete in the actual codebase — things that would noticeably affect a real user.

| Area                         | Spec Compliance | Notes                                                                 |
| ---------------------------- | --------------- | --------------------------------------------------------------------- |
| Authentication (1.3)         | ✅ Full         | All flows working                                                     |
| Security / CI (1.4)          | ✅ Full         | Headers, rate-limiting, CI confirmed                                  |
| Person Management (2.1)      | ✅ Full         | CRUD, detail tabs, evidence, activity                                 |
| Event Management (2.2)       | ✅ Full         | EventType, sub-events, detail tabs                                    |
| Source Management (2.3)      | ✅ Full         | CRUD, SourceDetailCard, evidence                                      |
| Relationship Engine (2.4)    | ⚠️ Partial      | Relations list filters absent; temporal validity not shown            |
| App Shell / Navigation (1.1) | ⚠️ Partial      | Two sidebar links go to non-existent routes                           |
| Dashboard                    | ⚠️ Stub         | Spec described stats + recent activity; current impl is a placeholder |
| Global Relations List        | ⚠️ Partial      | Three filter controls missing; strings not i18n'd                     |
| Loading Skeletons (1.1)      | ⚠️ Partial      | Per-route loading.tsx files absent; only global fallback exists       |

---

## Priority Order for Remediation

### P1 — User-Facing Failures (broken navigation / crashes)

1. **Sidebar dead links** — "Locations" and "Literature" nav items link to `/locations` and `/literature` which do not exist. Any user who clicks them gets a 404. The "Settings" primary nav item also 404s; only the child items (Event Types, Relation Types) work correctly.

### P2 — Missing Core Functionality (spec-promised features not present)

2. **Global Relations List — filter controls** — The `/relations` page spec defines [Entity Type], [Relation Type], and [Certainty] filter dropdowns. Only a free-text search input is implemented. Users cannot filter by type or certainty.

3. **RelationRow — temporal validity** — The spec requires `valid_from_year`/`valid_to_year` to be displayed on each relation row (e.g. "1920 – 1945"). The fields exist in the schema and are stored, but are never rendered.

4. **Dashboard stub** — The current dashboard renders only a welcome message and logout button. The spec implicitly (and standard UX) requires entity counts, recent activity, or quick navigation. The page is not useful in its current state.

### P3 — Polish / Quality (spec detail not met)

5. **Relations list — hardcoded i18n strings** — `RelationsDataTable` renders `"gesamt"`, `"Zurück"`, and `"Weiter"` as string literals. These are not passed through `useTranslations`. The rest of the app is consistently i18n'd.

6. **Relation counts hardcoded to 0** — The `persons/[id]/page.tsx` and `events/[id]/page.tsx` server components pass `relations_from: 0, relations_to: 0` to the detail component instead of querying the real count. Tab count badges therefore never reflect reality.

7. **`created_by` shown as raw CUID** — `PersonDetailCard` and `EventDetailCard` display `created_by_id` as a raw database ID string (`cm1abc...`). The spec implies a human-readable name or email.

8. **Per-route loading skeletons absent** — Epic 1.1 specifies per-route `loading.tsx` files with appropriate skeleton variants (`list` for entity lists, `detail` for detail pages). Only a single global `loading.tsx` exists using `card-grid`.

9. **Tab count badges not shown** — The Epic 2.4 spec mockups show relation count badges on detail-page tabs (e.g. `Relationen ★3`). No count badges appear.

---

## Files Consulted

**Specs:**

- `docs/specs/1-1-project-bootstrap/specification.md`
- `docs/specs/1-2-database-schema-data-layer/specification.md`
- `docs/specs/2-1-person-management/specification.md`
- `docs/specs/2-2-event-management/specification.md`
- `docs/specs/2-3-source-management/specification.md`
- `docs/specs/2-4-universal-relationship-engine/specification.md`
- `docs/specs/2-1_2-4 cleanup/specification.md`
- `docs/specs/events-cleanup/specification.md`
- `docs/specs/sources-cleanup/specification.md`

**Codebase:**

- `src/components/shell/sidebar.tsx`
- `src/app/[locale]/(app)/dashboard/page.tsx`
- `src/app/[locale]/(app)/relations/page.tsx`
- `src/app/[locale]/(app)/relations/_components/RelationsDataTable.tsx`
- `src/app/[locale]/(app)/persons/[id]/page.tsx`
- `src/app/[locale]/(app)/events/[id]/page.tsx`
- `src/components/research/PersonDetailCard.tsx`
- `src/components/research/EventDetailCard.tsx`
- `src/components/research/SourceDetailCard.tsx`
- `src/components/research/PersonDetailTabs.tsx`
- `src/components/research/EventDetailTabs.tsx`
- `src/components/research/SourceDetailTabs.tsx`
- `src/components/relations/RelationRow.tsx`
- `src/components/relations/RelationsTab.tsx`
- `src/components/relations/RelationFormDialog.tsx`
- `src/app/[locale]/loading.tsx`
- `prisma/schema.prisma`
