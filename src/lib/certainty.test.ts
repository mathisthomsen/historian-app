import { describe, expect, it } from "vitest";

import { certaintyForValue } from "@/lib/certainty";

/**
 * Guards the invariant that certainty qualifies an assertion.
 *
 * Measured against a running server before this existed: the API accepted
 * `birth_place: null, birth_place_certainty: "CERTAIN"` (201), and clearing an
 * existing place left its CERTAIN in place (200). The detail page then rendered
 * "— · Unbelegt" — an unevidenced-claim warning about a claim nobody made.
 */
describe("certaintyForValue", () => {
  it("keeps the level when the field carries a value", () => {
    expect(certaintyForValue("Weimar", "CERTAIN")).toBe("CERTAIN");
    expect(certaintyForValue("Weimar", "PROBABLE")).toBe("PROBABLE");
    expect(certaintyForValue("Weimar", "UNKNOWN")).toBe("UNKNOWN");
  });

  it("drops the level to UNKNOWN when there is nothing to qualify", () => {
    expect(certaintyForValue(null, "CERTAIN")).toBe("UNKNOWN");
    expect(certaintyForValue(undefined, "PROBABLE")).toBe("UNKNOWN");
    expect(certaintyForValue("", "CERTAIN")).toBe("UNKNOWN");
  });

  it("treats whitespace as absent, since it asserts nothing either", () => {
    expect(certaintyForValue("   ", "CERTAIN")).toBe("UNKNOWN");
  });

  it("stays undefined when no level was supplied, so a PATCH-style merge is not forced to write one", () => {
    expect(certaintyForValue("Weimar", undefined)).toBeUndefined();
    expect(certaintyForValue(null, undefined)).toBeUndefined();
  });
});
