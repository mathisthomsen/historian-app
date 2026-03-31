import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";
import type { EventFilterState } from "@/types/event";
import type { EventType } from "@/types/event-type";

import { EventFilters } from "./EventFilters";

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
    useTranslations: vi.fn(() => (key: string) => {
      const map: Record<string, string> = {
        type_filter_label: "Typ",
        date_range_from: "Von Jahr",
        date_range_to: "Bis Jahr",
        date_range_tooltip:
          "Zeigt Ereignisse, die sich zeitlich mit dem gewählten Bereich überschneiden.",
        top_level_only: "Nur Hauptereignisse",
      };
      return map[key] ?? key;
    }),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockTypes: EventType[] = [
  { id: "et-1", name: "Krieg", color: "#dc2626", icon: null, event_count: 3 },
  { id: "et-2", name: "Revolution", color: "#4338ca", icon: null, event_count: 1 },
];

function defaultProps(overrides?: Partial<React.ComponentProps<typeof EventFilters>>) {
  return {
    typeIds: [],
    fromYear: null,
    toYear: null,
    topLevelOnly: false,
    availableTypes: mockTypes,
    onChange: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("EventFilters", () => {
  it("renders the DateRangeFilterInfo tooltip trigger with correct aria-label", () => {
    renderWithProviders(<EventFilters {...defaultProps()} />);

    // The tooltip trigger button has aria-label from the translation key
    const infoButton = screen.getByRole("button", {
      name: "Zeigt Ereignisse, die sich zeitlich mit dem gewählten Bereich überschneiden.",
    });
    expect(infoButton).toBeInTheDocument();
  });

  it("calls onChange with correct typeIds when a type is selected", () => {
    const onChange = vi.fn();

    renderWithProviders(<EventFilters {...defaultProps({ onChange })} />);

    // Open type filter popover
    const typeButton = screen.getByRole("button", { name: /Typ/i });
    fireEvent.click(typeButton);

    // Click on "Krieg" type
    const kriegButton = screen.getByText("Krieg");
    fireEvent.click(kriegButton);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining<Partial<EventFilterState>>({
        typeIds: ["et-1"],
      }),
    );
  });

  it("calls onChange without the type when a selected type is clicked again (toggle off)", () => {
    const onChange = vi.fn();

    // Start with et-1 already selected
    renderWithProviders(<EventFilters {...defaultProps({ typeIds: ["et-1"], onChange })} />);

    // Open type filter popover
    const typeButton = screen.getByRole("button", { name: /Typ/ });
    fireEvent.click(typeButton);

    // Click Krieg again to deselect
    const kriegButton = screen.getByText("Krieg");
    fireEvent.click(kriegButton);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining<Partial<EventFilterState>>({
        typeIds: [],
      }),
    );
  });

  it("calls onChange with topLevelOnly:true when the checkbox is clicked", () => {
    const onChange = vi.fn();

    renderWithProviders(<EventFilters {...defaultProps({ onChange })} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining<Partial<EventFilterState>>({
        topLevelOnly: true,
      }),
    );
  });

  it("calls onChange with topLevelOnly:false when checked checkbox is clicked", () => {
    const onChange = vi.fn();

    // Start with topLevelOnly: true
    renderWithProviders(<EventFilters {...defaultProps({ topLevelOnly: true, onChange })} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining<Partial<EventFilterState>>({
        topLevelOnly: false,
      }),
    );
  });
});
