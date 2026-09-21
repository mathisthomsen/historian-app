# Specification — Documentation consolidation

> **Archived 2026-09-21:** specification for the one-time documentation consolidation migration; archived once executed (Part 2 shipped). Kept for forensics only, not as authority — see `docs/archive/README.md`.

**Status:** Draft · **Date:** 2026-09-17
**Rule of record:** [ADR-0002](../../decisions/0002-documentation-architecture.md)
**Disposable:** this document describes a one-time migration. Once executed it is
archived. The enduring rule lives in the ADR, not here.

## Goal

Give every kind of project knowledge exactly one home, per ADR-0002, and make the
duplication structurally unable to return.

## Explicitly out of scope

**Roadmap content is not revised in this pass.** Phases, epics and acceptance criteria
migrate verbatim. Where the migration exposes a gap, drift, or a decision that looks
stale, it is recorded as a `TODO(content-pass)` marker in the merged roadmap and listed
in Phase 1's output — never guessed at, never silently corrected. A separate content
pass follows this one.

Also out of scope: renaming or moving `docs/design-system/` or `docs/implementation/`
(cited by section from `skills/platforms/evidoxa.md` and ~20 agent definitions), and any
change to the `docs/specs/{epic}/specification.md` contracts themselves.

---

## Phase 1 — One roadmap

Create `docs/strategy/roadmap.md` as a mechanical union:

- Phases 1–5 from `docs/specs/roadmap.md`, verbatim.
- Phase 6 from `docs/specs/ai_aided_roadmap.md`, verbatim, promoted from proposal to
  committed. Phase 6 is the product thesis: agents hold no write authority, every
  suggestion is grounded in an existing Source, acceptance is an explicit human gate.
- Slots added for work that exists but appears in neither roadmap: **Epic 2.5**
  (shipped, no spec directory) and the four cleanup workstreams (`2-1_2-4 cleanup`,
  `events-cleanup`, `sources-cleanup`, `2-4-delta`). These are recorded as history, at
  the same altitude as the epics around them.
- **No status markers of any kind.** No `✅`, no `Status:`, no "complete".

Create `docs/strategy/decisions.md` holding the union of both locked-decision tables
(12 original + 6 AX), each row attributed to its source document.

Update the two live citations of the old AX roadmap in the same commit:

- `prisma/schema.prisma:546` — "AX roadmap §7" → the merged roadmap by path and
  section heading, so the constraint's authority stays resolvable
- `skills/platforms/evidoxa.md:61` — Market Profile provenance

Delete `docs/specs/roadmap.md` and `docs/specs/ai_aided_roadmap.md`. Deleting is the
point; leaving either in place recreates the fork.

**Acceptance:** `grep -rn "ai_aided_roadmap\|docs/specs/roadmap.md" --include="*.md"
--include="*.ts" --include="*.prisma" .` returns nothing outside `docs/archive/`. Every
epic from both source documents appears exactly once. Every `TODO(content-pass)` marker
is listed in the phase report.

## Phase 2 — Vision and personas

Create `docs/strategy/vision.md`: the problem, the thesis (grounded AI as a transparent
research assistant, never an author), positioning, and who it is for. Fold in the
accurate content of `docs/communication/evidoxa-overview.md` — German, since university
partners are a named audience — under strict tense discipline: built behaviour in
present tense, unbuilt behaviour in future tense or marked planned.

Create `docs/strategy/personas.md`. `docs/notes/ideas.md` item 1 has requested personas
since March; `docs/design-system/01-ux/research.md §2.4` already contains a persona
matrix that `skills/platforms/evidoxa.md` cites. Personas are **extracted** from that
existing research, not invented.

Delete `docs/communication/evidoxa-overview.md` (zero references measured) and
`docs/notes/ideas.md` (items 2 and 3 become issues first — see Phase 3).

**Acceptance:** every capability claim in `vision.md` is either present-tense and
verifiable against the schema or the shipped UI, or future-tense. A reviewer can check
this claim by claim; issues #97 and #99 exist because nobody could before.

## Phase 3 — Absorb the second backlog

For each of the 12 items in `docs/technical-debt.md`: **re-verify it against current
code before filing.** The file dates from 2026-06-06 and some items may be fixed,
worsened, or reshaped. Per CLAUDE.md, an unverified claim must not reach an issue
wearing the confidence of a measurement — each issue states what was measured and what
was not.

Then file, per the CLAUDE.md working agreement (one `priority:`, at least one `area:`,
a board slot), cross-checking open issues first to avoid near-duplicates.

Also file, from this review's findings:

- **`created_via` is absent from every entity table.** The AX roadmap locks
  `created_via` (MANUAL | IMPORT | AGENT) + `agent_name` on all entities. Measured:
  `agent_name` exists only on `EntityActivity`; `created_via` exists nowhere. With AX
  committed, attribution that arrives after rows accumulate cannot be backfilled
  truthfully. `area: data-model`.
- **`README.md` is silent on the AX thesis.** Measured: zero mentions of agents,
  grounding, or suggestions. CLAUDE.md obliges the README to carry data-model
  rationale, and mandatory source-grounding is rationale. `area: docs`.
- `docs/notes/ideas.md` items 2 (synthetic usability testing) and 3 (Pirsch analytics).
- **Unfiled findings in `.ux-review-log.md`.** This tracked 76 KB root-level log is
  appended by the `ux-reviewer` agent and contains entries such as
  "Critical: 5 · Warnings: 12 · Action taken: Report shown, no fixes". That is unfiled
  work sitting in a file — the same anti-pattern as `technical-debt.md`, and the third
  instance found in this review. Sweep it for findings that are still true and not
  already filed, then file them.

Delete `docs/technical-debt.md` once its items are filed.

**Acceptance:** `docs/technical-debt.md` is gone; every item is an issue or has a
recorded reason for not being one. No issue asserts as measured anything that was only
inferred.

## Phase 4 — Archive the dead

Create `docs/archive/` with a `README.md` stating that nothing inside is maintained and
that it is kept for forensics.

Move only what a reference search proves unreferenced:

| Moves                                                                              | Why safe                                           |
| ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| `docs/specs/legacy-feature-set.md`, `legacy-feature-review.md`                     | 0 references; analysis of the pre-rebuild app      |
| `docs/ux/audit-2026-08-10.md`                                                      | 0 references                                       |
| `docs/project-review-2026-07-13.md`                                                | 1 reference, in `README.md`, updated with the move |
| `docs/specs/2-4-delta/`, `events-cleanup/`, `sources-cleanup/`, `2-1_2-4 cleanup/` | reference only each other; move as one unit        |
| all 13 `docs/specs/*/progress.md`                                                  | superseded by Phase 6; see Phase 7                 |

Each moved file gains a first line naming what it was and when it closed.

`docs/specs/2-1_2-4 cleanup/` loses the space in its directory name on the way in — it
currently breaks shell globs.

`.ux-review-log.md` is gitignored rather than archived, once Phase 3 has swept it. The
`ux-reviewer` agent regenerates it, so it is local agent scratch in the same category as
`.superpowers/` (880 KB, already correctly gitignored and requiring no action). Agent
scratch that is tracked will accumulate findings nobody files; ignoring it forces
findings into GitHub, which is where ADR-0002 puts them.

Three references to `progress.md` survive in documents that are not moving:
`docs/specs/2-6-marketing-landing/specification.md:452,463` (acceptance criteria that
required recording Lighthouse results there) and
`docs/implementation/00-plan/implementation-plan.md:269`. These are **not** rewritten.
Both documents describe completed work, and Phase 5's shipped header makes them
historical records rather than live instructions. Rewriting a shipped contract to match
a convention retired after it shipped would falsify the record.

**Acceptance:** `grep -rn` for each moved path finds no live reference, with the three
historical `progress.md` mentions above as the named exceptions. The app builds and
`pnpm test` passes — proving nothing in the archive was load-bearing.

## Phase 5 — Mark the living

Each surviving `docs/specs/{epic}/specification.md` gains a one-line header: shipped or
not, and a pointer to `docs/strategy/roadmap.md` for status. Marking, not moving —
these are contracts that are still consulted.

`docs/design-system/` and `docs/implementation/` each gain a `README.md` stating they
are reference documentation, cited by section from `skills/platforms/evidoxa.md`, and
changed deliberately rather than incidentally.

**Acceptance:** opening any document under `docs/` answers "is this current?" from its
first screen.

## Phase 6 — Generated status

Create one GitHub milestone per epic across Phases 1–6 (~26; none exist today).
Retro-assign existing issues where an epic is identifiable; unassigned is acceptable and
better than a guess.

Write `scripts/roadmap-status.ts`: read milestones via `gh api`, emit JSON of
`{ epic, state, openIssues, closedIssues }`. `state` derives from the milestone —
closed means shipped, open with issues means in progress, absent means planned.

Wire it into the changelog's "coming next" section, **closing issue #84**, which asked
for exactly this.

**Acceptance:** the generator's output for Epics 1.1–2.6 matches the shipped reality
recorded in git history. Verify against history, not against the progress files being
deleted — that would be circular.

## Phase 7 — Guardrails and workflow

The rules from ADR-0002 become mechanical wherever possible, per the CLAUDE.md
preference for making omissions impossible over remembering to check:

- A unit test asserts `docs/strategy/roadmap.md` contains no `✅` and no `Status:`.
  This is the guard that stops a fifth status location from reappearing. Verify it by
  adding a marker and watching the test fail, then removing it.
- `.claude/skills/dev.md` drops `progress.md` entirely — the create step (~line 49),
  the read step (~line 38), the pre-flight questions (~line 43), and the final update
  (~lines 347, 373). `brainstorming.md` in `.claude/skills/spec.md` is untouched.
- `CLAUDE.md` gains a short "Where things live" section pointing at ADR-0002, and the
  tense-discipline rule for strategy documents.
- `docs/notes/repository-guide.md:17–18` is corrected: it currently tells agents the
  AI-aided roadmap is an unauthorized proposal while `schema.prisma` cites it as
  binding.
- `README.md` gains the AX paragraph filed in Phase 3.

**Acceptance:** the guard test fails when a status marker is introduced. A fresh agent
session, reading only `CLAUDE.md` and `repository-guide.md`, can name the right home
for a new fact without being told.

## Phase 8 — Publish

Add a `/roadmap` route under `src/app/[locale]/(marketing)/`, rendering
`docs/strategy/roadmap.md` plus Phase 6's generated status, reusing the `compileMDX`
pattern in `src/lib/changelog.ts` — including its required `localeFallback` field, so no
path can silently present German as English.

Shipped-versus-planned comes from GitHub, never from prose. This is the structural fix
for the bug class behind issues #97 and #99: the page cannot overclaim, because no
human writes the claim.

**Acceptance:** `/de/roadmap` and `/en/roadmap` render. An epic's state changes on the
page when its milestone closes, with no edit to any markdown file.

---

## Sequencing

Phases 1–5 are independent of 6–8 and can ship as one PR. Phase 6 depends on 1 (epic
list) and 5. Phase 8 depends on 6. Phase 3 can run at any time and is the only phase
that touches GitHub state rather than the repo.

## Risks

| Risk                                                                        | Mitigation                                                                              |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Archiving something live, as nearly happened with `docs/design-system/`     | Every move is preceded by a reference search; Phase 4 acceptance requires a green build |
| The mechanical merge quietly drops an epic                                  | Phase 1 acceptance counts epics in against epics out                                    |
| Stale `technical-debt.md` items filed as current fact                       | Phase 3 re-verifies each against code and records what was not measured                 |
| The content pass never happens, leaving `TODO(content-pass)` markers to rot | The markers are listed in the Phase 1 report and filed as one tracking issue            |
