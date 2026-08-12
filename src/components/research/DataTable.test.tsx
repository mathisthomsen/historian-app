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
