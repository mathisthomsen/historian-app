import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useSidebar } from "./use-sidebar";

describe("useSidebar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("defaults to expanded (open=true)", () => {
    const { result } = renderHook(() => useSidebar());
    expect(result.current.isOpen).toBe(true);
  });

  it("restores persisted collapsed state from localStorage", () => {
    localStorage.setItem("sidebar-open", "false");
    const { result } = renderHook(() => useSidebar());
    expect(result.current.isOpen).toBe(false);
  });

  it("toggles open/closed", () => {
    const { result } = renderHook(() => useSidebar());
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("persists state to localStorage on toggle", () => {
    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.toggle();
    });

    expect(localStorage.getItem("sidebar-open")).toBe("false");
  });

  it("exposes a setOpen function", () => {
    const { result } = renderHook(() => useSidebar());

    act(() => {
      result.current.setOpen(false);
    });

    expect(result.current.isOpen).toBe(false);
    expect(localStorage.getItem("sidebar-open")).toBe("false");
  });
});
