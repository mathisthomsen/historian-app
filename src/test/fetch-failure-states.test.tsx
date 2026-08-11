import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ActivityLog } from "@/components/relations/ActivityLog";
import { PropertyEvidenceBadge } from "@/components/relations/PropertyEvidenceBadge";
import { EntityEvidenceTab } from "@/components/research/EntityEvidenceTab";
import { EventTypeSettingsTable } from "@/components/research/EventTypeSettingsTable";
import { renderWithProviders, screen, waitFor } from "@/test/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: "de" }),
}));

/**
 * Guards issue #34: `if (res.ok) { ... }` with no else and no catch made a 500, a
 * 403, an expired session and a dropped connection render identically to a
 * successful empty response. On the evidence surfaces that means "the request
 * failed" was shown as "this claim has no evidence".
 */

const FAILURES = [
  { label: "a 500", value: { ok: false, status: 500, json: async () => ({}) } },
  { label: "a 403", value: { ok: false, status: 403, json: async () => ({}) } },
] as const;

function stubFetch(response: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
}

function stubRejectedFetch() {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("failed loads do not render as empty states", () => {
  describe("EventTypeSettingsTable", () => {
    for (const { label, value } of FAILURES) {
      it(`reports ${label} instead of an empty authority table`, async () => {
        stubFetch(value);
        renderWithProviders(<EventTypeSettingsTable projectId="p1" />);

        await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
        expect(screen.getByText("Daten konnten nicht geladen werden.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Erneut versuchen" })).toBeInTheDocument();
      });
    }

    it("reports a rejected fetch rather than resolving to empty", async () => {
      stubRejectedFetch();
      renderWithProviders(<EventTypeSettingsTable projectId="p1" />);

      await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    });
  });

  describe("EntityEvidenceTab", () => {
    it("does not claim the record has no evidence when the request failed", async () => {
      stubFetch(FAILURES[0].value);
      renderWithProviders(<EntityEvidenceTab projectId="p1" entityType="PERSON" entityId="e1" />);

      await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
      expect(screen.queryByText("Keine Nachweise vorhanden.")).not.toBeInTheDocument();
    });
  });

  describe("ActivityLog", () => {
    it("does not claim there is no history when the request failed", async () => {
      stubFetch(FAILURES[0].value);
      renderWithProviders(<ActivityLog projectId="p1" entityType="PERSON" entityId="e1" />);

      await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    });
  });

  describe("PropertyEvidenceBadge", () => {
    it("stays visible and marks the count unknown rather than vanishing", async () => {
      stubFetch(FAILURES[0].value);
      renderWithProviders(
        <PropertyEvidenceBadge
          projectId="p1"
          entityType="PERSON"
          entityId="e1"
          property="birth_year"
          fieldLabel="Geburtsdatum"
          hasCertainty
        />,
      );

      // The old code left count === null, so the badge — and with it the
      // unevidenced warning — disappeared entirely.
      const badge = await screen.findByRole("button", {
        name: /Nachweise konnten nicht geladen werden/,
      });
      expect(badge).toHaveTextContent("?");
      expect(badge).not.toHaveTextContent("0");
    });
  });
});

describe("successful empty responses still render the empty state", () => {
  beforeEach(() => {
    stubFetch({ ok: true, status: 200, json: async () => ({ data: [] }) });
  });

  it("EntityEvidenceTab reports no evidence", async () => {
    renderWithProviders(<EntityEvidenceTab projectId="p1" entityType="PERSON" entityId="e1" />);

    await waitFor(() => expect(screen.getByText("Keine Nachweise vorhanden.")).toBeInTheDocument());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ActivityLog reports no history", async () => {
    renderWithProviders(<ActivityLog projectId="p1" entityType="PERSON" entityId="e1" />);

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});
