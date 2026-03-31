import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { PartialDateInput } from "./PartialDateInput";

// German translations: year="Jahr", month="Monat", day="Tag"
const LABEL = "Geburtsdatum";

function baseProps() {
  return {
    label: LABEL,
    yearValue: null as number | null,
    monthValue: null as number | null,
    dayValue: null as number | null,
    onYearChange: vi.fn<(v: number | null) => void>(),
    onMonthChange: vi.fn<(v: number | null) => void>(),
    onDayChange: vi.fn<(v: number | null) => void>(),
  };
}

describe("PartialDateInput", () => {
  it("disables the month select when yearValue is null", () => {
    const props = baseProps();
    renderWithProviders(<PartialDateInput {...props} />);
    // Label text is "Monat" (de translation of "month")
    expect(screen.getByLabelText("Monat")).toBeDisabled();
  });

  it("enables the month select when yearValue has a value", () => {
    const props = { ...baseProps(), yearValue: 1848 };
    renderWithProviders(<PartialDateInput {...props} />);
    expect(screen.getByLabelText("Monat")).not.toBeDisabled();
  });

  it("disables the day input when monthValue is null", () => {
    const props = { ...baseProps(), yearValue: 1848 };
    renderWithProviders(<PartialDateInput {...props} />);
    expect(screen.getByLabelText("Tag")).toBeDisabled();
  });

  it("enables the day input when both year and month are set", () => {
    const props = { ...baseProps(), yearValue: 1848, monthValue: 3 };
    renderWithProviders(<PartialDateInput {...props} />);
    expect(screen.getByLabelText("Tag")).not.toBeDisabled();
  });

  it("calls onYearChange with a number when the year input changes", () => {
    const props = baseProps();
    renderWithProviders(<PartialDateInput {...props} />);
    fireEvent.change(screen.getByLabelText("Jahr"), { target: { value: "1848" } });
    expect(props.onYearChange).toHaveBeenCalledOnce();
    expect(props.onYearChange).toHaveBeenCalledWith(1848);
  });

  it("calls onYearChange with null when the year input is cleared", () => {
    const props = { ...baseProps(), yearValue: 1848 };
    renderWithProviders(<PartialDateInput {...props} />);
    fireEvent.change(screen.getByLabelText("Jahr"), { target: { value: "" } });
    expect(props.onYearChange).toHaveBeenCalledWith(null);
  });

  it("calls onMonthChange(null) and onDayChange(null) when month is reset", () => {
    const props = { ...baseProps(), yearValue: 1848, monthValue: 3, dayValue: 15 };
    renderWithProviders(<PartialDateInput {...props} />);
    fireEvent.change(screen.getByLabelText("Monat"), { target: { value: "" } });
    expect(props.onMonthChange).toHaveBeenCalledWith(null);
    expect(props.onDayChange).toHaveBeenCalledWith(null);
  });
});
