import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { CertaintySelector } from "./CertaintySelector";

describe("CertaintySelector", () => {
  const noop = () => undefined;

  it("renders 4 radio buttons for the four certainty levels", () => {
    renderWithProviders(<CertaintySelector value="CERTAIN" onChange={noop} />);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("marks the active certainty button as aria-checked=true", () => {
    renderWithProviders(<CertaintySelector value="PROBABLE" onChange={noop} />);
    // German translation for PROBABLE is "Wahrscheinlich"
    const probableBtn = screen.getByText("Wahrscheinlich");
    expect(probableBtn).toHaveAttribute("aria-checked", "true");
  });

  it("marks all other buttons as aria-checked=false", () => {
    renderWithProviders(<CertaintySelector value="CERTAIN" onChange={noop} />);
    const notChecked = screen
      .getAllByRole("radio")
      .filter((btn) => btn.getAttribute("aria-checked") === "false");
    expect(notChecked).toHaveLength(3);
  });

  it("fires onChange with PROBABLE when the Wahrscheinlich button is clicked", () => {
    const onChange = vi.fn();
    renderWithProviders(<CertaintySelector value="CERTAIN" onChange={onChange} />);
    fireEvent.click(screen.getByText("Wahrscheinlich"));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith("PROBABLE");
  });

  it("disables all buttons when the disabled prop is true", () => {
    renderWithProviders(<CertaintySelector value="CERTAIN" onChange={noop} disabled />);
    for (const btn of screen.getAllByRole("radio")) {
      expect(btn).toBeDisabled();
    }
  });
});
