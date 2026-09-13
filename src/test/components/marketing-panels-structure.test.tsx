import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EditorialPassage } from "@/components/marketing/EditorialPassage";
import { HighlightPanel } from "@/components/marketing/HighlightPanel";

import deMessages from "../../../messages/de.json";
import { renderWithProviders } from "../render";

describe("HighlightPanel", () => {
  it("renders the kicker, title and body", () => {
    renderWithProviders(
      <HighlightPanel kicker="Gewissheit" title="Vier Stufen." body="Pro Feld." specimen={null} />,
    );
    expect(screen.getByText("Gewissheit")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Vier Stufen." })).toBeInTheDocument();
    expect(screen.getByText("Pro Feld.")).toBeInTheDocument();
  });

  it("puts the specimen in its own column, not inside the prose", () => {
    const { container } = renderWithProviders(
      <HighlightPanel
        kicker="Gewissheit"
        title="Vier Stufen."
        body="Pro Feld."
        specimen={<p>SPEZIMEN</p>}
      />,
    );
    const specimen = container.querySelector("[data-slot='specimen']");
    const prose = container.querySelector("[data-slot='panel-prose']");
    expect(specimen).toBeInTheDocument();
    expect(prose).toBeInTheDocument();
    // The old rail nested the demo in a card footer, which read as metadata
    // about the card rather than a picture of its subject. It is now a sibling
    // of the prose, carrying its own half of the spread.
    expect(prose!.contains(specimen!)).toBe(false);
    expect(specimen).toHaveTextContent("SPEZIMEN");
  });
});

describe("EditorialPassage", () => {
  it("labels itself, so the passage reads as a deliberate epigraph", () => {
    renderWithProviders(<EditorialPassage />);
    expect(screen.getByText(deMessages.marketing.editorial.kicker)).toBeInTheDocument();
  });

  it("renders the lede and sets the closing clause apart for emphasis", () => {
    renderWithProviders(<EditorialPassage />);
    expect(
      screen.getByText(deMessages.marketing.editorial.lede, { exact: false }),
    ).toBeInTheDocument();
    const punchline = screen.getByText(deMessages.marketing.editorial.punchline);
    expect(punchline.tagName).toBe("STRONG");
  });
});
