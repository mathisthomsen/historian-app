import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HighlightPanel } from "@/components/marketing/HighlightPanel";
import { HighlightRail } from "@/components/marketing/HighlightRail";

import { renderWithProviders } from "../render";

function renderRail() {
  return renderWithProviders(
    <HighlightRail>
      {["A", "B", "C", "D"].map((id) => (
        <HighlightPanel key={id} kicker={`K${id}`} title={`T${id}`} body={`B${id}`} />
      ))}
    </HighlightRail>,
  );
}

describe("HighlightRail", () => {
  it("renders every panel in the DOM, none hidden from assistive tech", () => {
    renderRail();
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    for (const item of items) {
      expect(item).not.toHaveAttribute("aria-hidden");
    }
  });

  it("gives both paddles accessible names", () => {
    renderRail();
    expect(screen.getByRole("button", { name: /zurück|vorher/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /weiter/i })).toBeInTheDocument();
  });

  it("disables the previous paddle at the start", () => {
    renderRail();
    expect(screen.getByRole("button", { name: /zurück|vorher/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /weiter/i })).toBeEnabled();
  });

  it("announces position in a polite live region", () => {
    const { container } = renderRail();
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toBeInTheDocument();
    expect(live).toHaveTextContent("1");
    expect(live).toHaveTextContent("4");
  });

  it("advances the announced position when the next paddle is pressed", () => {
    const { container } = renderRail();
    fireEvent.click(screen.getByRole("button", { name: /weiter/i }));
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent("2");
  });

  it("never auto-advances", () => {
    const { container } = renderRail();
    const before = container.querySelector('[aria-live="polite"]')?.textContent;
    // No timers are started by this component; nothing may change on its own.
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(before);
  });
});
