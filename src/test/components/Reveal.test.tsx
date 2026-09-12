import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi, beforeEach } from "vitest";

import { Reveal } from "@/components/marketing/Reveal";

import { act, renderWithProviders } from "../render";

// jsdom does not run layout, so the real Element.prototype.getBoundingClientRect
// always returns an all-zero rect — which would make every element look
// "already scrolled past" under the F1 fix (bottom <= 0) purely as an artifact
// of the test environment. Stub it so tests can choose which case they exercise.
function mockBoundingRectBottom(bottom: number) {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    bottom,
    top: bottom - 100,
    left: 0,
    right: 0,
    width: 0,
    height: 100,
    x: 0,
    y: bottom - 100,
    toJSON: () => {},
  });
}

// Same stub, but the returned bottom can change between calls — needed to
// simulate a same-page anchor jump that happens strictly after mount, where
// the element's position genuinely changes underneath an already-running effect.
function mockMovingBoundingRectBottom(getBottom: () => number) {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(() => {
    const bottom = getBottom();
    return {
      bottom,
      top: bottom - 100,
      left: 0,
      right: 0,
      width: 0,
      height: 100,
      x: 0,
      y: bottom - 100,
      toJSON: () => {},
    };
  });
}

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
    // A realistic on-screen rect: not already scrolled past, so the F1
    // above-viewport shortcut must not fire here.
    mockBoundingRectBottom(400);
    // Query by the data attribute rather than container.firstElementChild:
    // next-themes' ThemeProvider (used by renderWithProviders) prepends an
    // inline flash-prevention <script> as the first child, so firstElementChild
    // is not the Reveal wrapper.
    const { container } = renderWithProviders(<Reveal>content</Reveal>);
    expect(container.querySelector("[data-revealed]")).toHaveAttribute("data-revealed", "false");
    expect(IntersectionObserver).toHaveBeenCalled();
  });

  it("reveals immediately when the element is already above the viewport (F1)", () => {
    // Reproduces the hero CTA jump / back-navigation scroll-restore cases:
    // the element scrolled past before it ever intersected, so a bare
    // IntersectionObserver would never fire and it would stay opacity: 0
    // forever.
    mockReducedMotion(false);
    mockBoundingRectBottom(-50);
    const { container } = renderWithProviders(<Reveal>content</Reveal>);
    expect(container.querySelector("[data-revealed]")).toHaveAttribute("data-revealed", "true");
    expect(IntersectionObserver).not.toHaveBeenCalled();
  });

  it("reveals on scroll when the element goes past the viewport after mount (F1, hero CTA jump)", () => {
    // The mount-time check alone cannot catch this: the element starts
    // below the viewport (not yet past it), so IntersectionObserver is
    // attached normally. It then jumps straight past the viewport — as the
    // hero's "#highlights" anchor CTA does to the editorial passage above
    // it — without ever intersecting, which produces no observer callback.
    // Only a subsequent recheck (on scroll) catches this.
    mockReducedMotion(false);
    let bottom = 400;
    mockMovingBoundingRectBottom(() => bottom);
    const { container } = renderWithProviders(<Reveal>content</Reveal>);
    expect(container.querySelector("[data-revealed]")).toHaveAttribute("data-revealed", "false");

    bottom = -50;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(container.querySelector("[data-revealed]")).toHaveAttribute("data-revealed", "true");
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
