import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROADMAP = join(process.cwd(), "docs", "strategy", "roadmap.md");

// The roadmap is the one strategy document most likely to attract a
// hand-written status column, because that is what both of its predecessors
// eventually wanted to be. Status lives on GitHub Issues and the Evidoxa
// Backlog project board (`gh project 1 --owner mathisthomsen`), not in this
// file — the repo has 30 GitHub milestones (one per epic) and a milestone-based
// generator, `scripts/roadmap-status.ts`, but it is a manually-run script, not a
// present-tense live mechanism (issue #122 tracks automating it). This
// test is the guard that keeps status out of the roadmap either way.
// What this regex can and cannot do.
//
// It catches the mechanical forms: status glyphs anywhere, and a "Status:" label at the
// start of a line in the spellings that actually occur (`**Status**:`, `Status :`,
// lowercase). Issue #115 tracks the gaps this closes.
//
// The line-start anchor is load-bearing. Without it, `status:` matches the API payload
// `{status: ACCEPTED, review_note?}` in Epic 6.1 — a field name, not a status claim. The
// first version of this hardening did exactly that and failed the build on correct text.
//
// It cannot catch a status claim written as ordinary prose — "Phase 1 and 2 are done",
// or a scope definition ambiguous enough to read as one. A regex that tried would have to
// flag "Phases 4 and 5 make it a complete, production-ready product", which is a correct
// sentence three lines further down. Semantic status claims are a review concern, not a
// test concern: AGENTS.md § "Documentation structure" asks reviewers to flag them, and to
// look hardest at any PR that changes THIS test to accommodate new text.
describe("docs/strategy/roadmap.md", () => {
  it("contains no hand-written status markers", () => {
    const offenders = readFileSync(ROADMAP, "utf8")
      .split("\n")
      .map((line, index) => ({ line: index + 1, text: line }))
      .filter(({ text }) =>
        /[✅❌🚧⏳⚡🆕✔️🔴🟢🟡]|^\s*[-*]?\s*\*{0,2}[Ss]tatus\*{0,2}\s*:/u.test(text),
      );

    expect(offenders).toEqual([]);
  });

  // 22 epics from roadmap.md + 4 new Phase 6 epics from ai_aided_roadmap.md
  // (26 total). The 5 [AX-AUGMENTATION] blocks overlay existing epics and add
  // no headings. Epic 2.7 (Session & Authorization Hardening) was added at the
  // end of Phase 2 in the September 2026 grooming pass to carry three
  // priority:high session/authorization defects (#103, #88, #27) that predate
  // the roadmap and were previously undocumented in it — 27 total. In the same
  // grooming pass, Epic 6.3 (Source Scan & Pixel Anchoring) moved to Phase 3
  // and was renumbered 3.5 — a rename, not an addition, so the count did not
  // change. Three genuinely new epics were then added: 6.4 (Document AI) in
  // Phase 6, and 7.1/7.2 (Field Capture) in a new Phase 7 — 30 total.
  it("carries every epic from both source roadmaps, exactly once", () => {
    const headings = readFileSync(ROADMAP, "utf8").match(/^### Epic \d+\.\d+/gmu) ?? [];

    expect(headings).toHaveLength(30);
    expect(new Set(headings).size).toBe(30);
  });
});
