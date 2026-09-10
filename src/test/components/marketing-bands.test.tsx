import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CtaBand } from "@/components/marketing/CtaBand";
import { OpenDevelopment } from "@/components/marketing/OpenDevelopment";

import { renderWithProviders } from "../render";

describe("CtaBand (Part A)", () => {
  it("sends visitors to open registration", () => {
    renderWithProviders(<CtaBand locale="de" />);
    expect(screen.getByRole("link", { name: /konto erstellen/i })).toHaveAttribute(
      "href",
      "/de/auth/register",
    );
  });

  it("does not claim a closed alpha, because registration is open in Part A", () => {
    const { container } = renderWithProviders(<CtaBand locale="de" />);
    expect(container.textContent?.toLowerCase()).not.toMatch(/geschlossen|closed alpha|warteliste/);
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
