# ADR-0002 — Where project knowledge lives

**Status:** Accepted · **Date:** 2026-09-17
**Context:** prompted by a consolidation review that found two frozen roadmaps, four
places claiming to answer "where are we?", and a second backlog the working agreement
already forbade

## The question

Project knowledge had accumulated across 209 markdown files, 55 open issues, a project
board, and an agent memory directory. Strategy and status were duplicated; some
documents had been frozen for six months without saying so. Where should each kind of
fact live, and what stops the duplication returning?

## Decision

**One fact, one home. The home is chosen by who must be able to change it and how
often it changes — never by what topic it is about.**

| Home                                          | Holds                                                                   | Changes                  | Read by                   |
| --------------------------------------------- | ----------------------------------------------------------------------- | ------------------------ | ------------------------- |
| Repo root                                     | `CLAUDE.md`, `AGENTS.md`, `README.md`, `docs/notes/repository-guide.md` | as conventions shift     | agents, devs              |
| GitHub Issues + Project 1                     | every unit of executable work                                           | daily                    | maintainer, agents        |
| `docs/strategy/`                              | vision, personas, roadmap, locked decisions                             | monthly                  | agents, then published    |
| `docs/design-system/`, `docs/implementation/` | design authority cited by section                                       | rarely, deliberately     | UX platform skill, agents |
| `docs/specs/`                                 | per-epic specification, brainstorming, and test-plan files              | per epic                 | agents, devs              |
| `docs/decisions/`                             | architecture decision records                                           | rarely, one per decision | agents, devs              |
| `docs/notes/`                                 | navigation aids                                                         | as structure shifts      | agents, devs              |
| `docs/archive/`                               | closed material                                                         | never                    | forensics only            |

Three rules make it hold:

1. **Status is written in exactly one place: GitHub.** Every other surface derives it.
   `docs/strategy/roadmap.md` carries no status markers at all, and a unit test fails
   the build if any appear. Epics map to GitHub milestones; a generator reads them.
2. **Strategy documents state `is` versus `will be` explicitly.** Any sentence
   describing unbuilt behaviour is future tense or marked as planned.
3. **Frozen material says so, in its first line.** Closed documents are marked, and
   moved to `docs/archive/` only when nothing cites them as authority for current
   behaviour. Citing an archived document by path as a historical record of what was
   done — the way `docs/strategy/decisions.md`'s Source column and
   `docs/strategy/roadmap.md`'s History table do — is fine; treating it as a live
   link or a source of current fact is not.

## Why not a wiki

The obvious answer — move strategy into Notion or similar — was rejected on four
grounds specific to this project:

- **There are no collaborators.** The work is one maintainer plus AI agents. Every
  external audience (university partners, funding bodies, website visitors) reads;
  none edit. A shared-editing tool solves a problem this project does not have.
- **The primary workforce could not read it.** Agents read `docs/strategy/roadmap.md`
  natively and a wiki page only when told it exists. Strategy the agents cannot see is
  strategy that does not reach the work.
- **It adds a place rather than removing one.** The disorder was never a missing tool;
  it was one fact living in several places with no owner. Unless something is deleted
  from the repo, a wiki page is a second copy — and the repo copy is the one agents
  keep reading. That is exactly how two roadmaps happened.
- **A better publishing surface already exists.** `src/lib/changelog.ts` compiles MDX
  from `content/` and makes `localeFallback` a required field so no code path can
  silently present German as English. That is stricter editorial rigour than a wiki
  offers, already in production, and branded as the product.

A wiki remains appropriate for material with no canonical repo representation and no
need for versioning: partner and investor CRM, meeting notes, fundraising pipeline.

## Evidence

Measured on 2026-09-17, on the `fix/public-page-seo-followups` branch:

| Observation                             | Measurement                                                                                                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/specs/roadmap.md` frozen          | last commit 2026-03-13; 6 commits ever; no status field                                                                                                                                             |
| `docs/specs/ai_aided_roadmap.md` frozen | last commit 2026-03-14; 2 commits ever                                                                                                                                                              |
| …yet load-bearing                       | `prisma/schema.prisma:546` cites "AX roadmap §7" as the authority for a permanent no-DELETE constraint                                                                                              |
| …while contradicted                     | `docs/notes/repository-guide.md:17` told agents not to infer authorization from it                                                                                                                  |
| Work invisible to the roadmap           | `events-cleanup`, `sources-cleanup`, `2-4-delta`, `2-1_2-4 cleanup`: 0 mentions; Epic 2.5 shipped with no spec directory                                                                            |
| Second backlog                          | none of `technical-debt.md`'s distinctive items (`mapRelation` duplication, `ALLOWED_PROPERTIES` duplication, `TS2349` count, silent Playwright launch failures) appeared in any of 76 issue bodies |
| Second backlog, again                   | `.ux-review-log.md` (tracked, 76 KB, repo root) records agent findings as "Critical: 5 · Action taken: Report shown, no fixes" — unfiled work in a file                                             |
| Aspiration leaking into claims          | `docs/communication/evidoxa-overview.md` described Epics 3.2, 3.3, 4.2, 4.3 in present tense; issues #97 and #99 are open bugs about the landing page claiming unbuilt behaviour                    |

One correction worth recording, because it nearly became an error: `docs/design-system/`
looked like archaeology by size and age. It is not. `skills/platforms/evidoxa.md` cites
it by section (§2.4, §3.1, §3.6), CLAUDE.md mandates loading that skill for UX review,
and roughly twenty `.claude/agents/*` files write to those paths. Archiving it would
have broken the UX pipeline. **Age and size do not establish that a document is dead;
a reference search does.**

## Criteria for placing a new document

Ask in order:

1. **Is it a unit of work?** → GitHub issue. Never a file. This includes anything that
   would otherwise become a list of deferred items.
2. **Does it state status?** → GitHub only. If another surface needs it, generate it.
3. **Must an agent read it to do the work correctly?** → repo markdown, always.
4. **Will it still be true in six months?** → `docs/strategy/` if it must stay current;
   `docs/design-system/` if it is reference that changes deliberately.
5. **Is it finished?** → mark it closed in its first line; archive when unreferenced.

A document that answers "yes" to more than one of 1–3 is doing two jobs and should be
split before it is written.

The first criterion is the one that keeps being violated. Three separate files in this
repo — `docs/technical-debt.md`, the thirteen `progress.md` files, and
`.ux-review-log.md` — were each a list of work items living outside GitHub. A list of
things to do is a backlog regardless of what the file is called.

## Consequences

- `docs/communication/evidoxa-overview.md` is deleted; its content becomes
  `docs/strategy/vision.md`. `docs/technical-debt.md` is retired once its items are
  filed as issues; until then it stays on disk.
- The two roadmaps become one at `docs/strategy/roadmap.md`. Citations in
  `prisma/schema.prisma` and `skills/platforms/evidoxa.md` are updated with the move.
- `progress.md` is no longer written. The board and git history already carry it, and
  CLAUDE.md already forbids "currently in progress" notes elsewhere for the same
  reason — they rot. `.claude/skills/dev.md` drops the step; `brainstorming.md` stays
  as the design record.
- Roadmap status is generated from milestones, which also satisfies issue #84.
- A new strategy document that hand-writes status is a defect, not a style preference.
