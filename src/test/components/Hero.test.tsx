import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hero } from "@/components/marketing/Hero";

import { renderWithProviders } from "../render";

describe("Hero", () => {
  it("renders exactly one h1", () => {
    renderWithProviders(<Hero locale="de" />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("points its primary CTA at registration", () => {
    renderWithProviders(<Hero locale="de" />);
    expect(screen.getByRole("link", { name: /konto erstellen/i })).toHaveAttribute(
      "href",
      "/de/auth/register",
    );
  });

  it("uses the marketing display tier, not the app's text scale", () => {
    renderWithProviders(<Hero locale="de" />);
    const h1 = screen.getByRole("heading", { level: 1 });
    // The `length:` hint is the assertion, not decoration. This test used to
    // match `text-[var(--text-display-`, which is the form Tailwind v4 resolves
    // as a *colour* — so it passed while the hero rendered at the inherited
    // 16px. See src/test/display-type.test.ts for the repo-wide guard.
    expect(h1.className).toMatch(/text-\[length:var\(--text-display-/);
  });

  it("hides the decorative app frame from assistive technology", () => {
    const { container } = renderWithProviders(<Hero locale="de" />);
    expect(container.querySelector('[data-testid="hero-app-frame"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
