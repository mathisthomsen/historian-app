"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { BulkDeleteDialog } from "@/components/research/BulkDeleteDialog";
import { DataTable } from "@/components/research/DataTable";
import { DataTablePagination } from "@/components/research/DataTablePagination";
import { DataTableSearch } from "@/components/research/DataTableSearch";
import { Button } from "@/components/ui/button";
import { formatPartialDate } from "@/lib/date";
import type { PersonSummary } from "@/types/person";

interface PersonsListClientProps {
  persons: PersonSummary[];
  total: number;
  page: number;
  totalPages: number;
  locale: string;
  projectId?: string;
  search: string;
  sort: string;
  order: string;
}

export function PersonsListClient({
  persons,
  total,
  page,
  totalPages,
  locale,
  search,
  sort,
  order,
}: PersonsListClientProps) {
  const t = useTranslations("persons");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  function buildUrl(params: Record<string, string>) {
    const current = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
    }
    return `?${current.toString()}`;
  }

  const handleSearch = useCallback(
    (value: string) => {
      router.push(buildUrl({ search: value, page: "1" }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, searchParams],
  );

  function handleSort(key: string) {
    const newOrder = sort === key && order === "asc" ? "desc" : "asc";
    router.push(buildUrl({ sort: key, order: newOrder, page: "1" }));
  }

  function handlePageChange(newPage: number) {
    router.push(buildUrl({ page: String(newPage) }));
  }

  async function handleBulkDelete() {
    const res = await fetch("/api/persons/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, action: "delete" }),
    });
    if (res.ok) {
      toast.success(t("bulk.deleted_toast", { count: selectedIds.length }));
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      router.refresh();
    } else {
      toast.error(t("errors.save_failed"));
    }
  }

  const columns = [
    {
      key: "last_name",
      header: t("list.columns.last_name"),
      cell: (row: PersonSummary) => row.last_name ?? "—",
      sortable: true,
      currentSort: sort,
      currentOrder: order as "asc" | "desc",
      onSort: handleSort,
    },
    {
      key: "first_name",
      header: t("list.columns.first_name"),
      cell: (row: PersonSummary) => row.first_name ?? "—",
      sortable: true,
      currentSort: sort,
      currentOrder: order as "asc" | "desc",
      onSort: handleSort,
    },
    {
      key: "birth_date",
      header: t("list.columns.birth_date"),
      cell: (row: PersonSummary) =>
        formatPartialDate(row.birth_year, row.birth_month, row.birth_day, locale),
    },
    {
      key: "death_date",
      header: t("list.columns.death_date"),
      cell: (row: PersonSummary) =>
        formatPartialDate(row.death_year, row.death_month, row.death_day, locale),
    },
  ];

  if (persons.length === 0 && !search) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">{t("list.empty")}</p>
        <Link
          href={`/${locale}/persons/new`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("list.empty_action")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <DataTableSearch
          value={search}
          onChange={handleSearch}
          placeholder={t("list.search_placeholder")}
        />
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t("bulk.selected", { count: selectedIds.length })}
            </span>
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              {t("bulk.delete_button")}
            </Button>
          </div>
        )}
      </div>

      {persons.length === 0 && search ? (
        <p className="py-8 text-center text-muted-foreground">{t("list.empty")}</p>
      ) : (
        <DataTable
          data={persons}
          columns={columns}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(id) => router.push(`/${locale}/persons/${id}`)}
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "Person" : "Personen"}
        </p>
        <DataTablePagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      <BulkDeleteDialog
        count={selectedIds.length}
        open={bulkDeleteOpen}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
