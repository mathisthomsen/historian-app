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
  propertyLabel: "Beleg für",
  property: "Geburtsdatum",
  sourceLabel: "Nürnberger Polizeiakte, 1828",
  page: "Bl. 4r",
  quoteLabel: "Zitat",
  quote: "ist allhier den 26. Mai unverhofft angekommen",
  transcriptionLabel: "Transkription",
  transcription: "ist alhier den 26. Maii ohnverhofft angekommen",
};

describe("EvidenceCitation", () => {
  it("renders the source and the page reference", () => {
    renderWithProviders(<EvidenceCitation {...CITATION} />);
    expect(screen.getByText(/Nürnberger Polizeiakte, 1828/)).toBeInTheDocument();
    expect(screen.getByText(/Bl\. 4r/)).toBeInTheDocument();
  });

  it("names the field the evidence attaches to", () => {
    // `PropertyEvidence.property` is what makes "evidence attaches to the
    // individual field" true; without it the panel's claim has nothing in the
    // picture to point at.
    renderWithProviders(<EvidenceCitation {...CITATION} />);
    expect(screen.getByText("Beleg für")).toBeInTheDocument();
    expect(screen.getByText("Geburtsdatum")).toBeInTheDocument();
  });

  it("keeps the normalized quotation and the verbatim transcription as separate, labelled values", () => {
    // PropertyEvidence stores `quote` and `raw_transcription` as two columns
    // because they are two scholarly objects. Showing one value under a label
    // that names the other collapses the distinction the panel's copy promises.
    renderWithProviders(<EvidenceCitation {...CITATION} />);
    expect(screen.getByText(/unverhofft angekommen/)).toBeInTheDocument();
    expect(screen.getByText(/ohnverhofft angekommen/)).toBeInTheDocument();
    expect(screen.getByText("Zitat")).toBeInTheDocument();
    expect(screen.getByText("Transkription")).toBeInTheDocument();
  });

  it("issues no network request", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    renderWithProviders(<EvidenceCitation {...CITATION} />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

const DESCRIPTION =
  "Vier Entitätstypen — Person, Ereignis, Ort und Quelle — sind untereinander verbunden. " +
  "Die Verbindung von Person zu Ereignis trägt den selbst definierten Typ „bezeugt“ und die " +
  "Gewissheit „Wahrscheinlich“.";

describe("RelationDiagram", () => {
  it("labels all four entity nodes", () => {
    renderWithProviders(<RelationDiagram labels={LABELS} description={DESCRIPTION} />);
    for (const label of ["Person", "Ereignis", "Ort", "Quelle"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("names every node it draws in its accessible name, not just a sample", () => {
    // role="img" collapses the SVG's own <text> nodes, so the label is the only
    // thing a screen reader gets. An earlier version named three of the four
    // nodes and reduced five edges to one chain; asserting against the same
    // LABELS the picture renders from is what keeps the two in step.
    renderWithProviders(<RelationDiagram labels={LABELS} description={DESCRIPTION} />);
    const name = screen.getByRole("img").getAttribute("aria-label") ?? "";
    for (const value of Object.values(LABELS)) {
      expect(name).toContain(value);
    }
  });

  it("does not paint certainty onto entity types", () => {
    // A node is an entity type, not an assertion. Stroking nodes from the
    // certainty palette taught a level the model does not record at that scope,
    // one panel after the page introduced the palette.
    const { container } = renderWithProviders(
      <RelationDiagram labels={LABELS} description={DESCRIPTION} />,
    );
    for (const circle of Array.from(container.querySelectorAll("circle[r='34']"))) {
      expect(circle.getAttribute("stroke")).toBe("var(--color-border)");
    }
  });
});
