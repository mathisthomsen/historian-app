import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";

import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

describe("PasswordStrengthIndicator", () => {
  it("renders 5 segments with muted color and no label text for empty password", () => {
    renderWithProviders(<PasswordStrengthIndicator password="" />);
    const segments = document.querySelectorAll(".h-1\\.5");
    expect(segments).toHaveLength(5);
    segments.forEach((seg) => {
      expect(seg.className).toContain("bg-muted");
    });
    // No label text shown when password is empty
    expect(screen.queryByText("Schwach")).toBeNull();
    expect(screen.queryByText("Sehr stark")).toBeNull();
  });

  it("shows label text when password has content (score 1 = weak)", () => {
    renderWithProviders(<PasswordStrengthIndicator password="test" />);
    expect(screen.getByText("Schwach")).toBeDefined();
  });

  it("all segments green and shows 'Sehr stark' for strong password", () => {
    renderWithProviders(<PasswordStrengthIndicator password="Demo1234!" />);
    const segments = document.querySelectorAll(".h-1\\.5");
    segments.forEach((seg) => {
      expect(seg.className).toContain("bg-green-500");
    });
    expect(screen.getByText("Sehr stark")).toBeDefined();
  });

  it("shows 'Gut' for password with score 3", () => {
    // score 3: length>=8, has lower, has number — no upper, no special
    renderWithProviders(<PasswordStrengthIndicator password="demo1234" />);
    expect(screen.getByText("Gut")).toBeDefined();
  });

  it("has aria-label from translations", () => {
    renderWithProviders(<PasswordStrengthIndicator password="" />);
    expect(screen.getByRole("group", { name: "Passwortstärke" })).toBeDefined();
  });
});
