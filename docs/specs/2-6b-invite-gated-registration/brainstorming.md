# Epic 2.6 Part B — Invite-gated registration (#29)

## Brainstorming

**Goal:** Define every implementation detail so the specification leaves no ambiguity.

Most of this design was settled in `docs/specs/2-6-marketing-landing/brainstorming.md` and §4–§5 of
that specification (2026-09-10). Those decisions are **not** re-asked here. This file records only
the questions that re-measuring the current code on 2026-10-02 reopened — chiefly because Epic 2.7
changed `authorized()` after the Part B design was written, so parts of that design no longer hold.

---

## Round 1 — What measurement reopened

### Q1 — How does the operator approve a request?

2.6 §5.3 specified a `GET /api/access-request/approve?…` link that writes on click, relying on
"an unauthenticated click redirects to `/auth/login`". That premise is now false: since #88/#128,
`authorized()` answers an anonymous `/api/*` request with a **401 JSON body**
(`src/auth.config.ts:138`), never a redirect. The operator would see raw JSON. Independently, a GET
that writes is followed by mail-security link scanners and prefetchers.

```
2.6 design                         proposed
──────────                         ────────
email ─GET─▶ /api/…/approve        email ─GET─▶ /[locale]/admin/access-requests/[id]   (page, reads only)
              writes on click                     │ shows the request, Approve / Decline
                                                  └─POST─▶ /api/admin/access-requests/[id]  (writes)
```

- [ ] Keep the GET link — smallest diff, but shows raw JSON when signed out and writes on prefetch
- [x] Confirmation page + POST — **recommended** — reads on GET, writes only on an explicit click;
      the page lives under a gated prefix so a signed-out operator gets the normal login redirect
- [ ] Server Action on the page — no server action exists anywhere in `src/` yet; introducing the
      first one inside a security change adds a new pattern to review for no gain over a route

### Q2 — What makes someone an operator?

2.6 said "`role === "ADMIN"` on the session". But `token.role` is written **only at sign-in**
(`src/auth.config.ts:43–45`, inside `if (user)`), so a session role is as stale as the sign-in. And
#29 records **0 ADMIN accounts in production** as of 2026-08-09.

- [ ] Session role — stale: a demoted admin keeps approving until their 30-day session ends
- [x] `User.role = ADMIN`, re-read from the database on every operator request — **recommended** —
      the column already exists, no new env var, demotion takes effect immediately
- [ ] `OPERATOR_EMAILS` env allow-list — binds at deploy time, invisible from the data, one more
      production variable to keep in sync across environments

### Q3 — Who receives the "new request" notification?

- [x] Every `ADMIN` user with a verified email, queried at send time — **recommended** — follows
      from Q2; nothing to configure; zero admins is detectable and logged
- [ ] A dedicated env var (`ACCESS_REQUEST_NOTIFY_EMAIL`) — a second source of truth for "who is
      the operator"

### Q4 — Does the requester get a confirmation email?

2.6 sent two emails per request. The confirmation goes to an **unverified address typed by a
stranger** — a public form that sends mail from our domain to any address. Rate limiting bounds it
per IP; it does not stop a distributed run, and our sending domain is already spam-scored (#13,
no SPF record, re-measured 2026-10-02).

- [ ] Keep it — reassures the requester
- [x] Drop it; confirm on screen only — **recommended** — removes the mail-relay surface entirely;
      the invite email itself is the first mail they get, and it is one they asked for

### Q5 — Does a registration via invite still need email verification?

The invite token proves the holder received mail at that address — _or_ that someone forwarded it.

- [x] Keep verification — **recommended** — a forwarded invite then yields an account its holder
      cannot sign into without the invitee's mailbox; zero new code; the issue explicitly asks
      that the verification flow stay intact
- [ ] Mark verified on redemption — one fewer email, but a forwarded link becomes a working account

### Q6 — Decline in v1?

- [x] Approve **and** Decline on the confirmation page — **recommended** — the `DECLINED` status
      already exists in the 2.6 model; without a button it is unreachable except by SQL
- [ ] Approve only

### Q7 — Signed-out operator clicking the link

The middleware login redirect carries no `callbackUrl` (`src/auth.config.ts`, end of
`authorized()`), so after signing in the operator lands on `/dashboard`.

- [x] Accept it in v1 — **recommended** — the operator holds a 30-day session, so this is the rare
      case; the email says "sign in, then open this link again". Adding `callbackUrl` would change
      a cross-cutting gate and lean on `LoginForm`'s `callbackUrl` validation, which has not been
      reviewed for this purpose
- [ ] Carry `callbackUrl` through the middleware redirect

### Q8 — Keep the HMAC-signed link?

2.6 required session + ADMIN + HMAC because the link itself wrote. With Q1–Q2 the link only
_displays_, and every write requires a database-confirmed ADMIN.

- [x] Drop the HMAC — **recommended** — nothing it protects remains unprotected; one less secret-
      derived value to get wrong
- [ ] Keep it as defence in depth

---

## Round 2 — Owner's answers (2026-10-02)

- Q1–Q8: no objection raised; the recommended options stand.
- **Operator:** an account was created by the owner and is to be promoted to `ADMIN` (address not
  recorded in this public file).
- **Retention:** `DECLINED` kept 48 hours, `PENDING` 6 hours.

### Q9 — How is a 6-hour retention enforced on a Hobby plan?

Measured: the Vercel team is on `hobby`; Vercel documents Hobby crons as daily at most.

- [ ] Vercel Cron, daily — rows outlive their retention by up to a day
- [ ] Purge on write only — nothing runs while there is no traffic
- [x] Read-time expiry + hourly GitHub Actions purge — **recommended** — read-time makes "never used
      after expiry" exact; the hourly job bounds physical deletion; GitHub Actions is already the CI
