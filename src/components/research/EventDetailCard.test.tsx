import { afterEach, describe, expect, it, vi } from "vitest";

import { EventDetailCard } from "@/components/research/EventDetailCard";
import { renderWithProviders, screen, waitFor } from "@/test/render";
import type { EventDetail } from "@/types/event";

vi.mock("next/navigation", () => ({
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

function event(overrides: Partial<EventDetail>): EventDetail {
  return {
    id: "e1",
    title: "Erster Weltkrieg",
    event_type: null,
    start_year: 1914,
    start_month: null,
    start_day: null,
    start_date_certainty: "UNKNOWN",
    end_year: null,
    end_month: null,
    end_day: null,
    end_date_certainty: "UNKNOWN",
    location: null,
    location_certainty: "UNKNOWN",
    parent: null,
    _count: { sub_events: 0, relations_from: 0, relations_to: 0 },
    created_at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    description: null,
    notes: null,
    created_by_id: null,
    updated_at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    sub_events: [],
    ...overrides,
  };
}

describe("EventDetailCard location certainty (issue #78)", () => {
  it("renders the location certainty badge next to the location value", () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(evidenceResponse(1)));

    renderWithProviders(
      <EventDetailCard
        event={event({ location: "Somme", location_certainty: "CERTAIN" })}
        locale="de"
        projectId="proj-1"
      />,
    );

    expect(screen.getByText("Somme")).toBeInTheDocument();
    expect(screen.getByText("Sicher")).toBeInTheDocument();
  });

  it("does not render a location certainty badge when no location is set — a certainty about nothing is noise", () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(evidenceResponse(0)));

    renderWithProviders(
      <EventDetailCard
        event={event({ location: null, location_certainty: "CERTAIN" })}
        locale="de"
        projectId="proj-1"
      />,
    );

    expect(screen.queryByText("Sicher")).not.toBeInTheDocument();
  });

  it("passes location_certainty into PropertyEvidenceBadge — an unevidenced CERTAIN claim now warns", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(evidenceResponse(0)));

    renderWithProviders(
      <EventDetailCard
        event={event({ location: "Somme", location_certainty: "CERTAIN" })}
        locale="de"
        projectId="proj-1"
      />,
    );

    // Before issue #78, the location field never passed a certainty into
    // PropertyEvidenceBadge, so this warning state was unreachable for it.
    //
    // Asserted on the accessible name and the warning affordance class, not the
    // word "Unbelegt": the #70 branch swaps that word for the evidence count,
    // and this assertion has to survive the two branches meeting.
    const button = await screen.findByRole("button", {
      name: "Ort: als Sicher bewertet, aber ohne Beleg",
    });
    await waitFor(() => expect(button).toHaveClass("certainty-unevidenced"));
  });
});
