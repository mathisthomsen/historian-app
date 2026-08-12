import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let currentParams = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useSearchParams: () => currentParams,
}));

const { useRowSelection } = await import("@/hooks/use-row-selection");

describe("useRowSelection", () => {
  beforeEach(() => {
    currentParams = new URLSearchParams("page=1");
  });

  it("holds a selection while the list params are unchanged", () => {
    const { result, rerender } = renderHook(() => useRowSelection());

    act(() => result.current[1](["a", "b"]));
    rerender();

    expect(result.current[0]).toEqual(["a", "b"]);
  });

  it("drops the selection when the page changes", () => {
    const { result, rerender } = renderHook(() => useRowSelection());

    act(() => result.current[1](["a", "b"]));
    currentParams = new URLSearchParams("page=2");
    rerender();

    expect(result.current[0]).toEqual([]);
  });

  it("drops the selection when the search term changes", () => {
    const { result, rerender } = renderHook(() => useRowSelection());

    act(() => result.current[1](["a"]));
    currentParams = new URLSearchParams("page=1&search=humboldt");
    rerender();

    expect(result.current[0]).toEqual([]);
  });

  it("drops the selection when the sort changes", () => {
    const { result, rerender } = renderHook(() => useRowSelection());

    act(() => result.current[1](["a"]));
    currentParams = new URLSearchParams("page=1&sort=last_name&order=desc");
    rerender();

    expect(result.current[0]).toEqual([]);
  });

  it("never renders the stale selection under the new params", () => {
    const seen: string[][] = [];
    const { result, rerender } = renderHook(() => {
      const value = useRowSelection();
      seen.push(value[0]);
      return value;
    });

    act(() => result.current[1](["a", "b"]));
    const rendersBeforeChange = seen.length;
    currentParams = new URLSearchParams("page=2");
    rerender();

    // Every render after the param change must already show the empty selection —
    // an effect-based reset would paint ["a", "b"] once first.
    expect(seen.slice(rendersBeforeChange).every((ids) => ids.length === 0)).toBe(true);
  });
});
