import type { Certainty } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PropertyEvidenceBadge } from "@/components/relations/PropertyEvidenceBadge";
import { CertaintyMarker } from "@/components/research/CertaintyMarker";
import { DatedCell } from "@/components/research/DatedCell";
import { PersonsListClient } from "@/components/research/PersonsListClient";
import { renderWithProviders, screen, waitFor, within } from "@/test/render";
import type { PersonSummary } from "@/types/person";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams("page=1"),
  useParams: () => ({ locale: "de" }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function evidenceResponse(count: number) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: async () => ({ data: Array.from({ length: count }, (_, i) => ({ id: String(i) })) }),
  } as unknown as Response;
}

function person(overrides: Partial<PersonSummary>): PersonSummary {
  return {
    id: "p1",
    first_name: "Ada",
    last_name: "Lovelace",
    birth_year: 1815,
    birth_month: null,
    birth_day: null,
    birth_date_certainty: "CERTAIN",
    death_year: null,
    death_month: null,
    death_day: null,
    death_date_certainty: "UNKNOWN",
    ...overrides,
  } as PersonSummary;
}

/**
 * Guards issue #37. The Mental Model Rule requires certainty and evidence count
 * to be visible at every level without a hover or click, and a high-certainty
 * claim with zero evidence to read as a visible warning state.
 */
describe("certainty is visible at list level", () => {
  it("tells a Certain date apart from a Possible one", () => {
    const { rerender } = renderWithProviders(<DatedCell text="1815" certainty="CERTAIN" />);
    expect(screen.getByRole("img", { name: "Gewissheit: Sicher" })).toBeInTheDocument();

    rerender(<DatedCell text="1815" certainty="POSSIBLE" />);
    expect(screen.getByRole("img", { name: "Gewissheit: Möglich" })).toBeInTheDocument();
  });

  it("does not qualify a date that is not there", () => {
    renderWithProviders(<DatedCell text="—" certainty="UNKNOWN" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders certainty for every row of the persons list", () => {
    renderWithProviders(
      <PersonsListClient
        persons={[
          person({ id: "p1", birth_date_certainty: "CERTAIN" }),
          person({ id: "p2", birth_year: 1820, birth_date_certainty: "POSSIBLE" }),
        ]}
        total={2}
        page={1}
        totalPages={1}
        locale="de"
        search=""
        sort="last_name"
        order="asc"
      />,
    );

    expect(screen.getByRole("img", { name: "Gewissheit: Sicher" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Gewissheit: Möglich" })).toBeInTheDocument();
  });
});

/**
 * Guards issue #71. The marker used to be a glyph (`● ◕ ◔ ○`) that carried the
 * per-level distinction through character shape; it is now an inline SVG pie
 * (circle outline + filled wedge). WCAG 1.4.1 requires the four levels to stay
 * distinguishable by something other than colour — here, the wedge fraction.
 * Scope of the guard, stated honestly: the first assertion compares whole SVG
 * markup, which includes the colour style, so on its own it would also pass for
 * four colours of one shape. The `d`-attribute assertion below is the one that
 * actually pins the geometry — the two partial levels must differ in wedge
 * sweep, not merely in hue.
 */
describe("certainty markers are distinguishable by shape, not colour alone", () => {
  const LEVELS: Certainty[] = ["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"];

  it("renders a differently shaped SVG per level", () => {
    const shapes = LEVELS.map((level) => {
      const { container, unmount } = renderWithProviders(<CertaintyMarker certainty={level} />);
      const svg = container.querySelector("svg");
      const shape = svg?.innerHTML ?? "";
      unmount();
      return shape;
    });

    // Every level's markup is unique...
    expect(new Set(shapes).size).toBe(shapes.length);
    // ...and it's not empty (a regression that rendered nothing would also be "unique").
    for (const shape of shapes) {
      expect(shape.length).toBeGreaterThan(0);
    }
  });

  it("keeps the accessible name exactly as before (role=img, aria-label from certaintyLabel)", () => {
    renderWithProviders(<CertaintyMarker certainty="PROBABLE" />);
    const marker = screen.getByRole("img", { name: "Gewissheit: Wahrscheinlich" });
    // The SVG is decorative; the accessible name must come only from the wrapper.
    expect(marker.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("sweeps a different wedge for POSSIBLE than for PROBABLE", () => {
    // The greyscale-safe distinction: 25% vs 75% of the disc inked. If a
    // regression made every level the same wedge and varied only the colour,
    // this is the assertion that catches it.
    const { container: probable, unmount } = renderWithProviders(
      <CertaintyMarker certainty="PROBABLE" />,
    );
    const probableD = probable.querySelector("path")?.getAttribute("d");
    unmount();

    const { container: possible } = renderWithProviders(<CertaintyMarker certainty="POSSIBLE" />);
    const possibleD = possible.querySelector("path")?.getAttribute("d");

    expect(probableD).toBeTruthy();
    expect(possibleD).toBeTruthy();
    expect(probableD).not.toBe(possibleD);
  });

  it("fills the full circle for CERTAIN and only outlines it for UNKNOWN", () => {
    const { container: certain } = renderWithProviders(<CertaintyMarker certainty="CERTAIN" />);
    expect(certain.querySelector("path")).not.toBeInTheDocument();
    expect(certain.querySelector("circle")).toBeInTheDocument();

    const { container: unknown } = renderWithProviders(<CertaintyMarker certainty="UNKNOWN" />);
    expect(unknown.querySelector("path")).not.toBeInTheDocument();
    expect(unknown.querySelector("circle")).toBeInTheDocument();

    const { container: probable } = renderWithProviders(<CertaintyMarker certainty="PROBABLE" />);
    expect(probable.querySelector("path")).toBeInTheDocument();
  });
});

describe("the unevidenced warning keys on the certainty level", () => {
  function renderBadge(certainty: "CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN" | undefined) {
    return renderWithProviders(
      <PropertyEvidenceBadge
        projectId="p1"
        entityType="EVENT"
        entityId="e1"
        property="start_year"
        fieldLabel="Startdatum"
        certainty={certainty}
      />,
    );
  }

  it("warns when a high-certainty claim has no evidence", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(evidenceResponse(0)));
    renderBadge("CERTAIN");

    // The warning is an AFFORDANCE (icon + dashed-border warning tokens), not
    // a different word — every field reads as a number at a glance (issue
    // #70/#71). The full sentence still reaches assistive tech via the
    // accessible name below.
    const button = await screen.findByRole("button");
    await waitFor(() => expect(within(button).getByText("0")).toBeInTheDocument());
    expect(button.querySelector("svg")).toHaveClass("lucide-triangle-alert");
    expect(button).toHaveClass("certainty-unevidenced");
    expect(button).toHaveAccessibleName("Startdatum: als Sicher bewertet, aber ohne Beleg");
  });

  it("does not warn on an honest UNKNOWN non-claim", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(evidenceResponse(0)));
    renderBadge("UNKNOWN");

    // Previously fired whenever a date existed, regardless of level.
    const button = await screen.findByRole("button");
    await waitFor(() => expect(within(button).getByText("0")).toBeInTheDocument());
    expect(button).not.toHaveClass("certainty-unevidenced");
    expect(button.querySelector("svg")).not.toBeInTheDocument();
  });

  it("does not warn once the claim has evidence", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(evidenceResponse(2)));
    renderBadge("CERTAIN");

    const button = await screen.findByRole("button");
    await waitFor(() => expect(within(button).getByText("2")).toBeInTheDocument());
    expect(button).not.toHaveClass("certainty-unevidenced");
  });

  it("renders the numeral in the warning state, not a word (issue #70/#71)", async () => {
    // Regression guard: birth/death place and notes pass no `certainty` today
    // (issue #72), but a field that DOES carry certainty and has zero
    // evidence must show "0", not "Unbelegt" — the inconsistency the badge
    // used to have between date fields (word) and other fields (bare "0").
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(evidenceResponse(0)));
    renderBadge("PROBABLE");

    const button = await screen.findByRole("button");
    await waitFor(() => expect(within(button).getByText("0")).toBeInTheDocument());
    expect(screen.queryByText("Unbelegt")).not.toBeInTheDocument();
  });

  it("still renders on a field with no certainty and no evidence", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(evidenceResponse(0)));
    renderBadge(undefined);

    // It used to return null here, so on a freshly catalogued record the popover
    // it triggers — the only add-evidence control on the surface — was
    // unreachable.
    await waitFor(() => expect(screen.getByRole("button")).toBeInTheDocument());
    expect(screen.getByRole("button")).toHaveAccessibleName("Startdatum: Noch kein Beleg");
  });
});
