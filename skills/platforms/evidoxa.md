# Platform Skill: evidoxa

This file overlays the universal UX skills with evidoxa-specific definitions. It is loaded
by `agents/ux-reviewer.md` (and `content-designer` / `information-architect`) when the project's
`CLAUDE.md` declares this platform as active.

Fill the slots below. Sections tagged **(code)** can be auto-derived from the repo by `/ux-platform`;
**(judgment)** sections need human or spec input. Leave any slot you cannot fill as an explicit
`TODO —` marker rather than guessing — an honest TODO is better than an invented fact. Each section
header names the skill criterion that consumes it, so the overlay stays correctly wired.

**Stack:** Next.js 15.5 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4 _(code)_

## User Types (heuristics.md N8 / N7; cognitive-walkthrough.md goals) _(spec — docs/design-system/01-ux/research.md §2.4)_

| User type                                                | Density profile                                                                          | Friction profile                                                                                | Conventions                                                                                                                              |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Faculty leader (e.g. project PI reviewing others' work)  | Low — short 15–30 min sessions, reviews rather than creates; "wants clarity at a glance" | Low tolerance for complexity — frictionless, progressive disclosure, dashboard/export-first     | Evaluative use of certainty (checking others' assessments); supervisory, asynchronous review                                             |
| Student / early-career researcher (primary data creator) | High — long 2–4 hr sessions, high entry volume                                           | High tolerance for complexity — power-user, keyboard-first (command palette, shortcuts)         | Generative use of certainty during entry; source-first workflow (source → entities, not the reverse)                                     |
| Archivist / collection manager                           | Moderate — 1–2 hr methodical sessions, source cataloging + authority maintenance         | High tolerance for familiar (archival) paradigms, low for unfamiliar ones — standard disclosure | Conservative certainty use (documented fact over inference); needs structured reference fields (archive/fond/series/item), not free text |

Default when not specified: `student / early-career researcher` (the primary data-entry persona; the
research doc treats this as the dominant day-to-day workflow the interface must not add friction to).

## Mental Model Rule (heuristics.md N2) _(spec — docs/design-system/01-ux/research.md §3.1, §3.5; docs/design-system/02-brand/identity.md §2.5)_

| Surface                                                     | Rule                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Any field carrying a claim (person/event/source attributes) | Certainty (Certain/Probable/Possible/Unknown) and evidence count must be visible at every level without a hover or click — never hidden behind interaction. A high-certainty claim with zero evidence must read as a visible warning state (dashed border + warning color, "Unevidenced"), not a neutral default. |
| Soft-deleted records (Person/Event/Source/Relation)         | Deletion is not silent removal — the "deleted" state must be surfaced and recoverable through clear UI, proportional to the friction already required to trigger it (confirmation dialog).                                                                                                                        |
| EntityActivity / audit log tabs                             | Must not be buried — accessible, scannable, filterable (by user, entity type, date range, action). This is the primary trust mechanism for supervisory review (faculty-leader persona); do not treat it as a low-priority "last tab."                                                                             |
| Attribution (`created_by_id`, edit history)                 | Must surface automatically and persistently on every record — who created/changed it and when — not require a click into history.                                                                                                                                                                                 |

If a surface-version dimension does not apply, the agent passes `not-applicable` and skips this check.

## Tracking Attributes (post-code; accessibility.md does NOT cover) _(elicited — 2026-08-09)_

TBD — explicitly out of scope for the current iterations. No analytics stack is adopted; this section
stays a no-op check until at least beta. Revisit once an analytics stack is chosen — fill in the
required `data-*` attributes and the severity of a missing one (per `shared/severity-rubric.md`) then,
not before.

| Attribute    | Allowed values |
| ------------ | -------------- |
| {{ data-* }} | {{ values }}   |

## Internationalization _(hybrid)_

Primary target: `de` (German) — the default locale, and the UI language the personas most consistently
prefer ("German UI strongly preferred" for the archivist; "German UI preferred" for the faculty leader)
_(spec — docs/design-system/01-ux/research.md §2.4 persona matrix)_.
Detected locales (from i18n config): `de` (default), `en` _(code — src/i18n/routing.ts, localePrefix: "always")_.
Secondary targets: `en` — content fields (names, transcriptions, notes) accept any language regardless
of UI locale; no spell-check/language-detection enforcement on content _(spec — research.md §3.6)_.
Expansion note: German strings run ~20–30% longer than English; every interactive element (buttons,
tabs, sidebar items) must be sized to the German baseline, not truncated — e.g. button max 24ch
("Beziehung erstellen" = 22ch), sidebar nav max 20ch ("Beziehungstypen" = 16ch + icon). Buttons widen
rather than truncate; entity names never truncate on their own detail page
_(spec — docs/design-system/02-brand/identity.md §3.6)_.

## Market Profile _(elicited — 2026-08-09, informed by docs/design-system/01-ux/research.md and docs/specs/ai_aided_roadmap.md)_

Declared target markets and where their UX norms diverge from the universal Western-default the skills
assume.

Primary market: **DACH** (Germany / Austria / Switzerland) — academic and archival institutions. This
is a declared decision, not an inference from persona language preference alone: the personas'
demographics, quotes, and workflows in `research.md` §2 describe this audience specifically, and the
locked AX-roadmap principles (`ai_aided_roadmap.md`) are written against the same audience's AI
skepticism. No secondary market is declared.

| Market | Density norm                                                                                                                                                       | Color semantics                 | Trust signals | Payment order                                                                      | Name/Address order                                                                                                                                                                                                                                                                     | Consent model                                                                                                                                                                                                                                                                                                                                                | Reading dir      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | ------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| DACH   | High — denser than the Western-SaaS default is expected and should not itself be flagged as a finding (research.md §3.7, persona "tolerance for complexity" table) | EU/Western default, no override | See below     | EU/Western default, no override — no payment/checkout flow exists in the app today | `[Titel] Vorname [Partikel] Nachname` display (e.g. "Prof. Dr. Margarethe Engel", "Johann von Dalberg"); sort key ignores nobiliary particles (`von`/`zu`/`van`/`de`) — "von Dalberg" sorts under D; academic titles are a separate optional field, never part of the sortable surname | GDPR via institutional data-processing basis (DPA) — the app is logged-in/institutional, not a public site with anonymous visitors, so no cookie-consent banner is required today; `anonymizeIp()` (HMAC-SHA256) is already a GDPR data-minimization measure. A consent banner becomes necessary only if a public-facing marketing site is added (Epic 2.6+) | ltr (EU default) |

**Trust signals — detail (this audience is digital-skeptic, AI-skeptic, and protective of hands-on
scholarly work with primary materials):**

- Never frame a feature as "AI-powered" or "smart" in copy without also surfacing what grounds it. The
  locked AX-roadmap principle: "the AI is a Transparent Research Assistant, never an author" — every
  agent-origin datum must carry a visible, non-removable `created_via: AGENT` badge distinct from
  human-entered data (`ai_aided_roadmap.md`), never blended silently into a record.
- Machine suggestions are never auto-applied — they require an explicit human ACCEPT (the locked
  "Approval gate" decision) and agents never write directly to an entity.
- Human attribution stays visibly primary ("Created by X on date" on every record) — required by the
  Mental Model Rule above; for this audience it doubles as a trust signal, not only an audit feature.
- Data sovereignty / no lock-in is a standing signal, not a one-time claim — structured export must stay
  discoverable (the same fact behind the archivist persona's "lock-in is unacceptable" pain point,
  research.md §2.3).
- No dark patterns, gamification, or persuasive design — already a brand anti-value
  (identity.md §1.4); for a skeptical audience this is a trust requirement, not only a tone preference.

The five market-conditional skill clauses (`visual-design.md` V2, `heuristics.md` N8,
`forms-and-input.md` F5, `ethics.md` E4, `content-design.md` C1) fire against this row when reviewing
evidoxa surfaces.

## Brand Voice (content-design.md C1) _(spec — docs/design-system/02-brand/identity.md §1.3, §1.4)_

**Tone:** Direct, calm, precise. Never apologetic ("Oops!"), never robotic ("Error 422"). System
messages state what happened, then what the user can do about it.

- Good: "The source could not be saved. Your changes are preserved — try again."
- Bad: "Oops! Something went wrong." / "Error: SAVE_FAILED. Contact administrator."

**UI labels:** Concise, professional, domain vocabulary used without explanation (e.g. "Gewissheit" /
certainty is a first-class term, not a marketed feature). Buttons are verb-first ("Erstellen"/"Create",
"Bearbeiten"/"Edit", "Löschen"/"Delete") — never "Submit", "OK", or "Go". Empty states: one sentence of
context, one clear action (e.g. "No sources recorded yet. Create your first source.").

**Tooltips/help text:** Instructive but brief; assume the user is intelligent and professionally
trained — explain the distinction (e.g. diplomatic vs. normalized transcription), don't over-explain
the obvious.

**Anti-values (what Evidoxa is NOT):** not flashy (no gradients/glassmorphism/animated backgrounds),
not cold (warm neutrals, not clinical white or blue-grey), not simplistic (density is a feature, but
organized, never chaotic), not patronizing (no onboarding carousels, gamification, or achievement
badges), not disposable (no trend-chasing visual language).

Five brand attributes for tone calibration: **Rigorous** (every datum is a claim requiring
justification), **Lucid** (clarifies rather than complicates), **Enduring** (stable, unhurried, no
startup energy), **Collegial** (respects academic hierarchy — professor/student, archivist/researcher —
without being intrusive or condescending), **Resourceful** (adapts to bilingual/multilingual, partial,
uncertain reality rather than forcing rigid categories).

## Active Design Systems _(code)_

| Design system   | When                                                                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tailwind/shadcn | default — Tailwind CSS v4 (CSS-first, `@theme` in globals.css) + shadcn/ui components in `src/components/ui/`, Radix primitives (`@radix-ui/*`), `class-variance-authority` for variants |

## Performance UX (post-code check) _(spec — docs/implementation/06-motion/motion-spec.md; docs/design-system/02-brand/identity.md §7)_

- Loading states use the Skeleton pattern (`.animate-skeleton-pulse`, continuous 2000ms opacity pulse
  1.0↔0.4), not a spinner, for content areas — Warning if a spinner is used where a skeleton pattern
  exists for that content type.
- Under `prefers-reduced-motion: reduce`, the skeleton pulse becomes a static `opacity: 0.6` (AC-MOT-12)
  — Warning if a loading treatment ignores `prefers-reduced-motion`.
- Sidebar width/collapse transitions must not cascade layout shift onto siblings: the sidebar animates
  `width` on itself only, main content shifts via its own `padding-left` transition (AC-MOT-18) — Warning
  if a layout-affecting transition on one element visibly shifts unrelated siblings. TODO — the spec
  states this rule for the sidebar specifically; whether it generalizes to all async-loaded content
  (target zero CLS platform-wide) is not stated and should be elicited if this check needs to fire
  beyond the sidebar case.

`motion-and-microinteractions.md` owns motion _quality_; this section owns the platform's perf-UX
_policy_.

## Touch-First Degradation _(spec — docs/design-system/01-ux/architecture.md §4.2, §4.4)_

Applies — evidoxa explicitly targets tablet and mobile, not desktop-only: the faculty-leader persona
uses an iPad at conferences/archives, and the student persona uses a smartphone and archive
reading-room PCs of varying size. Every `:hover` state must have a touch-friendly equivalent
(`:active`, `focus-visible`, or equivalent); hover-only interactions are findings. Minimum touch target
44×44px on `pointer: coarse` or viewport < 1024px, applied via a dedicated media-query block rather than
shrinking desktop hit areas.

## Stack Adapter _(code where detectable, else elicited-once, else TODO)_

How Aura finds, fixes, and verifies UI on _this_ project's stack. Aura fills it by detection
(`shared/platform-signals.md` Step A′); where a signal is absent it asks **one batched question** and
records the answer here; an unanswered slot stays `TODO —`. Universal skills read this adapter, never a
framework name.

| Field          | Value                                                                                                                                                                       | Provenance |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Stack          | Next.js 15.5 (App Router)                                                                                                                                                   | code       |
| Surface roots  | `src/app/[locale]/` (also `src/app/` for the root-level redirect page)                                                                                                      | code       |
| Surface globs  | `src/app/[locale]/**/page.{tsx,jsx,ts,js}`                                                                                                                                  | code       |
| Routing model  | filesystem                                                                                                                                                                  | code       |
| Template idiom | jsx                                                                                                                                                                         | code       |
| Style idiom    | tailwind                                                                                                                                                                    | code       |
| Verify command | `pnpm lint && pnpm typecheck && pnpm test`                                                                                                                                  | code       |
| Excludes       | `node_modules`, `.next`, `dist`, `build`, `out`, plus test files (`*.test.*`, `*.spec.*`) and `src/app/[locale]/[...catchAll]/page.tsx` (404 catch-all, not a real surface) | code       |

If **Routing model** is `config-file`, Surface globs are derived by reading that route table, not by
filesystem convention. If **Template idiom** is `other`, fixes are emitted as guidance, not code patches
(see `ux-reviewer` Step 5).

## How this skill is used

The evaluative agents load this file when the active platform is `evidoxa`. They read:

- User-type vocabulary → `heuristics.md` (N8 / N7 density-and-friction profile)
- Mental-model rule → `heuristics.md` (N2)
- Tracking attributes → post-code check at the stated severity
- Performance UX → post-code Warning check (skeleton-vs-spinner, CLS)
- i18n target → post-code QA check
- Design system → routed to fix-snippet generation

## Do not

- Hard-code platform specifics in any universal skill. Add slots here instead.
- Ship internal-only content (revenue thresholds, internal tooling URLs, named individuals). Leave
  such slots as TODOs the internal maintainer fills in a working copy and does not commit.
