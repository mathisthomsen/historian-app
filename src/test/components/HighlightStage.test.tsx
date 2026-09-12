import { act, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HighlightStage, type StageStep } from "@/components/marketing/HighlightStage";

import deMessages from "../../../messages/de.json";

const STEPS: StageStep[] = [
  {
    id: "certainty",
    kicker: "Gewissheit",
    title: "Vier Stufen statt einer Behauptung.",
    body: "Gesichert, wahrscheinlich, möglich, unbekannt.",
    specimen: <p>Gewissheits-Spezimen</p>,
  },
  {
    id: "dates",
    kicker: "Datierung",
    title: "Ein Jahr ohne Monat ist eine vollständige Antwort.",
    body: "Jahr, Monat und Tag werden getrennt gespeichert.",
    specimen: <p>Datierungs-Spezimen</p>,
  },
  {
    id: "evidence",
    kicker: "Belege",
    title: "Jede Aussage zeigt auf ihre Quelle.",
    body: "Belege hängen am einzelnen Feld.",
    specimen: <p>Beleg-Spezimen</p>,
  },
  {
    id: "relations",
    kicker: "Beziehungen",
    title: "Alles kann mit allem verbunden sein.",
    body: "Beziehungstypen definieren Sie selbst.",
    specimen: <p>Beziehungs-Spezimen</p>,
  },
];

/**
 * The stage is progressive enhancement: the server and every fallback path
 * render four stacked spreads, and only a wide viewport with motion allowed
 * upgrades to the pinned, scroll-driven stage. jsdom's matchMedia mock answers
 * `false` to everything, so the default render here IS the fallback path —
 * which is the one a crawler, a no-JS visitor and a failed bundle all get.
 */
function setViewport({ wide, reducedMotion }: { wide: boolean; reducedMotion: boolean }) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? reducedMotion : wide,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly targets: Element[] = [];
  constructor(private readonly callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this);
  }
  observe(target: Element) {
    this.targets.push(target);
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  /** Fire as if `target` alone crossed the observer's threshold. */
  enter(target: Element) {
    act(() => {
      this.callback(
        [{ target, isIntersecting: true } as unknown as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    });
  }
}

function renderStage() {
  return render(
    <NextIntlClientProvider locale="de" messages={deMessages}>
      <HighlightStage steps={STEPS} />
    </NextIntlClientProvider>,
  );
}

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  Object.defineProperty(window, "matchMedia", { writable: true, value: originalMatchMedia });
  MockIntersectionObserver.instances.length = 0;
  vi.unstubAllGlobals();
});

describe("HighlightStage — fallback layout (server, no JS, narrow, reduced motion)", () => {
  beforeEach(() => setViewport({ wide: false, reducedMotion: false }));

  it("renders every step in the DOM, none hidden from assistive tech", () => {
    const { container } = renderStage();
    for (const step of STEPS) {
      expect(screen.getByRole("heading", { name: step.title })).toBeInTheDocument();
    }
    expect(container.querySelectorAll("[aria-hidden='true'] h3")).toHaveLength(0);
  });

  it("renders every specimen, so the fallback is not a text-only degradation", () => {
    for (const label of [
      "Gewissheits-Spezimen",
      "Datierungs-Spezimen",
      "Beleg-Spezimen",
      "Beziehungs-Spezimen",
    ]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
    renderStage();
    for (const label of [
      "Gewissheits-Spezimen",
      "Datierungs-Spezimen",
      "Beleg-Spezimen",
      "Beziehungs-Spezimen",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("does not render the step navigation, because every spread is already on screen", () => {
    renderStage();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("marks itself as un-enhanced so the CSS can lay the spreads out in normal flow", () => {
    const { container } = renderStage();
    expect(container.querySelector("#highlights")).toHaveAttribute("data-enhanced", "false");
  });
});

describe("HighlightStage — enhanced layout (wide viewport, motion allowed)", () => {
  beforeEach(() => {
    setViewport({ wide: true, reducedMotion: false });
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  it("upgrades to the pinned stage", () => {
    const { container } = renderStage();
    expect(container.querySelector("#highlights")).toHaveAttribute("data-enhanced", "true");
  });

  it("gives each step an in-page link that resolves to a real scroll target", () => {
    const { container } = renderStage();
    const nav = screen.getByRole("navigation");
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(STEPS.length);
    STEPS.forEach((step, index) => {
      const href = links[index]!.getAttribute("href");
      expect(href).toBe(`#highlight-${step.id}`);
      expect(container.querySelector(href!)).toBeInTheDocument();
    });
  });

  it("marks the first step current and moves aria-current as sentinels are crossed", () => {
    const { container } = renderStage();
    const nav = screen.getByRole("navigation");
    const links = within(nav).getAllByRole("link");
    expect(links[0]).toHaveAttribute("aria-current", "true");
    expect(links[2]).not.toHaveAttribute("aria-current");

    const observer = MockIntersectionObserver.instances.at(-1)!;
    observer.enter(container.querySelector("#highlight-evidence")!);

    expect(links[2]).toHaveAttribute("aria-current", "true");
    expect(links[0]).not.toHaveAttribute("aria-current");
  });

  it("shows exactly one panel and keeps the rest readable but out of sight", () => {
    const { container } = renderStage();
    const panels = Array.from(container.querySelectorAll("[data-slot='stage-panel']"));
    expect(panels).toHaveLength(STEPS.length);
    expect(panels.filter((p) => p.getAttribute("data-active") === "true")).toHaveLength(1);
    // Cross-faded out, not removed: a screen reader still reaches all four.
    for (const panel of panels) {
      expect(panel).not.toHaveAttribute("aria-hidden");
    }
  });

  it("never auto-advances", () => {
    vi.useFakeTimers();
    try {
      renderStage();
      const links = within(screen.getByRole("navigation")).getAllByRole("link");
      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(links[0]).toHaveAttribute("aria-current", "true");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("HighlightStage — reduced motion", () => {
  it("stays in the fallback layout even on a wide viewport", () => {
    setViewport({ wide: true, reducedMotion: true });
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    const { container } = renderStage();
    expect(container.querySelector("#highlights")).toHaveAttribute("data-enhanced", "false");
  });
});

describe("HighlightStage — regression guards", () => {
  it("has no paddle buttons: the rail they belonged to is gone", () => {
    setViewport({ wide: true, reducedMotion: false });
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    renderStage();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("has no scroll-driven live region, which would announce on every step", () => {
    setViewport({ wide: true, reducedMotion: false });
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    const { container } = renderStage();
    expect(container.querySelector("[aria-live]")).not.toBeInTheDocument();
  });
});
