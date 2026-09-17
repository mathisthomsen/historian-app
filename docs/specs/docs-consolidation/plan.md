# Documentation Consolidation — Implementation Plan (Part 1 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every kind of project knowledge exactly one home, and make the duplication structurally unable to return.

**Architecture:** A one-time reorganisation of `docs/`, driven by ADR-0002's rule — one fact, one home, chosen by who must change it and how often. Two frozen roadmaps merge into one at `docs/strategy/roadmap.md`; three files acting as backlogs outside GitHub are absorbed into issues and deleted; provably-unreferenced material moves to `docs/archive/`; everything else is _marked_ rather than moved. A unit test guards the merged roadmap against hand-written status, which is the mechanism that stops a fifth status location reappearing.

**Tech Stack:** Markdown, Vitest (`pnpm test`), `gh` CLI, Prettier via lint-staged on commit.

**Spec:** `docs/specs/docs-consolidation/specification.md`
**Rule of record:** `docs/decisions/0002-documentation-architecture.md`

**Part 2** (separate plan, depends on this one): GitHub milestones, `scripts/roadmap-status.ts`, changelog wiring for issue #84, and the `/roadmap` route.

## Global Constraints

- **Roadmap content is not revised in this pass.** Phases, epics and acceptance criteria migrate verbatim. Anything that looks stale, drifted, or wrong is recorded as a `TODO(content-pass)` marker and listed in Task 1's report — never guessed at, never silently corrected.
- **Do not move or rename `docs/design-system/` or `docs/implementation/`.** `skills/platforms/evidoxa.md` cites them by section (§2.4, §3.1, §3.6) and ~20 `.claude/agents/*` files write to those paths.
- **Nothing moves to `docs/archive/` without a reference search first.** Age and size do not establish that a document is dead.
- **Measured versus inferred must be stated** in every issue filed (CLAUDE.md, "Measure, don't infer").
- Every issue filed gets exactly one `priority:`, at least one `area:`, and a slot on project board 1 (`gh project 1 --owner mathisthomsen`).
- Branch: `chore/docs-consolidation`, already created from `origin/main`.
- Commit messages end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

## File Structure

| Path                             | Responsibility                                          | Task |
| -------------------------------- | ------------------------------------------------------- | ---- |
| `docs/strategy/roadmap.md`       | the single roadmap, Phases 1–6, **no status**           | 1    |
| `src/test/strategy-docs.test.ts` | guards the roadmap against status markers and epic loss | 1    |
| `docs/strategy/decisions.md`     | union of both locked-decision tables                    | 2    |
| `docs/strategy/vision.md`        | problem, thesis, positioning, audience                  | 3    |
| `docs/strategy/personas.md`      | personas extracted from existing UX research            | 3    |
| `docs/archive/README.md`         | states that nothing inside is maintained                | 5    |
| `.claude/skills/dev.md`          | workflow, minus the `progress.md` steps                 | 7    |

---

### Task 1: One roadmap, guarded

**Files:**

- Create: `docs/strategy/roadmap.md`
- Create: `src/test/strategy-docs.test.ts`
- Read (sources): `docs/specs/roadmap.md`, `docs/specs/ai_aided_roadmap.md`

**Interfaces:**

- Produces: `docs/strategy/roadmap.md` containing exactly 26 `### Epic N.N` headings. Tasks 2, 6 and 7 link to this path. Part 2's status generator parses these headings.

**Why 26:** `docs/specs/roadmap.md` has 22 epics (1.1–5.4). `ai_aided_roadmap.md` adds 4 genuinely new ones (6.0, 6.1, 6.2, 6.3). Its 5 `[AX-AUGMENTATION]` blocks (2.4, 3.2, 3.4, 4.4, 5.2) overlay epics that already exist — they merge into those epics as subsections and must **not** become new headings. `Epic 2.1–2.3` in the AX file is a group pointer carrying no content.

- [ ] **Step 1: Write the failing test**

```ts
// src/test/strategy-docs.test.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROADMAP = join(process.cwd(), "docs", "strategy", "roadmap.md");

// The roadmap is the one strategy document most likely to attract a
// hand-written status column, because that is what both of its predecessors
// eventually wanted to be. Status is generated from GitHub milestones
// (see ADR-0002); this test is the guard that keeps it that way.
describe("docs/strategy/roadmap.md", () => {
  it("contains no hand-written status markers", () => {
    const offenders = readFileSync(ROADMAP, "utf8")
      .split("\n")
      .map((line, index) => ({ line: index + 1, text: line }))
      .filter(({ text }) => /[✅❌🚧]|\bStatus:/u.test(text));

    expect(offenders).toEqual([]);
  });

  // 22 epics from roadmap.md + 4 new Phase 6 epics from ai_aided_roadmap.md.
  // The 5 [AX-AUGMENTATION] blocks overlay existing epics and add no headings.
  it("carries every epic from both source roadmaps, exactly once", () => {
    const headings = readFileSync(ROADMAP, "utf8").match(/^### Epic \d+\.\d+/gmu) ?? [];

    expect(headings).toHaveLength(26);
    expect(new Set(headings).size).toBe(26);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails for the right reason**

Run: `pnpm vitest run src/test/strategy-docs.test.ts`
Expected: FAIL — `ENOENT: no such file or directory ... docs/strategy/roadmap.md`. A failure for any other reason means the path is wrong; fix that before continuing.

- [ ] **Step 3: Build the merged roadmap**

`mkdir -p docs/strategy`, then assemble `docs/strategy/roadmap.md`:

1. Intro and the Phase 1–5 structure from `docs/specs/roadmap.md`, verbatim.
2. Each `[AX-AUGMENTATION]` block from `ai_aided_roadmap.md` folded into its existing epic as an `#### Agentic layer` subsection — 2.4, 3.2, 3.4, 4.4, 5.2.
3. Phase 6 and Epics 6.0–6.3 from `ai_aided_roadmap.md`, verbatim, presented as committed rather than proposed.
4. A `## History` section recording work that appears in neither source: **Epic 2.5** (shipped, never had a spec directory) and the four cleanup workstreams (`2-1_2-4 cleanup`, `events-cleanup`, `sources-cleanup`, `2-4-delta`).
5. **No status markers.** Not in prose, not in tables, not in the History section — write History as "what was done", never as "✅".
6. A `TODO(content-pass):` marker at any point where a source contradicts the current codebase or reads as stale.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `pnpm vitest run src/test/strategy-docs.test.ts`
Expected: PASS, 2 tests. If the epic count is off, diff the headings against both sources — do not adjust the expected number to match the output.

- [ ] **Step 5: Prove the guard has teeth**

The test is the only thing standing between this repo and a fifth status location, so verify it actually fires rather than trusting that it would:

```bash
printf '\n**Status:** complete\n' >> docs/strategy/roadmap.md
pnpm vitest run src/test/strategy-docs.test.ts   # MUST fail, naming the line number
git checkout -- docs/strategy/roadmap.md 2>/dev/null || sed -i '' -e '$d' -e '$d' docs/strategy/roadmap.md
pnpm vitest run src/test/strategy-docs.test.ts   # passes again
```

- [ ] **Step 6: Report the content-pass markers**

Run: `grep -n "TODO(content-pass)" docs/strategy/roadmap.md`
Collect the output. It is the input to the follow-up content pass and to Task 4's tracking issue. Do not act on any of them here.

- [ ] **Step 7: Commit**

```bash
git add docs/strategy/roadmap.md src/test/strategy-docs.test.ts
git commit -m "$(cat <<'MSG'
docs(strategy): merge two roadmaps into one, guarded against status drift

Both predecessors froze in March 2026 while the work carried on without them.
The merge is mechanical: Phases 1-5 verbatim, the five AX-AUGMENTATION blocks
folded into the epics they overlay, Phase 6 promoted from proposal to committed,
and a History section for Epic 2.5 and the four cleanup workstreams that
appeared in neither document.

Content is not revised here; points that read as stale carry TODO(content-pass)
markers for the separate content pass.

The test is the load-bearing part: status is generated from GitHub milestones,
so a hand-written status marker in this file is a defect, not a style choice.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

### Task 2: Locked decisions, and retiring the old roadmaps

**Files:**

- Create: `docs/strategy/decisions.md`
- Modify: `prisma/schema.prisma:546` (the `AX roadmap §7` citation)
- Modify: `skills/platforms/evidoxa.md:61` (Market Profile provenance)
- Delete: `docs/specs/roadmap.md`, `docs/specs/ai_aided_roadmap.md`

**Interfaces:**

- Consumes: `docs/strategy/roadmap.md` from Task 1.
- Produces: `docs/strategy/decisions.md`, linked from the roadmap and from `README.md` in Task 7.

- [ ] **Step 1: Build the union of both decision tables**

`docs/specs/roadmap.md` "Strategic Decisions (locked)" holds 12 rows; `ai_aided_roadmap.md` "AX-Ergänzungen" holds 6 (agent write authority, grounding policy, confidence representation, approval gate, agent attribution, hallucination suppression). Write all 18 into `docs/strategy/decisions.md` as one table with a third column naming the source document, so each decision's provenance survives the deletion.

- [ ] **Step 2: Repoint the schema citation**

`prisma/schema.prisma:546` reads `CONSTRAINT: No DELETE endpoint will ever be created for this table (AX roadmap §7).` Update it to cite `docs/strategy/roadmap.md` by section heading. This is the edit that makes the schema's existing AX groundwork legitimate: a permanent database constraint should not cite a document labelled "proposal".

- [ ] **Step 3: Repoint the platform skill citation**

`skills/platforms/evidoxa.md:61` cites `docs/specs/ai_aided_roadmap.md` as provenance for the Market Profile. Point it at `docs/strategy/roadmap.md`.

- [ ] **Step 4: Delete both old roadmaps**

```bash
git rm docs/specs/roadmap.md docs/specs/ai_aided_roadmap.md
```

Deleting is the point. Leaving either in place recreates the fork this whole plan exists to remove.

- [ ] **Step 5: Verify no dangling references**

```bash
grep -rn "ai_aided_roadmap\|docs/specs/roadmap\.md" \
  --include="*.md" --include="*.ts" --include="*.tsx" --include="*.prisma" . \
  | grep -v node_modules | grep -v "^\./\.next"
```

Expected: no output. Any hit outside `docs/archive/` is a broken citation and must be fixed before committing.

- [ ] **Step 6: Confirm nothing else broke**

Run: `pnpm test && pnpm lint`
Expected: PASS. The schema comment change is a comment, so `prisma validate` is unaffected, but the full suite confirms no test asserted on the deleted paths.

- [ ] **Step 7: Commit**

```bash
git add -A docs/strategy/decisions.md prisma/schema.prisma skills/platforms/evidoxa.md docs/specs/
git commit -m "$(cat <<'MSG'
docs(strategy): union the locked decisions, retire both old roadmaps

schema.prisma cited "AX roadmap §7" as the authority for a permanent no-DELETE
constraint while repository-guide.md told agents that same document was an
unauthorized proposal. Both citations now point at the merged roadmap.

All 18 locked decisions (12 original + 6 AX) move to docs/strategy/decisions.md
with their provenance recorded, so deleting the sources loses nothing.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

### Task 3: Vision and personas

**Files:**

- Create: `docs/strategy/vision.md`, `docs/strategy/personas.md`
- Read: `docs/communication/evidoxa-overview.md`, `docs/design-system/01-ux/research.md` §2.4
- Delete: `docs/communication/evidoxa-overview.md`

**Interfaces:**

- Consumes: `docs/strategy/roadmap.md` (for what is planned versus built).
- Produces: `docs/strategy/vision.md`, rendered by Part 2's `/roadmap` route.

- [ ] **Step 1: Write `vision.md` under tense discipline**

German, since university partners are a named audience. **Assemble it from existing material — do not invent strategy.** Every section has a source:

| Section                 | Source                                                                                                                                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Problem and positioning | `docs/specs/roadmap.md` intro — "university MVP validation → future SaaS commercialization", and the note that the UX keeps the data model's complexity away from the user                                             |
| The thesis              | `ai_aided_roadmap.md` preamble — "The AI is a Transparent Research Assistant, never an author. Every agent claim must be grounded in an existing Source record. Historians retain full data sovereignty at all times." |
| What it does today      | `docs/communication/evidoxa-overview.md`, filtered by Step 2                                                                                                                                                           |
| Who it is for           | the persona matrix in `docs/design-system/01-ux/research.md` §2.4                                                                                                                                                      |

Read both roadmaps from git history if Task 2 has already deleted them (`git show HEAD~1:docs/specs/roadmap.md`). If a section has no source, leave it as a `TODO(content-pass)` marker — the maintainer supplies vision, not the executor.

The rule that matters: **built behaviour in present tense, unbuilt behaviour in future tense or explicitly marked planned.** The source file describes Orte with Nominatim geocoding, Literatur with Zotero sync, Zeitstrahl and Netzwerkgraph in the present tense — all of them Epics 3.2, 3.3, 4.2 and 4.3, none of them built. That is the document the marketing copy drew from, and issues #97 and #99 are the result.

- [ ] **Step 2: Verify every present-tense claim**

For each present-tense capability claim in `vision.md`, confirm it against `prisma/schema.prisma` or a shipped route under `src/app/[locale]/`. Anything you cannot confirm moves to future tense. Record which claims you checked — a reviewer must be able to repeat this, which is precisely what nobody could do with the source file.

- [ ] **Step 3: Extract personas rather than inventing them**

`docs/design-system/01-ux/research.md` §2.4 already holds a persona matrix, and `skills/platforms/evidoxa.md` cites it for the user-type vocabulary. Write `docs/strategy/personas.md` as an extraction from that matrix, cross-linked to it. Inventing a second, divergent set of personas would recreate the exact failure this plan is fixing.

- [ ] **Step 4: Delete the superseded overview**

```bash
git rm docs/communication/evidoxa-overview.md
rmdir docs/communication 2>/dev/null || true
grep -rn "evidoxa-overview" --include="*.md" . | grep -v node_modules
```

Expected: no output (the file was measured at zero references before deletion).

- [ ] **Step 5: Commit**

```bash
git add -A docs/strategy/ docs/communication/
git commit -m "$(cat <<'MSG'
docs(strategy): add vision and personas, delete the aspirational overview

evidoxa-overview.md described Epics 3.2, 3.3, 4.2 and 4.3 in the present tense.
It was the only German "what Evidoxa does" document, and the landing page
believed it — issues #97 and #99 are the consequence.

vision.md replaces it under explicit tense discipline: present tense only for
behaviour verifiable against the schema or a shipped route.

Personas are extracted from the existing persona matrix in the UX research the
platform skill already cites, not invented alongside it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

### Task 4: Absorb the three backlogs-outside-GitHub

No code, no tests — this task changes GitHub state. It is independent of Tasks 1–3 and 5–7 and may run at any point.

**Files:**

- Read then delete: `docs/technical-debt.md`
- Read then gitignore: `.ux-review-log.md`
- Read then delete: `docs/notes/ideas.md`
- Modify: `.gitignore`

- [ ] **Step 1: Re-verify each `technical-debt.md` item before filing it**

The file dates from 2026-06-06. Items may be fixed, worsened, or reshaped. For each of the 12, check the named location in current code. CLAUDE.md is explicit that an inference must not reach an issue wearing the confidence of a measurement — so each issue states what was checked and what was not.

Item 12 ("`tsc --noEmit` fails with ~1,519 pre-existing TS2349 errors in test files") must be re-counted, not copied: `pnpm exec tsc --noEmit 2>&1 | grep -c TS2349`.

- [ ] **Step 2: Cross-check before filing**

```bash
gh issue list --state all --limit 200 --json number,title,body \
  --jq '.[] | select((.body//"") + .title | test("<keyword>"; "i")) | "\(.number) \(.title)"'
```

Per CLAUDE.md, prefer commenting on an existing issue over opening a near-duplicate. A measured sweep on 2026-09-17 found no issue covering `mapRelation` duplication, `ALLOWED_PROPERTIES` duplication, the TS2349 count, or silently-swallowed Playwright launch failures — but re-run it, because issues have been filed since.

- [ ] **Step 3: File the two findings from the consolidation review**

**`created_via` is absent from every entity table.** `docs/strategy/decisions.md` locks `created_via` (MANUAL | IMPORT | AGENT) + `agent_name` on all entities. Measured 2026-09-17: `agent_name` exists only on `EntityActivity`; `created_via` exists nowhere in `prisma/schema.prisma`. With Phase 6 committed, attribution added after rows accumulate cannot be backfilled truthfully — every existing row would have to be guessed at. Labels: `enhancement`, `priority: medium`, `area: data-model`, `spec-needed`. Not verified: whether Epic 6.0 intends to add it as part of its own migration, which would make this a sequencing question rather than a gap.

**`README.md` is silent on the AX thesis.** Measured: zero mentions of agents, grounding, or suggestions. CLAUDE.md obliges the README to carry data-model rationale, and mandatory source-grounding is rationale. Labels: `priority: low`, `tech-debt`, `area: docs`. (Task 7 fixes this; file it anyway so the board reflects the work.)

- [ ] **Step 4: Sweep `.ux-review-log.md` for unfiled findings**

This tracked 76 KB root-level log is appended by the `ux-reviewer` agent and contains entries such as `Critical: 5 · Warnings: 12 · Action taken: Report shown, no fixes`. That is unfiled work in a file — the third instance of the pattern in this repo. Read it, discard what is stale or already filed, file what remains.

- [ ] **Step 5: File `ideas.md` items 2 and 3**

Item 2: synthetic usability testing driven by the personas from Task 3. Item 3: Pirsch analytics, server-side with client hints. Item 1 (personas) is delivered by Task 3 and needs no issue.

- [ ] **Step 6: File the content-pass tracking issue**

One issue listing the `TODO(content-pass)` markers collected in Task 1 Step 6, so they cannot rot unnoticed. Labels: `priority: medium`, `area: docs`, `spec-needed`.

- [ ] **Step 7: Delete the absorbed files and ignore the log**

```bash
git rm docs/technical-debt.md docs/notes/ideas.md
git rm --cached .ux-review-log.md
printf '\n# Agent-generated UX review log — findings belong in GitHub issues (ADR-0002)\n.ux-review-log.md\n' >> .gitignore
```

`.ux-review-log.md` is ignored rather than archived: the `ux-reviewer` agent regenerates it, putting it in the same category as `.superpowers/` (880 KB, already correctly ignored, no action needed). Tracked agent scratch accumulates findings nobody files.

- [ ] **Step 8: Verify and commit**

```bash
gh issue list --state open --limit 200 --json number --jq 'length'   # expect a rise
grep -rn "technical-debt\|notes/ideas" --include="*.md" . | grep -v node_modules | grep -v docs/archive
git add -A && git commit -m "$(cat <<'MSG'
chore(backlog): absorb three backlogs that lived outside GitHub

technical-debt.md, .ux-review-log.md and docs/notes/ideas.md were each a list of
work items in a file. A measured sweep of all 76 issue bodies found none of
technical-debt.md's distinctive items filed anywhere.

Each item was re-verified against current code before filing rather than copied
on faith; the issues state what was measured and what was not.

Also filed: created_via missing from every entity table despite being a locked
decision, and the README's silence on the AX thesis.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

### Task 5: Archive what is provably dead

**Files:**

- Create: `docs/archive/README.md`
- Move: `docs/specs/legacy-feature-set.md`, `docs/specs/legacy-feature-review.md`, `docs/ux/audit-2026-08-10.md`, `docs/project-review-2026-07-13.md`, `docs/specs/2-4-delta/`, `docs/specs/events-cleanup/`, `docs/specs/sources-cleanup/`, `docs/specs/2-1_2-4 cleanup/`, all 13 `docs/specs/*/progress.md`
- Modify: `README.md` (its one reference to the project review)

- [ ] **Step 1: Re-run the reference search before moving anything**

```bash
for p in legacy-feature-set legacy-feature-review "ux/audit-2026" "project-review-2026" \
         2-4-delta events-cleanup sources-cleanup; do
  printf '%-24s ' "$p"
  grep -rl "$p" --include="*.md" --include="*.ts" --include="*.tsx" . 2>/dev/null \
    | grep -v node_modules | grep -v '^\./\.next' | tr '\n' ' '
  echo
done
```

Measured on 2026-09-17: the legacy files and the UX audit had zero references; `project-review-2026` had exactly one, in `README.md`; the cleanup directories referenced only each other. **Confirm this still holds** — Tasks 1–4 have edited the tree since.

`docs/specs/2-6-marketing-landing/plan-part-a.md` (90 KB) was not measured during the review and must be checked in this step. It is an executed plan document, the same category as this file, and archives with the rest if nothing cites it.

This step is the one that matters. `docs/design-system/` looked like archaeology by every superficial measure and turned out to be live design authority cited by section. Age and size prove nothing.

- [ ] **Step 2: Create the archive with a README that sets expectations**

`docs/archive/README.md` states: nothing inside is maintained; it is kept for forensics; do not cite it as authority; if something here is still true, it belongs in `docs/strategy/` or a GitHub issue instead.

- [ ] **Step 3: Move, fixing the broken directory name on the way**

```bash
mkdir -p docs/archive
git mv docs/specs/legacy-feature-set.md docs/specs/legacy-feature-review.md docs/archive/
git mv docs/ux/audit-2026-08-10.md docs/archive/
git mv docs/project-review-2026-07-13.md docs/archive/
git mv docs/specs/2-4-delta docs/specs/events-cleanup docs/specs/sources-cleanup docs/archive/
git mv "docs/specs/2-1_2-4 cleanup" docs/archive/2-1_2-4-cleanup   # the space breaks shell globs
git mv docs/specs/2-6-marketing-landing/plan-part-a.md docs/archive/   # 90 KB of executed plan
for f in docs/specs/*/progress.md; do
  mkdir -p "docs/archive/progress/$(basename "$(dirname "$f")")"
  git mv "$f" "docs/archive/progress/$(basename "$(dirname "$f")")/progress.md"
done
rmdir docs/ux 2>/dev/null || true
```

- [ ] **Step 4: Head each moved file with what it was**

One line at the top of each: what it recorded and when it closed. A reader who lands on an archived file from a search result must learn within one screen that it is not current.

- [ ] **Step 5: Update the README's citation**

`README.md` references `docs/project-review-2026-07-13.md`. Point it at `docs/archive/project-review-2026-07-13.md`.

- [ ] **Step 6: Leave the three historical `progress.md` mentions alone**

`docs/specs/2-6-marketing-landing/specification.md:452,463` and `docs/implementation/00-plan/implementation-plan.md:269` reference `progress.md`. **Do not rewrite them.** Both describe completed work, and Task 6's shipped header makes them historical records. Editing a shipped contract to match a convention retired after it shipped would falsify the record.

- [ ] **Step 7: Prove nothing archived was load-bearing**

```bash
pnpm test && pnpm lint && pnpm build
```

Expected: PASS. This is the acceptance criterion for the whole task — a green build after moving 1 MB out of the way is the evidence that none of it was live.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "$(cat <<'MSG'
docs: archive what a reference search proves is dead

Moved only material measured to have no live references: the pre-rebuild legacy
analysis, the August UX audit, the July project review (its one citation in
README.md updated with it), the four self-contained cleanup workstreams, and the
thirteen progress files the workflow no longer writes.

Left in place: docs/design-system/ and docs/implementation/, which look like
archaeology by size and age but are cited by section from
skills/platforms/evidoxa.md and written to by ~20 agent definitions.

docs/specs/2-1_2-4 cleanup/ lost the space in its name; it broke shell globs.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

### Task 6: Mark the living

**Files:**

- Modify: each surviving `docs/specs/{epic}/specification.md` (9 files)
- Create: `docs/design-system/README.md`, `docs/implementation/README.md`

- [ ] **Step 1: Head each surviving spec with its state**

For each of the 9 remaining `docs/specs/*/specification.md`, add one line under the title: whether the epic shipped, and a pointer to `docs/strategy/roadmap.md` for current status. Derive shipped-ness from **git history**, not from the progress files archived in Task 5 — those are what this plan is replacing, and trusting them would be circular.

```bash
git log --oneline --diff-filter=A -- "src/app/api/persons" | tail -1   # pattern per epic
```

- [ ] **Step 2: Mark the two reference trees**

`docs/design-system/README.md` and `docs/implementation/README.md` each state: this is reference documentation, cited by section from `skills/platforms/evidoxa.md` and written by the `/design-system` and `/implement-design-system` workflows; it changes deliberately, not incidentally; it is not archived and not a backlog.

- [ ] **Step 3: Verify the outcome the marking is for**

Open three documents at random under `docs/` and confirm each answers "is this current?" within its first screen. That is the whole point of marking over moving.

- [ ] **Step 4: Commit**

```bash
git add -A docs/
git commit -m "$(cat <<'MSG'
docs: state on every surviving document whether it is current

Marking rather than moving: the problem was never disk, it was that nobody could
tell frozen from live. Each epic spec now says whether it shipped and points at
the roadmap for status; the two reference trees say they are reference.

Shipped-ness is derived from git history rather than from the archived progress
files, which is what this change replaces.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

### Task 7: Workflow and documents of record

**Files:**

- Modify: `.claude/skills/dev.md` (lines ~14, ~38, ~43, ~49–51, ~347, ~373)
- Modify: `CLAUDE.md`, `docs/notes/repository-guide.md:17-18`, `README.md`

**Interfaces:**

- Consumes: `docs/strategy/roadmap.md`, `docs/strategy/decisions.md`, `docs/decisions/0002-documentation-architecture.md`.

- [ ] **Step 1: Drop `progress.md` from the dev workflow**

`.claude/skills/dev.md` is the only file that creates or updates it. Remove: the step-2 summary line (~14), the "existing progress" read (~38), the pre-flight questions (~43), the "Create progress.md" section (~49–51), and the final update (~347, ~373). Where the removed steps recorded outcomes, point at the GitHub issue and the commit instead.

Leave `.claude/skills/spec.md` untouched — `brainstorming.md` stays as the design record.

- [ ] **Step 2: Verify the workflow still reads coherently**

Read `.claude/skills/dev.md` start to finish. A step that says "record the outcome" with nowhere to record it is a worse failure than the file it replaced.

- [ ] **Step 3: Correct the guidance that contradicts the schema**

`docs/notes/repository-guide.md:17-18` currently reads: _"The AI-aided roadmap is a separate proposal; do not infer authorization to implement it."_ `prisma/schema.prisma` cites that same document as binding. Replace with a pointer to `docs/strategy/roadmap.md` as the single roadmap, and to ADR-0002 for where things live.

- [ ] **Step 4: Add the placement rules to `CLAUDE.md`**

A short "Where things live" section: the five homes table from ADR-0002 (or a link to it), the rule that status is written only in GitHub, and the tense-discipline rule for strategy documents. Keep it short — CLAUDE.md is loaded every session, and ADR-0002 holds the reasoning.

- [ ] **Step 5: Give the README its AX paragraph**

Add, in `## Scientific Background — Why the Data Model Looks Like This`, the rationale for the agentic layer: agents hold no write authority, every suggestion is grounded in an existing Source, acceptance is an explicit human gate — and that `EntityActivity` is append-only _because_ of it. This closes the issue filed in Task 4 Step 3; reference it in the commit.

- [ ] **Step 6: Full verification**

```bash
pnpm test && pnpm lint && pnpm build
grep -rn "TODO\|TBD" docs/strategy/ | grep -v "TODO(content-pass)"   # expect no output
```

- [ ] **Step 7: Commit and open the PR**

```bash
git add -A
git commit -m "$(cat <<'MSG'
chore: retire progress.md, and correct the documents of record

repository-guide.md told agents the AI-aided roadmap was an unauthorized
proposal while schema.prisma cited it as the authority for a permanent
constraint. That contradiction is resolved.

progress.md leaves the dev workflow: the board and git history already carry it,
and CLAUDE.md already forbids "currently in progress" notes elsewhere for the
same reason — they rot. brainstorming.md stays as the design record.

The README gains the AX rationale it was missing, which CLAUDE.md already
required of it.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
gh pr create --title "docs: one fact, one home" --body "..."
```

The PR body states plainly what was deferred and why: roadmap **content** revision (a separate pass, tracked by the issue from Task 4 Step 6), and Part 2 — milestones, `scripts/roadmap-status.ts`, changelog wiring for #84, and the `/roadmap` route.

**After Part 2 ships,** `docs/specs/docs-consolidation/` archives itself: ADR-0002 is the enduring rule, and the specification and this plan are the disposable migration record. Do not archive them while Part 2 still depends on them.

---

## Self-review notes

- **Spec coverage:** spec Phases 1→Task 1–2, 2→Task 3, 3→Task 4, 4→Task 5, 5→Task 6, 7→Task 7. Phases 6 and 8 are deliberately Part 2 — they ship working software and depend on this plan's epic headings existing.
- **Circularity avoided twice:** Task 5 archives the progress files, so Task 6 derives shipped-ness from git history instead, and Task 1's epic count comes from the two sources rather than from any status record.
- **The one irreversible step** is Task 2's deletion of both roadmaps. It is gated behind Task 1's passing epic-count test, which is what makes the deletion safe rather than brave.
