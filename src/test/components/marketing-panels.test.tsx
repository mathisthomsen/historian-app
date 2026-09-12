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

const CITATION = {
  sourceLabel: "Nürnberger Polizeiakte, 1828",
  page: "Bl. 4r",
  quote: "ist alhier den 26. Maii ohnverhofft angekommen",
};

describe("EvidenceCitation", () => {
  it("renders the source, the page reference and the quotation", () => {
    renderWithProviders(<EvidenceCitation {...CITATION} />);
    expect(screen.getByText(/Nürnberger Polizeiakte, 1828/)).toBeInTheDocument();
    expect(screen.getByText(/Bl\. 4r/)).toBeInTheDocument();
    expect(screen.getByText(/ohnverhofft angekommen/)).toBeInTheDocument();
  });

  it("issues no network request", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    renderWithProviders(<EvidenceCitation {...CITATION} />);
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
