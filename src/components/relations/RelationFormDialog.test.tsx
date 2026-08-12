import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RelationFormDialog } from "@/components/relations/RelationFormDialog";
import { renderWithProviders, screen, waitFor } from "@/test/render";

import deMessages from "../../../messages/de.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: "de" }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/hooks/use-relation-types", () => ({
  useRelationTypes: () => ({
    data: [
      {
        id: "rt1",
        name: "kennt",
        from_type: "PERSON",
        to_type: "PERSON",
        _count: { relations: 0 },
      },
    ],
    loading: false,
  }),
}));

// The pickers are exercised elsewhere; here they only need to seed values so the
// submit path can run. Each renders one button that reports a fixed selection.
vi.mock("@/components/relations/EntitySelector", () => ({
  EntitySelector: ({
    onChange,
    allowedTypes,
  }: {
    onChange: (v: { type: string; id: string; label: string } | null) => void;
    allowedTypes?: string[];
  }) => (
    <button
      type="button"
      onClick={() =>
        onChange({ type: allowedTypes?.[0] ?? "PERSON", id: "src1", label: "Kirchenbuch" })
      }
    >
      {`pick-${allowedTypes?.join(",") ?? "any"}`}
    </button>
  ),
}));
vi.mock("@/components/relations/RelationTypeSelector", () => ({
  RelationTypeSelector: ({ onChange }: { onChange: (id: string) => void }) => (
    <button type="button" onClick={() => onChange("rt1")}>
      pick-relation-type
    </button>
  ),
}));

const QUOTE_PLACEHOLDER = deMessages.relations.fields.evidenceQuotePlaceholder;

const PERSON_A = { type: "PERSON", id: "p1", label: "Ada" } as const;
const PERSON_B = { type: "PERSON", id: "p2", label: "Bertha" } as const;

/** Selects the relation type, which the real selector would supply. */
async function pickRelationType() {
  await userEvent.click(screen.getByRole("button", { name: "pick-relation-type" }));
}

function renderDialog(onSuccess = vi.fn(), onOpenChange = vi.fn()) {
  renderWithProviders(
    <RelationFormDialog
      open
      onOpenChange={onOpenChange}
      projectId="proj1"
      prefillFrom={PERSON_A}
      prefillTo={PERSON_B}
      onSuccess={onSuccess}
    />,
  );
  return { onSuccess, onOpenChange };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

/**
 * Guards issue #46: the evidence POST was fired without checking its response, so
 * a failure was swallowed while the UI toasted success — silent loss of exactly
 * the datum the product exists to record.
 */
describe("RelationFormDialog evidence submission", () => {
  /** Expands the evidence section and enters a source and a quote. */
  async function enterEvidence(quote: string) {
    await userEvent.click(screen.getByRole("button", { name: "Beleg hinzufügen" }));
    await userEvent.click(screen.getByRole("button", { name: "pick-SOURCE" }));
    // Addressed by placeholder: this textarea has no accessible name (issue #52).
    await userEvent.type(screen.getByPlaceholderText(QUOTE_PLACEHOLDER), quote);
  }

  it("does not report success when the evidence POST fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: "rel1" }) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    const { onOpenChange } = renderDialog();
    await pickRelationType();
    await enterEvidence("Taufregister 1811");
    await userEvent.click(screen.getByRole("button", { name: "Relation erstellen" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(toast.success).not.toHaveBeenCalled();
    // The dialog stays open so the entered evidence is not lost.
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByDisplayValue("Taufregister 1811")).toBeInTheDocument();
  });

  it("retries only the evidence, so a retry cannot create a second relation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: "rel1" }) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: "ev1" }) });
    vi.stubGlobal("fetch", fetchMock);

    const { onOpenChange } = renderDialog();
    await pickRelationType();
    await enterEvidence("Taufregister 1811");
    await userEvent.click(screen.getByRole("button", { name: "Relation erstellen" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Nachweis erneut anhängen" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(toast.success).toHaveBeenCalled();

    const relationCreates = fetchMock.mock.calls.filter(
      ([url, init]) => url === "/api/relations" && (init as RequestInit)?.method === "POST",
    );
    expect(relationCreates).toHaveLength(1);
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe("/api/relations/rel1/evidence");
  });

  it("stores the evidence and closes when both writes succeed", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: "rel1" }) })
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: "ev1" }) });
    vi.stubGlobal("fetch", fetchMock);

    const { onOpenChange } = renderDialog();
    await pickRelationType();
    await enterEvidence("Taufregister 1811");
    await userEvent.click(screen.getByRole("button", { name: "Relation erstellen" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(toast.success).toHaveBeenCalled();

    const evidenceCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/evidence"));
    expect(JSON.parse(String((evidenceCall?.[1] as RequestInit)?.body))).toMatchObject({
      source_id: "src1",
      quote: "Taufregister 1811",
    });
  });

  it("closes and reports success when the relation saves and no evidence was entered", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: "rel1" }) });
    vi.stubGlobal("fetch", fetchMock);

    const { onSuccess, onOpenChange } = renderDialog();
    await pickRelationType();

    await userEvent.click(screen.getByRole("button", { name: "Relation erstellen" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onSuccess).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    // Only the relation create — no evidence POST was attempted.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports a failed relation create rather than success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) }),
    );

    const { onOpenChange } = renderDialog();
    await pickRelationType();

    await userEvent.click(screen.getByRole("button", { name: "Relation erstellen" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("reports a rejected relation create rather than leaving an unhandled rejection", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    renderDialog();
    await pickRelationType();

    await userEvent.click(screen.getByRole("button", { name: "Relation erstellen" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
  });
});
