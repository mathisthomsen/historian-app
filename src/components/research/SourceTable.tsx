"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { BulkDeleteDialog } from "@/components/research/BulkDeleteDialog";
import { DataTable } from "@/components/research/DataTable";
import { DataTablePagination } from "@/components/research/DataTablePagination";
import { DataTableSearch } from "@/components/research/DataTableSearch";
import { DeleteSourceButton } from "@/components/research/DeleteSourceButton";
import { ReliabilityBadge } from "@/components/research/ReliabilityBadge";
import { Button } from "@/components/ui/button";
import { SOURCE_TYPE_SUGGESTIONS } from "@/lib/source-types";
import type { SourceReliability, SourceSummary } from "@/types/source";

const RELIABILITIES: SourceReliability[] = ["HIGH", "MEDIUM", "LOW", "UNKNOWN"];

interface SourceTableProps {
  sources: SourceSummary[];
  total: number;
  page: number;
  totalPages: number;
  locale: string;
  projectId: string;
  search: string;
  sort: string;
  order: string;
  reliability: string[];
  type: string;
}

export function SourceTable({
  sources,
  total,
  page,
  totalPages,
  locale,
  projectId,
  search,
  sort,
  order,
  reliability,
  type,
}: SourceTableProps) {
  const t = useTranslations("sources");
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

  function handleTypeChange(value: string) {
    router.push(buildUrl({ type: value, page: "1" }));
  }

  function handleReliabilityChange(value: SourceReliability) {
    const current = reliability.includes(value)
      ? reliability.filter((r) => r !== value)
      : [...reliability, value];
    router.push(buildUrl({ reliability: current.join(","), page: "1" }));
  }

  async function handleBulkDelete() {
    const res = await fetch("/api/sources/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, project_id: projectId }),
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
      key: "title",
      header: t("columns.title"),
      cell: (row: SourceSummary) => (
        <Link
          href={`/${locale}/sources/${row.id}`}
          className="underline hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          {row.title}
        </Link>
      ),
      sortable: true,
      currentSort: sort,
      currentOrder: order as "asc" | "desc",
      onSort: handleSort,
    },
    {
      key: "type",
      header: t("columns.type"),
      cell: (row: SourceSummary) => (
        <span className="rounded bg-muted px-2 py-0.5 text-xs">{row.type}</span>
      ),
    },
    {
      key: "author",
      header: t("columns.author"),
      cell: (row: SourceSummary) =>
        row.author ? (row.author.length > 40 ? `${row.author.slice(0, 40)}…` : row.author) : "—",
    },
    {
      key: "reliability",
      header: t("columns.reliability"),
      cell: (row: SourceSummary) => <ReliabilityBadge reliability={row.reliability} />,
    },
    {
      key: "created_at",
      header: t("columns.created_at"),
      cell: (row: SourceSummary) => new Date(row.created_at).toLocaleDateString(locale),
      sortable: true,
      currentSort: sort,
      currentOrder: order as "asc" | "desc",
      onSort: handleSort,
    },
    {
      key: "actions",
      header: t("columns.actions"),
      cell: (row: SourceSummary) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link href={`/${locale}/sources/${row.id}/edit`} aria-label="Edit">
            <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Link>
          <DeleteSourceButton id={row.id} locale={locale} label={t("delete")} />
        </div>
      ),
    },
  ];

  const hasFilters = search || reliability.length > 0 || type;

  if (sources.length === 0 && !hasFilters) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">{t("empty_state")}</p>
        <Link
          href={`/${locale}/sources/new`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("empty_action")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <DataTableSearch
            value={search}
            onChange={handleSearch}
            placeholder={t("search_placeholder")}
          />

          {/* Type filter */}
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="">{t("all_types")}</option>
            {SOURCE_TYPE_SUGGESTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Reliability filter */}
          <div className="flex items-center gap-1">
            {RELIABILITIES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleReliabilityChange(r)}
                className={[
                  "rounded-md border px-2 py-1 text-xs transition-colors",
                  reliability.includes(r)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground hover:bg-accent",
                ].join(" ")}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {t("bulk.selected", { count: selectedIds.length })}
              </span>
              <Button
                data-testid="bulk-delete-btn"
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
              >
                {t("bulk.delete_button")}
              </Button>
            </>
          )}
          <Link
            href={`/${locale}/sources/new`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("create")}
          </Link>
        </div>
      </div>

      {sources.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">{t("empty_state")}</p>
      ) : (
        <DataTable
          data={sources}
          columns={columns}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(id) => router.push(`/${locale}/sources/${id}`)}
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "Quelle" : "Quellen"}
        </p>
        <DataTablePagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      <BulkDeleteDialog
        count={selectedIds.length}
        open={bulkDeleteOpen}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        title={t("bulk_delete_confirm", { count: selectedIds.length })}
      />
    </div>
  );
}
