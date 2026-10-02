# Pre-Alpha — Minimal project export — Implementation Plan

> **For agentic workers:** this plan carries no code. Each task names its files, the spec sections it
> implements, the tests written first, and the check that ends it. Tasks run in the order given
> under "Tasks"; T5 may not start before the owner gate G2.

**Goal:** A project member can download everything the project holds as one JSON file; nobody else
can (#139, Pre-Alpha Gate 2 of 5).

**Architecture:** One new route, `GET /api/projects/[id]/export`, which authenticates, rate-limits and
checks membership, then hands a transaction client to `buildExport` in `src/lib/export/`. All reads
finish inside one `REPEATABLE READ` transaction before the response is built; the response stream
only serialises rows already in memory. A dashboard link triggers the download.

**Spec:** `docs/specs/pre-alpha-project-export/specification.md` — referenced by section, not restated.

## Global constraints

- **Read with `prisma`, never `db`.** `db` (`src/lib/db.ts:21–62`) silently adds `deleted_at: null`
  to `findMany`/`findFirst` on person, event, source and relation, which would drop exactly the rows
  X2 requires. `buildExport` will take the transaction client as a parameter and import nothing from
  `@/lib/db`; the route opens the transaction on the bare `prisma` client (`db.ts:5–9`).
- **One 404 for every refusal.** Nonexistent project, non-member, soft-deleted project: same status,
  same body (X3). No project data, and no `$transaction`, before the check passes (§3 step 3).
- **Status is final before the first byte.** 401/404/413/429/503 are decided before the stream
  opens; nothing after `200` can change it.
- **No un-namespaced Redis.** Unit tests mock `@/lib/rate-limit` (house style:
  `src/app/api/auth/register/route.test.ts:29`). Nothing imports `src/lib/redis.ts` directly.
- **No database other than CI's ephemeral branch or `dev`.** E2E DB helpers refuse production via
  `connectGuarded` (`e2e/helpers/db.ts:28`). Agents never deploy to Vercel (see G1).
- **`src/lib/api.ts` `ERROR_CODES` is shared with #29.** Append `EXPORT_TOO_LARGE` only; rebase
  rather than resolve by hand if #29 lands first.

## Load-bearing assumptions

| #   | Premise                                                                                                    | State                                        | Evidence today · method that can observe it false                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | `UserProject` membership is the only read grant, and the route enforces it for every caller (spec E1, E3). | Code: measured. **Runtime: assumed → T6**    | `requireProjectMembership` at `src/lib/api.ts:193–207`; no other grant in `schema.prisma`. Security-relevant, so "assumed" may not stand: **T6's cross-tenant test — two users, two real browser contexts, real sign-in, CI's real Neon branch — measures it, and merge is blocked until it passes in CI.** A unit test with mocked membership cannot observe a missing `where`.                                                                                                                                                         |
| P2  | The spec §5 DMMF predicate selects exactly the twelve tables of §2 plus `UserProject` (spec E2).           | Measured                                     | 2026-10-02, `getDMMF` from `@prisma/internals@6.19.2` on today's `prisma/schema.prisma`, no DB connection: 18 models; predicate selects 13 — `UserProject, Person, PersonName, EventType, Event, Source, Location, Literature, RelationType, Relation, RelationEvidence, PropertyEvidence, EntityActivity`. Method: T3 runs the guard on the generated `Prisma.dmmf`, not a fixture.                                                                                                                                                     |
| P3  | Reading through `prisma` returns soft-deleted rows.                                                        | Measured (code)                              | Only `db` carries the filter (`db.ts:21–62`); `prisma` is unextended (`db.ts:5–9`). Wrong client → X2 fails silently. Method: T3 source assertion that the export module does not reference `db`; T6 soft-deleted person present in a real download.                                                                                                                                                                                                                                                                                     |
| P4  | Every exported value serialises as structured JSON via `JSON.stringify`, and serialising cannot throw.     | Measured (schema)                            | Same DMMF run: scalar types across the 13 models are `String, Int, Boolean, DateTime, Float, Json` and enums — no `BigInt` (would throw), `Decimal` or `Bytes`. Partial dates are `Int?` (`schema.prisma:203–205`). No field-level `@map` (only `@@map`), so Prisma field names equal column names, as X1 requires. Method: T6 parses a real download.                                                                                                                                                                                   |
| P5  | A uniform 404 is new behaviour, not a copy of existing routes.                                             | Measured                                     | List routes answer non-members 403 (`src/app/api/persons/route.ts:49`); `[id]` routes answer 404 for a missing row but 403 for another project's row (`persons/[id]/route.ts:28,36`) — an existence oracle the export must not copy. Method: T4 asserts byte-identical bodies for nonexistent vs non-member vs soft-deleted; T6 repeats it over HTTP.                                                                                                                                                                                    |
| P6  | The route's own `requireUser()` is load-bearing, not redundant.                                            | Measured                                     | Middleware answers anonymous `/api/*` with 401 (`src/auth.config.ts:129–138`), but its matcher skips any path containing a dot (`src/middleware.ts:30`). Project ids are cuids (`schema.prisma:155`), so normal URLs are gated twice; a dotted path reaches the route ungated. Method: T4 unit (anonymous → 401 with middleware absent); T6 anonymous request.                                                                                                                                                                           |
| P7  | `REPEATABLE READ` interactive transactions work through the pooled Neon URL Prisma uses.                   | **Assumed → T6**                             | Interactive transactions already run on the pooled `url` (`src/lib/project.ts:72`, `schema.prisma:9`), but no code sets `isolationLevel` (grep of `src/`: no match). Production-bound. Method: T6 on CI's ephemeral Neon branch, which uses the pooled URL (`ci.yml:209`) — a mock cannot observe this.                                                                                                                                                                                                                                  |
| P8  | The largest realistic project fits in one invocation's memory (spec E4).                                   | Measured (dev)                               | Spec §0 E4: ≈ 0.7 MB on `dev`; 100 000-row cap → 413.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| P9  | A streamed response is not subject to Vercel's buffered response-size limit (spec E5).                     | **Assumed → T2 (owner gate)**                | Production-bound; CI runs `next start`, not Vercel, so cannot observe it. Method: a Vercel **preview**, export > 5 MB (spec §7). Blocks T5.                                                                                                                                                                                                                                                                                                                                                                                              |
| P10 | A preview given only `DATABASE_URL`/`DATABASE_URL_UNPOOLED` (spec §7 step 2) can serve the route at all.   | **Measured false from code; env unmeasured** | `src/lib/env.ts:53–58` parses `AUTH_SECRET`, `AUTH_URL`, `RESEND_*`, `NEXT_PUBLIC_APP_URL` and Redis credentials at module scope and throws if absent; `rateLimitPrefix` throws outside production without `RATELIMIT_NAMESPACE` (`src/lib/rate-limit-key.ts:42–46`), so the limiter fails closed with 503 (`src/lib/rate-limit.ts:53–54,87`). A preview missing any of these fails for reasons unrelated to E5 — a false negative. Which variables Preview already inherits is not measured here (no Vercel CLI in this session). → Q3. |
| P11 | Each E2E user gets its own, distinct project on first sign-in.                                             | Measured (code)                              | `createTestUser` inserts a bare user (`e2e/helpers/db.ts:215`); sign-in provisions a project via `ensureDefaultProject` (`src/auth.ts:132`), which can return `null` (`src/lib/project.ts:59–66`). If both users ended up with no or the same project, the cross-tenant test would pass vacuously — so T6 asserts two distinct non-null project ids first.                                                                                                                                                                               |

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
  becomes false the moment the export calls it → Q6.

Test scope: new unit tests, `src/test/pages/app-pages.test.tsx`, full `pnpm test` (cheap), `pnpm
typecheck`, `pnpm lint`, `e2e/export.spec.ts`, `e2e/smoke.spec.ts`. CI's full E2E run is the merge
gate. Depth over breadth: the risk is one route returning every row, so method matters more than
count — see the method column above. Per assumption: P1, P3, P4, P7, P11 by **real browser contexts
with real sessions against a real Neon branch**; P2 by the **generated DMMF**; P5, P6 by unit and
HTTP; P9 by a **Vercel preview**, never local `next start`.

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

T1 is this plan. Order: **T3 → T4 → T2 (G1, G2) → T5 → T6 → T7.** T6's API-level tests may be
written alongside T4; its download-via-button test needs T5. This differs from the brief's table
(T2 depending only on the owner): the spec §7 procedure exports through the real route, so T4 must
exist on a branch first — unless the owner picks the probe option in Q4.

### T3 — Export module (Sonnet)

- **Implements:** spec §2 (shape, ordering `created_at, id`), §3 step 4 (counts, 100 000-row cap,
  per-table `where`), §5, X1, X2, X5, X6.
- **Depends on:** T1 approved.
- **Tests first:** (1) §5 guard over the generated `Prisma.dmmf`; (2) on a mocked `tx`, every direct
  table's `findMany` `where` has `project_id: id`, `person_names` filters through `person`,
  `relation_evidence` through `relation`, every call orders by `created_at, id`; (3) total > 100 000
  → too-large result and **no** `findMany` called; (4) output keys equal §2 and `counts` equal array
  lengths; (5) the module's source never references `db` from `@/lib/db` (P3); (6) no query
  `include`s a `User` relation (X5).
- **Acceptance:** confirm each test fails before the module exists, then `pnpm test`, `pnpm typecheck`.

### T4 — Route and error code (Sonnet)

- **Implements:** spec §3 steps 1–3, 5, 6; X3, X4 (opening the transaction with
  `isolationLevel: "RepeatableRead", timeout: 20_000`), X7.
- **Depends on:** T3. Coordinate `src/lib/api.ts` with #29.
- **Tests first** (spec §7 route list, plus): anonymous → 401 with no membership query (P6);
  nonexistent, non-member and soft-deleted project → 404 with **identical bodies** and no
  `$transaction` call (P5); the transaction is opened on `prisma` with the X4 options; VIEWER → 200; rate-limit key `export:{userId}` → 429; 413 before any
  `findMany`; headers exactly §3 step 5, including the slug fallback `projekt` for a name with no
  ASCII letters; the log line carries ids and counts only.
- **Acceptance:** `pnpm test`, `pnpm typecheck`, `pnpm lint`; a local `pnpm build && pnpm start`
  request with a real session returns a parseable file.

### T2 — E5 measurement on a preview (Sonnet prepares; **owner runs or approves** — G1)

- **Implements:** spec §7 "Preview deployment", acceptance criterion 7.
- **Depends on:** T4 on a pushed branch; Q3 answered.
- **Preparation an agent may do:** list the exact variable set the preview needs (P10) without
  values, and the dev-branch seed procedure from spec §7 step 1, including the
  `SELECT current_setting('neon.branch_id')` check.
- **Acceptance:** export > 5 MB downloads on the preview, `JSON.parse` succeeds, `counts` match;
  size and outcome recorded in the PR; throwaway project deleted. **Gate G2:** owner signs off
  before T5 starts. If it fails, T5 does not start and Q5 goes to the owner.

### T5 — Dashboard link and strings (Haiku)

- **Implements:** spec §4; acceptance criterion 1.
- **Depends on:** T4, G2, Q1, Q2.
- **Tests first:** extend `src/test/pages/app-pages.test.tsx` with an assertion that the dashboard
  renders an `<a>` to `/api/projects/{id}/export`; the strings exist in both locales.
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
  (T4 404 tests, T6 cross-tenant); drop `project_id` from one `findMany` (T3 `where` test); swap
  `prisma` for `db` in the export path (T3 source test **and** T6 soft-deleted assertion); make the
  non-member body differ from the nonexistent body (T4, T6); add a `project_id` model to a DMMF copy
  (§5 guard); remove `isolationLevel` (T4 transaction-options assertion).
- **Method:** review the branch, not the tasks — run T6 against `pnpm build && pnpm start`, and read
  the route top to bottom for any read before the membership check. Record each mutation and its
  failing test in the PR.

## Owner-only gates — agents must not perform these

- **G1 — E5 preview run.** Deploying a preview with dev credentials, seeding `dev`, and signing in
  there. Never `--prod`, never production's `DATABASE_URL`, branch identity verified by
  `neon.branch_id`, not by name. Agents prepare (T2) and stop.
- **G2 — E5 sign-off,** and the fallback decision (Q5) if it fails. Gates T5.
- **G3 — Approval of this plan PR** before T3 starts.

## Open questions for review

1. **Message namespace.** Spec §4 says `dashboard.export.*`, but the page reads `auth.dashboard`
   (`page.tsx:8`) and `messages/*.json` have no top-level `dashboard`. Nest under `auth.dashboard`,
   or create `dashboard`?
2. **No active project.** `session.user.projectId` can be absent (`project.ts:59–66`). Hide the
   button, or render it disabled with a reason? Spec §4 is silent.
3. **Preview environment (P10).** Spec §7 passes only the two database URLs. Which of `AUTH_SECRET`,
   `AUTH_URL`, Redis credentials, `RESEND_*`, `NEXT_PUBLIC_APP_URL` does Preview already inherit, and
   which `CACHE_NAMESPACE`/`RATELIMIT_NAMESPACE` values should it use? Without the namespaces the
   route answers 503, and a sign-out on the preview writes an un-namespaced revocation key to the
   shared Upstash instance (`src/lib/session-revocation-key.ts:52–54`).
4. **Order of T2.** Spec §7 measures through the real route (needs T3 + T4 deployed). Alternative: a
   throwaway, never-merged probe route that streams > 5 MB of synthetic JSON, which measures E5 with
   no database credentials on the preview and before T3 — leaving spec §7 as the final acceptance
   run. Owner's choice.
5. **If E5 fails.** Candidates, not decided: a short-lived Blob-hosted file (spec E5's suggestion);
   a lower row cap that keeps the file under the buffered limit; a split export. Each changes §3.
6. **Fail-closed limiter on the exit route.** `checkRateLimit` denies on Redis outage
   (`rate-limit.ts:36–41`), a choice argued for auth routes. For the one route that returns a
   researcher's data, is 503 during an Upstash outage acceptable? Either way the doc comment needs
   correcting in T4.
7. **Timeouts.** Spec sets a 20 s transaction timeout but no route `maxDuration`, and the stream
   continues after the transaction. A truncated file after a `200` is detectable only via `counts`.
   Set `maxDuration` explicitly, and is a truncated download acceptable in v1?
