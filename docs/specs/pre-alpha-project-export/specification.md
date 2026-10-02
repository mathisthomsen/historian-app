# Pre-Alpha — Minimal project export

## Specification

**Tracks:** #139 · **Milestone:** Pre-Alpha Gate (gate 2 of 5)
**Deliverable:** A member of a project can download everything that project holds as one JSON file.
**Verifiable:** On the dashboard, "Projekt exportieren" downloads `evidoxa-export-….json`; opening it
shows every person, event, source and relation the UI shows, plus soft-deleted ones; requesting
another user's project returns 404.

**Not Epic 5.1.** No CSV, no format or field choice, no filtering, no import. This exists so a
researcher can get their work back out, which makes it a precondition for asking anyone to put work in.

---

## 0. Load-bearing assumptions

| #   | Premise                                                                                                     | State                              | Evidence / what breaks if false                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | **`UserProject` membership is the only grant of read access to a project.**                                 | Measured                           | `requireProjectMembership` (`src/lib/api.ts:193–207`) is what every project-scoped route calls, e.g. `persons/route.ts:49`. If anything else granted access (a share link, an admin bypass), the export's check would be narrower or wider than the UI's. No other grant exists in `schema.prisma`.                                                                                                                                                                                                                                                   |
| E2  | **Every row a project owns is reachable from `project_id`**, either directly or through exactly one parent. | Measured                           | `schema.prisma` 2026-10-02: ten models carry `project_id`; two do not and hang off one that does — `PersonName → Person`, `RelationEvidence → Relation`. False → the export silently omits data, which is the failure this feature exists to prevent. §5 makes it a test failure when a future model is added.                                                                                                                                                                                                                                        |
| E3  | **Child rows filtered through their parent cannot leak across projects.**                                   | Measured                           | `PersonName.person_id` and `RelationEvidence.relation_id` are real FKs (`schema.prisma:247–255`, `:486–498`), so `where: { person: { project_id } }` is enforced by the join. The **polymorphic** columns (`Relation.from_id/to_id`, `PropertyEvidence.entity_id`, `EntityActivity.entity_id`) have no FK — the export filters those tables by their **own** `project_id`, never by following an id.                                                                                                                                                  |
| E4  | **The largest realistic project fits comfortably in one function invocation's memory.**                     | Measured (dev)                     | Largest project on `dev` (`br-falling-resonance-a9xyd5y9`, verified in-session 2026-10-02): 147 persons, 881 events, 100 sources, 28 relations, 222 activity rows — **≈ 0.7 MB** as JSON (`sum(length(row_to_json(x)::text))`). A 100× project is ≈ 70 MB. §3 caps rows so a pathological project fails clearly instead of exhausting memory.                                                                                                                                                                                                         |
| E5  | **A streamed response is not subject to Vercel's buffered response-size limit.**                            | **Assumed — measure before merge** | Production-bound. CI E2E runs `pnpm build` + `next start`, not Vercel, so it cannot observe this. Measure on a **preview deployment** with a seeded project exported above 5 MB (§7). **Measured 2026-10-02:** the Preview environment has **no `DATABASE_URL`** (`vercel env ls preview` lists only `NEON_API_KEY`), so a preview needs the `dev` branch URL passed explicitly — never production's. If false, the 0.7 MB case still works and large projects fail — the fix is then a Blob-hosted file, a design change, so it must be known first. |

## 0b. Blast radius and test scope

One new route, one button. No change to `authorized()`, middleware, layouts or any existing route:
the route sits under `/api/`, so the existing gate already answers anonymous callers with 401
(`src/auth.config.ts:128–139`). Test scope is the diff plus `e2e/smoke.spec.ts`.

The risk is not breadth but depth — this is the single route that returns **every** row of a project
at once, so a scoping mistake leaks everything. Method, matching that risk:

- **Cross-tenant (E1, E3):** E2E with **two real users in real browser sessions**, each with their own
  project and data. User B requests A's export → 404, and the response body contains none of A's
  ids. A unit test with a mocked membership cannot observe a missing `where`.
- **Completeness (E2):** a unit test over Prisma's DMMF (§5), not a hand-maintained list.
- **Size (E5):** a preview deployment, not CI (above).
- Unit tests mock Prisma; the `pnpm test` job has real Upstash credentials and no namespace
  (`ci.yml:56–59`), so nothing here may reach `src/lib/redis.ts`. The rate limiter goes through
  `checkRateLimit`, which refuses to build an un-namespaced key.

---

## 1. Decisions

| #   | Decision              | Choice and reason                                                                                                                                                                                                         |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| X1  | Shape                 | **Table-shaped**: one array per database table, rows with their database column names. Honest about what is stored, needs no mapping layer to drift, and is the natural input for a future import. Not nested per person. |
| X2  | Soft-deleted rows     | **Included**, with `deleted_at` (issue requirement — a deleted record is still the researcher's data).                                                                                                                    |
| X3  | Non-member response   | **404**, not the 403 that list routes return — does not confirm the project exists (issue requirement). The divergence is deliberate.                                                                                     |
| X4  | Snapshot consistency  | All reads in **one `REPEATABLE READ` transaction**, so an edit during export cannot produce a relation whose endpoint is missing from the file.                                                                           |
| X5  | Other users           | Ids only (`created_by_id`, `EntityActivity.user_id`). No names or emails of other members.                                                                                                                                |
| X6  | Locations, Literature | **Included** although no UI writes them yet (Epic 3.2): "everything the project owns" means the schema, not the UI. Normally empty arrays.                                                                                |
| X7  | Caching               | **None.** `Cache-Control: no-store`; `cache.ts` is not used.                                                                                                                                                              |

---

## 2. Format

```ts
interface EvidoxaExport {
  format: "evidoxa-project-export";
  format_version: 1;
  exported_at: string; // ISO 8601, UTC
  app_version: string; // package.json version
  schema_migration: string | null; // getLatestMigration() — which schema these columns belong to
  project: { id; name; description; created_at; updated_at };
  tables: {
    persons: Person[];
    person_names: PersonName[];
    events: Event[];
    event_types: EventType[];
    sources: Source[];
    locations: Location[];
    literature: Literature[];
    relation_types: RelationType[];
    relations: Relation[];
    relation_evidence: RelationEvidence[];
    property_evidence: PropertyEvidence[];
    entity_activity: EntityActivity[];
  };
  counts: Record<keyof EvidoxaExport["tables"], number>; // lets a reader check the file is complete
}
```

Value rules — the issue's "structured values, not stringified blobs":

- Partial dates stay as separate nullable integers (`birth_year`, `birth_month`, `birth_day`).
- Enums (`Certainty`, `SourceReliability`, `EntityType`, `ActivityAction`) as their string names.
- Timestamps as ISO 8601 strings (what `JSON.stringify` does to a `Date`).
- `EntityActivity.old_value` / `new_value` are `Json` columns and stay embedded JSON, not strings.
- `RelationType.valid_from_types` / `valid_to_types` stay arrays.
- Rows ordered by `created_at, id` per table, so two exports of an unchanged project are byte-identical
  except `exported_at`.

---

## 3. API — `GET /api/projects/[id]/export`

1. `requireUser()` → none: 401 (the middleware already answers first; this is the second layer).
2. `checkRateLimit("export:{userId}", 5, 10 min)` → 429.
3. `requireProjectMembership(user.id, id)` (any role, including VIEWER) **and** the project's
   `deleted_at` is null → otherwise **404** `NOT_FOUND`. The check precedes any read of project data.
4. One `prisma.$transaction(async (tx) => …, { isolationLevel: "RepeatableRead", timeout: 20_000 })`:
   - `count` every table first; total > **100 000 rows** → 413 `EXPORT_TOO_LARGE` (new code in
     `ERROR_CODES`). ~140× the largest measured project (E4).
   - Then one `findMany` per table: direct tables `where: { project_id: id }`; `person_names`
     `where: { person: { project_id: id } }`; `relation_evidence` `where: { relation: { project_id: id } }`.
5. Respond `200` with a `ReadableStream` that writes the document table by table, and headers:
   - `Content-Type: application/json; charset=utf-8`
   - `Content-Disposition: attachment; filename="evidoxa-export-{slug(project.name)}-{YYYY-MM-DD}.json"`
     (slug: lowercase ASCII, `[a-z0-9-]`, max 40, fallback `projekt`)
   - `Cache-Control: no-store`
6. Log `console.info("[export]", { userId, projectId, rows })` — counts and ids, no content.

`src/lib/export/project-export.ts` holds the table list and the query builder; the route only does
steps 1–3 and 5.

---

## 4. UI

Dashboard (`src/app/[locale]/(app)/dashboard/page.tsx`): a secondary button **"Projekt exportieren"**
/ **"Export project"** with one line of help — "Alle Daten dieses Projekts als JSON-Datei,
einschließlich gelöschter Einträge." It is a plain `<a href="/api/projects/{projectId}/export">`
styled as a button: the browser sends the cookie, the `Content-Disposition` header triggers the
download, no client JS needed.

The settings area has no index page today, so the dashboard is the only place a researcher already
lands. Errors (429, 413) arrive as a JSON body in a new tab; acceptable for v1 at these frequencies.
Strings: `dashboard.export.{action, help}` in both locales.

---

## 5. Completeness guard

```ts
// src/lib/export/project-export.test.ts
import { Prisma } from "@prisma/client";

const EXCLUDED = { UserProject: "membership, not research data" };

it("exports every model that belongs to a project", () => {
  const models = Prisma.dmmf.datamodel.models;
  const owned = models.filter(
    (m) =>
      m.fields.some((f) => f.name === "project_id") ||
      // children of a project-owned model, e.g. PersonName → Person
      m.fields.some(
        (f) =>
          f.relationFromFields?.length &&
          models.find((p) => p.name === f.type)?.fields.some((pf) => pf.name === "project_id"),
      ),
  );
  for (const m of owned) {
    if (m.name in EXCLUDED) continue;
    expect(EXPORT_TABLES.map((t) => t.model)).toContain(m.name);
  }
});
```

When Epic 3.x adds a project-scoped model, this fails until the export includes it — or until someone
writes down, in `EXCLUDED`, why it should not. That is the compile-time-style guardrail `CLAUDE.md`
prefers to a checklist. **Measured 2026-10-02:** run against today's schema via `tsx`, the predicate selects exactly the
twelve tables of §2 plus `UserProject` — nothing missing, nothing extra. (`Project` itself is not
selected, so it needs no exclusion entry.)

---

## 6. Files

```
src/lib/export/project-export.ts         new — EXPORT_TABLES, buildExport(tx, projectId)
src/lib/export/project-export.test.ts    new — §5 guard + shape tests
src/app/api/projects/[id]/export/route.ts  new
src/lib/api.ts                           + EXPORT_TOO_LARGE
src/app/[locale]/(app)/dashboard/page.tsx  + export button
messages/de.json, messages/en.json       + dashboard.export.*
e2e/export.spec.ts                       new
```

---

## 7. Testing

**Unit (Prisma mocked)**

- Route: anonymous → 401; non-member → 404 with **no** `findMany` called (the check precedes the
  read); soft-deleted project → 404; VIEWER → 200; over 100 000 rows → 413 before any `findMany`;
  headers exactly as §3; rate limit → 429.
- `buildExport`: every `where` contains `project_id` (direct) or the parent relation (children) —
  asserted on the mocked call arguments; output keys and `counts` match.
- §5 guard.
- **Mutation checks:** delete the membership check → the 404 tests fail. Delete the `project_id` from
  one `findMany` → the `where` assertion fails. Add a dummy `project_id` model to the DMMF fixture → the
  guard fails.

**E2E (CI: ephemeral Neon branch, namespaced Redis, production build)**

- Write + read-back: user A creates a person with a year-only birth date and `POSSIBLE` certainty, an
  event, a source with property evidence on the birth date, and a relation; soft-deletes a second
  person. Download the export → parse → the person has `birth_year` set, `birth_month: null`,
  `birth_date_certainty: "POSSIBLE"`; the evidence row is present with its `property`; the deleted
  person is present with `deleted_at` set; `counts` match array lengths.
- **Cross-tenant:** user B, signed in a separate browser context, requests A's export URL → 404, and
  the body contains none of A's ids. B's own export contains none of A's ids either.
- Anonymous request → 401 JSON.
- Edit-mode test: not applicable — nothing is edited. Activity-log test: the export writes no
  `EntityActivity` (it is a read), and the E2E asserts the activity count is unchanged afterwards.

**Preview deployment (E5, before merge; owner-run or owner-approved)** — Preview has no database
env (§0 E5), so:

1. Seed a throwaway project above 5 MB on the **`dev`** branch (`br-falling-resonance-a9xyd5y9`;
   verify with `SELECT current_setting('neon.branch_id')` before writing).
2. `vercel deploy --env DATABASE_URL=… --env DATABASE_URL_UNPOOLED=…` with the **dev** URLs from
   `.env.local` — a preview, never `--prod`.
3. Sign in on the preview as that project's member, download the export, confirm `JSON.parse` succeeds
   and `counts` match. Record size and outcome in the PR; delete the throwaway project.

---

## 8. Acceptance criteria

1. A project member can download the export from the dashboard in one click, in DE and EN.
2. The file contains every table of §2; `counts` equal the array lengths.
3. Soft-deleted persons, events, sources and relations are present with `deleted_at`.
4. Partial dates, certainty values, evidence and activity snapshots are structured JSON, not strings.
5. A signed-in non-member gets 404 and no data; an anonymous caller gets 401.
6. Adding a project-scoped model without exporting it fails the unit suite.
7. A > 5 MB export completes on a Vercel preview deployment (E5), recorded in the PR.
8. Unit and E2E suites pass in CI; #139 closes on merge.

## 9. Out of scope

Everything in Epic 5.1: CSV, GEDCOM or other formats, field selection, filtering, scheduled exports,
import. Export of a whole account across projects (one project per user until Epic 3.1). Members'
names or emails. An audit-log entry for exports (would alter the `AuditAction` enum; the server log
in §3 step 6 suffices for alpha).
