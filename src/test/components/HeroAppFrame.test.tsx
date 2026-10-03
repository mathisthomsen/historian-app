import { describe, expect, it } from "vitest";

import { HeroAppFrame } from "@/components/marketing/HeroAppFrame";

import { renderWithProviders } from "../render";

/** Certainty of each marker in a row, read from its accessible name. */
function rowLevels(row: Element): (string | null)[] {
  return Array.from(row.querySelectorAll('[role="img"]')).map((m) => m.getAttribute("aria-label"));
}

describe("HeroAppFrame", () => {
  it("draws rows as three cells — name, birth date, death date — like the persons list", () => {
    const { container } = renderWithProviders(<HeroAppFrame />);
    const rows = container.querySelectorAll('[data-testid="hero-row"]');
    expect(rows.length).toBeGreaterThanOrEqual(4);
    for (const row of rows) {
      expect(row.querySelectorAll('[data-testid="hero-cell"]')).toHaveLength(3);
      // One marker per *date* cell; the name cell carries none.
      expect(row.querySelectorAll('[role="img"]')).toHaveLength(2);
      expect(
        row.querySelector('[data-testid="hero-cell"]')?.querySelector('[role="img"]'),
      ).toBeNull();
    }
  });

  it("shows different certainties in the two date cells of at least one row", () => {
    // Per-field scope, visible at a glance: one record whose fields disagree.
    const { container } = renderWithProviders(<HeroAppFrame />);
    const rows = Array.from(container.querySelectorAll('[data-testid="hero-row"]'));
    const differing = rows.filter((row) => {
      const [birth, death] = rowLevels(row);
      return birth !== death;
    });
    expect(differing.length).toBeGreaterThanOrEqual(2);
  });

  it("stays decorative: hidden from assistive technology", () => {
    const { container } = renderWithProviders(<HeroAppFrame />);
    expect(container.querySelector('[data-testid="hero-app-frame"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
