import { describe, expect, it } from "vitest";

// The guard itself lives with the E2E helpers (it is test infrastructure, not
// app code), but vitest excludes **/e2e/**, so its unit test lives here.
import { PRODUCTION_BRANCH_ID, assertNotProductionBranch } from "../../e2e/helpers/guard";

describe("assertNotProductionBranch", () => {
  // On 2026-08-09 a machine ran the E2E suite against a localhost server that
  // was wired to the production database, creating 20 fixture accounts there.
  // Nothing in the suite objected. This is the objection.
  it("throws when connected to the production branch", () => {
    expect(() => assertNotProductionBranch(PRODUCTION_BRANCH_ID)).toThrow(/production/i);
  });

  it("names the branch in the error so the message is actionable", () => {
    expect(() => assertNotProductionBranch(PRODUCTION_BRANCH_ID)).toThrow(
      new RegExp(PRODUCTION_BRANCH_ID),
    );
  });

  it("allows the dev branch", () => {
    expect(() => assertNotProductionBranch("br-falling-resonance-a9xyd5y9")).not.toThrow();
  });

  it("allows an ephemeral per-run CI branch", () => {
    expect(() => assertNotProductionBranch("br-royal-meadow-a9rsw9na")).not.toThrow();
  });

  // Fails closed, deliberately: if we cannot prove which database we are
  // pointed at, we must not write fixtures into it. Every environment here is
  // Neon, so an absent branch id means something is wrong, not something exotic.
  it("throws when the branch cannot be determined (null)", () => {
    expect(() => assertNotProductionBranch(null)).toThrow(/could not determine|unknown/i);
  });

  it("throws when the branch cannot be determined (undefined)", () => {
    expect(() => assertNotProductionBranch(undefined)).toThrow(/could not determine|unknown/i);
  });

  it("throws on an empty branch id rather than treating it as safe", () => {
    expect(() => assertNotProductionBranch("")).toThrow(/could not determine|unknown/i);
  });

  it("points at the setting to check when the branch is unknown", () => {
    expect(() => assertNotProductionBranch(null)).toThrow(/neon\.branch_id/);
  });
});
