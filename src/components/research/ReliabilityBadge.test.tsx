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
  it("renders 'Hoch' for HIGH with green classes", () => {
    renderWithProviders(<ReliabilityBadge reliability="HIGH" />);
    const badge = screen.getByText("Hoch");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-green-700");
    expect(badge).toHaveClass("bg-green-50");
  });

  it("renders 'Mittel' for MEDIUM with yellow classes", () => {
    renderWithProviders(<ReliabilityBadge reliability="MEDIUM" />);
    const badge = screen.getByText("Mittel");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-yellow-700");
    expect(badge).toHaveClass("bg-yellow-50");
  });

  it("renders 'Niedrig' for LOW with red classes", () => {
    renderWithProviders(<ReliabilityBadge reliability="LOW" />);
    const badge = screen.getByText("Niedrig");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-red-700");
    expect(badge).toHaveClass("bg-red-50");
  });

  it("renders 'Unbekannt' for UNKNOWN with secondary variant", () => {
    renderWithProviders(<ReliabilityBadge reliability="UNKNOWN" />);
    const badge = screen.getByText("Unbekannt");
    expect(badge).toBeInTheDocument();
    // secondary variant should not have color-specific classes
    expect(badge).not.toHaveClass("text-green-700");
    expect(badge).not.toHaveClass("text-yellow-700");
    expect(badge).not.toHaveClass("text-red-700");
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
