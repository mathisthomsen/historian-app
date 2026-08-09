# ADR-0001 — When a pre-release dependency is acceptable

**Status:** Accepted · **Date:** 2026-08-09
**Context:** prompted by a critical `next-auth@5.0.0-beta.30` advisory on a live public app

## The question

Is it generally safer to depend on the latest _stable_ release rather than a
pre-release? Specifically: should we have moved `next-auth` back to v4 (`latest`)
instead of forward to another v5 beta?

## Decision

**Stay on `next-auth` v5 (currently `5.0.0-beta.32`). Do not revert to v4.**

More generally: **a pre-release is acceptable when it is the vendor's recommended
path for our architecture and is actively maintained. The version string is not
the criterion — the maintenance signal is.**

## Why the intuition doesn't hold here

The instinct that "stable is safer" is usually right, but it assumes the stable
line is a _supported alternative_ receiving _better_ security attention. For
`next-auth` in August 2026, neither holds. Evidence from the GitHub Advisory
Database on 2026-08-09:

| Advisory            | Severity | Affects v5 line           | Affects v4 line                |
| ------------------- | -------- | ------------------------- | ------------------------------ |
| GHSA-8fpg-xm3f-6cx3 | Critical | ≤ beta.31 → fixed beta.32 | —                              |
| GHSA-7rqj-j65f-68wh | Critical | ≤ beta.31 → fixed beta.32 | 4.10.3–4.24.14 → fixed 4.24.15 |
| GHSA-xmf8-cvqr-rfgj | High     | ≤ beta.31 → fixed beta.32 | 4.0.6–4.24.14 → fixed 4.24.15  |
| GHSA-x445-f3h2-j279 | Moderate | ≤ beta.31 → fixed beta.32 | ≤ 4.24.14 → fixed 4.24.15      |

Three of the four hit **both** lines and were patched **on the same day** in both.
v4 and v5 are the same Auth.js core; "stable" and "beta" here are release-channel
labels on one shared codebase, not different levels of scrutiny. Moving to v4
would have inherited the same bug classes while buying nothing.

Two further points specific to us:

- **v4 is not a supported alternative for this architecture.** The app is built on
  v5's App Router patterns — the `auth()` helper, `NextAuth(config)` returning
  route handlers, and the Edge-safe/Node split across `src/auth.config.ts` and
  `src/auth.ts` that lets `middleware.ts` run without Prisma or bcrypt. v4 has no
  equivalent split. Reverting is a rewrite of the auth layer, not a version change.
- **A large refactor of the auth layer is itself the bigger risk.** Trading a
  patched advisory for a hand-rolled reimplementation of session handling on a
  live public app is a bad exchange.

## Criteria to apply next time

Prefer the latest stable release by default. Accept a pre-release only when
**all** of the following hold; re-check at each major dependency review:

1. **No supported stable line exists for our architecture** (as with v4 vs. the
   App Router), or migrating to it costs more risk than it removes.
2. **The vendor treats the pre-release as the recommended path** — it is what the
   official docs target, not an experimental branch.
3. **Security response is demonstrably active** on the pre-release channel: recent
   advisories have real patched versions, published promptly.
4. **The pin is exact, not a range.** `next-auth` is pinned to an exact version
   (no `^`) precisely because pre-release channels can ship breaking changes in a
   patch segment. Keep it that way.
5. **Someone is watching.** `pnpm audit` runs and is read; advisories on the
   pinned package are triaged rather than accumulating.

If a criterion stops holding — the beta stalls, security fixes lag, or a stable
line gains App Router support — revisit this ADR rather than drifting.

## Consequences

- `next-auth` stays pinned exactly; upgrades are deliberate, never automatic.
- New advisories against it are triaged individually. "It's a beta, so this is
  expected" is not an acceptable response.
- This reasoning is dependency-specific. It does **not** generalise into "betas are
  fine" — for any other package the default remains the latest stable release.
