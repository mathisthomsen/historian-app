"use client";

import { useTranslations } from "next-intl";

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
  prevLabel,
  nextLabel,
  pageLabel,
}: DataTablePaginationProps) {
  // Defaults were hardcoded German and no caller ever overrode them, so the
  // English locale showed "Zurück/Weiter/Seite" (audit F-H4). The component now
  // translates itself; the props remain as per-caller overrides.
  const t = useTranslations("pagination");
  if (totalPages <= 1) return null;

  const prev = prevLabel ?? t("previous");
  const next = nextLabel ?? t("next");
  const pageWord = pageLabel ?? t("page");

  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        {"< "}
        {prev}
      </Button>
      <span className="text-muted-foreground text-sm">
        {pageWord} {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        {next}
        {" >"}
      </Button>
    </div>
  );
}
