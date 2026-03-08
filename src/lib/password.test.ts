import { describe, expect, it } from "vitest";

import { checkPasswordStrength } from "@/lib/password";

describe("checkPasswordStrength", () => {
  it("score 0: empty string", () => {
    const result = checkPasswordStrength("");
    expect(result.score).toBe(0);
    expect(result.label).toBe("weak");
  });

  // Score 1: only one rule matched. The length rule uses >= 8.
  // To hit exactly 1: 8 digits only → length(+1) + digit(+1) = 2. Hard to get exactly 1.
  // Best approach: use a string that's < 8 chars but hits exactly 1 rule.
  // e.g. "A" → uppercase only → score 1
  it("score 1: single rule matched (e.g. one uppercase char)", () => {
    const result = checkPasswordStrength("A");
    expect(result.score).toBe(1);
    expect(result.label).toBe("weak");
  });

  // Score 2: length + one other rule. "AAAAAAAA" → length + upper = 2
  it("score 2: length + uppercase only (e.g. 'AAAAAAAA')", () => {
    const result = checkPasswordStrength("AAAAAAAA");
    expect(result.score).toBe(2);
    expect(result.label).toBe("fair");
  });

  // Score 3: length + upper + lower = 3 (e.g. "AAAAAaaa")
  it("score 3: length + upper + lower (e.g. 'AAAAAaaa')", () => {
    const result = checkPasswordStrength("AAAAAaaa");
    expect(result.score).toBe(3);
    expect(result.label).toBe("good");
  });

  // Score 4: length + upper + lower + digit = 4 (e.g. "AAAAAaaa1")
  it("score 4: length + upper + lower + number (e.g. 'AAAAAaaa1')", () => {
    const result = checkPasswordStrength("AAAAAaaa1");
    expect(result.score).toBe(4);
    expect(result.label).toBe("strong");
  });

  // Score 5: all rules (e.g. "AAAAAaaa1!")
  it("score 5 (veryStrong): all rules (e.g. 'AAAAAaaa1!')", () => {
    const result = checkPasswordStrength("AAAAAaaa1!");
    expect(result.score).toBe(5);
    expect(result.label).toBe("veryStrong");
  });

  // Boundary: 7 chars does NOT get the length point
  // "AAAAa1!" = 7 chars → no length, but upper + lower + digit + special = 4
  it("boundary: 7 chars does NOT get the length point", () => {
    const result = checkPasswordStrength("AAAAa1!");
    expect(result.score).toBe(4);
    expect(result.label).toBe("strong");
  });

  // Missing each rule individually (starting from all-5 password "AAAAAaaa1!")
  it("missing uppercase: score drops to 4", () => {
    // length + lower + digit + special (no upper)
    const result = checkPasswordStrength("aaaaaaaa1!");
    expect(result.score).toBe(4);
    expect(result.label).toBe("strong");
  });

  it("missing lowercase: score drops to 4", () => {
    // length + upper + digit + special (no lower)
    const result = checkPasswordStrength("AAAAAAAA1!");
    expect(result.score).toBe(4);
    expect(result.label).toBe("strong");
  });

  it("missing digit: score drops to 4", () => {
    // length + upper + lower + special (no digit)
    const result = checkPasswordStrength("AAAAAaaa!");
    expect(result.score).toBe(4);
    expect(result.label).toBe("strong");
  });

  it("missing special: score drops to 4", () => {
    // length + upper + lower + digit (no special)
    const result = checkPasswordStrength("AAAAAaaa1");
    expect(result.score).toBe(4);
    expect(result.label).toBe("strong");
  });
});
