# Epic 2.6 — Marketing Landing Page (MVP scope)

## Specification

**Phase:** 2 — Core Research Loop
**Deliverable:** A public pre-login one-pager at `/[locale]`, a changelog page, two legal pages, and a
closed-alpha access-request flow that gates registration behind single-use invite tokens.
**Verifiable:** `/de` and `/en` render the landing page for guest and signed-in visitors; the hero CTA
reaches the access form; a submitted request lands in `access_requests` and sends two emails; approving
from the notification link issues an invite token; `/auth/register` refuses a request without a valid
token; `/de/changelog` lists releases from MDX; Lighthouse ≥ 90 on `/de`.

**Scope note.** This is the MVP cut of roadmap Epic 2.6, not its full text. The roadmap lists Homepage,
Features, About, Pricing, Privacy and Terms. This spec ships **one** marketing page plus changelog and the
two legally required pages. Features/About/Pricing are deferred — see §13.

---

## 1. Decisions (locked in brainstorming)

Recorded so the reasoning survives the conversation. Full alternates in `brainstorming.md`.

| #   | Decision         | Choice                                                                                                                                                                                       |
| --- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Audience         | Dual: alpha recruitment (historians, doctoral students, archivists) **and** portfolio/credibility (supervisors, institutes, evaluators)                                                      |
| D2  | Thesis           | **Uncertainty is the feature.** Every section serves this claim                                                                                                                              |
| D3  | Visual substance | Live UI components + diagrammatic SVG. **No raster screenshots**, no image asset pipeline                                                                                                    |
| D4  | Primary CTA      | Request access (waitlist), not open sign-up                                                                                                                                                  |
| D5  | Access model     | Waitlist + single-use invite tokens; **registration closes** as part of this epic (implements #29)                                                                                           |
| D6  | Expressiveness   | "Marketing register": same tokens, added display type tier, scroll-reveal motion. Anti-values from `identity.md` hold — no gradients, no glassmorphism, no animated backgrounds, no autoplay |
| D7  | Hero             | Treatment **C** — centred statement, two CTAs, app frame cropped at the fold                                                                                                                 |
| D8  | Highlights       | Horizontal `scroll-snap` rail on **all** viewports, with peek-of-next-card and real paddle buttons                                                                                           |
| D9  | Panels           | Four: certainty levels · year-only dates · evidence per claim · relations (the relation SVG lives _inside_ panel 4)                                                                          |
| D10 | Root routing     | Landing always renders; nav is session-aware (`Zur App` when signed in). Redirect-signed-in-to-dashboard is a **planned later switch**, not built now                                        |
| D11 | Changelog        | In-repo MDX, one file per release. "Coming next" = three hand-written prose themes, no ticket numbers                                                                                        |
| D12 | Copy             | Claude drafts DE + EN against the platform-skill voice rules; the user edits in place                                                                                                        |
| D13 | Legal            | `Impressum` and `Datenschutz` scaffolded as real routes; legal text supplied by the user                                                                                                     |
| D14 | Co-development   | One open field on the access form (`tool_gap`), not a GitHub link                                                                                                                            |

---

## 2. Technology Stack

No new runtime dependencies except MDX.

| Tool                          | Version                        | Purpose                                                 |
| ----------------------------- | ------------------------------ | ------------------------------------------------------- |
| `@next/mdx` + `@mdx-js/react` | latest compatible with Next 15 | Changelog entries                                       |
| `next/og` (`ImageResponse`)   | built in                       | OG images generated from JSX — no raster pipeline (D3)  |
| Prisma                        | ^6.19.2                        | `AccessRequest` model, `Invite` model                   |
| Zod                           | existing                       | Request validation                                      |
| next-intl                     | existing                       | New `marketing.*`, `changelog.*`, `access.*` namespaces |
| Resend                        | existing                       | Notification + confirmation + invite emails             |
| Upstash rate limit            | existing                       | `src/lib/rate-limit.ts`, reused unchanged               |

---

## 3. Route Structure

New route group, sibling to `(app)` and `(auth)`:

```
src/app/[locale]/(marketing)/
  layout.tsx              MarketingShell — PublicNav + <main> + PublicFooter
  page.tsx                the one-pager               → /de , /en
  changelog/page.tsx      release list + coming next  → /de/changelog
  impressum/page.tsx
  datenschutz/page.tsx
src/app/api/access-request/route.ts        POST — public
src/app/api/access-request/approve/route.ts GET  — signed link, admin only
src/app/sitemap.ts
src/app/robots.ts
```

**`src/app/[locale]/page.tsx` is deleted.** Route groups do not affect URLs, so
`(marketing)/page.tsx` claims `/[locale]`; leaving both files is a build-time route conflict.

`src/auth.config.ts` — `PUBLIC_PATHS` gains `/changelog`, `/impressum`, `/datenschutz`.

**Verified:** the middleware matcher is `/((?!_next|.*\..*).*)` — it excludes `_next` and dotted
paths, **not** `/api`. API routes therefore _do_ pass through `authorized()`, which allows only
`/api/auth/*` and `/api/health` and otherwise falls through to `return isLoggedIn`. Consequences:

- `/api/access-request` (POST, public) **must** be added to the allow-list, or guests are redirected
  to login instead of reaching it.
- `/api/access-request/approve` **must not** be. Leaving it gated means an unauthenticated click on the
  approve link redirects to `/auth/login` — which is the desired behaviour for a link arriving by email,
  not an error. The route additionally checks `role === "ADMIN"` itself.

### 3.1 Session-awareness vs. static rendering

`(marketing)/layout.tsx` is a server component calling `auth()` and passing `isSignedIn` to
`PublicNav`, which swaps _Anmelden / Zugang anfragen_ → _Zur App_. This renders the marketing routes
dynamically.

> **Unmeasured assumption.** Session strategy is JWT, so `auth()` is a cookie decode with no database
> round-trip, and Lighthouse ≥ 90 is expected to hold. **This has not been measured.** Implementation
> must run Lighthouse against `/de` before the epic is called done. If the budget fails, the fallback
> is a fully static page with a client-side nav CTA fetching `/api/auth/session`.

---

## 4. Data Model

### 4.1 `AccessRequest`

Deliberately **not** `project_id`-scoped. This is a documented exception to the roadmap's
"all user-data tables scoped to project_id from day one" rule: these rows exist before any account,
project or membership does, so there is no project to scope them to.

```prisma
model AccessRequest {
  id            String              @id @default(cuid())
  email         String              @unique
  name          String
  institution   String?
  research_area String?
  tool_gap      String?             // D14 — the co-development field
  locale        String              // "de" | "en" — which language to reply in
  status        AccessRequestStatus @default(PENDING)
  consent_at    DateTime            @db.Timestamptz(3)  // privacy consent, explicit
  ip_hash       String?             // anonymizeIp() output; abuse forensics only
  created_at    DateTime            @default(now()) @db.Timestamptz(3)
  reviewed_at   DateTime?           @db.Timestamptz(3)

  invites Invite[]

  @@index([status, created_at])
  @@map("access_requests")
}

enum AccessRequestStatus {
  PENDING
  INVITED
  DECLINED
}
```

### 4.2 `Invite`

Mirrors the existing `EmailConfirmation` / `PasswordReset` shape — hashed token at rest, raw token only
ever in the email link.

```prisma
model Invite {
  id                String    @id @default(cuid())
  email             String
  token_hash        String    @unique  // SHA-256 of the raw token
  access_request_id String?
  expires_at        DateTime  @db.Timestamptz(3)   // 14 days
  used_at           DateTime? @db.Timestamptz(3)   // single-use
  created_at        DateTime  @default(now()) @db.Timestamptz(3)

  access_request AccessRequest? @relation(fields: [access_request_id], references: [id], onDelete: SetNull)

  @@index([email])
  @@map("invites")
}
```

Migration is additive only — no existing table is altered, no backfill, no `USING` clause hazard
(see the timestamptz note in `docs/` and the project memory).

---

## 5. API Contract

### 5.1 `POST /api/access-request` (public)

Order of operations, and each step is a required behaviour, not an optimisation:

1. Anonymise IP via `anonymizeIp()` (`src/lib/security.ts`).
2. `checkRateLimit("access-request:{ip}", 3, 60 * 60 * 1000)` — 3 per hour.
3. Parse body with Zod (§5.2). Reject with field-keyed i18n error codes, matching the register route's
   existing `jsonError` convention.
4. **Honeypot:** a visually hidden `company` field. Non-empty → return the success response without
   writing. No third-party captcha — the page's whole argument is rigour, and a captcha would put an
   external tracker on it.
5. **Timing check:** a `rendered_at` timestamp posted back; submissions faster than 2 seconds are
   treated as the honeypot case.
6. `sanitize()` every free-text field before write (`src/lib/sanitize.ts`).
7. Upsert by email — a resubmission updates the row rather than erroring.
8. Resend: notification to the operator (containing the one-click approve link, §5.3) and a
   confirmation to the requester in `locale`.
9. **Uniform response.** Identical 200 body whether the address is new, already pending, already
   invited, or trapped by the honeypot. Never leak whether an address is known.

### 5.2 Zod schema

```ts
const accessRequestSchema = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
  name: z.string().min(1).max(100).trim(),
  institution: z.string().max(200).trim().optional(),
  research_area: z.string().max(200).trim().optional(),
  tool_gap: z.string().max(2000).trim().optional(),
  locale: z.enum(["de", "en"]),
  consent: z.literal(true), // must be explicitly checked
  company: z.string().max(0), // honeypot — must be empty
  rendered_at: z.number().int(),
});
```

### 5.3 `GET /api/access-request/approve` (operator)

Reached from the notification email. Guarded by **all three** of:

1. Middleware session gate (§3) — an unauthenticated click redirects to `/auth/login`.
2. `requireUser()` from `src/lib/auth-guard.ts` (returns `null` rather than redirecting, so it is
   usable in a route handler) with an explicit `role === "ADMIN"` check.
3. An HMAC signature over `{requestId}.{expiry}` using `AUTH_SECRET`.

Signature alone is not sufficient — notification emails get forwarded, and a leaked link must not grant
approval. Session alone is not sufficient either — any signed-in USER could otherwise guess a request id.

On success: set `status = INVITED`, `reviewed_at = now()`, create an `Invite` (14-day expiry), and
send the invite email containing `/[locale]/auth/register?invite=<raw token>`.

### 5.4 Registration gate (implements #29)

`POST /api/auth/register` gains, **before** any user is created:

- `invite` token required in the body.
- `hashToken(invite)` looked up in `Invite`; must exist, be unexpired, unused, and its `email` must
  equal the submitted email.
- On success the invite is marked `used_at` in the **same transaction** as the user creation, so a
  concurrent double-submit cannot consume one invite twice.
- Missing/invalid/expired/used → `403 INVITE_REQUIRED` with a distinct i18n message per case, so the
  register form can say _"Dieser Einladungslink ist abgelaufen"_ rather than a generic failure.

`RegisterForm` reads `?invite=` from the URL, carries it through submission, and renders a clear
"invite required" state when the parameter is absent.

> **This is a breaking change to a working public flow.** Existing verified users are unaffected —
> the gate is on registration only, never on login. The E2E auth suite creates users through this
> route and **will need an invite fixture**; see §9.

---

## 6. Page Composition

Bands, in order. Numbering matches the approved wireframe.

| Band   | Content                                                                                    | Notes                                                         |
| ------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Nav    | Logo · Funktionen · Changelog · locale · theme · Anmelden · Zugang anfragen                | Session-aware (§3.1)                                          |
| 1      | **Hero** — centred display statement, two CTAs, app frame cropped at fold                  | Treatment C                                                   |
| 2      | **The problem** — one editorial passage, large type, ~40 words                             | Placement is an **open content question** — see §11.1         |
| 3      | **Highlights rail** — four panels                                                          | §7                                                            |
| 4      | **Open development + status** — what works, what's next, and that users decide what's next | Merged band; links to `/changelog`; points at the access form |
| 5      | **Access request form**                                                                    | §5.1                                                          |
| Footer | Evidoxa · Impressum · Datenschutz · Changelog · GitHub · locale                            |                                                               |

**Cut, with reasons recorded:** a standalone relation-graph band (argues a different thesis and fights
band 3 — the diagram survives inside panel 4); a "Für wen" audience band (the access form expresses
audience fit better, by letting the visitor state it).

### 6.1 Highlight panels

All four are verified against `prisma/schema.prisma` as **built and shipping**. No panel may claim
unbuilt behaviour.

| #   | Claim                                                                    | Verified against                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Four certainty levels, per field — not per record                        | `enum Certainty`; `birth_date_certainty`, `birth_place_certainty`, `death_date_certainty`, `death_place_certainty`, `start_date_certainty`, `end_date_certainty`, `location_certainty`, `Relation.certainty` |
| 2   | A year without a month is a complete answer                              | `birth_year`/`birth_month`/`birth_day` nullable triples                                                                                                                                                      |
| 3   | Every claim points at its source — with page reference and transcription | `PropertyEvidence.property`, `.page_reference`, `.quote`, `.raw_transcription`, `.confidence`                                                                                                                |
| 4   | Any entity relates to any other; the relation carries its own certainty  | `Relation`, `RelationType`, `Relation.certainty`                                                                                                                                                             |

> **Explicitly forbidden copy.** Earlier drafts claimed circa dates, decades, date ranges and
> _terminus ante quem_. **None of these exist** — the model has nullable y/m/d triples and nothing
> more. Any copy implying fuzzy date arithmetic is a false claim and must be rejected in review.

---

## 7. Component Architecture

### 7.1 Live-UI reuse strategy

Three options were considered; the hybrid is chosen.

- **(a) Import app components wholesale** — zero drift, but pulls interactive, data-bound components
  into a static page.
- **(b) Marketing-only twins** — static and small, but the page can drift into showing a badge the app
  no longer has. This is exactly the failure D3 exists to prevent.
- **(c) Hybrid — chosen.**

**Reused verbatim** (verified as pure, prop-driven, `"use client"` + `useTranslations` only — no data
fetching, no router, no session, no project context):

- `src/components/research/CertaintyMarker.tsx`
- `src/components/research/CertaintySelector.tsx`
- `src/components/relations/PropertyEvidenceBadge.tsx`
- `src/components/ui/badge.tsx`

**New, marketing-only composition shells** in `src/components/marketing/`:

```
PublicNav.tsx          session-aware CTA
PublicFooter.tsx
Hero.tsx               display statement + CTA pair
HeroAppFrame.tsx       cropped app frame; composes reused leaves
HighlightRail.tsx      scroll-snap container, paddles, live region
HighlightPanel.tsx
RelationDiagram.tsx    inline SVG, themed via currentColor + tokens
EditorialPassage.tsx
OpenDevelopment.tsx
AccessRequestForm.tsx  react-hook-form + Zod, mirrors RegisterForm patterns
ChangelogEntry.tsx
```

Rationale: drift becomes impossible in the certainty visual language — the one thing the page is
actually about — because a props change to `CertaintyMarker` breaks the build. That is the compile-time
guardrail CLAUDE.md prefers over a review checklist.

### 7.2 `HighlightRail` behaviour

- Native `overflow-x: auto` + `scroll-snap-type: x mandatory`, `scroll-snap-align: start` per panel.
- **Peek**: panel width leaves ~12% of the next card visible at every breakpoint, so the fourth panel
  is discoverable without a paddle. This is the mitigation for the rail's one real weakness.
- Paddles are real `<button>` elements with `aria-label` (`marketing.rail.previous` / `.next`),
  disabled at each end, **44 × 44 minimum hit area** on coarse pointers.
- A `aria-live="polite"` region announces "Panel 2 von 4" on change.
- Panels are in DOM order and never `aria-hidden` — horizontal scrolling must not hide content from
  assistive technology.
- **No autoplay, no auto-advance, ever.** (`identity.md` anti-values.)
- With JS disabled it degrades to a plain horizontal scroller that still works.

The 44 × 44 requirement touches open issue **#33** ("touch-target rule implemented nowhere"). This
epic implements it _for the rail paddles only_ and comments on #33; it does not widen into a global fix.

---

## 8. Tokens, Motion, i18n, SEO

### 8.1 Display type tier

Added to `@theme` in `src/styles/globals.css`, labelled as marketing-tier. The app's existing scale is
**not modified**; `--text-4xl` remains the app's ceiling.

```css
--text-display-sm: clamp(2rem, 1.6rem + 2vw, 2.75rem);
--text-display-md: clamp(2.5rem, 1.9rem + 3vw, 3.75rem);
--text-display-lg: clamp(3rem, 2.1rem + 4.5vw, 5rem);
--text-display-xl: clamp(3.5rem, 2.2rem + 6vw, 6.5rem);
/* matched --leading-display-* and --tracking-display-* (negative, −0.03em to −0.04em) */
--section-gap-sm / -md / -lg      /* vertical rhythm between bands */
```

German is the sizing baseline: every display string must be checked against its longest German
compound at 320 px width before the epic is done.

### 8.2 Motion

Scroll-reveal on band entry (opacity + small translate) via `IntersectionObserver`. Everything sits
behind:

```css
@media (prefers-reduced-motion: reduce) {
  /* no transform, no fade, final state immediately */
}
```

The reduced-motion path is a **tested branch**, not an afterthought (§9). No parallax, no pinning,
no scroll hijacking — band 3's mechanism is native scrolling only.

### 8.3 i18n

New namespaces `marketing.*`, `changelog.*`, `access.*` in `messages/de.json` and `messages/en.json`.
Claude drafts both; the user edits (D12). Voice rules come from `skills/platforms/evidoxa.md`
§ Brand Voice — direct, calm, precise; verb-first buttons; no "Oops"; no startup register.

Changelog content: `content/changelog/{version}.{locale}.mdx`. A release missing a locale falls back to
DE with a visible note rather than rendering an empty page.

### 8.4 SEO

- `generateMetadata` per route: title, description, canonical, `hreflang` alternates for de/en.
- OG images via `next/og` `ImageResponse` from JSX — consistent with D3, no raster pipeline.
- `schema.org` `SoftwareApplication` JSON-LD on the landing page.
- `src/app/sitemap.ts` and `src/app/robots.ts` — **neither exists today**.
- No analytics, no tracker, no third-party script of any kind.

---

## 9. Testing Plan

**Unit (Vitest + RTL)**

- `HighlightRail`: paddle enable/disable at ends; live-region text; keyboard reachability; panels not
  `aria-hidden`.
- Reduced-motion branch renders final state with no transition classes.
- `PublicNav` renders _Zur App_ when `isSignedIn`, _Anmelden + Zugang anfragen_ when not.
- `accessRequestSchema`: each field's bounds; `consent: true` required; honeypot must be empty.
- `AccessRequestForm`: validation messages render translated (build the Zod schema _inside_ the
  component with `t()` — the established pattern from the auth forms).
- Invite verification: valid / expired / already-used / email-mismatch each return their own code.
- Register route rejects a request with no invite.

**Mutation check (required, per "Measure, don't infer"):** for the invite gate, remove the check and
confirm the test fails. A guard whose test passes without it is not a guard.

**E2E (Playwright, Chromium + Firefox)**

- `/de` and `/en` render; hero CTA scrolls to the form.
- Rail: paddle advances, announcement updates, fourth panel reachable.
- Access request happy path → row written, uniform response.
- Honeypot submission returns success and writes nothing.
- `/de/changelog` lists releases; footer legal links resolve.
- Registration without an invite is refused; with a valid invite, succeeds.

> **Known baseline, not a regression.** Issue **#61** records that the Playwright suite does not pass
> locally on `main` — 24 Chromium specs fail identically because no client JS runs. E2E green is judged
> **in CI**. A red local run proves nothing about this epic.

**Budgets**

- Lighthouse ≥ 90 on `/de` (performance, a11y, best practices, SEO) — measured, per §3.1.
- `axe` clean on the landing page in both themes.
- Contrast checked on display type in light _and_ dark.

---

## 10. Acceptance Criteria

1. `/de` and `/en` render the landing page; `src/app/[locale]/page.tsx` is gone and no route conflict exists.
2. A signed-in visitor sees _Zur App_; a guest sees _Anmelden_ and _Zugang anfragen_.
3. All four highlight panels are reachable by scroll, by paddle, and by keyboard; the live region announces position.
4. `prefers-reduced-motion: reduce` produces no transitions anywhere on the page.
5. Submitting the access form writes one `access_requests` row and sends two emails.
6. A honeypot or sub-2-second submission returns the identical success body and writes nothing.
7. The approve link, when opened by an ADMIN, sets `status = INVITED` and sends an invite email.
8. `POST /api/auth/register` returns 403 without a valid, unexpired, unused invite matching the email.
9. `/de/changelog` renders every MDX release plus the three "coming next" themes.
10. `/de/impressum` and `/de/datenschutz` resolve and are linked from the footer.
11. Every string renders in DE and EN; no hardcoded literals (cf. open issue #40).
12. Lighthouse ≥ 90 on `/de`, measured and recorded in `progress.md`.
13. No copy on the page claims behaviour absent from `prisma/schema.prisma` (§6.1).

---

## 11. Open Questions

### 11.1 Placement of the editorial passage (band 2)

Whether the page opens on the problem or arrives at it after the hero is deliberately **not** settled
here. It is a content decision that needs real copy to judge, not a wireframe. Resolve during the copy
pass; record the outcome in `progress.md`.

### 11.2 Legal text

`Impressum` and `Datenschutz` ship as routes with structure and styling; the operative legal text is the
user's to supply. Claude will not draft legal text. The privacy page must, at minimum, describe what
`access_requests` stores, why, and the retention period — the form's consent line links to it.

---

### 11.3 Sequencing — RESOLVED: two plans

This spec covers two separable bodies of work: **(A)** the marketing surface (routes, layout, tokens,
rail, changelog, legal, SEO) and **(B)** access requests plus the invite gate on registration (schema,
three API routes, three emails, a breaking change to a working auth flow).

They share only the form component. B touches security-critical code and will attract a different kind
of review than A. The bounded-review rule in CLAUDE.md exists precisely to stop one PR growing past
what a reviewer can hold, and A alone is already a large diff.

**Decided (2026-09-10): two implementation plans and two PRs**, A then B.

- **Part A — #82.** The marketing surface. Ships first, with access-form copy that does **not** yet
  promise a closed alpha, because at that point registration is still open and the claim would be false.
- **Part B — #29.** Access requests and the invite gate. Flips that copy to "geschlossene Alpha" in the
  same PR that closes registration, so the page never claims a gate that does not exist.

The copy hand-off between the two is the deploy-ordering hazard here, and it is why the flip lives in
B's PR rather than A's.

Spec sections by part: **A** = §3, §6, §7, §8; **B** = §4, §5. §9 testing and §10 acceptance criteria
split accordingly — A takes criteria 1–4 and 9–13, B takes 5–8.

---

## 12. Backlog (filed 2026-09-10)

All three new issues verified present on the Evidoxa Backlog board with Status `Todo`.

| Issue   | Role                                                                                                                            | State                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **#82** | **Part A** — public landing page, changelog, legal pages                                                                        | Open, `Todo`                 |
| **#29** | **Part B** — invite-gated registration. Pre-existing issue; commented with the full design rather than opening a near-duplicate | Open, closes on Part B merge |
| #83     | In-app feedback channel for signed-in users. Deferred, with the reasoning for _not_ auto-creating GitHub Issues recorded        | Open, `Todo`                 |
| #84     | Automated "coming next" from the project board, with the filtering rules recorded                                               | Open, `Todo`                 |
| #33     | Commented: the rail paddles implement the 44 × 44 rule in one place; the global gap is unchanged and the issue stays open       | Open                         |
| #61     | Not modified. Referenced in §9 as the reason local E2E red is a known baseline                                                  | Open                         |

---

## 13. Out of Scope

Features page · About page · Pricing · blog · analytics or any third-party tracker · A/B testing
infrastructure · the in-app feedback channel · admin UI for reviewing access requests (approval is a
one-click email link in v1) · automated roadmap generation · hero treatments A and B (recorded as
documented alternates in `brainstorming.md`) · a standalone relation-graph band · a "Für wen" band ·
redirecting signed-in visitors to `/dashboard` (planned later switch, D10) · a global fix for #33.
