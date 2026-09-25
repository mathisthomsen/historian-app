# Specification — Epic 2.7: Session & Authorization Hardening

**Status:** Draft · **Date:** 2026-09-24
**Roadmap:** [`docs/strategy/roadmap.md`](../../strategy/roadmap.md) § Epic 2.7
**Issues:** #103, #88, #27 · **Advisories:** GHSA-h32c-m6mx-pmw6, GHSA-g6gc-49hx-h4jr

> **Disclosure note.** This repository is public and this document is published. Everything
> below is stated as class, impact and fix. Reproductions live in the two advisories above.
> Do not copy them into this file — see `CLAUDE.md` § "Security findings in a public repo".

## Why this epic exists

The product is live and public. Three `priority: high` defects sit between what Epic 1.3
documents and what the running system enforces. This epic was pulled ahead of Phase 3 during
the September 2026 grooming pass on the grounds that the open backlog is Phases 1–2's unpaid
cost, and these are the most expensive items in it.

## Two measurements that changed the prescribed fix

The roadmap originally prescribed "a denylist of revoked session/`jti` ids". **That fix would
not have closed the vulnerability.** Measured 2026-09-24 against the installed `next-auth`:

1. **next-auth already issues `jti`, `iat` and `exp` on every token.** No new claim is needed.
   (Probe: `encode()` then `decode()` a token; the claim set is `exp, iat, id, jti, role`.)
2. **`jti` is regenerated on every re-encode — and re-encode happens on every session read, not
   only at `updateAge` rotation.** Two consecutive reads of the same session, seconds apart,
   produced different `jti`s (and different `iat`s). `authConfig.session.updateAge` (24h) governs
   nothing about `jwt.encode`'s own behaviour; that call is unconditional in
   `@auth/core`'s JWT-strategy session action and reruns on every request.

Consequence: a `jti` denylist revokes only the _most recently issued_ token. A token captured
earlier in the same session carries a different `jti`, is not on the list, and stays valid for
the remainder of its 30-day `maxAge`. That is exactly the attack GHSA-h32c-m6mx-pmw6 describes.

**Therefore: revoke by issue-time, not by token identity.**

**This model mattered beyond the `jti` decision above.** Believing re-encode happened only
daily is also what made `token.iat` look like a stable authentication-time value worth comparing
against. It is not: since re-encode happens on every read, `iat` is overwritten with the current
time on every read too. A whole-branch review measured this directly and found the branch had
built its revocation check on `token.iat` — the exact same wrong model, reapplied to the fix
itself. See § 1's Comparison note below for the corrected field.

## Locked decisions for this epic

| #   | Decision                                                       | Rationale                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Revocation is **per user, by issue-time**                      | Survives `jti` rotation; invalidates tokens issued before logout regardless of how many times the session rotated                                                                                                                                                                                                                                                                                         |
| 2   | Redis unavailable ⇒ **fail open**                              | Failing closed would make a Redis blip a site-wide forced logout. The exposure during an outage is today's behaviour, not a regression. Note this is the **opposite** of `src/lib/rate-limit.ts:54`, which fails _closed_ — deliberately: refusing a rate-limited request costs one request, refusing a session costs every logged-in user. Same dependency, different blast radius, so different default |
| 3   | Checked in **edge middleware, on every authenticated request** | Complete coverage of pages and API routes                                                                                                                                                                                                                                                                                                                                                                 |
| 4   | Signing out signs that user out **on all devices**             | Accepted blast radius. Per-device revocation would need our own `sid` carried across every refresh path, and a path that silently drops it reopens the hole                                                                                                                                                                                                                                               |

Decision 4 is a deliberate product trade-off, not an implementation shortcut.

**Clock skew is the one path that is not fail-open (added 2026-09-25).** The floor
(`revokeSessionsBefore`) is stamped using the _revoking_ instance's clock; `authTime` is stamped
by the _signing_ instance's clock at that user's next login. If the revoking instance's clock
runs ahead of the signing instance's, a legitimate fresh login can carry an `authTime` that
reads as older than the floor, and `isSessionRevoked` correctly (from its own point of view)
reports it revoked — refusing a real, freshly-authenticated user. This is bounded by however far
the two clocks actually diverge, and self-corrects once wall-clock time on the signing instance
catches up to the floor. Before the `authTime` correction above, this failure mode was masked:
comparing against `iat` meant every re-encode re-admitted the session anyway, so a skew-induced
false revocation would silently heal itself on the next request. After the correction it no
longer does — a session caught by clock skew stays refused until the skew resolves. No numeric
bound on acceptable skew is set by this epic; infrastructure clock sync (NTP) is assumed, as it
is everywhere else in the stack.

---

## 1 — Server-side session invalidation (#103)

**Defect class.** Under the JWT strategy, `signOut` clears the cookie client-side. Nothing
server-side refuses a token captured beforehand, so it remains valid until `exp`.

**Fix.** A Redis-backed issue-time floor per user.

- **Key:** `session:revoked-before:<userId>` · **Value:** unix seconds · **TTL:** 30 days
  (equal to `maxAge` — past that, no token issued before the floor can still be valid).
- **Write:** a `signOut` event. `auth.ts` has no `events` block today; one is added.
- **Read:** `authConfig.callbacks.session`.
- **Comparison:** revoke when `token.authTime < floor`, strictly, falling back to `token.iat`
  when `authTime` is absent. Ties are **not** revoked, and the floor is written as the logout
  instant — so a login in the same second as a logout is not caught by its own revocation. The
  residual window is under one second and is accepted.
  **Corrected 2026-09-25:** the field compared here was originally `token.iat`. A whole-branch
  review measured that `@auth/core`'s JWT-strategy session action calls `jwt.encode` — and
  therefore re-stamps `iat` to the current time via jose's `.setIssuedAt()` — on _every_ session
  read, not only at `updateAge` rotation (see the corrected measurement above). A revoked cookie
  compared against `iat` was refused once, came back from that same response with a freshly
  stamped `iat`, and was admitted on every request after that — escaping the revocation this
  section exists to provide. `authTime` is a separate claim, stamped once in `callbacks.jwt` at
  sign-in (the only call where `user` is defined) and never rewritten, so it survives re-encode
  intact. The `?? iat` fallback exists only so sessions already live before this correction
  shipped are not misread as revoked; they age out within `maxAge` (30 days) like any other
  legacy token.
- **Missing or malformed `iat`:** fail open (decision 2) but log at error level. The probe
  showed `iat` is always present, so its absence means an assumption has broken and should be
  loud rather than silent. (This still applies to the `authTime ?? iat` fallback value as a
  whole: if neither is a usable number, `isSessionRevoked` fails open and logs — see the clock
  skew note below for the one case where fail-open does not hold.)
- **Invalidation mechanism:** when the compared issue-time is older than the floor, **`user` is
  removed from the returned session**. `requireUser()`, `requireUserOrRedirect()` and
  `authorized()` all test `session?.user`, so one action invalidates every consumer.

**Why that placement.** `src/auth.ts:155` delegates to `authConfig.callbacks.session` before
adding `attachProjectId`, so a single implementation covers both the Edge middleware and every
Node-side `auth()` call. **Corrected 2026-09-25:** the supporting measurement previously recorded
here — "`jwt` runs only on sign-in and on `updateAge` rotation" — is false; `callbacks.jwt` fires
on every session read, same as `session`. The real reason the check cannot live in `jwt` is that
`user` is only defined there at sign-in, so a check placed in `jwt` would see `user` as `undefined`
(and therefore nothing to invalidate) on every ordinary page request. `session` has no such gap:
it runs on every `auth()` call and always has the token to compare.

**Edge-safety constraint — load-bearing.** Nothing currently imports Redis into the Edge path,
and `src/lib/env.ts` parses `process.env` through Zod **at module scope**. If that throws under
the Edge runtime it takes middleware down entirely, which is worse than the defect and is _not_
a fail-open outcome. Therefore the revocation module:

- reads `KV_REST_API_URL` / `KV_REST_API_TOKEN` (falling back to `UPSTASH_REDIS_REST_*`)
  **inside the function**, never at module scope;
- must not import `src/lib/env.ts` or `src/lib/redis.ts` — it constructs its own
  `new Redis({ url, token })` from `@upstash/redis` inside the function, which is HTTP-based
  and therefore Edge-compatible;
- wraps every Redis interaction in `try/catch` and returns "not revoked" on any error.

Fail-open must be structural. A module that cannot be imported cannot fail open.

**Also revoke on:** password reset completion and password change. A credential change should
invalidate sessions minted before it. Same mechanism, no extra machinery.

## 2 — Make `authorized()` gate requests (#88)

**Defect class.** next-auth honours `authorized()`'s return value only when it is a `Response`.
`src/auth.config.ts` returns a boolean, which is silently discarded, so `PUBLIC_PATHS` has no
runtime effect. **No user data leaks** — `requireUserOrRedirect()` and the API routes' own
guards still hold — but the allow-list is dead code and a future page that forgets its own
guard has nothing behind it.

**Fix.** Return a `Response`, with two shapes:

| Request                                | Response                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Page, unauthenticated, non-public      | `NextResponse.redirect` → `/{locale}/auth/login`, preserving the locale already present in the path (default `de`) |
| API route, unauthenticated, non-public | `401` JSON — never a redirect                                                                                      |

The split is required: `isPublic` exempts only `/api/auth` and `/api/health`, so a single
redirect response would make every unauthenticated API call answer with a login redirect.

Public paths and authenticated requests continue to return `true` so the request proceeds to
the middleware handler and next-intl.

## 3 — Root-cause TC-AUTH-13 (#27)

The logout E2E flaked once in CI, rendering an authenticated dashboard immediately after
`signOut` had navigated away. The leading theory is the same client-side meta-refresh mechanism
as #88.

**This must be confirmed, not assumed.** After #88 lands, re-run TC-AUTH-13 and state which
explanation the evidence supports. The alternative reading — a session outliving `signOut` — is
the more serious one, and "it stopped failing" is not a root cause.

## 4 — Session fixation check

Verify next-auth issues a fresh session identifier on login rather than reusing a
pre-authentication one. Given `jti` rotates on every encode and login mints a new token, this
is _expected_ to already hold — which is precisely why it gets measured rather than asserted.

Record the measurement. If it holds, the outcome is a test that would fail if it stopped
holding.

## 5 — Regression coverage

- **Unit:** the issue-time comparison — `iat` older than the floor, newer, exactly equal (not
  revoked), and no floor present at all; Redis
  error ⇒ fail open; a missing or malformed `iat` ⇒ fail open with the reason logged.
- **Unit:** `authorized()` returns a redirect `Response` for an anonymous page request, a `401`
  for an anonymous API request, and `true` for public paths and authenticated requests.
- **E2E:** a permanent guard automating GHSA-h32c-m6mx-pmw6's procedure. The procedure stays in
  the advisory; the test file may reference the GHSA id but must not restate the steps in a
  comment.
- **E2E:** an anonymous request to a protected route produces a real HTTP redirect, not a `200`
  with a client-side meta-refresh.

## Acceptance criteria

1. A token issued before `signOut` is refused afterwards; a token issued after a subsequent
   login is accepted.
2. Revocation survives session rotation — a token from earlier in a rotated session is refused.
3. With Redis unreachable, authentication continues to work and the failure is logged.
4. An anonymous request to a protected page returns an HTTP redirect to the locale-correct
   login page. An anonymous request to a protected API route returns `401`.
5. Public paths remain reachable anonymously, in both locales.
6. TC-AUTH-13 passes 20 consecutive CI runs, with a stated root cause for the original flake.
7. The fixation property is measured and covered by a test.
8. `pnpm test`, `pnpm lint` and `pnpm build` pass.

## Out of scope

- Shortening `maxAge` or introducing refresh tokens. That is the structural fix for the size of
  the window and belongs in its own epic.
- Per-device revocation (decision 4).
- Any change to the login, registration or password-reset **flows** themselves; this epic
  changes only what happens to a session afterwards.
