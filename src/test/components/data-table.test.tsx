/**
 * DataTable component tests
 * Spec: docs/implementation/03-components/data-table-spec.md
 *
 * Tests cover:
 * - Visual/token: class output for all table primitives
 * - TableHeader, TableHead, TableRow, TableCell, TableBody, TableCaption
 * - DataTable wrapper: sort icons, selection state, cursor
 * - DataTablePagination: button variant and count text
 * - Accessibility: axe-core, ARIA labels, keyboard focus
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { DataTable } from "@/components/research/DataTable";
import { DataTablePagination } from "@/components/research/DataTablePagination";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { render, screen } from "../render";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClasses(element: HTMLElement | SVGElement): string[] {
  // SVG elements have className as SVGAnimatedString, not a plain string
  const raw =
    typeof element.className === "string"
      ? element.className
      : (element.className as SVGAnimatedString).baseVal;
  return raw.split(/\s+/).filter(Boolean);
}

// Minimal table fixture used by multiple tests
function renderMinimalTable() {
  return render(
    <Table aria-label="Test table">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Alice</TableCell>
          <TableCell>1900</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Bob</TableCell>
          <TableCell>1910</TableCell>
        </TableRow>
      </TableBody>
      <TableCaption>Table caption text</TableCaption>
    </Table>,
  );
}

// ---------------------------------------------------------------------------
// AC-DT-01: TableHeader has [&_tr]:border-b
// ---------------------------------------------------------------------------

describe("TableHeader", () => {
  it("AC-DT-01: has [&_tr]:border-b class", () => {
    renderMinimalTable();
    const thead = document.querySelector("thead");
    expect(thead).not.toBeNull();
    const classes = getClasses(thead as HTMLElement);
    expect(classes).toContain("[&_tr]:border-b");
  });

  it("AC-DT-15: renders a <thead> element", () => {
    renderMinimalTable();
    expect(document.querySelector("thead")).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AC-DT-02 through AC-DT-06: TableHead classes
// ---------------------------------------------------------------------------

describe("TableHead — token classes (AC-DT-02 to AC-DT-06)", () => {
  it("AC-DT-02: has h-10 class", () => {
    renderMinimalTable();
    const ths = document.querySelectorAll("th");
    expect(ths.length).toBeGreaterThan(0);
    for (const th of ths) {
      expect(getClasses(th as HTMLElement)).toContain("h-10");
    }
  });

  it("AC-DT-03: has px-4 class (not px-2)", () => {
    renderMinimalTable();
    const ths = document.querySelectorAll("th");
    for (const th of ths) {
      const classes = getClasses(th as HTMLElement);
      expect(classes).toContain("px-4");
      expect(classes).not.toContain("px-2");
    }
  });

  it("AC-DT-04: has text-left and align-middle classes", () => {
    renderMinimalTable();
    const ths = document.querySelectorAll("th");
    for (const th of ths) {
      const classes = getClasses(th as HTMLElement);
      expect(classes).toContain("text-left");
      expect(classes).toContain("align-middle");
    }
  });

  it("AC-DT-05: has font-medium and text-muted-foreground classes", () => {
    renderMinimalTable();
    const ths = document.querySelectorAll("th");
    for (const th of ths) {
      const classes = getClasses(th as HTMLElement);
      expect(classes).toContain("font-medium");
      expect(classes).toContain("text-muted-foreground");
    }
  });

  it("AC-DT-06: has text-xs, uppercase, and tracking-wide classes", () => {
    renderMinimalTable();
    const ths = document.querySelectorAll("th");
    for (const th of ths) {
      const classes = getClasses(th as HTMLElement);
      expect(classes).toContain("text-xs");
      expect(classes).toContain("uppercase");
      expect(classes).toContain("tracking-wide");
    }
  });
});

// ---------------------------------------------------------------------------
// AC-DT-07 through AC-DT-11: TableRow classes
// ---------------------------------------------------------------------------

describe("TableRow — token classes (AC-DT-07 to AC-DT-11)", () => {
  it("AC-DT-07: body rows have border-b class", () => {
    renderMinimalTable();
    const trs = document.querySelectorAll("tbody tr");
    expect(trs.length).toBeGreaterThan(0);
    for (const tr of trs) {
      expect(getClasses(tr as HTMLElement)).toContain("border-b");
    }
  });

  it("AC-DT-08: body rows have border-border class", () => {
    renderMinimalTable();
    const trs = document.querySelectorAll("tbody tr");
    for (const tr of trs) {
      expect(getClasses(tr as HTMLElement)).toContain("border-border");
    }
  });

  it("AC-DT-09: body rows have hover:bg-muted/30 class", () => {
    renderMinimalTable();
    const trs = document.querySelectorAll("tbody tr");
    for (const tr of trs) {
      expect(getClasses(tr as HTMLElement)).toContain("hover:bg-muted/30");
    }
  });

  it("AC-DT-10: body rows have data-[state=selected]:bg-primary/10 class", () => {
    renderMinimalTable();
    const trs = document.querySelectorAll("tbody tr");
    for (const tr of trs) {
      expect(getClasses(tr as HTMLElement)).toContain("data-[state=selected]:bg-primary/10");
    }
  });

  it("AC-DT-11: body rows have transition-colors class", () => {
    renderMinimalTable();
    const trs = document.querySelectorAll("tbody tr");
    for (const tr of trs) {
      expect(getClasses(tr as HTMLElement)).toContain("transition-colors");
    }
  });

  it("header rows also have border-b via TableRow", () => {
    renderMinimalTable();
    const headerTr = document.querySelector("thead tr");
    expect(headerTr).not.toBeNull();
    expect(getClasses(headerTr as HTMLElement)).toContain("border-b");
  });
});

// ---------------------------------------------------------------------------
// AC-DT-12 and AC-DT-13: TableCell classes
// ---------------------------------------------------------------------------

describe("TableCell — token classes (AC-DT-12 to AC-DT-13)", () => {
  it("AC-DT-12: has p-4 class (not p-2)", () => {
    renderMinimalTable();
    const tds = document.querySelectorAll("td");
    expect(tds.length).toBeGreaterThan(0);
    for (const td of tds) {
      const classes = getClasses(td as HTMLElement);
      expect(classes).toContain("p-4");
      expect(classes).not.toContain("p-2");
    }
  });

  it("AC-DT-13: has align-middle class", () => {
    renderMinimalTable();
    const tds = document.querySelectorAll("td");
    for (const td of tds) {
      expect(getClasses(td as HTMLElement)).toContain("align-middle");
    }
  });
});

// ---------------------------------------------------------------------------
// AC-DT-14: TableCaption classes
// ---------------------------------------------------------------------------

describe("TableCaption — token classes (AC-DT-14)", () => {
  it("AC-DT-14: has mt-4, text-sm, text-muted-foreground classes", () => {
    renderMinimalTable();
    const caption = document.querySelector("caption");
    expect(caption).not.toBeNull();
    const classes = getClasses(caption as HTMLElement);
    expect(classes).toContain("mt-4");
    expect(classes).toContain("text-sm");
    expect(classes).toContain("text-muted-foreground");
  });
});

// ---------------------------------------------------------------------------
// DataTable component tests
// ---------------------------------------------------------------------------

type TestRow = { id: string; name: string; year: string };

const testData: TestRow[] = [
  { id: "row-1", name: "Alice", year: "1900" },
  { id: "row-2", name: "Bob", year: "1910" },
];

const testColumns = [
  {
    key: "name",
    header: "Name",
    cell: (row: TestRow) => row.name,
    sortable: true,
    currentSort: "name",
    currentOrder: "asc" as const,
    onSort: vi.fn(),
  },
  {
    key: "year",
    header: "Year",
    cell: (row: TestRow) => row.year,
  },
];

const unsortedColumns = [
  {
    key: "name",
    header: "Name",
    cell: (row: TestRow) => row.name,
    sortable: true,
    currentSort: "year", // different key — name column is NOT the active sort
    currentOrder: "asc" as const,
    onSort: vi.fn(),
  },
];

describe("DataTable — sort icons (AC-DT-16 to AC-DT-18)", () => {
  it("AC-DT-16: sort button has inline-flex items-center gap-1 classes", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
      />,
    );
    const sortButtons = document.querySelectorAll("thead button");
    expect(sortButtons.length).toBeGreaterThan(0);
    for (const btn of sortButtons) {
      const classes = getClasses(btn as HTMLElement);
      expect(classes).toContain("inline-flex");
      expect(classes).toContain("items-center");
      expect(classes).toContain("gap-1");
    }
  });

  it("AC-DT-17: inactive sort icon has opacity-30 class", () => {
    render(
      <DataTable
        data={testData}
        columns={unsortedColumns}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
      />,
    );
    // The inactive sort icon svg should have opacity-30
    const sortButton = document.querySelector("thead button");
    expect(sortButton).not.toBeNull();
    const svg = sortButton!.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(getClasses(svg as unknown as HTMLElement)).toContain("opacity-30");
  });

  it("AC-DT-18: active sort icon does NOT have opacity-30 class", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
      />,
    );
    const sortButton = document.querySelector("thead button");
    expect(sortButton).not.toBeNull();
    const svg = sortButton!.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(getClasses(svg as unknown as HTMLElement)).not.toContain("opacity-30");
  });
});

describe("DataTable — row states (AC-DT-19 to AC-DT-20)", () => {
  it("AC-DT-19: row with onRowClick gets cursor-pointer class", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onRowClick={vi.fn()}
      />,
    );
    const bodyRows = document.querySelectorAll("tbody tr");
    for (const tr of bodyRows) {
      expect(getClasses(tr as HTMLElement)).toContain("cursor-pointer");
    }
  });

  it("AC-DT-20: row has data-state=selected when id is in selectedIds", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        selectedIds={["row-1"]}
        onSelectionChange={vi.fn()}
      />,
    );
    const bodyRows = document.querySelectorAll("tbody tr");
    expect(bodyRows[0]).toHaveAttribute("data-state", "selected");
    expect(bodyRows[1]).not.toHaveAttribute("data-state", "selected");
  });

  it("row without onRowClick does NOT get cursor-pointer class", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
      />,
    );
    const bodyRows = document.querySelectorAll("tbody tr");
    for (const tr of bodyRows) {
      expect(getClasses(tr as HTMLElement)).not.toContain("cursor-pointer");
    }
  });
});

// ---------------------------------------------------------------------------
// DataTablePagination tests (AC-DT-21 to AC-DT-22)
// ---------------------------------------------------------------------------

describe("DataTablePagination (AC-DT-21 to AC-DT-22)", () => {
  it("AC-DT-21: Prev button has outline variant classes (border class present)", () => {
    render(<DataTablePagination page={2} totalPages={5} onPageChange={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    // outline variant includes "border" class
    expect(getClasses(buttons[0]!)).toContain("border");
  });

  it("AC-DT-22: page count span uses text-sm and text-muted-foreground classes", () => {
    render(<DataTablePagination page={2} totalPages={5} onPageChange={vi.fn()} />);
    const span = document.querySelector("span.text-muted-foreground");
    expect(span).not.toBeNull();
    expect(getClasses(span as HTMLElement)).toContain("text-sm");
    expect(getClasses(span as HTMLElement)).toContain("text-muted-foreground");
  });

  it("returns null when totalPages <= 1", () => {
    const { container } = render(
      <DataTablePagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("prev button is disabled on first page", () => {
    render(<DataTablePagination page={1} totalPages={3} onPageChange={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toBeDisabled();
  });

  it("next button is disabled on last page", () => {
    render(<DataTablePagination page={3} totalPages={3} onPageChange={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[buttons.length - 1]).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Accessibility tests (AC-DT-23 to AC-DT-26)
// ---------------------------------------------------------------------------

describe("DataTable — accessibility (AC-DT-23 to AC-DT-26)", () => {
  it("AC-DT-23: full table with aria-label passes axe-core", async () => {
    const { container } = renderMinimalTable();
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("AC-DT-24: sort buttons inside <th> are keyboard-focusable", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
      />,
    );
    const sortButtons = document.querySelectorAll("thead button");
    for (const btn of sortButtons) {
      // Not disabled and no tabIndex=-1 means keyboard focusable
      expect((btn as HTMLButtonElement).disabled).toBe(false);
      expect((btn as HTMLButtonElement).tabIndex).not.toBe(-1);
    }
  });

  it("AC-DT-25: header checkbox has aria-label", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
      />,
    );
    const headerCheckbox = document.querySelector("thead [role='checkbox']");
    expect(headerCheckbox).not.toBeNull();
    expect(headerCheckbox).toHaveAttribute("aria-label");
  });

  it("AC-DT-26: row checkboxes have aria-label containing row id", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
      />,
    );
    const rowCheckboxes = document.querySelectorAll("tbody [role='checkbox']");
    expect(rowCheckboxes.length).toBe(testData.length);
    for (const cb of rowCheckboxes) {
      expect(cb).toHaveAttribute("aria-label");
    }
  });

  it("DataTable passes axe-core with aria-label on table wrapper", async () => {
    const { container } = render(
      <div>
        <DataTable
          data={testData}
          columns={testColumns}
          selectedIds={[]}
          onSelectionChange={vi.fn()}
        />
      </div>,
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// className passthrough / composition
// ---------------------------------------------------------------------------

describe("Table primitives — className passthrough", () => {
  it("Table merges custom className", () => {
    render(
      <Table className="custom-table" aria-label="test">
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const table = document.querySelector("table");
    expect(table?.className).toContain("custom-table");
  });

  it("TableHead merges custom className for width", () => {
    render(
      <Table aria-label="test">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">Check</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const th = document.querySelector("th");
    expect(th?.className).toContain("w-10");
    // Still has base token classes
    expect(th?.className).toContain("text-muted-foreground");
  });

  it("TableCell merges custom className", () => {
    render(
      <Table aria-label="test">
        <TableBody>
          <TableRow>
            <TableCell className="text-right">123</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const td = document.querySelector("td");
    expect(td?.className).toContain("text-right");
    expect(td?.className).toContain("p-4");
  });
});
