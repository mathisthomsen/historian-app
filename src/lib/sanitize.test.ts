import { describe, expect, it } from "vitest";

import { sanitize } from "@/lib/sanitize";

describe("sanitize", () => {
  it("strips an inline <script> tag", () => {
    expect(sanitize("<script>alert(1)</script>Hello")).toBe("Hello");
  });

  it("strips <script> with src attribute", () => {
    expect(sanitize('<script src="evil.js"></script>')).toBe("");
  });

  it("strips multi-line <script> block", () => {
    const input = "<script>\nconsole.log('x');\n</script>safe";
    expect(sanitize(input)).toBe("safe");
  });

  it("is case-insensitive (<SCRIPT>)", () => {
    expect(sanitize("<SCRIPT>alert(1)</SCRIPT>ok")).toBe("ok");
  });

  it("passes clean strings through unchanged", () => {
    const clean = "Hello, World! <b>bold</b>";
    expect(sanitize(clean)).toBe(clean);
  });

  it("returns empty string when input is empty", () => {
    expect(sanitize("")).toBe("");
  });
});
