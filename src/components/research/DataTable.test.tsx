import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DataTable } from "@/components/research/DataTable";
import { renderWithProviders, screen } from "@/test/render";

interface Row {
  id: string;
  name: string;
}

const page = [
  { id: "a", name: "Ada" },
  { id: "b", name: "Bertha" },
];

const columns = [{ key: "name", header: "Name", cell: (row: Row) => row.name }];

function setup(selectedIds: string[]) {
  const onSelectionChange = vi.fn();
  renderWithProviders(
    <DataTable
      data={page}
      columns={columns}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
    />,
  );
  return onSelectionChange;
}

/**
 * Guards the mobile navigation affordance (issue #71 review).
 *
 * The whole row navigates, but on a phone the table scrolls horizontally —
 * measured at 390px: 558px of content in a 342px box — which parked the
 * trailing chevron 168px off-screen. Touch has no hover either, so the row's
 * hover underline never fires, leaving a fully tappable row with no visible
 * affordance on exactly the viewport where this was reported. The chevron is
 * pinned to the right edge so it survives the horizontal scroll.
 */
describe("DataTable row-click affordance", () => {
  it("pins the chevron column so it stays visible when the table scrolls", () => {
    const { container } = renderWithProviders(
      <DataTable
        data={[{ id: "a" }]}
        columns={[{ key: "k", header: "H", cell: () => "v" }]}
        selectedIds={[]}
        onSelectionChange={() => {}}
        onRowClick={() => {}}
      />,
    );
    // Queried from the DOM, not by role: the cell is aria-hidden (it names no
    // column and duplicates nothing), so it is absent from the a11y tree.
    const cells = Array.from(container.querySelectorAll("tbody td"));
    const chevronCell = cells[cells.length - 1]!;
    expect(chevronCell.className).toContain("sticky");
    expect(chevronCell.className).toContain("right-0");
    // A sticky cell floats above the scrolling content, so it needs its own
    // background or rows slide visibly underneath it.
    expect(chevronCell.className).toContain("bg-background");
  });

  it("renders no affordance column when rows are not clickable", () => {
    const { container } = renderWithProviders(
      <DataTable
        data={[{ id: "a" }]}
        columns={[{ key: "k", header: "H", cell: () => "v" }]}
        selectedIds={[]}
        onSelectionChange={() => {}}
      />,
    );
    // checkbox cell + one data cell, nothing else
    expect(container.querySelectorAll("tbody td")).toHaveLength(2);
  });
});

describe("DataTable select-all", () => {
  it("names itself as page-scoped so the user is not told it covers all results", () => {
    setup([]);

    expect(
      screen.getByRole("checkbox", { name: "Alle auf dieser Seite auswählen" }),
    ).toBeInTheDocument();
  });

  it("adds only the visible rows, keeping ids selected elsewhere", async () => {
    const onSelectionChange = setup(["z"]);

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Alle auf dieser Seite auswählen" }),
    );

    expect(onSelectionChange).toHaveBeenCalledWith(["z", "a", "b"]);
  });

  it("clears only the visible rows, never off-screen ids", async () => {
    const onSelectionChange = setup(["z", "a", "b"]);

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Alle auf dieser Seite auswählen" }),
    );

    expect(onSelectionChange).toHaveBeenCalledWith(["z"]);
  });

  it("does not double-add a row already selected", async () => {
    const onSelectionChange = setup(["a"]);

    await userEvent.click(
      screen.getByRole("checkbox", { name: "Alle auf dieser Seite auswählen" }),
    );

    expect(onSelectionChange).toHaveBeenCalledWith(["a", "b"]);
  });
});
