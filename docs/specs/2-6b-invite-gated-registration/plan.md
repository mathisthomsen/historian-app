# Epic 2.6 Part B — Invite-gated registration — Implementation Plan

> **For agentic workers:** this plan describes tasks, not code. Each task is TDD: write the
> listed tests, run them, watch them fail for the stated reason, then implement. A test that
> passes before the implementation exists is testing something else — fix the test.

**Goal:** Close public self-service registration. An account will be creatable only through a
single-use, email-bound invite issued when an operator approves an access request (#29).

**Spec (the contract):** `docs/specs/2-6b-invite-gated-registration/specification.md`. This plan
references its sections (`§n`) and does not restate them. Rejected options: `brainstorming.md`.

**Shape:** two additive tables (§3); four new routes or pages (§4.1, §4.4–§4.6); the register
route becomes a gate (§4.3); `authorized()` gains two exact-match allows and one gated prefix.

## Global constraints

- **Public repository.** No reproduction of any unfixed defect in a commit, comment, test name or
  doc. Class, impact and fix only (`CLAUDE.md` § "Security findings in a public repo").
- **One integration branch, one PR to `main`.** The spec assumes a single merge: the copy flip
  lands "in this PR" (§6.1) and "merging closes the only way in" (§10). T2–T9 land as commits or
  sub-PRs on one branch (name: orchestrator's choice); only T10's reviewed result goes to `main`.
- **Every task leaves the branch green** — unit and E2E. The task that breaks an existing test
  fixes it in the same task (see T5, T6). This moves part of the brief's T9 into T5.
- **No production access.** Agents never connect to the production Neon branch or production
  Redis. Any local DB work is guarded by `SELECT current_setting('neon.branch_id')` ≠
  `br-old-grass-a9acitgb` (`e2e/helpers/guard.ts:22`).
- **Unit tests mock Prisma, Redis and email.** The `pnpm test` CI job holds real Upstash
  credentials and no namespace (`ci.yml:56–59`); `src/lib/redis.ts:5` is a raw client that does
  not namespace. A unit test that reaches it writes to production's key space.
- `pnpm` only. No Haiku on T3–T8. Review-fix rounds are bounded at two (`CLAUDE.md`).

---

## 1. Load-bearing assumptions

State: **M** = measured today (evidence beside it), **M\*** = measured by an earlier session and
not re-measured here (why given), **A** = assumed. Spec premises keep their spec ids (A1–A8).

| #   | Premise                                                                                                           | State | Evidence                                                                                                                                                                                                                                       | Method that could observe it false                                                                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | A verified `ADMIN` exists in production                                                                           | **A** | Owner-reported 2026-10-02 (#29 comment); no agent has measured it                                                                                                                                                                              | Owner's guarded SQL (§10.1). **Merge gate**, owner-only (§4 below)                                                                                                           |
| A2  | The session `role` is stale; only a DB read is current                                                            | M     | `src/auth.config.ts:43–45` writes `token.role` only inside `if (user)`; `:102` copies it to the session; `src/auth.ts:138` sets it only from `authorize()`                                                                                     | E2E, **real browser session**, promote/demote in DB without re-login (T9). A mocked session cannot observe staleness                                                         |
| A3  | Anonymous `/api/*` gets 401 JSON; only `/api/auth*` (prefix) and `/api/health` (exact) pass                       | M     | `src/auth.config.ts:129–139`. `PUBLIC_PATHS` no longer exists; `/auth/register` (page) is public because `auth` is not in `GATED_PREFIXES` (`:21–28`, `:144–145`). `/api/auth/register` is public via the `/api/auth` prefix                   | Unit (T4); `curl` against `pnpm build && pnpm start` (T4); E2E A3 (T9)                                                                                                       |
| A4  | Session cookie is `SameSite=Lax`                                                                                  | M     | `@auth/core@0.41.3` `lib/utils/cookie.js:48–52`: `sessionToken` defaults to `sameSite: "lax"`; `src/auth.ts`/`src/auth.config.ts` set no `cookies` override (grep, 2026-10-02, orchestrator session)                                           | E2E reads the cookie from a real browser context (T9) — confirms the deployed behaviour, not just the default                                                                |
| P1  | The JSON-body half of §4.5's CSRF argument holds                                                                  | **A** | Only if the route rejects non-JSON content types: `text/plain` is CORS-safelisted, and the existing pattern `request.json()` parses any body (`src/app/api/auth/register/route.ts:42–46`). Lax (A4) is unaffected                              | Unit (T7): a `text/plain` body with valid JSON text is refused. See open question Q3                                                                                         |
| A5  | `User.email` is unique — the hard backstop against double redemption                                              | M     | `prisma/schema.prisma:79`                                                                                                                                                                                                                      | E2E: two parallel registers, one invite, ephemeral branch (T9)                                                                                                               |
| P2  | A conditional `UPDATE … WHERE used_at IS NULL` re-checks its predicate after a concurrent commit (READ COMMITTED) | **A** | Documented Postgres behaviour; not measured. If false, A5 still prevents a second account, but the loser fails at the constraint instead of a clean `INVITE_USED`                                                                              | Two-connection SQL test on a real Neon branch: A holds the row in an open transaction, B's update blocks, A commits, B reports 0 rows. **Measured in T5 before §4.3 step 7** |
| P3  | Interactive transactions work through the app's Prisma client in production                                       | M     | `src/lib/project.ts:72` runs `prisma.$transaction(async (tx) => …)` at a project-less user's first sign-in (`src/auth.ts:132`)                                                                                                                 | E2E success path in CI (T5, T9)                                                                                                                                              |
| P4  | Invite tokens are 256-bit; only a SHA-256 hash is stored                                                          | M     | `src/lib/security.ts:3–9` (`randomBytes(32)`, SHA-256 hex) — the `EmailConfirmation` pattern (`schema.prisma`, `token_hash @unique`)                                                                                                           | Unit (T3): stored value ≠ raw; lookup is by hash                                                                                                                             |
| P5  | Rate limiting is the register route's first step                                                                  | M     | `route.ts:34–39`; SEC-05 (`e2e/security.spec.ts:63–93`) depends on it                                                                                                                                                                          | Unit call order (T5); SEC-05 in CI                                                                                                                                           |
| P6  | Rate-limit keys are namespaced in CI and refused un-namespaced outside production                                 | M     | `src/lib/rate-limit-key.ts:42–54`; `ci.yml:91,99`; `resetRateLimits()` clears `{prefix}:*` (`e2e/helpers/db.ts:169–205`), so new `access-request:*` keys are covered                                                                           | E2E **real Redis round trip with `RATELIMIT_NAMESPACE` set** (T6, T9). Never a real-Redis unit test                                                                          |
| A7  | CI E2E is isolated: ephemeral branch, namespaced Redis, production build, email stub                              | M     | `ci.yml:154` (branch), `:91,99` (namespaces), `:108` (stub), `:257` (`pnpm build`); `playwright.config.ts:73` (`pnpm start` in CI), `:54` (`workers: 1`)                                                                                       | — (this is the method). Consequence: fixtures insert invites; no test reads a token from mail                                                                                |
| P7  | The email stub cannot run on a deployment                                                                         | M     | `src/lib/email.ts:14–20` throws when `VERCEL` is set or `AUTH_URL` is not localhost                                                                                                                                                            | Existing `email.test.ts`                                                                                                                                                     |
| P8  | Sanitized stranger text is inert when interpolated into the operator email's HTML                                 | **A** | `sanitize()` is `sanitize-html` with no allowed tags (`src/lib/sanitize.ts:8–10`); that it also entity-escapes text is expected, not measured. Security-relevant: a stranger's text in mail sent from our domain                               | Unit (T3) with the **real** `sanitize` (not mocked): tag, attribute and quote payloads yield no markup. **T6 blocked** until it passes                                       |
| P9  | "Production" for the `PURGE_SECRET` requirement means `VERCEL_ENV === "production"`                               | M     | `src/lib/env.ts:52–55` parses at module scope; `NODE_ENV` is `production` under CI's `pnpm start` and on previews (`src/lib/deployment-env.ts:1–30`). A `NODE_ENV` rule would fail every CI boot and preview — inferred from the code, not run | Unit env test (T8); CI E2E boots (T8)                                                                                                                                        |
| P10 | `PURGE_SECRET` exists in Vercel Production and GitHub Actions                                                     | M\*   | #29 comment 2026-10-02 13:08 (`vercel env ls production`, `gh secret list`). Not re-measured: `gh secret list` returns HTTP 403 through this session's proxy                                                                                   | Post-merge `workflow_dispatch` run returns 200 with counts (§5)                                                                                                              |
| A8  | An hourly GitHub schedule bounds physical deletion                                                                | **A** | Hobby plan measured (spec A8). GitHub documents delayed runs under load, and that scheduled workflows in a **public** repo are disabled after 60 days without repository activity — documented, not measured                                   | Workflow run log. Not a correctness premise: read-time expiry (I6) is the guarantee                                                                                          |
| A6  | Invite mail reaches an inbox                                                                                      | M\*   | #13 closed as fixed 2026-10-02 (SPF on a mistyped host; the closing comment quotes the `dig` result). Not re-measured: no DNS tooling here, DNS-over-HTTPS blocked by the proxy                                                                | §10.2: the operator's first approval goes to an address they control (owner)                                                                                                 |
| P11 | The seed admin is `ADMIN` + verified, and re-seeding does not reset `role`                                        | M     | `prisma/seed.ts:137–152` (`update` omits `role`)                                                                                                                                                                                               | — Consequence: E2E may read with the seed admin but must **never demote it**; A2 uses its own `createTestUser` account                                                       |

Every **A** that is security-relevant (A1, P1, P2, P8) names the task that measures it and what
stays blocked until then. P10 is **M\*** and is re-observed by the named method.

## 2. Blast radius and test scope

**This change edits `authorized()` — the gate on every request — and the only route that creates
users. Test scope is the whole unit suite and the whole E2E suite, in CI (production build,
ephemeral Neon branch, namespaced Redis, email stub), plus a real-browser pass in T10.** Not the
diff.

Beyond the touched files (spec §0b, plus what this plan's measurement found):

| Affected                                                                                                                                                                                    | Why                                                                                                  | Owner task |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------- |
| Every anonymous request; `e2e/smoke.spec.ts` anonymous-404                                                                                                                                  | `authorized()` changes; a prefix-shaped allow would open sibling paths                               | T4         |
| Every `(app)` page                                                                                                                                                                          | `auth-config.test.ts:215–228` fails if an `(app)` dir is missing from `GATED_PREFIXES` → T7 after T4 | T4, T7     |
| TC-AUTH-02/-03/-04/-05/-06/-19 (`e2e/auth.spec.ts`), SEC-05 (`e2e/security.spec.ts`)                                                                                                        | Register needs an invite; SEC-05 must still see 429 on call 11                                       | T5         |
| `RegisterForm.test.tsx`, `src/test/{verification-resend,auth-failure-states,validation-messages}.test.tsx`, `src/test/pages/auth-pages.test.tsx`, `src/app/api/auth/register/route.test.ts` | Render or call the register form/route without an invite                                             | T5         |
| `src/components/auth/LoginForm.tsx:167`                                                                                                                                                     | Links to `/auth/register`; not covered by §6.1 (Q2)                                                  | T5         |
| `Hero.test.tsx`, `PublicNav.test.tsx`, `marketing-bands.test.tsx`, `e2e/marketing.spec.ts:128–132` ("hero CTA goes to registration")                                                        | CTA flip and `CtaBand` deletion                                                                      | T6         |
| Every process boot (CI, preview, local)                                                                                                                                                     | `env.ts` parses at module scope (P9)                                                                 | T8         |

## 3. Invariants and the test that proves each

| #   | Invariant                                                                                                                                                                    | Proof                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| I1  | **Single use.** The invite is consumed by a conditional `updateMany` inside the same interactive transaction as `user.create` and `emailConfirmation.create` (§4.3 step 7)   | Unit: `count: 0` → 403 `INVITE_USED`; all three writes inside one `$transaction` callback. E2E A5. P2 two-connection test    |
| I2  | **Email binding.** `invite.email` equals the registering email; both are lowercased before comparison                                                                        | Unit: mismatch → 403 `INVITE_EMAIL_MISMATCH`, mixed-case match passes. E2E other-email fixture                               |
| I3  | **Expiry.** `expires_at <= now` refuses — at read (step 4) **and** in the consume predicate (`expires_at > now`)                                                             | Unit at exactly `now`; E2E expired fixture                                                                                   |
| I4  | **Rate limit first.** Nothing touches Prisma before `checkRateLimit` in the register and access-request routes                                                               | Unit: limited → no Prisma call. SEC-05                                                                                       |
| I5  | **No enumeration.** Uninvited register returns 403 before any `EMAIL_TAKEN` check; access-request returns the identical 200 for trap, existing user and real submissions     | Unit: existing email + no invite → 403, not 409; byte-identical bodies (§9)                                                  |
| I6  | **Read-time retention.** Every read path (§4.1 step 7, §4.4, §4.5) calls `isExpired`; `status_changed_at` moves only on a status change                                      | Unit boundaries (6 h, 48 h, exactly-at, PENDING field update). E2E 7 h / 5 h rows (§9)                                       |
| I7  | **Operator = DB role, every request.** Page and decision route read `User.role` from the DB; the session role is never consulted                                             | Unit: session ADMIN + DB USER → 404 / 403. E2E A2 with a real browser session                                                |
| I8  | **No GET writes.** The register preview and the confirmation page write nothing; the purge and decision routes export `POST` only                                            | Unit: loaders call no Prisma write. E2E: open the invite page twice, then register succeeds; `GET` on both POST routes → 405 |
| I9  | **Exact-match allows.** Only `/api/access-request` and `/api/internal/purge-access-requests` are opened, by `===`                                                            | Unit: `/api/access-requests/x`, `/api/access-request/x`, `/api/internal/purge-access-requests/x` → 401 anonymous. E2E A3     |
| I10 | **Purge auth.** Constant-time comparison of fixed-length digests; an unset secret never matches                                                                              | Unit: missing, wrong same-length, wrong-length (401, not 500), unset-secret → 401                                            |
| I11 | **Re-issue revokes.** Approve updates the request row **first** (taking its row lock), then deletes unused invites, then creates one — so two concurrent approvals serialise | Unit: call order inside the transaction. Concurrency not E2E-tested; A5 bounds the worst case to one account                 |
| I12 | **Mail failure never changes the outcome** (§4.1 step 8; §4.5 `email_sent: false`)                                                                                           | Unit                                                                                                                         |
| I13 | **Verification still required** (B5)                                                                                                                                         | E2E: invited registration, then sign-in refused until verified (§11 AC 3)                                                    |

**Mutation checks.** Required (§9), first run in T5 and repeated in T10: delete the invite check →
unit and E2E "no invite" fail; replace the conditional `updateMany` with a plain `update` → the
`count: 0` unit test fails, while A5's parallel E2E **still passes** — the PR says so. Additionally
in T10: make an allow-list entry a `startsWith` (I9 unit fails); read `session.user.role` in the
decision route (I7 fails); drop `isExpired` from the confirmation page (retention E2E fails); move
the rate limit after the invite lookup (I4 unit fails).

## 4. Owner-only gates — agents must not perform these

From the 2026-10-02 brief on #29, verbatim in substance; state as recorded on #29.

1. **Confirm the promoted operator account is `ADMIN` and has `email_verified_at` set**, and record
   the count and date on #29 (spec §10.1). Owner-reported, not agent-measured. **Blocks merge.**
2. **Create `PURGE_SECRET` (≥ 32 chars) in Vercel Production and as a GitHub Actions secret before
   merge, then redeploy.** Measured present 2026-10-02 (P10).
3. **Approve the landing-page copy flip and the request-form copy** (spec §6.1, §8). **Blocks the
   merge of T6's copy**, and so the PR.
4. **Do not invite a real person until #13 is fixed** (spec §10.2). #13 was closed as fixed on
   2026-10-02 (A6). §10.2 still applies: the first approval goes to an address the operator
   controls, checked for inbox placement.
5. Privacy-page text stating the §4.6 periods is the owner's wording (spec §12.2) — timing: Q8.

## 5. Tasks

**Order.** T1 → {T2 → T3} ∥ T4 → {T5, T6, T7, T8} → T9 → T10. T5 needs T3; T6–T8 need T3 and T4.
**Shared files**, each with a single owner: `prisma/*` T2 · `src/lib/api.ts` and `src/lib/email.ts`
T3 · `src/auth.config.ts` T4 · `env.ts`, `README.md`, `ci.yml` T8. `messages/{de,en}.json` is
edited by T5 (`auth.invite.*`, `auth.register.*`), T6 (`access.*`, `marketing.*`) and T7
(`admin.accessRequest.*`) in disjoint namespaces, merged one after another. `ERROR_CODES` is also
touched by #139: T3 appends a separate commented group so either merge order is a trivial rebase.

### T2 — Data model and migration (Sonnet)

- **Files:** `prisma/schema.prisma`; `prisma/migrations/<ts>_access_requests_invites/migration.sql`.
- **Implements:** §3. **Depends:** T1.
- **Tests first:** none at unit level. The red step is T3's suite failing to compile without the
  generated types.
- **Acceptance:** migration applied on a guarded dev branch; `prisma migrate diff
--from-migrations … --to-schema-datamodel …` reports no drift; the SQL alters no existing table
  (only `CREATE TYPE`, `CREATE TABLE`, `CREATE INDEX`, and FKs on the new tables); `pnpm typecheck`.

### T3 — Library layer (Sonnet)

- **Files:** new `src/lib/invite.ts`, `src/lib/operators.ts`, `src/lib/access-retention.ts` and
  their tests; `src/lib/email.ts` (+ `sendAccessRequestNotification`, `sendInviteEmail`) and
  `email.test.ts`; `src/lib/api.ts` (+ five codes).
- **Implements:** §4 codes, §4.6 definitions, §5 interfaces, §7. **Depends:** T2.
- **Tests first:** `resolveInvite` — five states, expiry exactly at `now`, no write calls (I3, I8).
  `consumeInvite(tx, …)` — issues the conditional `updateMany` (I1, I3). `isOperator` — reads the
  DB on every call, no caching, false for USER or missing (I7). `operatorEmails` — verified ADMINs
  only. `isExpired` / `purgeExpired` — every boundary in §9 (I6). Email: P8 with real `sanitize`;
  Berlin clock-time deadline; invite link in the request's locale with the 14-day expiry.
- **Acceptance:** `pnpm test`, `pnpm typecheck`, `pnpm lint`. **P8 measured** before T6 starts.

### T4 — `authorized()` (Sonnet) — all `src/auth.config.ts` edits

- **Files:** `src/auth.config.ts`; `src/auth-config.test.ts`.
- **Implements:** §4.1 allow, §4.4 prefix, §4.6 allow, §0b. **Depends:** T1 only.
- **Tests first:** I9 cases; `/de/admin/access-requests/x` anonymous → 307 to `/de/auth/login`,
  `/en/…` keeps `en`; a signed-in `/api/admin/…` passes (the route does the role check).
- **Acceptance:** unit green; whole E2E suite green in CI, including `smoke.spec.ts`. Like 2.7's
  Task 3, a `curl` against `pnpm build && pnpm start` records the real status codes for the I9
  paths in the task report — the unit test constructs its arguments and cannot prove next-auth
  honours them.

### T5 — The register gate (Sonnet; Opus reviews the diff)

- **Files:** `src/app/api/auth/register/route.ts` + test; `src/app/[locale]/(auth)/auth/register/page.tsx`;
  `src/components/auth/RegisterForm.tsx` + test; new `src/components/auth/InviteStateCard.tsx` + test;
  `messages/*` `auth.invite.*`; the unit tests in §2's T5 rows; `e2e/helpers/db.ts`
  (+ `insertTestInvite(email, opts?)`); `e2e/auth.spec.ts` (six TCs); `e2e/security.spec.ts` (SEC-05).
- **Implements:** §4.2, §4.3, §6.2, §8 (gate keys), #112 item 2. **Depends:** T3.
- **Before step 7:** measure **P2** on a guarded dev branch with two `psql` sessions; record the
  result in the task report. If it is false, stop and report — do not substitute a pattern.
- **Tests first:** I1–I5 route cases; the four 403 rejections each write an `INVALID_TOKEN` audit
  row with `token_type: "invite"`; `P2002` → 409; `bcrypt.hash` before `$transaction`; `REGISTER`
  audit carries `invite_id`. Page: each `InviteState`. Form: email read-only and prefilled; sends
  `invite`; each 403 code maps to its message (Q1).
- **Acceptance:** unit and whole E2E green; SEC-05 sees 403 ×10 then 429; both required mutation
  checks run and reported.

### T6 — Access-request route, form, copy flip (Sonnet)

- **Files:** new `src/app/api/access-request/route.ts` + test; new
  `src/components/marketing/AccessRequestForm.tsx` + test; delete `CtaBand.tsx`; `Hero.tsx`,
  `PublicNav.tsx`, `src/app/[locale]/(marketing)/page.tsx`; `messages/*` `access.*`,
  `marketing.cta.*`, `marketing.hero.primary`, `marketing.nav.register`; the T6 rows of §2.
- **Implements:** §4.1, §6.1, §8. **Depends:** T3 (and P8), T4.
- **Tests first:** both limiters before parsing (I4); trap, existing-user and real submissions
  return byte-identical response bodies (I5) — but only trap and existing-user submissions write
  nothing and send no mail; a real new submission creates the `PENDING` row and notifies operators
  (§4.1), asserted separately; every step-7 branch, which notify and
  which do not; an expired row is deleted then recreated; a PENDING field update leaves
  `status_changed_at` (I6); concurrent create (Q6); notification failure → 200 (I12). Form:
  honeypot attributes, disabled while submitting, no-promise success copy, translated validation.
- **Acceptance:** unit and E2E green; gate 3 recorded before this copy merges to `main`.

### T7 — Confirmation page and decision route (Sonnet)

- **Files:** new `src/app/[locale]/(app)/admin/access-requests/[id]/page.tsx`,
  `src/app/api/admin/access-requests/[id]/route.ts`, `src/components/admin/AccessRequestDecision.tsx`,
  each with tests; `messages/*` `admin.accessRequest.*`.
- **Implements:** §4.4, §4.5, §6.3. **Depends:** T3, T4 (drift test, §2).
- **Tests first:** I7 on both page and route (the route also calls `auth()` itself, not only the
  middleware); unknown or expired id → 404; existing user → 409 with nothing written; decline sets
  `DECLINED`, `reviewed_*` and `status_changed_at`, and deletes unused invites; approve follows I11's
  order with the email outside the transaction; `email_sent: false`; re-approve re-issues; P1 per Q3.
- **Acceptance:** unit and E2E green.

### T8 — Purge route, workflow, env (Sonnet)

- **Files:** new `src/app/api/internal/purge-access-requests/route.ts` + test;
  `.github/workflows/purge-access-requests.yml` (hourly `17 * * * *` + `workflow_dispatch`, failing
  the run on a non-2xx); `src/lib/env.ts` + test; `README.md` env section; `ci.yml` (a
  `PURGE_SECRET` for the E2E job — Q7).
- **Implements:** §4.6 physical deletion, §10.3. **Depends:** T3, T4.
- **Tests first:** I10; response holds counts only; idempotent; `GET` → 405. Env: a production
  deployment without, or with a short, `PURGE_SECRET` fails to parse; non-production parses without
  it (P9).
- **Acceptance:** unit green; CI E2E boots with the new env contract.

### T9 — End-to-end coverage (Sonnet)

- **Files:** new `e2e/invite-registration.spec.ts`; `e2e/helpers/db.ts` (+ an access-request
  fixture with a settable `status_changed_at`, a role setter for test-owned users).
- **Implements:** §9 E2E list; A2–A5; P2 as a CI test; I8, I13. **Depends:** T5–T8.
- **Method:** `resetRateLimits()` in `beforeEach` (P6; per-IP limit is 3/h); A2 on a
  `createTestUser` account, never the seed admin (P11); A5 via `Promise.all` in one test.
- **Acceptance:** whole suite green in CI.

### T10 — Whole-branch review (Opus)

- Real browser against `pnpm build && pnpm start` — not `pnpm dev`, not constructed tokens. Walk
  §11's acceptance criteria end to end in DE and EN.
- Re-check every row of §1 against the final code; confirm no **A** that is security-relevant is
  left unmeasured; run §3's mutation checks; confirm no reproduction text anywhere.
- Findings: correctness, security, data integrity, accessibility → fixed in-branch; the rest → filed
  issues linked from the PR. At most two fix rounds.
- The PR description carries A5's limitation (§3) and the post-merge steps below.

**After merge (orchestrator, with the owner):** an anonymous `POST /api/auth/register` without an
invite returns 403 on the **live** production URL (§10.3, #132); one `workflow_dispatch` purge run
shows counts; comment on #99 that item 1 is retired; close #29 referencing the PR; tell #97 the
`marketing.*` copy moved.

## 6. Open questions for review

- **Q1 — Where the five error codes are translated.** §8 says `errors.*`; no top-level `errors`
  namespace exists. The convention maps codes per component onto `auth.errors.*`
  (`ResetPasswordForm.tsx:99–103`). §6.2 already says the 403s reuse the `auth.invite.*` messages —
  map onto those, with no new namespace?
- **Q2 — `LoginForm.tsx:167` "register" link.** Outside §6.1 and AC 9. Keep it (it lands on the
  `missing` card, which links to `#access`), retarget it to `/{locale}#access`, or relabel it?
- **Q3 — Content-Type on the decision route (P1).** Enforce `application/json` (status and code to
  choose), or drop the JSON-body sentence from §4.5 and rely on Lax alone?
- **Q4 — A missing `invite` together with other invalid fields.** §4.3 makes a missing invite 403
  but orders Zod first. Proposed: check presence straight after JSON parsing, so an uninvited caller
  learns nothing about the password policy.
- **Q5 — Mail link base.** §7 uses `NEXT_PUBLIC_APP_URL`; existing mails build links from
  `env.AUTH_URL` (`email.ts:62`). Whether they are equal in production is not measured. Which one?
- **Q6 — Two first submissions for one new email race** on `access_requests.email @unique`. §4.1 is
  silent; the uniform-response rule suggests treating `P2002` as "existing PENDING": 200, no second
  notification. Confirm.
- **Q7 — Purge plumbing.** The CI E2E job needs a `PURGE_SECRET`: a per-run non-secret value
  (proposed — it guards an ephemeral database) or a GitHub secret? And the workflow's target URL: a
  hard-coded production origin or a repository variable?
- **Q8 — Gate timing.** §10.1's heading says A1 is measured "before implementation"; the brief says
  "before merge". This plan treats it as a merge gate, since A1 affects rollout, not code. The same
  question for the privacy-page text (§12.2): before merge, or before the first invite?
- **Q9 — Global access-request cap (30/h).** One actor with several addresses can exhaust it and
  turn real requesters away for an hour (no data exposure). Accept for the alpha?
- **Q10 — #112 item 1 (no double-submit guard on `RegisterForm`).** With invites, a double click can
  overwrite the success card with `INVITE_USED`. T5 rewrites the form anyway — fold it in?
