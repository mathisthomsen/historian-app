import { describe, expect, it, vi } from "vitest";

import { EventForm } from "@/components/research/EventForm";
import { renderWithProviders, screen, waitFor } from "@/test/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: "de" }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

/** One page of top-level candidates that deliberately excludes the seeded parent. */
const CANDIDATE_PAGE = {
  ok: true,
  status: 200,
  json: async () => ({
    data: [{ id: "other1", title: "Wiener Kongress", start_year: 1814 }],
    pagination: { total: 250, page: 1, totalPages: 10 },
  }),
};

function routedFetch(byId: unknown) {
  return vi.fn((url: string) => {
    if (String(url).startsWith("/api/events?")) return Promise.resolve(CANDIDATE_PAGE);
    return Promise.resolve(byId);
  });
}

function renderWithSeededParent(parentId: string) {
  renderWithProviders(
    <EventForm mode="create" projectId="p1" defaultParentId={parentId} onSuccess={vi.fn()} />,
  );
}

/**
 * Guards issue #47: the picker resolved its display label from a single page of
 * top-level candidates, so a seeded ?parentId= outside that page rendered the
 * "no parent" placeholder while parent_id was still held and submitted.
 */
describe("EventForm parent picker", () => {
  it("names a seeded parent that is absent from the candidate page", async () => {
    vi.stubGlobal(
      "fetch",
      routedFetch({
        ok: true,
        status: 200,
        json: async () => ({
          id: "far-away",
          title: "Reichsdeputationshauptschluss",
          parent: null,
        }),
      }),
    );

    renderWithSeededParent("far-away");

    await waitFor(() =>
      expect(screen.getByText("Reichsdeputationshauptschluss")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Kein übergeordnetes Ereignis")).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("shows an explicit unresolved state, never the no-parent placeholder", async () => {
    vi.stubGlobal("fetch", routedFetch({ ok: false, status: 404, json: async () => ({}) }));

    renderWithSeededParent("missing");

    await waitFor(() =>
      expect(
        screen.getByText("Übergeordnetes Ereignis konnte nicht geladen werden."),
      ).toBeInTheDocument(),
    );
    // The old code rendered the em-dash "no parent" placeholder here while still
    // submitting parent_id.
    expect(screen.queryByText("Kein übergeordnetes Ereignis")).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("warns when the seeded parent is itself a sub-event and cannot be a parent", async () => {
    vi.stubGlobal(
      "fetch",
      routedFetch({
        ok: true,
        status: 200,
        json: async () => ({ id: "sub1", title: "Schlacht bei Leipzig", parent: { id: "top1" } }),
      }),
    );

    renderWithSeededParent("sub1");

    await waitFor(() =>
      expect(screen.getByText(/ist selbst ein Unterereignis/)).toBeInTheDocument(),
    );
    expect(screen.getByText("Schlacht bei Leipzig")).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("says no parent when none is seeded", async () => {
    vi.stubGlobal("fetch", routedFetch({ ok: true, status: 200, json: async () => ({}) }));

    renderWithProviders(<EventForm mode="create" projectId="p1" onSuccess={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByText("Kein übergeordnetes Ereignis")).toBeInTheDocument(),
    );

    vi.unstubAllGlobals();
  });

  it("asks the server for matches rather than filtering one page client-side", async () => {
    const fetchMock = routedFetch({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<EventForm mode="create" projectId="p1" onSuccess={vi.fn()} />);

    // The list request is debounced, so wait for it specifically.
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).startsWith("/api/events?"))).toBe(
        true,
      ),
    );
    const listCall = fetchMock.mock.calls.find(([url]) => String(url).startsWith("/api/events?"));
    const params = new URLSearchParams(String(listCall?.[0]).split("?")[1]);

    // pageSize 100 was the API's hard maximum, and the picker asked for all of it
    // then filtered locally — so event 101 could not be found by title.
    expect(params.get("pageSize")).not.toBe("100");
    expect(params.get("topLevelOnly")).toBe("true");

    vi.unstubAllGlobals();
  });
});
