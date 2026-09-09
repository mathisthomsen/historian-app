import { afterEach, describe, expect, it, vi } from "vitest";

import { PersonDetailCard } from "@/components/research/PersonDetailCard";
import { renderWithProviders, screen, waitFor } from "@/test/render";
import type { PersonDetail } from "@/types/person";

import deMessages from "../../../messages/de.json";

// PersonDetailCard is an async server component (uses `getTranslations` from
// next-intl/server). We mock it with a small dot-path lookup into the real
// German message file so the test exercises the actual copy, not a stub.
function makeT(messages: Record<string, unknown>, namespace: string) {
  const ns = namespace
    .split(".")
    .reduce<unknown>(
      (acc, k) =>
        acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined,
      messages,
    );
  return (key: string, params?: Record<string, unknown>) => {
    let val = key
      .split(".")
      .reduce<unknown>(
        (acc, k) =>
          acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined,
        ns,
      );
    if (typeof val !== "string") return key;
    let result = val;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return result;
  };
}

vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) => makeT(deMessages, namespace),
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

function person(overrides: Partial<PersonDetail>): PersonDetail {
  return {
    id: "p1",
    first_name: "Ada",
    last_name: "Lovelace",
    birth_year: 1815,
    birth_month: null,
    birth_day: null,
    birth_date_certainty: "UNKNOWN",
    birth_place: null,
    birth_place_certainty: "UNKNOWN",
    death_year: null,
    death_month: null,
    death_day: null,
    death_date_certainty: "UNKNOWN",
    death_place: null,
    death_place_certainty: "UNKNOWN",
    notes: null,
    created_by_id: null,
    created_at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    updated_at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    names: [],
    _count: { relations_from: 0, relations_to: 0 },
    ...overrides,
  };
}

describe("PersonDetailCard place certainty (issue #78)", () => {
  it("renders the birth place certainty badge next to the place value", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(evidenceResponse(1)));

    const jsx = await PersonDetailCard({
      person: person({ birth_place: "London", birth_place_certainty: "CERTAIN" }),
      projectId: "proj-1",
      locale: "de",
    });
    renderWithProviders(jsx);

    expect(screen.getByText("London")).toBeInTheDocument();
    expect(screen.getByText("Sicher")).toBeInTheDocument();
  });

  it("does not render a place certainty badge when no birth place is set — a certainty about nothing is noise", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(evidenceResponse(0)));

    const jsx = await PersonDetailCard({
      person: person({ birth_place: null, birth_place_certainty: "CERTAIN" }),
      projectId: "proj-1",
      locale: "de",
    });
    renderWithProviders(jsx);

    expect(screen.queryByText("Sicher")).not.toBeInTheDocument();
  });

  it("wires death_place_certainty the same way as birth_place_certainty", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(evidenceResponse(1)));

    const jsx = await PersonDetailCard({
      person: person({ death_place: "Paris", death_place_certainty: "PROBABLE" }),
      projectId: "proj-1",
      locale: "de",
    });
    renderWithProviders(jsx);

    expect(screen.getByText("Paris")).toBeInTheDocument();
    expect(screen.getByText("Wahrscheinlich")).toBeInTheDocument();
  });

  it("passes birth_place_certainty into PropertyEvidenceBadge — an unevidenced CERTAIN claim now warns", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(evidenceResponse(0)));

    const jsx = await PersonDetailCard({
      person: person({ birth_place: "London", birth_place_certainty: "CERTAIN" }),
      projectId: "proj-1",
      locale: "de",
    });
    renderWithProviders(jsx);

    // Before issue #78, place fields never passed a certainty into
    // PropertyEvidenceBadge, so this warning state was unreachable for them.
    //
    // Asserted on the accessible name, not the word "Unbelegt": the #70 branch
    // swaps that word for the evidence count, and this assertion has to survive
    // the two branches meeting.
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Geburtsort: als Sicher bewertet, aber ohne Beleg" }),
      ).toBeInTheDocument(),
    );
  });
});
