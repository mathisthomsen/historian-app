# Pre-Alpha — Minimal project export — Implementation Plan

> **For agentic workers:** this plan carries no code. Each task names its files, the spec sections it
> implements, the tests written first, and the check that ends it. Tasks run in the order given
> under "Tasks"; T3 may not start before the owner gate G2 (E5 measured).

**Goal:** A project member can download everything the project holds as one JSON file; nobody else
can (#139, Pre-Alpha Gate 2 of 5).

**Architecture:** One new route, `GET /api/projects/[id]/export`, which authenticates, rate-limits and
checks membership, then hands a transaction client to `buildExport` in `src/lib/export/`. All reads
finish inside one `REPEATABLE READ` transaction; the complete document is then serialised to bytes
**before** the `Response` is built, and those finished bytes are streamed with `Content-Length` (D7).
A dashboard link triggers the download.

**Spec:** `docs/specs/pre-alpha-project-export/specification.md` — referenced by section, not restated.

## Global constraints

- **Read with `prisma`, never `db`.** `db` (`src/lib/db.ts:21–62`) silently adds `deleted_at: null`
  to `findMany`/`findFirst` on person, event, source and relation, which would drop exactly the rows
  X2 requires. `buildExport` will take the transaction client as a parameter and import nothing from
  `@/lib/db`; the route opens the transaction on the bare `prisma` client (`db.ts:5–9`).
- **One 404 for every refusal.** Nonexistent project, non-member, soft-deleted project: same status,
  same body (X3). No project data, and no `$transaction`, before the check passes (§3 step 3).
- **Status is final before the first byte, and no failure in our code can follow a `200`.**
  401/404/413/429/5xx are decided before the status line is sent: the document is fully serialised
  first (D7). Only a network or platform failure can truncate a `200`, and that shows as a short body
  against `Content-Length` and invalid JSON.
- **No un-namespaced Redis.** Unit tests mock `@/lib/rate-limit` (house style:
  `src/app/api/auth/register/route.test.ts:29`). Nothing imports `src/lib/redis.ts` directly.
- **No database other than CI's ephemeral branch or `dev`.** E2E DB helpers refuse production via
  `connectGuarded` (`e2e/helpers/db.ts:28`). Agents never deploy to Vercel (see G1).
- **`src/lib/api.ts` `ERROR_CODES` is shared with #29.** Append `EXPORT_TOO_LARGE` only; rebase
  rather than resolve by hand if #29 lands first.

## Load-bearing assumptions

| #   | Premise                                                                                                    | State                                     | Evidence today · method that can observe it false                                                                                                                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P1  | `UserProject` membership is the only read grant, and the route enforces it for every caller (spec E1, E3). | Code: measured. **Runtime: assumed → T6** | `requireProjectMembership` at `src/lib/api.ts:193–207`; no other grant in `schema.prisma`. Security-relevant, so "assumed" may not stand: **T6's cross-tenant test — two users, two real browser contexts, real sign-in, CI's real Neon branch — measures it, and merge is blocked until it passes in CI.** A unit test with mocked membership cannot observe a missing `where`.     |
| P2  | The spec §5 DMMF predicate selects exactly the twelve tables of §2 plus `UserProject` (spec E2).           | Measured                                  | 2026-10-02, `getDMMF` from `@prisma/internals@6.19.2` on today's `prisma/schema.prisma`, no DB connection: 18 models; predicate selects 13 — `UserProject, Person, PersonName, EventType, Event, Source, Location, Literature, RelationType, Relation, RelationEvidence, PropertyEvidence, EntityActivity`. Method: T3 runs the guard on the generated `Prisma.dmmf`, not a fixture. |
| P3  | Reading through `prisma` returns soft-deleted rows.                                                        | Measured (code)                           | Only `db` carries the filter (`db.ts:21–62`); `prisma` is unextended (`db.ts:5–9`). Wrong client → X2 fails silently. Method: T3 source assertion that the export module does not reference `db`; T6 soft-deleted person present in a real download.                                                                                                                                 |
| P4  | Every exported value serialises as structured JSON via `JSON.stringify`, and serialising cannot throw.     | Measured (schema)                         | Same DMMF run: scalar types across the 13 models are `String, Int, Boolean, DateTime, Float, Json` and enums — no `BigInt` (would throw), `Decimal` or `Bytes`. Partial dates are `Int?` (`schema.prisma:203–205`). No field-level `@map` (only `@@map`), so Prisma field names equal column names, as X1 requires. Method: T6 parses a real download.                               |
| P5  | A uniform 404 is new behaviour, not a copy of existing routes.                                             | Measured                                  | Existing project-scoped routes do not use one uniform refusal for every case (tracked in #144; class, impact and fix only there). The export will not copy them. Method: T4 asserts byte-identical bodies for nonexistent vs non-member vs soft-deleted; T6 repeats it over HTTP.                                                                                                    |
| P6  | The route's own `requireUser()` is load-bearing, not redundant.                                            | Measured                                  | Middleware answers anonymous `/api/*` with 401 (`src/auth.config.ts:129–138`), but its matcher skips any path containing a dot (`src/middleware.ts:30`). Project ids are cuids (`schema.prisma:155`), so normal URLs are gated twice; a dotted path reaches the route ungated. Method: T4 unit (anonymous → 401 with middleware absent); T6 anonymous request.                       |
| P7  | `REPEATABLE READ` interactive transactions work through the pooled Neon URL Prisma uses.                   | **Assumed → T6**                          | Interactive transactions already run on the pooled `url` (`src/lib/project.ts:72`, `schema.prisma:9`), but no code sets `isolationLevel` (grep of `src/`: no match). Production-bound. Method: T6 on CI's ephemeral Neon branch, which uses the pooled URL (`ci.yml:209`) — a mock cannot observe this.                                                                              |
| P8  | The largest realistic project fits in one invocation's memory (spec E4).                                   | Measured (dev)                            | Spec §0 E4: ≈ 0.7 MB on `dev`; 100 000-row cap → 413.                                                                                                                                                                                                                                                                                                                                |
| P9  | A streamed response is not subject to Vercel's buffered response-size limit (spec E5).                     | **Assumed → T2 (owner gate)**             | Production-bound; CI runs `next start`, not Vercel, so cannot observe it. Method (D4): a synthetic probe on a **non-promoted production deployment** (`vercel deploy --prod --skip-domain`) — real Vercel runtime, complete production env, never served on `evidoxa.com`, no database read. Blocks T3.                                                                              |
| P10 | Vercel Preview can serve the app.                                                                          | **Measured false**                        | Owner, 2026-10-02 (D3): `vercel env ls preview` lacks `AUTH_SECRET`, `DATABASE_URL*`, `RATELIMIT_NAMESPACE`, `CACHE_NAMESPACE`; `src/lib/env.ts:52–54` throws at module load; one preview deployment ever (2025-07-07). Consequence: Preview is **not used** by this plan; spec §7's preview procedure is replaced by the D4 probe.                                                  |
| P11 | Each E2E user gets its own, distinct project on first sign-in.                                             | Measured (code)                           | `createTestUser` inserts a bare user (`e2e/helpers/db.ts:215`); sign-in provisions a project via `ensureDefaultProject` (`src/auth.ts:132`), which can return `null` (`src/lib/project.ts:59–66`). If both users ended up with no or the same project, the cross-tenant test would pass vacuously — so T6 asserts two distinct non-null project ids first.                           |

## Blast radius and test scope

No cross-cutting gate changes: `src/auth.config.ts`, `src/middleware.ts`, `src/lib/db.ts`, every
layout and every existing route stay untouched. The new path inherits the existing `/api/*` gate
(P6). Shared files touched beyond new ones:

- `src/lib/api.ts` — one appended `ERROR_CODES` entry. Measured: no exhaustive consumer of the list
  outside `api.ts` (grep of `src/`, `messages/`).
- `src/app/[locale]/(app)/dashboard/page.tsx` — its source is read by `src/test/pages/app-pages.test.tsx:224,296`,
  and `e2e/smoke.spec.ts:138` asserts the dashboard after login.
- `messages/{de,en}.json` — read by several component tests (`src/test/render.tsx`).
- `src/lib/rate-limit.ts` — not edited, but its doc comment ("Every caller is an auth route", `:36–41`)
  becomes false the moment the export calls it → D6.

Test scope: new unit tests, `src/test/pages/app-pages.test.tsx`, full `pnpm test` (cheap), `pnpm
typecheck`, `pnpm lint`, `e2e/export.spec.ts`, `e2e/smoke.spec.ts`. CI's full E2E run is the merge
gate. Depth over breadth: the risk is one route returning every row, so method matters more than
count — see the method column above. Per assumption: P1, P3, P4, P7, P11 by **real browser contexts
with real sessions against a real Neon branch**; P2 by the **generated DMMF**; P5, P6 by unit and
HTTP; P9 by a **non-promoted production deployment on Vercel** (D4), never local `next start`.

## File structure

| Path                                                                 | Responsibility                                         | Task |
| -------------------------------------------------------------------- | ------------------------------------------------------ | ---- |
| `src/lib/export/project-export.ts`                                   | `EXPORT_TABLES`, count + cap, `buildExport(tx, id)`    | T3   |
| `src/lib/export/project-export.test.ts`                              | §5 guard, `where`/`orderBy`/shape tests, no-`db` check | T3   |
| `src/app/api/projects/[id]/export/route.ts`                          | §3 steps 1–3, 5, 6                                     | T4   |
| `src/app/api/projects/[id]/export/route.test.ts`                     | spec §7 route unit list + uniform-404                  | T4   |
| `src/lib/api.ts`                                                     | `EXPORT_TOO_LARGE`                                     | T4   |
| `src/app/[locale]/(app)/dashboard/page.tsx`, `messages/{de,en}.json` | link-button + strings (§4)                             | T5   |
| `e2e/export.spec.ts`                                                 | write → export → read back; cross-tenant; anonymous    | T6   |

## Tasks

T1 is this plan. Order: **T2 (G1, G2) → T3 → T4 → T5 → T6 → T7** (D4: the E5 result decides the
design, so it is measured before the design is built). T6's API-level tests may be written alongside
T4; its download-via-button test needs T5.

### T3 — Export module (Sonnet)

- **Implements:** spec §2 (shape, ordering `created_at, id`), §3 step 4 (counts, 100 000-row cap,
  per-table `where`), §5, X1, X2, X5, X6.
- **Depends on:** T1 approved; G2 (the row cap is 100 000 if E5 passes, lowered per D5 if not).
- **Tests first:** (1) §5 guard over the generated `Prisma.dmmf`; (2) on a mocked `tx`, every direct
  table's `findMany` `where` has `project_id: id`, `person_names` filters through `person`,
  `relation_evidence` through `relation`, every call orders by `created_at, id`; (2b) every `count` call carries the same scope as its
  `findMany` — `project_id: id` on direct tables, the `person` / `relation` parent filter on
  `person_names` / `relation_evidence` — so an unscoped count cannot sum other tenants' rows into
  the cap; (3) total > 100 000
  → too-large result and **no** `findMany` called; (4) output keys equal §2 and `counts` equal array
  lengths; (5) the module's source never references `db` from `@/lib/db` (P3); (6) no query
  `include`s a `User` relation (X5).
- **Acceptance:** confirm each test fails before the module exists, then `pnpm test`, `pnpm typecheck`.

### T4 — Route and error code (Sonnet)

- **Implements:** spec §3 steps 1–3, 5, 6; X3, X4 (opening the transaction with
  `isolationLevel: "RepeatableRead", timeout: 20_000`), X7; D6, D7. **Amends spec §3** in the same
  PR so `main` matches the code: step 5 becomes "serialise fully, then stream with
  `Content-Length`" (D7), the limiter is degraded-open (D6), `export const maxDuration = 60`.
- **Depends on:** T3. Coordinate `src/lib/api.ts` with #29.
- **Tests first** (spec §7 route list, plus): anonymous → 401 with no membership query (P6);
  nonexistent, non-member and soft-deleted project → 404 with **identical bodies** and no
  `$transaction` call (P5); the transaction is opened on `prisma` with the X4 options; `buildExport` is called **inside**
  the callback with the callback's `tx` object (identity, not just "a client") — the snapshot
  guarantee holds only then; VIEWER → 200; rate-limit key `export:{userId}` → 429 when
  `!allowed && !degraded`; **degraded limiter → request proceeds with 200** and one `console.warn`
  carrying `userId`, `projectId` (D6 — the route calls `rateLimiter.check()` directly;
  `checkRateLimit`, shared with the auth routes, is unchanged); a serialisation failure → 5xx, never a
  `200` (D7); the response carries `Content-Length` equal to the body's byte length; 413 before any
  `findMany`, with the D5 "contact the operator" message; headers exactly §3 step 5, including the slug fallback `projekt` for a name with no
  ASCII letters; the log line carries ids and counts only.
- **Acceptance:** `pnpm test`, `pnpm typecheck`, `pnpm lint`; a local `pnpm build && pnpm start`
  request with a real session returns a parseable file.

### T2 — E5 synthetic probe (Sonnet prepares; **owner approves and runs** — G1)

- **Implements:** D4; replaces spec §7 "Preview deployment" (P10). Acceptance criterion 7.
- **Depends on:** T1 approved.
- **An agent prepares, on a throwaway branch that is never merged and never PR'd to `main`:** one route
  handler that reads no database and imports nothing from `src/lib`, with two variants — (1) ~12 MB of
  generated JSON serialised first, then returned as a `ReadableStream` with `Content-Length` (the D7
  shape); (2) the same body as a plain buffered `Response`. Plus the exact commands for the owner:
  `vercel deploy --prod --skip-domain` from that branch, fetching both variants from the deployment URL
  (`vercel curl` if deployment protection blocks), byte-count and `JSON.parse` checks, and deleting the
  deployment. The agent stops there — this session holds no Vercel credentials, and a production-target
  deploy needs the owner's approval even when never promoted.
- **Acceptance:** both variants' byte counts and parse results recorded on #139; deployment deleted;
  branch deleted. **Gate G2:** owner signs off before T3. If variant 1 fails, D5 applies.

### T5 — Dashboard link and strings (Haiku)

- **Implements:** spec §4; acceptance criterion 1.
- **Depends on:** T4. Strings under **`auth.dashboard.export.*`** (D1); **amends spec §4** to match.
- **No active project (D2):** render no link; render one line telling the user their project could
  not be loaded and to reload the page — which retries provisioning (see D2). No create or select
  flow (Epic 3.1).
- **Tests first:** extend `src/test/pages/app-pages.test.tsx` with an assertion that the dashboard
  renders an `<a>` to `/api/projects/{id}/export`, and the retry line instead when `projectId` is
  absent; the strings exist in both locales.
- **Acceptance:** existing `DS-PAGE-FILE-01/15` still pass; `pnpm test`, `pnpm lint`.

### T6 — E2E (Sonnet)

- **Implements:** spec §7 E2E list; acceptance criteria 1–5. Measures P1, P3, P4, P7, P11.
- **Depends on:** T4 (API tests), T5 (button test). Runs in CI on the ephemeral branch with
  `CACHE_NAMESPACE`/`RATELIMIT_NAMESPACE` set (`ci.yml:91,99`).
- **Write first:** two users via `createTestUser`, each signed in through the login form in its own
  `browser.newContext()`; assert two distinct non-null project ids (P11). A seeds data through its
  own session (spec §7 list) and soft-deletes one person. Then: A's download parses with partial
  date, certainty, evidence and the soft-deleted row as specified; B requesting A's URL gets 404 whose
  body contains none of A's ids and equals the body for a random id; B's own export contains none
  of A's ids; anonymous → 401; `EntityActivity` count unchanged; the button downloads in DE and EN
  (`page.waitForEvent("download")`).
- **Acceptance:** green in CI. **Merge is blocked until the cross-tenant test passes in CI.**

### T7 — Whole-branch review and mutation checks (Opus)

- **Depends on:** T6.
- **Mutations — each must turn a named test red, then be reverted:** delete the membership check
  (T4 404 tests, T6 cross-tenant); drop `project_id` from one `findMany` (T3 `where` test); drop the scope from one `count` (T3
  test 2b); pass global `prisma` instead of `tx` to `buildExport`, or call it after the callback
  returns (T4 `tx`-identity test); swap
  `prisma` for `db` in the export path (T3 source test **and** T6 soft-deleted assertion); make the
  non-member body differ from the nonexistent body (T4, T6); add a `project_id` model to a DMMF copy
  (§5 guard); remove `isolationLevel` (T4 transaction-options assertion); make the degraded limiter
  return 429/503 (T4 degraded-path test); build the `Response` before serialisation finishes, or
  drop `Content-Length` (T4 serialisation-failure and header tests).
- **Method:** review the branch, not the tasks — run T6 against `pnpm build && pnpm start`, and read
  the route top to bottom for any read before the membership check. Record each mutation and its
  failing test in the PR.

## Owner-only gates — agents must not perform these

- **G1 — E5 probe deployment** (D4): approving and running the non-promoted
  `vercel deploy --prod --skip-domain` of the throwaway probe branch, fetching both variants, and
  deleting the deployment. Agents prepare (T2) and stop.
- **G2 — E5 sign-off.** Gates T3. If variant 1 fails, D5 applies without a further decision.
- **G3 — Approval of this plan PR** before T3 starts.

## Decisions (owner, 2026-10-02, [#139 comment](https://github.com/mathisthomsen/historian-app/issues/139#issuecomment-5955493197))

The open questions of the first revision, answered. Spec amendments they imply ship in the
implementing PR, not here.

- **D1 — Message keys:** `auth.dashboard.export.*`; spec §4's `dashboard.export.*` was an error (T5).
- **D2 — No active project:** the owner asked whether a "Create my first project" / "Select active
  project" button fits better than hiding or disabling. Measured for this plan: the state is reachable
  only when default-project provisioning fails on a database error — users with only VIEWER
  memberships get their own project (`src/lib/project.ts:19–25,66–90`), and every session read retries
  provisioning (`src/auth.ts:157` → `attachProjectId`). So it is a transient error, not an onboarding
  state, and a create/select flow would need the Epic 3.1 project UI. Proposed: a one-line "could not
  load your project — reload to retry" message in place of the link (T5). **Awaiting owner
  confirmation.**
- **D3 — Preview:** not used; Preview cannot run the app as configured (P10).
- **D4 — E5:** a synthetic probe before T3, on a non-promoted production deployment, owner-approved (T2).
- **D5 — If E5 fails:** lower the row cap to fit the measured limit (at ~500 B/row a 4.5 MB ceiling is
  ~9 000 rows, ~6× the largest real project); the `413 EXPORT_TOO_LARGE` message tells the researcher
  to contact the operator; file an issue for a Blob-hosted export. No Blob or split export in v1.
- **D6 — Redis down:** the export proceeds and logs; it does not return 503. The limit guards cost,
  the membership check is the security boundary, and session revocation already fails open
  (`session-revocation.ts:140–142`). `checkRateLimit` stays fail-closed for the auth routes (T4).
- **D7 — Truncation:** `maxDuration = 60`; serialise the complete document first, then stream the
  finished bytes with `Content-Length`, so no failure in our code can follow a `200` (T4).
