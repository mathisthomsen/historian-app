import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROADMAP = join(process.cwd(), "docs", "strategy", "roadmap.md");

// The roadmap is the one strategy document most likely to attract a
// hand-written status column, because that is what both of its predecessors
// eventually wanted to be. Status lives on GitHub Issues and the Evidoxa
// Backlog project board (`gh project 1 --owner mathisthomsen`), not in this
// file — there are no GitHub milestones in this repo, and a milestone-based
// generator, if ever built, is planned work, not a present mechanism. This
// test is the guard that keeps status out of the roadmap either way.
describe("docs/strategy/roadmap.md", () => {
  it("contains no hand-written status markers", () => {
    const offenders = readFileSync(ROADMAP, "utf8")
      .split("\n")
      .map((line, index) => ({ line: index + 1, text: line }))
      .filter(({ text }) => /[✅❌🚧]|\bStatus:/u.test(text));

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
