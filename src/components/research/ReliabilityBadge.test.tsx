import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { ReliabilityBadge } from "./ReliabilityBadge";

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useTranslations: () => (key: string) => {
      const map: Record<string, string> = {
        reliability_high: "Hoch",
        reliability_medium: "Mittel",
        reliability_low: "Niedrig",
        reliability_unknown: "Unbekannt",
      };
      return map[key] ?? key;
    },
  };
});

describe("ReliabilityBadge", () => {
  it("renders 'Hoch' for HIGH with success variant classes", () => {
    renderWithProviders(<ReliabilityBadge reliability="HIGH" />);
    const badge = screen.getByText("Hoch");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-[var(--color-success-background)]");
  });

  it("renders 'Mittel' for MEDIUM with warning variant classes", () => {
    renderWithProviders(<ReliabilityBadge reliability="MEDIUM" />);
    const badge = screen.getByText("Mittel");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-[var(--color-warning-background)]");
  });

  it("renders 'Niedrig' for LOW with destructive variant classes", () => {
    renderWithProviders(<ReliabilityBadge reliability="LOW" />);
    const badge = screen.getByText("Niedrig");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-destructive");
  });

  it("renders 'Unbekannt' for UNKNOWN with secondary variant", () => {
    renderWithProviders(<ReliabilityBadge reliability="UNKNOWN" />);
    const badge = screen.getByText("Unbekannt");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-secondary");
  });

  it("renders translated label text for each reliability level", () => {
    const { rerender } = renderWithProviders(<ReliabilityBadge reliability="HIGH" />);
    expect(screen.getByText("Hoch")).toBeInTheDocument();

    rerender(<ReliabilityBadge reliability="MEDIUM" />);
    expect(screen.getByText("Mittel")).toBeInTheDocument();

    rerender(<ReliabilityBadge reliability="LOW" />);
    expect(screen.getByText("Niedrig")).toBeInTheDocument();

    rerender(<ReliabilityBadge reliability="UNKNOWN" />);
    expect(screen.getByText("Unbekannt")).toBeInTheDocument();
  });
});
