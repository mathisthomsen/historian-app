import { act, renderHook } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EventForm } from "@/components/research/EventForm";
import { PersonForm } from "@/components/research/PersonForm";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { renderWithProviders, screen, waitFor } from "@/test/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: "de" }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

/**
 * Guards issue #42: a grep for isDirty / beforeunload / unsaved across src/
 * returned zero hits — every form silently discarded everything to Cancel,
 * browser Back, a sidebar click or a refresh.
 */
describe("useUnsavedChanges", () => {
  it("runs the action immediately when the form is clean", () => {
    const { result } = renderHook(() => useUnsavedChanges(false));
    const action = vi.fn();

    act(() => result.current.guard(action));

    expect(action).toHaveBeenCalledOnce();
    expect(result.current.isConfirming).toBe(false);
  });

  it("defers the action behind a confirmation when dirty", () => {
    const { result } = renderHook(() => useUnsavedChanges(true));
    const action = vi.fn();

    act(() => result.current.guard(action));

    expect(action).not.toHaveBeenCalled();
    expect(result.current.isConfirming).toBe(true);
  });

  it("runs the deferred action on confirm", () => {
    const { result } = renderHook(() => useUnsavedChanges(true));
    const action = vi.fn();

    act(() => result.current.guard(action));
    act(() => result.current.confirmDiscard());

    expect(action).toHaveBeenCalledOnce();
    expect(result.current.isConfirming).toBe(false);
  });

  it("abandons the action on cancel, and does not run it later", () => {
    const { result } = renderHook(() => useUnsavedChanges(true));
    const action = vi.fn();

    act(() => result.current.guard(action));
    act(() => result.current.cancelDiscard());
    act(() => result.current.confirmDiscard());

    expect(action).not.toHaveBeenCalled();
  });

  it("registers beforeunload only while dirty", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const { rerender, unmount } = renderHook(({ dirty }) => useUnsavedChanges(dirty), {
      initialProps: { dirty: false },
    });
    expect(add.mock.calls.filter(([e]) => e === "beforeunload")).toHaveLength(0);

    rerender({ dirty: true });
    expect(add.mock.calls.filter(([e]) => e === "beforeunload")).toHaveLength(1);

    rerender({ dirty: false });
    expect(remove.mock.calls.filter(([e]) => e === "beforeunload")).toHaveLength(1);

    unmount();
    add.mockRestore();
    remove.mockRestore();
  });

  it("the beforeunload handler opts in to the browser prompt", () => {
    const add = vi.spyOn(window, "addEventListener");
    renderHook(() => useUnsavedChanges(true));

    const handler = add.mock.calls.find(([e]) => e === "beforeunload")?.[1] as EventListener;
    const event = { preventDefault: vi.fn(), returnValue: undefined } as unknown as Event;
    handler(event);

    expect(event.preventDefault).toHaveBeenCalled();
    add.mockRestore();
  });
});

describe("forms route Cancel through the guard", () => {
  it("EventForm asks before discarding, and only leaves on confirm", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [] }) }),
    );
    const onCancel = vi.fn();

    renderWithProviders(
      <EventForm mode="create" projectId="p1" onSuccess={vi.fn()} onCancel={onCancel} />,
    );

    await userEvent.type(screen.getByLabelText(/Titel/), "Wiener Kongress");
    await userEvent.click(screen.getByRole("button", { name: "Abbrechen" }));

    await waitFor(() =>
      expect(screen.getByText("Ungespeicherte Änderungen verwerfen?")).toBeInTheDocument(),
    );
    expect(onCancel).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Änderungen verwerfen" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("EventForm leaves straight away when nothing was entered", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [] }) }),
    );
    const onCancel = vi.fn();

    renderWithProviders(
      <EventForm mode="create" projectId="p1" onSuccess={vi.fn()} onCancel={onCancel} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Abbrechen" }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByText("Ungespeicherte Änderungen verwerfen?")).not.toBeInTheDocument();
  });

  it("PersonForm keeps the entry when the user chooses to keep editing", async () => {
    const onCancel = vi.fn();

    renderWithProviders(
      <PersonForm mode="create" projectId="p1" onSuccess={vi.fn()} onCancel={onCancel} />,
    );

    const lastName = screen.getByLabelText(/Nachname/);
    await userEvent.type(lastName, "von Humboldt");
    await userEvent.click(screen.getByRole("button", { name: "Abbrechen" }));

    await waitFor(() =>
      expect(screen.getByText("Ungespeicherte Änderungen verwerfen?")).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Weiter bearbeiten" }));

    expect(onCancel).not.toHaveBeenCalled();
    expect(lastName).toHaveValue("von Humboldt");
  });
});
