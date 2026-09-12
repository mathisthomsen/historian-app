# Epic 2.6 — Brainstorming Record

Session: 2026-09-10. Captures what was considered and rejected, so later work does not
re-derive it. The decisions themselves live in `specification.md` §1.

---

## Alternate hero treatments (kept deliberately)

Hero **C** was chosen, but A and B were close and are explicitly retained as candidates for a second
landing page or a later A/B test. Do not delete this section.

### A — "The claim, annotated"

The headline _is_ the demo: a real historical statement with its uncertainty marked inline using the
live certainty palette.

> Geboren **1812**[wahrsch.], vermutlich in **Baden**[möglich], Vater **unbekannt**[unbekannt].

- **Strengths:** nothing else on the web looks like this; needs no screenshots; states the thesis in
  two seconds; the certainty palette does the work rather than decorating.
- **Risks:** a strong stylistic bet with no fallback; the marked phrases must reflow sanely in DE and
  EN, whose phrase lengths differ substantially; inline `<mark>`-style treatment needs careful
  screen-reader handling so the annotations are announced, not skipped.

### B — "Statement left, live record right"

Claim and CTA on the left; a real Evidoxa person record (Kaspar Hauser, with certainty pills on birth
date, birth place, death date, father, plus an evidence count) on the right.

- **Strengths:** immediately legible; reads as "this is software that exists"; the safest of the three.
- **Risks:** it is the layout every SaaS product page uses — competent rather than memorable, which
  works against the portfolio half of the audience.

### C — chosen

Centred display statement, two CTAs, app frame cropped at the fold so scrolling is rewarded. Most
literally Apple; maximum calm and space. Its risk — that the app frame is the only proof and must be
handsome at every width — is accepted and becomes a responsive-testing obligation.

---

## Rejected options, with reasons

| Considered                                           | Rejected because                                                                                                                                                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pinned/scroll-driven highlights stage                | Hijacks scroll — the "startup energy" `identity.md` explicitly warns off. Fragile on short viewports. Needs a full non-pinned fallback anyway                                                                                        |
| Vertical alternating stack instead of a rail         | Most accessible option, but it is not a slider, and the slider was the explicit ask                                                                                                                                                  |
| Rail on desktop / stack on mobile                    | Two mechanisms to build, test and keep in sync; Apple keeps the rail horizontal on mobile and it works                                                                                                                               |
| Raster screenshots captured via Playwright           | 8–16 variants (light/dark × de/en × desktop/mobile) that go stale on every UI change, plus a re-capture script. Live components achieve the same proof without rot                                                                   |
| Standalone relation-graph band                       | Argues "everything connects", which is _not_ the chosen thesis, and competes with the highlights band. The diagram survives inside panel 4                                                                                           |
| "Für wen" audience band                              | The section every product page has and nobody reads. Replaced by the open-development band; audience fit is expressed by the visitor in the access form instead                                                                      |
| Open registration with a "Create account" CTA        | Would make the waitlist theatre — `/api/auth/register` has no gate today, so the form would be bypassable in two clicks                                                                                                              |
| Soft registration (real `User` row, admin-activated) | Puts new state on the security-critical auth path; stores password hashes and PII for strangers who may never be approved; no natural home for the `tool_gap` field; trends toward needing an admin UI quickly                       |
| Auto-creating GitHub Issues from a feedback form     | Auto-created issues arrive without the `priority:`, `area:`, type label and board Status that CLAUDE.md requires — they would degrade the backlog rather than feed it. Discussions, or a DB table plus Resend, are the right targets |
| Changelog generated from GitHub Releases             | Release notes are English-only and engineering-toned; build-time network dependency                                                                                                                                                  |
| "Coming next" generated from the project board _now_ | Deferred by decision. Wanted eventually, with rules: separate features from bugs, never surface anything security-labelled                                                                                                           |
| Third-party captcha on the access form               | Puts an external tracker on a page whose entire argument is rigour. Honeypot + timing check instead                                                                                                                                  |

---

## Corrections made during the session

Recorded because each was a claim that would have shipped as false.

1. **Fuzzy dates.** Draft panel copy promised "Jahr, Jahrzehnt, Zeitraum, terminus ante quem".
   `prisma/schema.prisma` has nullable `year`/`month`/`day` triples and nothing else — no circa, no
   ranges, no t.a.q. The honest claim is "a year without a month is a complete answer".
2. **The backlog page.** Mid-session it was assumed the dedicated page would show the backlog. What
   had actually been decided was MDX for the _changelog_ (shipped releases). The forward-looking half
   was still open and was decided separately.
3. **Registration is open.** Assumed gated; measured otherwise — `POST /api/auth/register` has rate
   limiting and no invite check, and `/auth/register` is in `PUBLIC_PATHS`. This changed the access
   decision from "which table" to "does this epic close registration".

---

## Visual companion artefacts

Mockups from the session are in `.superpowers/brainstorm/` (gitignored, local only):
`hero.html`, `highlights.html`, `composition.html`.
