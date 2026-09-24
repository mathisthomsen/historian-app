import { execFileSync } from "node:child_process";

import { describe, expect, it, vi } from "vitest";

import {
  buildStatusFile,
  deriveEpicState,
  deriveEpicStatuses,
  fetchMilestones,
  parseEpicTitle,
  type GhMilestone,
} from "../../scripts/roadmap-status";

// The child_process module backing `fetchMilestones()` is mocked so this
// test never reaches the real GitHub API — see the "fetchMilestones" describe
// block below. `vi.mock` calls are hoisted above these imports by vitest, so
// placement here (after the imports, for import/order) is safe.
vi.mock("node:child_process", () => {
  const execFileSync = vi.fn();
  return { execFileSync, default: { execFileSync } };
});

const mockedExecFileSync = vi.mocked(execFileSync);

function milestone(overrides: Partial<GhMilestone> & Pick<GhMilestone, "title">): GhMilestone {
  return {
    state: "open",
    open_issues: 0,
    closed_issues: 0,
    ...overrides,
  };
}

describe("parseEpicTitle", () => {
  it("parses the epic number and name out of a milestone title", () => {
    expect(parseEpicTitle("Epic 2.7 — Session & Authorization Hardening")).toEqual({
      epic: "2.7",
      name: "Session & Authorization Hardening",
    });
  });

  it("accepts a plain hyphen as well as an em dash", () => {
    expect(parseEpicTitle("Epic 3.2 - Location System & Mapping")).toEqual({
      epic: "3.2",
      name: "Location System & Mapping",
    });
  });

  it("returns null for a milestone that isn't an epic milestone", () => {
    expect(parseEpicTitle("Sprint 14")).toBeNull();
    expect(parseEpicTitle("v1.0 release")).toBeNull();
  });
});

describe("deriveEpicState — the three derivation rules", () => {
  it("closed milestone -> shipped, regardless of issue counts", () => {
    expect(deriveEpicState({ state: "closed", open_issues: 0, closed_issues: 0 })).toBe("shipped");
    expect(deriveEpicState({ state: "closed", open_issues: 3, closed_issues: 5 })).toBe("shipped");
  });

  it("closed milestone with open issues remaining -> shipped with a non-zero openIssues (Epic 2.5 case: shipped with a known follow-up)", () => {
    expect(deriveEpicState({ state: "closed", open_issues: 1, closed_issues: 0 })).toBe("shipped");
  });

  it("open milestone with at least one closed issue -> in_progress", () => {
    expect(deriveEpicState({ state: "open", open_issues: 0, closed_issues: 1 })).toBe(
      "in_progress",
    );
  });

  it("open milestone with open issues but zero closed issues -> planned, not in_progress (Epic 2.7 case: filed scope is not evidence work has started)", () => {
    expect(deriveEpicState({ state: "open", open_issues: 3, closed_issues: 0 })).toBe("planned");
  });

  it("open milestone with a single open issue and zero closed -> planned", () => {
    expect(deriveEpicState({ state: "open", open_issues: 1, closed_issues: 0 })).toBe("planned");
  });

  it("open milestone with no issues at all -> planned", () => {
    expect(deriveEpicState({ state: "open", open_issues: 0, closed_issues: 0 })).toBe("planned");
  });

  it("no milestone at all -> planned, not an error", () => {
    expect(deriveEpicState(undefined)).toBe("planned");
  });
});

describe("deriveEpicStatuses", () => {
  it("builds one entry per epic milestone, sorted by epic number", () => {
    const milestones: GhMilestone[] = [
      milestone({ title: "Epic 3.2 — Location System & Mapping", state: "open" }),
      milestone({
        title: "Epic 1.1 — Project Bootstrap & Developer Experience",
        state: "closed",
      }),
      milestone({
        title: "Epic 2.7 — Session & Authorization Hardening",
        state: "open",
        open_issues: 2,
        closed_issues: 1,
      }),
    ];

    const statuses = deriveEpicStatuses(milestones);

    expect(statuses.map((s) => s.epic)).toEqual(["1.1", "2.7", "3.2"]);
    expect(statuses[0]).toEqual({
      epic: "1.1",
      title: "Project Bootstrap & Developer Experience",
      state: "shipped",
      openIssues: 0,
      closedIssues: 0,
    });
    expect(statuses[1]).toEqual({
      epic: "2.7",
      title: "Session & Authorization Hardening",
      state: "in_progress",
      openIssues: 2,
      closedIssues: 1,
    });
    expect(statuses[2]).toEqual({
      epic: "3.2",
      title: "Location System & Mapping",
      state: "planned",
      openIssues: 0,
      closedIssues: 0,
    });
  });

  it("drops milestones whose title is not an epic milestone, without erroring", () => {
    const milestones: GhMilestone[] = [
      milestone({ title: "Sprint 14", state: "closed" }),
      milestone({ title: "Epic 5.1 — Export System", state: "open", open_issues: 1 }),
    ];

    const statuses = deriveEpicStatuses(milestones);

    expect(statuses).toHaveLength(1);
    expect(statuses[0]?.epic).toBe("5.1");
  });

  it("an epic absent from the milestone list produces no entry — the generator must not invent one", () => {
    const milestones: GhMilestone[] = [
      milestone({ title: "Epic 1.1 — Project Bootstrap & Developer Experience", state: "closed" }),
    ];

    const statuses = deriveEpicStatuses(milestones);

    expect(statuses.map((s) => s.epic)).toEqual(["1.1"]);
    expect(statuses.find((s) => s.epic === "9.9")).toBeUndefined();
  });
});

describe("buildStatusFile", () => {
  it("emits a generatedAt timestamp alongside the derived epics", () => {
    const milestones: GhMilestone[] = [
      milestone({ title: "Epic 1.1 — Project Bootstrap & Developer Experience", state: "closed" }),
    ];
    const fixedNow = () => new Date("2026-09-24T12:00:00.000Z");

    const output = buildStatusFile(milestones, fixedNow);

    expect(output.generatedAt).toBe("2026-09-24T12:00:00.000Z");
    expect(output.epics).toEqual(deriveEpicStatuses(milestones));
  });

  it("defaults to the real clock when no clock is injected", () => {
    const before = Date.now();
    const output = buildStatusFile([]);
    const after = Date.now();

    const parsed = Date.parse(output.generatedAt);
    expect(parsed).toBeGreaterThanOrEqual(before);
    expect(parsed).toBeLessThanOrEqual(after);
    expect(output.epics).toEqual([]);
  });
});

describe("fetchMilestones", () => {
  it("parses a successful gh api response into milestone objects", () => {
    mockedExecFileSync.mockReturnValueOnce(
      JSON.stringify([
        { title: "Epic 1.1 — Project Bootstrap & Developer Experience", state: "closed" },
      ]),
    );

    const milestones = fetchMilestones();

    expect(milestones).toHaveLength(1);
    expect(milestones[0]?.title).toBe("Epic 1.1 — Project Bootstrap & Developer Experience");
  });

  it("fails loudly — throws rather than returning an empty list — when GitHub is unreachable", () => {
    mockedExecFileSync.mockImplementationOnce(() => {
      throw new Error("gh: connection refused");
    });

    expect(() => fetchMilestones()).toThrow(/could not reach github/i);
  });

  it("fails loudly when gh returns something that isn't a JSON array", () => {
    mockedExecFileSync.mockReturnValueOnce(JSON.stringify({ message: "Not Found" }));

    expect(() => fetchMilestones()).toThrow(/array of milestones/i);
  });

  it("fails loudly when gh returns unparseable output", () => {
    mockedExecFileSync.mockReturnValueOnce("not json");

    expect(() => fetchMilestones()).toThrow(/unparseable/i);
  });
});
