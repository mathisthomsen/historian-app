# Epic 2.6 Part B — Invite-gated registration

## Specification

**Tracks:** #29 · **Milestone:** Pre-Alpha Gate (gate 1 of 5)
**Phase:** 2 — Core Research Loop
**Deliverable:** Public self-service registration closes; an account can be created only with a
single-use invite issued by an operator approving an access request.
**Verifiable:** `POST /api/auth/register` without a valid invite returns 403; the landing page's
form writes an `access_requests` row and emails the operator; the operator approves on a
confirmation page and the requester receives a working registration link.

**Relation to the 2.6 spec.** This supersedes §4 and §5 of
`docs/specs/2-6-marketing-landing/specification.md` (Part B). The decisions recorded there stand
unless §1 below says otherwise; every change is the result of re-measuring the code on 2026-10-02,
after Epic 2.7 had changed `authorized()`. The questions and the rejected options are in
`brainstorming.md` beside this file.

---

## 0. Load-bearing assumptions

| #   | Premise                                                                                                                               | State                                                   | Evidence / what breaks if false                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | **At least one verified `ADMIN` user exists in production** at the moment this ships.                                                 | **Reported by owner** (2026-10-02) — not agent-measured | The owner ran the guarded promotion (§10.1) and reports it done. Before merge, confirm the count and that `email_verified_at` is set, and record it on #29. Before that: #29 recorded **0 ADMIN accounts** in production as of 2026-08-09. False → notifications go to nobody, nobody can approve, and registration is closed with no way in. Production-bound, so it must be **measured** before implementation (§10.1), and if it is false, an operator account must be promoted — a production write that needs the owner's explicit go-ahead. |
| A2  | **The session's `role` is not current** — so authorisation must read `User.role` from the database.                                   | Measured                                                | `src/auth.config.ts:43–45`: `token.role = user.role` runs only inside `if (user)`, i.e. at sign-in. A design trusting the session role would let a demoted admin keep approving for up to 30 days.                                                                                                                                                                                                                                                                                                                                                |
| A3  | **An anonymous `/api/*` request gets 401 JSON, not a login redirect.**                                                                | Measured                                                | `src/auth.config.ts:128–139`. This is what invalidated 2.6 §5.3's GET approve link (it assumed a redirect). It also means `/api/access-request` must be explicitly allow-listed, or guests get 401.                                                                                                                                                                                                                                                                                                                                               |
| A4  | **The session cookie is `SameSite=Lax`**, so a cross-site `POST` to the decision route carries no session — the route's CSRF defence. | Measured (source)                                       | `@auth/core@0.41.3` `lib/utils/cookie.js:48–55` sets `sameSite: "lax"`; neither `src/auth.ts` nor `src/auth.config.ts` overrides `cookies`. False → a third-party page could make a signed-in admin approve a request. Re-measured on a real response in §9 (E2E asserts the attribute).                                                                                                                                                                                                                                                          |
| A5  | **`User.email` is unique**, so two concurrent redemptions of one invite cannot create two accounts.                                   | Measured                                                | `prisma/schema.prisma:79` `email String @unique`; the invite binds the email (§4.3). This — not the transaction — is the hard backstop against double redemption. The conditional consume (§4.3 step 7) makes the second request fail cleanly instead of at the constraint.                                                                                                                                                                                                                                                                       |
| A6  | **Invite and verification emails reach an inbox.**                                                                                    | **Measured false** today                                | `dig +short TXT evidoxa.com` → empty (2026-10-02): no SPF record, DMARC `p=none` — #13. Does not break correctness, but a production rollout that assumes delivery fails silently: approved researchers never see the link. Does not block merge; blocks **inviting anyone** (§10.2).                                                                                                                                                                                                                                                             |
| A7  | **CI E2E runs isolated**: ephemeral Neon branch, namespaced Redis keys, production build, stubbed email.                              | Measured                                                | `.github/workflows/ci.yml:91,99` (`CACHE_NAMESPACE` / `RATELIMIT_NAMESPACE` per run), `:154` (ephemeral branch), `:108` (`EMAIL_TRANSPORT: "stub"`), `:257` (`pnpm build`). Consequence for method: no test can read a raw invite token out of an email — fixtures insert invites directly (§9).                                                                                                                                                                                                                                                  |
| A8  | **A purge job can run often enough to honour a 6-hour retention.**                                                                    | Measured (plan) / documented (limit)                    | `vercel api /v2/teams/mathis-thomsens-projects` → `billing.plan = hobby` (2026-10-02). Vercel documents Hobby cron jobs as at most once per day — not measured here. A daily cron would hold PENDING rows up to ~30 h. Hence: expiry is enforced **at read time** (§4.6), so an expired row is never used regardless of when it is physically deleted, and deletion runs **hourly from GitHub Actions**. GitHub documents that scheduled runs can be delayed under load — assumed acceptable.                                                     |

Not listed, deliberately: the client IP used for rate-limit keys (#29 records Vercel's
`X-Forwarded-For` as trustworthy, measured); the token helpers (`generateToken`/`hashToken` are the
existing reset/verification mechanism and substitutable).

## 0b. Blast radius and test scope

This change edits two cross-cutting gates — `authorized()` (a new API allow-list entry and a new
gated prefix) and the only route that creates users. **Test scope is the whole suite**, unit and
E2E, not the diff.

| Beyond the touched files                     | Why                                                                                                                                                                                                                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every anonymous `/api/*` request             | An allow-list entry written as a prefix (`startsWith("/api/access-request")`) would also open `/api/access-requests/…`. The entry must be an **exact** match (§4.1).                                                                                        |
| Every `(app)` page                           | `admin` joins `GATED_PREFIXES`; `auth-config.test.ts` already fails if an `(app)` directory is missing from it.                                                                                                                                             |
| Every E2E test that registers through the UI | TC-AUTH-02, -03, -04, -05, -06 and -19 (`e2e/auth.spec.ts`) and SEC-05 (`e2e/security.spec.ts`). The first group needs an invite fixture; SEC-05 must still see 429 on the 11th call, which holds only if rate limiting stays **before** invite validation. |
| Landing page copy and links                  | Hero, `PublicNav` and `CtaBand` link to `/auth/register`; all three change in this PR (§6.1).                                                                                                                                                               |

**Method per assumption:**

- **A2** — E2E with a **real browser session**, not a constructed token: sign in as a USER, promote
  them in the database without re-login, assert the decision route accepts; demote an ADMIN the same
  way, assert it refuses. A unit test with a mocked session cannot observe staleness.
- **A3** — E2E anonymous `request.post("/api/access-request")` returns 200, and anonymous
  `request.post("/api/access-requests/x")` (note the `s`) returns 401.
- **A4** — E2E reads the session cookie from the browser context and asserts `sameSite: "Lax"`.
- **A5** — E2E fires two parallel `POST /api/auth/register` with the same invite against the CI
  ephemeral branch: exactly one 201, one 403 or 409, one user row.
- Unit tests mock Prisma, Redis and email. The `pnpm test` job holds real Upstash credentials and
  no namespace (`ci.yml:56–59`); a unit test that reaches `src/lib/redis.ts` writes to production's
  key space.

---

## 1. Decisions

Carried from 2.6 unchanged: waitlist + single-use invites; `AccessRequest` is not project-scoped;
hashed token at rest, raw token only in the link; 14-day expiry; honeypot + timing check, no
captcha; uniform response; no admin list view in v1; "soft registration" rejected.

Changed here (rationale in `brainstorming.md`):

| #   | 2.6 said                                    | This spec                                                                                       |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| B1  | `GET` approve link that writes              | Confirmation **page** (read-only) + `POST` decision route                                       |
| B2  | Session `role === "ADMIN"` + HMAC signature | `User.role` re-read from the database on every operator request; **no HMAC**                    |
| B3  | Notification to "the operator"              | To every verified `ADMIN`, queried at send time; no new env var                                 |
| B4  | Two emails per request                      | **One** — operator notification only. Requester gets an on-screen confirmation                  |
| B5  | —                                           | Registration via invite **still requires email verification**                                   |
| B6  | Approve only                                | Approve **and** Decline                                                                         |
| B7  | One `403 INVITE_REQUIRED` code              | One code per failure (§4.3), matching the existing `TOKEN_EXPIRED` / `TOKEN_ALREADY_USED` style |

## 2. Technology

Nothing new. Prisma, Zod, next-intl, Resend via `src/lib/email.ts`, `checkRateLimit`,
`anonymizeIp`, `generateToken` / `hashToken`, `sanitize`, `writeAuditLog`.

---

## 3. Data model

Additive: two tables, one enum. No existing table or enum is altered, so there is no backfill and
no timestamptz `USING` hazard.

```prisma
model AccessRequest {
  id             String              @id @default(cuid())
  email          String              @unique            // lowercased by Zod before write
  name           String
  institution    String?
  research_area  String?
  tool_gap       String?                                // co-development field (2.6 D14)
  locale         String                                 // "de" | "en" — language of the invite email
  status         AccessRequestStatus @default(PENDING)
  consent_at     DateTime            @db.Timestamptz(3)
  ip_hash        String?                                // anonymizeIp(); abuse forensics only
  created_at     DateTime            @default(now()) @db.Timestamptz(3)
  updated_at     DateTime            @updatedAt @db.Timestamptz(3)
  status_changed_at DateTime         @default(now()) @db.Timestamptz(3) // retention clock (§4.6)
  reviewed_at    DateTime?           @db.Timestamptz(3)
  reviewed_by_id String?

  reviewed_by User?    @relation("AccessRequestReviewer", fields: [reviewed_by_id], references: [id], onDelete: SetNull)
  invites     Invite[]

  @@index([status, created_at])
  @@map("access_requests")
}

enum AccessRequestStatus {
  PENDING
  INVITED
  DECLINED
}

model Invite {
  id                String    @id @default(cuid())
  email             String                          // lowercased; must equal the registering email
  token_hash        String    @unique               // SHA-256(rawToken)
  access_request_id String?                         // nullable: leaves room for direct invites later
  expires_at        DateTime  @db.Timestamptz(3)    // created_at + 14 days
  used_at           DateTime? @db.Timestamptz(3)    // single-use
  created_at        DateTime  @default(now()) @db.Timestamptz(3)

  access_request AccessRequest? @relation(fields: [access_request_id], references: [id], onDelete: SetNull)

  @@index([email])
  @@map("invites")
}
```

`User` gains only the back-relation `reviewed_access_requests AccessRequest[] @relation("AccessRequestReviewer")` — a Prisma-level field, no column.

Differences from 2.6 §4: `updated_at` and `reviewed_by_id` added (who approved, recorded in the data
rather than inferred from logs), and `status_changed_at` — set on create and on **every status
change**, never on a plain field update — which is what retention counts from (§4.6). Resubmitting a
`PENDING` request therefore does not extend its life.

---

## 4. API contract

New error codes, added to `ERROR_CODES` in `src/lib/api.ts`:
`INVITE_REQUIRED`, `INVITE_INVALID`, `INVITE_EXPIRED`, `INVITE_USED`, `INVITE_EMAIL_MISMATCH`.

### 4.1 `POST /api/access-request` — public

`authorized()` gains `pathnameWithoutLocale === "/api/access-request"` beside `/api/health` —
**exact match** (§0b).

```ts
// request
interface AccessRequestBody {
  email: string; // z.string().email().max(254).toLowerCase().trim()
  name: string; // min 1, max 100
  institution?: string; // max 200
  research_area?: string; // max 200
  tool_gap?: string; // max 2000
  locale: "de" | "en";
  consent: true; // z.literal(true)
  company: string; // honeypot — z.string().max(0) is NOT used; see step 4
  rendered_at: number; // ms epoch, set when the form mounted
}
// response — always, for every accepted case
// 200 { ok: true }
```

Order, each step required:

1. `ip = anonymizeIp(...)`, extracted exactly as the register route does.
2. `checkRateLimit("access-request:{ip}", 3, 1h)` then `checkRateLimit("access-request:global", 30, 1h)`.
   Either → 429 `RATE_LIMITED` (reveals nothing about any address).
3. Parse JSON; invalid → 400 `INVALID_JSON`. Zod-validate all fields except `company`; failure →
   400 `VALIDATION_FAILED` with field-keyed i18n codes (register route's convention).
4. **Trap:** `company` non-empty, or `Date.now() - rendered_at < 2000` → return the 200 body, write
   nothing, send nothing. (Validated in code, not by Zod, so a bot filling it gets success rather
   than a field error telling it which field to leave blank.)
5. If a `User` with this email exists → 200, write nothing, send nothing.
6. `sanitize()` every free-text field.
7. If this email's row is expired (§4.6), delete it first and treat the request as new. Then upsert
   by email:
   - **new row** → create `PENDING`, notify operators (§7.1);
   - **existing `PENDING`** → update fields; **no** new notification;
   - **existing `INVITED` with a live invite** (unused, unexpired) → no change;
   - **existing `INVITED` without a live invite, or `DECLINED`** → update fields, set `PENDING`,
     clear `reviewed_*`, notify operators.
8. Notification failure is logged (`console.error`, request id only, no PII) and does **not** change
   the response.
9. 200 `{ ok: true }`.

No audit-log row: `AuthAuditLog.action` has no fitting value and adding one alters an enum.

### 4.2 Register page — invite preview (server)

`src/app/[locale]/(auth)/auth/register/page.tsx` reads `searchParams.invite`, and resolves:

```ts
type InviteState =
  | { kind: "missing" }
  | { kind: "invalid" } // no row for hashToken(invite)
  | { kind: "used" }
  | { kind: "expired" }
  | { kind: "valid"; email: string; token: string };
```

and passes it to `RegisterForm`. Only `valid` renders the form; the others render the states in §6.2.
The token is 256 bits, so this lookup needs no rate limit. Same-origin navigation keeps the token in
the `Referer`; cross-origin gets only the origin (`next.config.ts:25–26`,
`strict-origin-when-cross-origin`).

### 4.3 `POST /api/auth/register` — the gate

Body gains `invite: string` (`z.string().min(1)`; a missing field → 403 `INVITE_REQUIRED`, not a
400 field error). New order:

1. Rate limit — **unchanged and still first** (SEC-05 depends on it).
2. Parse + Zod.
3. `row = invite.findUnique({ token_hash: hashToken(invite) })`.
4. Reject, each with an `INVALID_TOKEN` audit row (`metadata.token_type = "invite"`, `reason`):
   | Condition | Response |
   | -------------------------- | ------------------------------ |
   | no row | 403 `INVITE_INVALID` |
   | `used_at` set | 403 `INVITE_USED` |
   | `expires_at <= now` | 403 `INVITE_EXPIRED` |
   | `row.email !== email` | 403 `INVITE_EMAIL_MISMATCH` |
5. Existing user check → 409 `EMAIL_TAKEN` (unchanged).
6. `bcrypt.hash` — **outside** the transaction, to keep it short.
7. Interactive `prisma.$transaction(async (tx) => …)`:
   - `tx.invite.updateMany({ where: { id, used_at: null, expires_at: { gt: now } }, data: { used_at: now } })`;
     `count !== 1` → throw → 403 `INVITE_USED`;
   - `tx.user.create(...)` — Prisma `P2002` on `email` → 409 `EMAIL_TAKEN` (today this race is an
     unhandled 500);
   - `tx.emailConfirmation.create(...)`.
8. Everything after (verification email, `REGISTER` audit with `metadata.invite_id`, response) is
   unchanged.

A plain `update({ where: { id } })` after a read (the `reset-password` pattern) is **not**
acceptable here: two concurrent requests both read `used_at = null`. The conditional `updateMany`
makes the second one observe `count = 0`.

### 4.4 `GET /[locale]/admin/access-requests/[id]` — confirmation page

`src/app/[locale]/(app)/admin/access-requests/[id]/page.tsx`. `admin` is added to `GATED_PREFIXES`.

- Signed out → middleware redirects to `/{locale}/auth/login` (no `callbackUrl` — `brainstorming.md` Q7).
- Signed in, `prisma.user.findUnique({ id: session.user.id }).role !== "ADMIN"` → `notFound()`.
  A 404 rather than 403 so the page does not confirm that request ids exist.
- Unknown id → `notFound()`.
- Otherwise renders the request (§6.3). **Writes nothing.**

### 4.5 `POST /api/admin/access-requests/[id]` — decision

```ts
interface DecisionBody {
  decision: "approve" | "decline";
}
// 200 { status: "INVITED" | "DECLINED", email_sent?: boolean }
```

1. No session → 401 (middleware, A3).
2. Re-read role from the database; not `ADMIN` → 403 `FORBIDDEN`.
3. Zod; unknown id → 404 `NOT_FOUND`.
4. A `User` already exists for the email → 409 `EMAIL_TAKEN`, nothing written.
5. **decline** → `status = DECLINED`, `reviewed_at`, `reviewed_by_id`. No email.
6. **approve** → in one transaction: delete unused invites for this email; create `Invite`
   (`expires_at = now + 14d`); `status = INVITED`, `reviewed_*`. Then send the invite email (§7.2) in
   `request.locale`. Failure is reported as `email_sent: false` (the register route's #43 pattern)
   — the invite exists and the operator can approve again to re-issue.
7. Approving an `INVITED` request re-issues (step 6 deletes the old invite). Declining an `INVITED`
   one deletes its unused invites.

CSRF: `SameSite=Lax` (A4) plus a JSON body — a cross-site form cannot send `application/json`
without a CORS preflight, which this route does not answer.

The confirmation page (§4.4) and this route treat an **expired** row (§4.6) as not found.

### 4.6 Retention — owner's decision, 2026-10-02

| Row                      | Kept for                                                             | Clock                    |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| `AccessRequest PENDING`  | **6 hours**                                                          | `status_changed_at`      |
| `AccessRequest DECLINED` | **48 hours**                                                         | `status_changed_at`      |
| `AccessRequest INVITED`  | until its invite is used or expires (≤ 14 days) — decided 2026-10-02 | latest invite            |
| `Invite`                 | until used or expired                                                | `used_at` / `expires_at` |

**One definition, two enforcers.** `src/lib/access-retention.ts` exports `RETENTION` and
`isExpired(row, now)`, plus `purgeExpired(now)` built from the same constants:

1. **Read time — the guarantee.** Every read path (§4.1 step 7, §4.4, §4.5) calls `isExpired` and
   treats an expired row as absent. Correctness never depends on when the purge last ran.
2. **Physical deletion — hourly.** `POST /api/internal/purge-access-requests`, called by a GitHub
   Actions workflow on `cron: "17 * * * *"`. Auth: `Authorization: Bearer <PURGE_SECRET>`, compared
   with `crypto.timingSafeEqual`; missing or wrong → 401 with no body detail. `authorized()` allows
   this path by **exact** match, like §4.1. Response `200 { deleted: { pending, declined, invited, invites } }`
   — counts only, so the workflow log carries no PII. Idempotent.

Why not Vercel Cron: A8. Why not purge-on-write only: with no new traffic, nothing would ever run.

**Consequence the operator must accept.** A request that arrives at 23:00 is gone at 05:00. The
notification email states the deadline as a clock time (§7.1), and the requester's success message
must not promise a reply (§6.1).

`PURGE_SECRET` is a new required production env var (≥ 32 chars, in `src/lib/env.ts`, optional
outside production) and a GitHub Actions secret. Per `CLAUDE.md`, the README's env section is
updated in the same commit.

---

## 5. Files

```
prisma/migrations/<ts>_access_requests_invites/migration.sql   new
prisma/schema.prisma                                             +2 models, +1 enum, User back-relation
src/lib/api.ts                                                   +5 error codes
src/lib/invite.ts                                                new — resolveInvite(), consumeInvite(tx, …), INVITE_TTL_MS
src/lib/operators.ts                                             new — isOperator(userId) (DB read), operatorEmails()
src/lib/access-retention.ts                                      new — RETENTION, isExpired(), purgeExpired()
src/app/api/internal/purge-access-requests/route.ts              new — bearer-authenticated purge
.github/workflows/purge-access-requests.yml                      new — hourly schedule + workflow_dispatch
src/lib/env.ts, README.md                                        + PURGE_SECRET
src/lib/email.ts                                                 + sendAccessRequestNotification(), sendInviteEmail()
src/auth.config.ts                                               + two exact API allows (§4.1, §4.6); + "admin" in GATED_PREFIXES
src/app/api/access-request/route.ts                              new
src/app/api/admin/access-requests/[id]/route.ts                  new
src/app/api/auth/register/route.ts                               gate (§4.3)
src/app/[locale]/(auth)/auth/register/page.tsx                   invite preview (§4.2)
src/app/[locale]/(app)/admin/access-requests/[id]/page.tsx       new, server component
src/components/admin/AccessRequestDecision.tsx                   new, client — two buttons + result
src/components/auth/RegisterForm.tsx                             props { invite }, email read-only, sends invite
src/components/auth/InviteStateCard.tsx                          new — missing/invalid/used/expired states
src/components/marketing/AccessRequestForm.tsx                   new, client — replaces CtaBand
src/components/marketing/CtaBand.tsx                             deleted
src/components/marketing/Hero.tsx, PublicNav.tsx                 primary CTA → #access
messages/de.json, messages/en.json                               access.*, auth.invite.*, admin.accessRequest.*, marketing copy flip
e2e/helpers/db.ts                                                + insertTestInvite(email, opts?)
```

---

## 6. UI

### 6.1 Landing page

`CtaBand` is replaced by `AccessRequestForm` at `id="access"`. Hero primary CTA and the `PublicNav`
register link become "Zugang anfragen" / "Request access" → `#access`. `marketing.cta.*` copy flips
to the closed alpha — in this PR, so the page never claims a gate that does not exist (2.6 §11.3).
This also retires #99 item 1 ("an account is all it takes"); say so on #99.

Form: name, email, institution (optional), research area (optional), `tool_gap` (optional,
multiline, the question the requester's current tool cannot answer), consent checkbox with a link
to `/{locale}/datenschutz`, honeypot `company` (visually hidden, `tabIndex={-1}`,
`autoComplete="off"`, `aria-hidden`). Submit disabled while submitting (the gap #112 found on
`RegisterForm`). Success replaces the form with a message that **must not promise a reply** —
an unreviewed request is deleted after 6 hours (§4.6). Draft: "Danke. Wenn wir Sie einladen können,
erhalten Sie in den nächsten Stunden eine E-Mail. Andernfalls wird Ihre Anfrage nach 6 Stunden
gelöscht — Sie können sie jederzeit erneut stellen." Zod schema built inside the component with `t()` (established pattern).

### 6.2 Register page

| `InviteState` | Renders                                                                             |
| ------------- | ----------------------------------------------------------------------------------- |
| `valid`       | The form; email prefilled and **read-only**, with a line "Eingeladen als …"         |
| `missing`     | "Die Registrierung ist nur mit Einladung möglich." + link to `/{locale}#access`     |
| `invalid`     | "Dieser Einladungslink ist ungültig." + link to `/{locale}#access`                  |
| `expired`     | "Dieser Einladungslink ist abgelaufen." + "Fragen Sie erneut Zugang an" → `#access` |
| `used`        | "Dieser Einladungslink wurde bereits verwendet." + link to login                    |

The same messages map from the 403 codes in §4.3 if the state changes between page load and submit.
The existing privacy link gap (#112 item 2) is fixed here, since the form is rewritten anyway.

### 6.3 Confirmation page

Inside the `AppShell`. Shows name, email, institution, research area, `tool_gap` (as plain text,
whitespace preserved), locale, created, status, and — if reviewed — when and by whom.

Buttons: **Einladen** (primary) and **Ablehnen** (outline). Disabled while submitting. After a
decision the page shows the new status inline; `email_sent: false` shows "Die Einladung wurde
angelegt, die E-Mail aber nicht versendet. Erneut einladen?". If a user already exists for the email,
both buttons are replaced by "Für diese Adresse besteht bereits ein Konto."

---

## 7. Emails

Both via `sendEmail` in `src/lib/email.ts`, so the stub and the 5-second deadline apply.

**7.1 Operator notification** — to `operatorEmails()` (verified `ADMIN` users). If the list is
empty, `console.error("[access-request] no operator to notify", { requestId })` and return. Subject
"Neue Zugangsanfrage: {name} — verfällt {HH:MM}". Body: the deadline (Europe/Berlin), the request fields and the link
`{NEXT_PUBLIC_APP_URL}/de/admin/access-requests/{id}` with the line "Falls Sie nicht angemeldet sind:
erst anmelden, dann diesen Link erneut öffnen." Operator mail is German only.

**7.2 Invite** — to the request email, in `request.locale`. Link
`{NEXT_PUBLIC_APP_URL}/{locale}/auth/register?invite={raw}`, states the 14-day expiry and that the
address cannot be changed.

---

## 8. i18n

New namespaces in both `messages/de.json` and `messages/en.json`: `access.*` (form labels, hints,
errors, success), `auth.invite.*` (the five states of §6.2, the "Eingeladen als" line),
`admin.accessRequest.*` (field labels, buttons, outcomes), `errors.*` entries for the five new codes,
and the rewritten `marketing.cta.*`, `marketing.hero.primary`, `marketing.nav.register`. Copy is
drafted by Claude against `skills/platforms/evidoxa.md` § Brand Voice and edited by the owner (2.6
D12). Key values for the gate itself:

| Key                         | de                                                 | en                                          |
| --------------------------- | -------------------------------------------------- | ------------------------------------------- |
| `auth.invite.missing`       | Die Registrierung ist nur mit Einladung möglich.   | Registration is by invitation only.         |
| `auth.invite.invalid`       | Dieser Einladungslink ist ungültig.                | This invitation link is not valid.          |
| `auth.invite.expired`       | Dieser Einladungslink ist abgelaufen.              | This invitation link has expired.           |
| `auth.invite.used`          | Dieser Einladungslink wurde bereits verwendet.     | This invitation link has already been used. |
| `auth.invite.emailMismatch` | Die Einladung gilt für eine andere E-Mail-Adresse. | The invitation is for a different address.  |

---

## 9. Testing

**Unit (Vitest; Prisma, Redis, email mocked — §0b)**

- `resolveInvite`: missing / invalid / used / expired / valid, including expiry exactly at `now`.
- Register route: each of the five 403 codes; rate limit precedes invite validation; `updateMany`
  returning `count: 0` → 403 `INVITE_USED`; `P2002` → 409; success writes user, confirmation and
  invite consumption in one transaction.
- Access-request route: each upsert branch of §4.1 step 7 — which ones notify and which do not;
  trap and existing-user cases return the identical body and call neither Prisma write nor email;
  global limit; notification failure still returns 200.
- Decision route: non-ADMIN 403 when the **database** says USER even if the session says ADMIN;
  approve deletes previous unused invites; decline; existing user → 409; `email_sent: false`.
- Retention: `isExpired` at each boundary (6 h, 48 h, exactly-at, and a `PENDING` field update that
  must not move `status_changed_at`); `purgeExpired` deletes exactly the expired rows; purge route
  401 on missing/wrong secret, 200 with counts only.
- `authorized()`: `/api/access-request` and `/api/internal/purge-access-requests` allowed anonymous; `/api/access-requests/x` and
  `/api/admin/access-requests/x` → 401 anonymous; `/de/admin/...` redirects anonymous.
- `AccessRequestForm`, `RegisterForm`, `InviteStateCard`, `AccessRequestDecision`: translated
  validation, disabled-while-submitting, each state renders.

**Mutation checks (required):** delete the invite check from the register route → the unit tests
and the E2E "no invite" test fail. Replace the conditional `updateMany` with a plain `update` → the
`count: 0` unit test fails. (The parallel E2E in A5 will **still pass** under that mutation, because
the email constraint catches it — that test proves no second account, not that the consume is
conditional. Say so in the PR rather than claim more.)

**E2E (Playwright, CI: ephemeral branch, namespaced Redis, `pnpm build`, email stub — A7)**

- Write flow: anonymous submits the landing form → 200, one `access_requests` row (`PENDING`).
- Trap: honeypot filled → identical response, no row.
- Read-back: admin (seed `admin@evidoxa.dev` is `ADMIN`) opens the confirmation page → every field
  shown as submitted; approve → status `INVITED` shown; reload → still `INVITED`; one `invites` row.
- Registration: `insertTestInvite(email)` → `/de/auth/register?invite=…` shows the email read-only
  → submit → success card. No invite → "nur mit Einladung". Used and expired fixtures → their states.
- Retention read-back: a `PENDING` row with `status_changed_at` set 7 h back → confirmation page 404s
  and the purge route deletes it; a 5 h one survives both.
- A2 promote/demote with a real browser session (§0b). A3, A4, A5 as in §0b.
- Existing tests: TC-AUTH-02/-03/-04/-05/-06/-19 gain an invite fixture; SEC-05 sends no invite and
  must still reach 429 on call 11.
- Edit-mode test: not applicable — no record is edited after creation. Activity-log (Verlauf) test:
  not applicable — neither table is project data and neither route calls `logActivity`.

The CI run is the verdict; local E2E also works since 2026-09-12 (project memory) and is worth
running before review.

---

## 10. Rollout

Ordering matters because merging closes the only way in.

### 10.1 Before implementation — measure A1

On the production branch, guarded by `SELECT current_setting('neon.branch_id')` matching
`br-old-grass-a9acitgb` (the endpoint names mislead — see the project memory):

```sql
SELECT count(*) FILTER (WHERE role = 'ADMIN' AND email_verified_at IS NOT NULL) AS admins
FROM users;
```

**Decided 2026-10-02:** the owner created the operator account and asked for it to be promoted. The
promotion is a guarded production `UPDATE` run by the owner (an agent was refused production
credentials, correctly). Record the before/after count and date — not the address — on #29.
A1 stays a blocker until that count is recorded as ≥ 1 **with** `email_verified_at` set; an
unverified admin receives no notifications (§7.1).

### 10.2 Before inviting anyone — #13

SPF is missing (A6). Merging is safe without it; sending the first real invite is not. The
operator's first approval should go to an address they control and check the inbox, not the spam
folder, before approving a stranger.

### 10.3 Deploy

The migration is additive and runs in CI's main-gated "Migrate production database" step before
the deploy. Set `PURGE_SECRET` in Vercel production **and** GitHub secrets before merging, then
redeploy — Vercel env binds at deploy time. After deploy, confirm **live**, not merely deployed (#132): an anonymous
`POST /api/auth/register` with no invite returns 403 on the production URL.

---

## 11. Acceptance criteria

1. Anonymous `POST /api/auth/register` without `invite` returns 403 `INVITE_REQUIRED`, on the live
   production URL.
2. With an invalid, used, expired, or other-email invite it returns 403 with the matching code, and
   the register page shows the matching message in DE and EN.
3. With a valid invite, the account is created, the invite shows `used_at`, a verification email is
   sent, and the user cannot sign in until they verify.
4. Two simultaneous registrations with one invite produce exactly one account.
5. The landing form writes one `access_requests` row and sends **one** email, to the operators.
6. A honeypot or sub-2-second submission, and a submission for an existing account, return the same
   body as a real one and write nothing.
7. A signed-out visit to the confirmation link lands on login; a signed-in USER gets 404.
8. An ADMIN can approve (invite email sent, status `INVITED`) and decline (status `DECLINED`);
   demoting that admin in the database takes effect without them signing out.
9. No landing-page link points at `/auth/register`; the hero and nav say "Zugang anfragen".
10. A `PENDING` request older than 6 h, or a `DECLINED` one older than 48 h, is unreachable at once
    and physically gone within ~1 h (the workflow's run log shows the counts).
11. The full unit and E2E suites pass in CI.

---

## 12. Owner decisions

1. **Retention of `INVITED` requests — decided 2026-10-02:** deleted once the invite is used or
   expires (≤ 14 days). The `tool_gap` answer goes with it; if the owner wants it, they copy it out
   from the confirmation page before then. No export of `tool_gap` is built.
2. **Privacy page text** must state the periods in §4.6 (2.6 §11.2); the legal wording is the
   owner's.

## 13. Out of scope

Admin list view of requests · direct invites without a request (the nullable FK leaves room) · a
CLI to mint invites · `callbackUrl` through the login redirect · skipping verification for invited
users · fixing `reset-password`'s read-then-update token consumption
(benign there — both racers hold the same token and set the same user's password; not changed here)
· Vercel BotID / Firewall rules (#29 option 4; complementary, not needed once the route is closed) ·
the #13 DNS fix itself.
