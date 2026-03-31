"use client";

import { Button } from "@/components/ui/button";

interface DataTablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  prevLabel?: string;
  nextLabel?: string;
  pageLabel?: string;
}

export function DataTablePagination({
  page,
  totalPages,
  onPageChange,
  prevLabel = "Zurück",
  nextLabel = "Weiter",
  pageLabel = "Seite",
}: DataTablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        {"< "}
        {prevLabel}
      </Button>
      <span className="text-sm text-muted-foreground">
        {pageLabel} {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        {nextLabel}
        {" >"}
      </Button>
    </div>
  );
}
