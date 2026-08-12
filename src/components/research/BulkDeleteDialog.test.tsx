import { describe, expect, it, vi } from "vitest";

import { BulkDeleteDialog } from "@/components/research/BulkDeleteDialog";
import { renderWithProviders, screen } from "@/test/render";

function setup(namespace: "persons.bulk" | "events.bulk" | "sources.bulk") {
  return renderWithProviders(
    <BulkDeleteDialog
      namespace={namespace}
      count={3}
      open
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
    />,
  );
}

describe("BulkDeleteDialog", () => {
  it("confirms with person wording on the persons surface", () => {
    setup("persons.bulk");

    expect(screen.getByRole("heading", { name: "3 Personen löschen?" })).toBeInTheDocument();
    expect(screen.getByText(/löscht 3 Personen/)).toBeInTheDocument();
  });

  it("confirms with event wording on the events surface", () => {
    setup("events.bulk");

    expect(screen.getByRole("heading", { name: "3 Ereignisse löschen?" })).toBeInTheDocument();
    expect(screen.getByText(/löscht 3 Ereignisse/)).toBeInTheDocument();
    expect(screen.queryByText(/Personen/)).not.toBeInTheDocument();
  });

  it("confirms with source wording on the sources surface", () => {
    setup("sources.bulk");

    expect(screen.getByRole("heading", { name: "3 Quellen löschen?" })).toBeInTheDocument();
    expect(screen.getByText(/löscht 3 Quellen/)).toBeInTheDocument();
    expect(screen.queryByText(/Personen/)).not.toBeInTheDocument();
  });

  it("labels the dismiss control in the active locale", () => {
    setup("events.bulk");

    expect(screen.getByRole("button", { name: "Abbrechen" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });
});
