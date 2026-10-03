import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccessRequestForm } from "@/components/marketing/AccessRequestForm";
import { OpenDevelopment } from "@/components/marketing/OpenDevelopment";

import deMessages from "../../../messages/de.json";
import enMessages from "../../../messages/en.json";
import { renderWithProviders } from "../render";

// The page must say what is true: registration closed with this change, so the
// copy names the gate. (Before #29 it was the reverse — a test forbade this
// language because the gate did not exist yet.)
const GATE_LANGUAGE = /geschlossen|closed alpha|einladung|invitation/i;
const OPEN_SIGNUP_LANGUAGE =
  /konto erstellen|create account|ein konto genügt|account is all it takes/i;

describe("AccessRequestForm band (replaces CtaBand)", () => {
  it("is the #access band and offers a request, not registration", () => {
    const { container } = renderWithProviders(<AccessRequestForm locale="de" />);
    expect(container.querySelector("section#access")).not.toBeNull();
    expect(screen.getByRole("button", { name: /zugang anfragen/i })).toBeInTheDocument();
    expect(container.querySelector('a[href*="/auth/register"]')).toBeNull();
  });

  it("states the closed alpha in the rendered German copy", () => {
    const { container } = renderWithProviders(<AccessRequestForm locale="de" />);
    expect(container.textContent).toMatch(GATE_LANGUAGE);
    expect(container.textContent).not.toMatch(OPEN_SIGNUP_LANGUAGE);
  });

  it.each([
    ["de", deMessages],
    ["en", enMessages],
  ])("%s landing copy names the gate and no longer promises open signup", (_locale, messages) => {
    const cta = Object.values(messages.marketing.cta).join(" ");
    expect(cta).toMatch(GATE_LANGUAGE);
    const entry = [cta, messages.marketing.hero.primary, messages.marketing.nav.register].join(" ");
    expect(entry).not.toMatch(OPEN_SIGNUP_LANGUAGE);
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
