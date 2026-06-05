"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ColumnDef<TData> {
  key: string;
  header: string;
  cell: (row: TData) => React.ReactNode;
  sortable?: boolean;
  currentSort?: string;
  currentOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
}

interface DataTableProps<TData extends { id: string }> {
  data: TData[];
  columns: ColumnDef<TData>[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRowClick?: (id: string) => void;
}

export function DataTable<TData extends { id: string }>({
  data,
  columns,
  selectedIds,
  onSelectionChange,
  onRowClick,
}: DataTableProps<TData>) {
  const allSelected = data.length > 0 && data.every((row) => selectedIds.includes(row.id));
  const someSelected = data.some((row) => selectedIds.includes(row.id));

  function handleSelectAll(checked: boolean | "indeterminate") {
    if (checked === true) {
      onSelectionChange(data.map((row) => row.id));
    } else {
      onSelectionChange([]);
    }
  }

  function handleSelectRow(id: string, checked: boolean) {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allSelected ? true : someSelected && !allSelected ? "indeterminate" : false}
              onCheckedChange={handleSelectAll}
              aria-label="Select all"
            />
          </TableHead>
          {columns.map((col) => (
            <TableHead key={col.key}>
              {col.sortable && col.onSort ? (
                <button
                  type="button"
                  onClick={() => col.onSort?.(col.key)}
                  className="hover:text-foreground inline-flex items-center gap-1 font-medium"
                >
                  {col.header}
                  {col.currentSort === col.key ? (
                    col.currentOrder === "asc" ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )
                  ) : (
                    <ChevronDown className="h-3 w-3 opacity-30" />
                  )}
                </button>
              ) : (
                col.header
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow
            key={row.id}
            data-state={selectedIds.includes(row.id) ? "selected" : undefined}
            className={onRowClick ? "cursor-pointer" : undefined}
            onClick={
              onRowClick
                ? (e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName !== "INPUT" && !target.closest('[role="checkbox"]')) {
                      onRowClick(row.id);
                    }
                  }
                : undefined
            }
          >
            <TableCell>
              <Checkbox
                checked={selectedIds.includes(row.id)}
                onCheckedChange={(checked) => handleSelectRow(row.id, checked === true)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select row ${row.id}`}
              />
            </TableCell>
            {columns.map((col) => (
              <TableCell key={col.key}>{col.cell(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
