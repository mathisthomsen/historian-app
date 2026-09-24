import { describe, expect, it, vi } from "vitest";

import {
  loadEpicStatuses,
  loadRoadmap,
  parseEpicStatuses,
  parseRoadmapStructure,
} from "@/lib/roadmap";

// A representative multi-phase fixture, held in memory rather than on disk —
// same rationale as src/test/changelog.test.ts. It deliberately includes:
//  - two phases, each with more than one epic, to prove phase/epic pairing;
//  - a heading typed with a plain hyphen (matching scripts/roadmap-status.ts's
//    EPIC_TITLE_PATTERN, which accepts both an em dash and a hyphen);
//  - a non-epic "###" heading (a table/requirement-check section, as the real
//    roadmap has) to prove it is not mistaken for an epic;
//  - a body full of exactly the kind of material the real Epic 2.7 carries
//    (a defect class, an issue number, a schema/file-path detail) tagged with
//    a unique marker string — the test below asserts the marker never reaches
//    the parsed structure.
const SENSITIVE_MARKER = "SENSITIVE_MARKER_DO_NOT_LEAK_9f3c";

const ROADMAP_FIXTURE = `# Fixture Roadmap

## Phase 1 — Foundation & Auth

### Epic 1.1 — Project Bootstrap

**Deliverable:** a running shell.

- some bullet point
- another one

---

### Epic 1.2 - Database Schema

Body text with a plain-hyphen heading above it.

---

## Phase 2 — Core Research Loop

### Epic 2.1 — Person Management

Ordinary body.

---

### Epic 2.7 — Session & Authorization Hardening

**Disclosure note.** ${SENSITIVE_MARKER}: unfixed defect class, issue #103,
Redis-backed revocation check on \`src/lib/auth-guard.ts\`, JWT \`jti\` denylist.

---

### Requirement-Check: Not An Epic Heading

| Column | Value |
| --- | --- |
| something | ${SENSITIVE_MARKER}-in-a-table-too |
`;

describe("parseRoadmapStructure", () => {
  it("extracts phases and pairs each with its epics, in document order", () => {
    const phases = parseRoadmapStructure(ROADMAP_FIXTURE);

    expect(phases.map((p) => p.name)).toEqual(["Foundation & Auth", "Core Research Loop"]);
    expect(phases[0]?.epics.map((e) => e.id)).toEqual(["1.1", "1.2"]);
    expect(phases[1]?.epics.map((e) => e.id)).toEqual(["2.1", "2.7"]);
  });

  it("extracts the epic title and defaults status to null", () => {
    const phases = parseRoadmapStructure(ROADMAP_FIXTURE);
    const epic = phases[0]?.epics[0];

    expect(epic?.title).toBe("Project Bootstrap");
    expect(epic?.status).toBeNull();
  });

  it("accepts a plain hyphen between the epic number and its name, not only an em dash", () => {
    const phases = parseRoadmapStructure(ROADMAP_FIXTURE);
    expect(phases[0]?.epics[1]).toEqual({ id: "1.2", title: "Database Schema", status: null });
  });

  it("does not treat a non-epic ### heading as an epic", () => {
    const phases = parseRoadmapStructure(ROADMAP_FIXTURE);
    const ids = phases.flatMap((p) => p.epics.map((e) => e.id));
    expect(ids).not.toContain("Not An Epic Heading");
    expect(phases.flatMap((p) => p.epics)).toHaveLength(4);
  });

  it("never carries epic body text into the parsed structure — the safety property", () => {
    // This is the load-bearing test for this whole feature: docs/strategy/roadmap.md
    // is an internal planning document in a public repository, and epic bodies
    // (Epic 2.7 sharpest of all) name defect classes, issue numbers, schema
    // internals and file paths that must never reach the public /roadmap page.
    // The parser must be structurally incapable of returning them — proven here
    // by grepping its OUTPUT, not by trusting the renderer to omit them.
    const phases = parseRoadmapStructure(ROADMAP_FIXTURE);
    const serialized = JSON.stringify(phases);

    expect(serialized).not.toContain(SENSITIVE_MARKER);
    expect(serialized).not.toContain("issue #103");
    expect(serialized).not.toContain("auth-guard.ts");
  });

  it("drops an epic heading that appears before any phase heading", () => {
    const noPhase = `### Epic 9.9 — Orphaned Epic\n\nBody.\n\n## Phase 1 — Real Phase\n\n### Epic 1.1 — Real Epic\n`;
    const phases = parseRoadmapStructure(noPhase);
    expect(phases).toHaveLength(1);
    expect(phases[0]?.epics.map((e) => e.id)).toEqual(["1.1"]);
  });

  it("returns no phases for markdown with no phase headings", () => {
    expect(parseRoadmapStructure("# Just a title\n\nSome prose.\n")).toEqual([]);
  });
});

describe("parseEpicStatuses", () => {
  it("builds a lookup by epic id from the status generator's shape", () => {
    const statuses = parseEpicStatuses([
      { epic: "1.1", title: "Project Bootstrap", state: "shipped", openIssues: 0, closedIssues: 0 },
      { epic: "2.7", title: "Hardening", state: "in_progress", openIssues: 2, closedIssues: 1 },
    ]);

    expect(statuses.get("1.1")).toEqual({ state: "shipped", openIssues: 0, closedIssues: 0 });
    expect(statuses.get("2.7")).toEqual({ state: "in_progress", openIssues: 2, closedIssues: 1 });
  });

  it("degrades gracefully: not an array at all", () => {
    expect(parseEpicStatuses(null).size).toBe(0);
    expect(parseEpicStatuses({ epic: "1.1" }).size).toBe(0);
    expect(parseEpicStatuses("garbage").size).toBe(0);
  });

  it("degrades gracefully: skips entries with a missing or unrecognised state", () => {
    const statuses = parseEpicStatuses([
      { epic: "1.1", state: "on_fire" },
      { epic: "1.2" },
      { state: "shipped" },
      "not even an object",
      null,
    ]);
    expect(statuses.size).toBe(0);
  });

  it("defaults missing issue counts to zero rather than throwing", () => {
    const statuses = parseEpicStatuses([{ epic: "1.1", state: "planned" }]);
    expect(statuses.get("1.1")).toEqual({ state: "planned", openIssues: 0, closedIssues: 0 });
  });
});

// content/roadmap-status.json is mocked the same way changelog.test.ts mocks
// content/changelog/*.mdx: readFile keyed by basename, so these tests never
// touch the real committed artifact or the real roadmap.md.
const files: Record<string, string> = {
  "roadmap-status.json": JSON.stringify([
    { epic: "1.1", title: "Project Bootstrap", state: "shipped", openIssues: 0, closedIssues: 0 },
    { epic: "1.2", title: "Database Schema", state: "planned", openIssues: 0, closedIssues: 0 },
    {
      epic: "2.7",
      title: "Session & Authorization Hardening",
      state: "in_progress",
      openIssues: 2,
      closedIssues: 1,
    },
  ]),
  "roadmap.md": ROADMAP_FIXTURE,
};

vi.mock("node:fs/promises", () => {
  const readFile = vi.fn(async (path: string) => {
    const name = path.split("/").pop() ?? "";
    const raw = files[name];
    if (raw === undefined) {
      throw Object.assign(new Error(`ENOENT: no such file, open '${path}'`), { code: "ENOENT" });
    }
    return raw;
  });
  return { readFile, default: { readFile } };
});

describe("loadEpicStatuses", () => {
  it("reads and parses the committed status artifact", async () => {
    const { statuses, available } = await loadEpicStatuses();
    expect(available).toBe(true);
    expect(statuses.get("1.1")?.state).toBe("shipped");
    expect(statuses.get("2.7")).toEqual({ state: "in_progress", openIssues: 2, closedIssues: 1 });
  });

  it("reports unavailable, without throwing, when the file is missing", async () => {
    files["roadmap-status.json"] = undefined as unknown as string;
    delete files["roadmap-status.json"];
    const { statuses, available } = await loadEpicStatuses();
    expect(available).toBe(false);
    expect(statuses.size).toBe(0);
    // restore for subsequent tests
    files["roadmap-status.json"] = JSON.stringify([
      { epic: "1.1", title: "Project Bootstrap", state: "shipped", openIssues: 0, closedIssues: 0 },
      { epic: "1.2", title: "Database Schema", state: "planned", openIssues: 0, closedIssues: 0 },
      {
        epic: "2.7",
        title: "Session & Authorization Hardening",
        state: "in_progress",
        openIssues: 2,
        closedIssues: 1,
      },
    ]);
  });

  it("reports unavailable, without throwing, when the file is not valid JSON", async () => {
    const original = files["roadmap-status.json"];
    files["roadmap-status.json"] = "{ not json";
    const { statuses, available } = await loadEpicStatuses();
    expect(available).toBe(false);
    expect(statuses.size).toBe(0);
    files["roadmap-status.json"] = original!;
  });

  it("reports unavailable when the file is valid JSON but not an array", async () => {
    const original = files["roadmap-status.json"];
    files["roadmap-status.json"] = JSON.stringify({ oops: true });
    const { available } = await loadEpicStatuses();
    expect(available).toBe(false);
    files["roadmap-status.json"] = original!;
  });
});

describe("loadRoadmap", () => {
  it("pairs each epic in the structure with its status", async () => {
    const { phases, statusAvailable } = await loadRoadmap();
    expect(statusAvailable).toBe(true);

    const phase1 = phases.find((p) => p.name === "Foundation & Auth");
    expect(phase1?.epics.find((e) => e.id === "1.1")?.status).toEqual({
      state: "shipped",
      openIssues: 0,
      closedIssues: 0,
    });

    const phase2 = phases.find((p) => p.name === "Core Research Loop");
    expect(phase2?.epics.find((e) => e.id === "2.7")?.status).toEqual({
      state: "in_progress",
      openIssues: 2,
      closedIssues: 1,
    });
  });

  it("leaves status null for an epic with no matching status entry, rather than guessing", async () => {
    const { phases } = await loadRoadmap();
    const phase2 = phases.find((p) => p.name === "Core Research Loop");
    // 2.1 has no entry in the mocked status fixture above.
    expect(phase2?.epics.find((e) => e.id === "2.1")?.status).toBeNull();
  });

  it("still returns the full phase/epic structure when status data is missing", async () => {
    const original = files["roadmap-status.json"];
    delete files["roadmap-status.json"];

    const { phases, statusAvailable } = await loadRoadmap();

    expect(statusAvailable).toBe(false);
    expect(phases.flatMap((p) => p.epics)).toHaveLength(4);
    expect(phases.flatMap((p) => p.epics).every((e) => e.status === null)).toBe(true);

    files["roadmap-status.json"] = original!;
  });

  it("never leaks epic body text through the full load path either", async () => {
    const { phases } = await loadRoadmap();
    expect(JSON.stringify(phases)).not.toContain(SENSITIVE_MARKER);
  });
});
