import { screen } from "@testing-library/react";
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
});
