import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
let currentParams = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => currentParams,
}));

const { useListUrlState } = await import("@/hooks/use-list-url-state");

describe("useListUrlState", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    currentParams = new URLSearchParams("");
  });

  it("preserves existing params when setting a new one", () => {
    currentParams = new URLSearchParams("search=ada&sort=last_name");
    const { result } = renderHook(() => useListUrlState());
    const url = new URLSearchParams(result.current.buildUrl({ page: "3" }).slice(1));
    expect(url.get("search")).toBe("ada");
    expect(url.get("sort")).toBe("last_name");
    expect(url.get("page")).toBe("3");
  });

  it("deletes a key when given an empty value", () => {
    currentParams = new URLSearchParams("search=ada&page=2");
    const { result } = renderHook(() => useListUrlState());
    const url = new URLSearchParams(result.current.buildUrl({ search: "" }).slice(1));
    expect(url.has("search")).toBe(false);
    expect(url.get("page")).toBe("2");
  });

  it("resets to page 1 on search", () => {
    currentParams = new URLSearchParams("page=5");
    const { result } = renderHook(() => useListUrlState());
    result.current.handleSearch("humboldt");
    const url = new URLSearchParams((mockPush.mock.calls[0]?.[0] as string).slice(1));
    expect(url.get("search")).toBe("humboldt");
    expect(url.get("page")).toBe("1");
  });

  it("sorts ascending when clicking a new column", () => {
    const { result } = renderHook(() => useListUrlState({ sort: "last_name", order: "asc" }));
    result.current.handleSort("first_name");
    const url = new URLSearchParams((mockPush.mock.calls[0]?.[0] as string).slice(1));
    expect(url.get("sort")).toBe("first_name");
    expect(url.get("order")).toBe("asc");
  });

  it("toggles to desc when re-clicking the active ascending column", () => {
    const { result } = renderHook(() => useListUrlState({ sort: "last_name", order: "asc" }));
    result.current.handleSort("last_name");
    const url = new URLSearchParams((mockPush.mock.calls[0]?.[0] as string).slice(1));
    expect(url.get("order")).toBe("desc");
  });

  it("toggles back to asc when re-clicking the active descending column", () => {
    const { result } = renderHook(() => useListUrlState({ sort: "last_name", order: "desc" }));
    result.current.handleSort("last_name");
    const url = new URLSearchParams((mockPush.mock.calls[0]?.[0] as string).slice(1));
    expect(url.get("order")).toBe("asc");
  });

  it("resets to page 1 when sorting", () => {
    currentParams = new URLSearchParams("page=4");
    const { result } = renderHook(() => useListUrlState({ sort: "last_name", order: "asc" }));
    result.current.handleSort("first_name");
    const url = new URLSearchParams((mockPush.mock.calls[0]?.[0] as string).slice(1));
    expect(url.get("page")).toBe("1");
  });

  it("changes page without disturbing filters", () => {
    currentParams = new URLSearchParams("search=ada&sort=last_name&order=desc");
    const { result } = renderHook(() => useListUrlState());
    result.current.handlePageChange(2);
    const url = new URLSearchParams((mockPush.mock.calls[0]?.[0] as string).slice(1));
    expect(url.get("page")).toBe("2");
    expect(url.get("search")).toBe("ada");
    expect(url.get("order")).toBe("desc");
  });
});
