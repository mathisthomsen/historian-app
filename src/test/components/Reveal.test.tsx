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
