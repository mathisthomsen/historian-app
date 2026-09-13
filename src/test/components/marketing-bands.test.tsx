import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CtaBand } from "@/components/marketing/CtaBand";
import { OpenDevelopment } from "@/components/marketing/OpenDevelopment";

import deMessages from "../../../messages/de.json";
import enMessages from "../../../messages/en.json";
import { renderWithProviders } from "../render";

const FORBIDDEN_GATE_LANGUAGE =
  /geschlossen|closed alpha|warteliste|waitlist|invite[- ]only|einladung|nur auf einladung/i;

describe("CtaBand (Part A)", () => {
  it("sends visitors to open registration", () => {
    renderWithProviders(<CtaBand locale="de" />);
    expect(screen.getByRole("link", { name: /konto erstellen/i })).toHaveAttribute(
      "href",
      "/de/auth/register",
    );
  });

  it("does not claim a closed alpha in the rendered German copy, because registration is open in Part A", () => {
    const { container } = renderWithProviders(<CtaBand locale="de" />);
    expect(container.textContent).not.toMatch(FORBIDDEN_GATE_LANGUAGE);
  });

  it.each([
    ["de", deMessages],
    ["en", enMessages],
  ])("%s cta copy does not claim a gate that does not exist yet", (_locale, messages) => {
    const cta = Object.values(messages.marketing.cta).join(" ");
    expect(cta).not.toMatch(FORBIDDEN_GATE_LANGUAGE);
  });
});

describe("OpenDevelopment", () => {
  it("links to the changelog", () => {
    renderWithProviders(<OpenDevelopment locale="de" />);
    expect(screen.getByRole("link", { name: /changelog/i })).toHaveAttribute(
      "href",
      "/de/changelog",
    );
  });

  it("lists three status lines", () => {
    renderWithProviders(<OpenDevelopment locale="de" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("renders each status line as a label and a separate state, so the ledger reads as a table", () => {
    renderWithProviders(<OpenDevelopment locale="de" />);
    const status = deMessages.marketing.openDev.status;
    for (const row of [status.shipped, status.next, status.planned]) {
      const item = screen.getByText(row.label).closest("li");
      expect(item).not.toBeNull();
      expect(within(item!).getByText(row.state)).toBeInTheDocument();
    }
  });

  it("occupies the second column instead of leaving it empty", () => {
    // The band used to be a single left-hugging text column inside a max-w-7xl
    // container, which left roughly 40% of a desktop viewport unclaimed and
    // read as missing content rather than as deliberate whitespace.
    const { container } = renderWithProviders(<OpenDevelopment locale="de" />);
    const grid = container.querySelector(".editorial-grid");
    expect(grid).toBeInTheDocument();
    expect(grid!.querySelector("[data-slot='specimen']")).toBeInTheDocument();
  });
});
