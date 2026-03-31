import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { EventTypeCombobox } from "./EventTypeCombobox";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn() })),
  useParams: vi.fn(() => ({ locale: "de" })),
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useTranslations: vi.fn(() => (key: string, params?: Record<string, unknown>) => {
      if (key === "inline_create" && params?.name) return `Neu erstellen: "${String(params.name)}"`;
      if (key === "fields.name") return "Name";
      if (key === "assign_color") return "Farbe zuweisen";
      return key;
    }),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockTypes = [{ id: "1", name: "Krieg", color: "#ea580c", icon: null, event_count: 2 }];

function mockFetchSuccess(data: unknown = mockTypes) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data }),
  } as Response);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("EventTypeCombobox", () => {
  const noop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSuccess();
  });

  it("renders existing types in dropdown when trigger is clicked", async () => {
    renderWithProviders(<EventTypeCombobox projectId="proj-1" value={null} onChange={noop} />);

    // Open the combobox by clicking the trigger button
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Wait for fetch and render of the type
    await waitFor(() => {
      expect(screen.getByText("Krieg")).toBeInTheDocument();
    });
  });

  it("shows inline_create option when typing a non-matching name", async () => {
    renderWithProviders(<EventTypeCombobox projectId="proj-1" value={null} onChange={noop} />);

    // Open the combobox
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Wait for types to load
    await waitFor(() => {
      expect(screen.getByText("Krieg")).toBeInTheDocument();
    });

    // Type something that doesn't match any type
    const input = screen.getByPlaceholderText("Name");
    fireEvent.change(input, { target: { value: "Revolution" } });

    await waitFor(() => {
      expect(screen.getByText('Neu erstellen: "Revolution"')).toBeInTheDocument();
    });
  });

  it("does NOT show inline_create option when typing an exact match", async () => {
    renderWithProviders(<EventTypeCombobox projectId="proj-1" value={null} onChange={noop} />);

    // Open the combobox
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Wait for types to load
    await waitFor(() => {
      expect(screen.getByText("Krieg")).toBeInTheDocument();
    });

    // Type the exact name of an existing type
    const input = screen.getByPlaceholderText("Name");
    fireEvent.change(input, { target: { value: "Krieg" } });

    await waitFor(() => {
      expect(screen.queryByText('Neu erstellen: "Krieg"')).not.toBeInTheDocument();
    });
  });

  it("fires POST and calls onTypeCreated when inline_create is selected", async () => {
    const newType = { id: "2", name: "Revolution", color: null, icon: null, event_count: 0 };

    // First fetch returns existing types, second fetch (POST) returns the new type
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTypes }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => newType,
      } as Response);

    const onChange = vi.fn();
    const onTypeCreated = vi.fn();

    renderWithProviders(
      <EventTypeCombobox
        projectId="proj-1"
        value={null}
        onChange={onChange}
        onTypeCreated={onTypeCreated}
      />,
    );

    // Open the combobox
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Wait for types to load
    await waitFor(() => {
      expect(screen.getByText("Krieg")).toBeInTheDocument();
    });

    // Type a new name
    const input = screen.getByPlaceholderText("Name");
    fireEvent.change(input, { target: { value: "Revolution" } });

    // Click the inline create option
    await waitFor(() => {
      expect(screen.getByText('Neu erstellen: "Revolution"')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Neu erstellen: "Revolution"'));

    await waitFor(() => {
      expect(onTypeCreated).toHaveBeenCalledWith(newType);
      expect(onChange).toHaveBeenCalledWith("2");
    });

    // Verify POST was made with correct body
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/event-types",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Revolution", project_id: "proj-1" }),
      }),
    );
  });
});
