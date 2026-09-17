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
