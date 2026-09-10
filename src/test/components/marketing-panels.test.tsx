import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EvidenceCitation } from "@/components/marketing/EvidenceCitation";
import { RelationDiagram } from "@/components/marketing/RelationDiagram";

import { renderWithProviders } from "../render";

const LABELS = {
  person: "Person",
  event: "Ereignis",
  place: "Ort",
  source: "Quelle",
  relation: "bezeugt",
};

describe("EvidenceCitation", () => {
  it("renders the count and the source label as text", () => {
    renderWithProviders(<EvidenceCitation count={3} sourceLabel="Nürnberger Polizeiakte, 1828" />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/Nürnberger Polizeiakte, 1828/)).toBeInTheDocument();
  });

  it("issues no network request", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    renderWithProviders(<EvidenceCitation count={3} sourceLabel="x" />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("RelationDiagram", () => {
  it("exposes an accessible description rather than bare decorative SVG", () => {
    renderWithProviders(<RelationDiagram labels={LABELS} />);
    expect(screen.getByRole("img")).toHaveAccessibleName(/person/i);
  });

  it("labels all four entity nodes", () => {
    renderWithProviders(<RelationDiagram labels={LABELS} />);
    for (const label of ["Person", "Ereignis", "Ort", "Quelle"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
