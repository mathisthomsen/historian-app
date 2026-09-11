import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi, beforeEach } from "vitest";

import { Reveal } from "@/components/marketing/Reveal";

import { renderWithProviders } from "../render";

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? reduce : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  );
}

describe("Reveal", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      })),
    );
  });

  it("starts hidden and observes when motion is allowed", () => {
    mockReducedMotion(false);
    // Query by the data attribute rather than container.firstElementChild:
    // next-themes' ThemeProvider (used by renderWithProviders) prepends an
    // inline flash-prevention <script> as the first child, so firstElementChild
    // is not the Reveal wrapper.
    const { container } = renderWithProviders(<Reveal>content</Reveal>);
    expect(container.querySelector("[data-revealed]")).toHaveAttribute("data-revealed", "false");
    expect(IntersectionObserver).toHaveBeenCalled();
  });

  it("renders already revealed when reduced motion is requested", () => {
    mockReducedMotion(true);
    const { container } = renderWithProviders(<Reveal>content</Reveal>);
    expect(container.querySelector("[data-revealed]")).toHaveAttribute("data-revealed", "true");
  });

  it("never creates an observer under reduced motion", () => {
    mockReducedMotion(true);
    renderWithProviders(<Reveal>content</Reveal>);
    expect(IntersectionObserver).not.toHaveBeenCalled();
  });
});

describe("Reveal CSS — visible by default for no-JS visitors (F1)", () => {
  it("does not set opacity: 0 on a bare .reveal selector unscoped by .js", () => {
    // SSR always emits data-revealed="false" (see prefersReducedMotion() returning
    // false when `window` is undefined). If the base .reveal rule hides content
    // unconditionally, then a no-JS visitor, a crawler, or a failed bundle would
    // see a permanently blank page below the hero — the hiding must be opt-in,
    // gated on a .js class that only lands once client JS has proven itself
    // present (see the inline script in the marketing layout).
    const css = readFileSync(resolve(process.cwd(), "src/styles/globals.css"), "utf-8");
    const unscopedHidden = /(?<!\.js )\.reveal\s*\{[^}]*opacity:\s*0\b/.exec(css);
    expect(
      unscopedHidden,
      `Found a bare, unscoped ".reveal" rule setting opacity: 0 — this hides content ` +
        `from any visitor without JS. Scope it under ".js .reveal" instead. Match: ${JSON.stringify(
          unscopedHidden?.[0],
        )}`,
    ).toBeNull();
  });
});
