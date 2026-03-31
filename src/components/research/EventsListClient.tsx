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
import { EventFilters } from "@/components/research/EventFilters";
import { Button } from "@/components/ui/button";
import { formatPartialDate } from "@/lib/date";
import type { EventFilterState, EventSummary } from "@/types/event";
import type { EventType } from "@/types/event-type";

interface EventsListClientProps {
  events: EventSummary[];
  total: number;
  page: number;
  totalPages: number;
  locale: string;
  projectId?: string;
  search: string;
  sort: string;
  order: string;
  typeIds: string[];
  fromYear: number | null;
  toYear: number | null;
  topLevelOnly: boolean;
  availableTypes: EventType[];
}

export function EventsListClient({
  events,
  total,
  page,
  totalPages,
  locale,
  search,
  sort,
  order,
  typeIds,
  fromYear,
  toYear,
  topLevelOnly,
  availableTypes,
}: EventsListClientProps) {
  const t = useTranslations("events");
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

  function handleFiltersChange(filters: EventFilterState) {
    const params: Record<string, string> = { page: "1" };
    params.typeIds = filters.typeIds.join(",");
    params.fromYear = filters.fromYear ? String(filters.fromYear) : "";
    params.toYear = filters.toYear ? String(filters.toYear) : "";
    params.topLevelOnly = filters.topLevelOnly ? "1" : "";
    router.push(buildUrl(params));
  }

  async function handleBulkDelete() {
    const res = await fetch("/api/events/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, action: "delete" }),
    });
    if (res.ok) {
      const data = (await res.json()) as { deleted?: number; skipped?: number };
      if (data.skipped && data.skipped > 0) {
        toast.success(
          t("bulk.skipped_toast", {
            deleted: data.deleted ?? selectedIds.length,
            skipped: data.skipped,
          }),
        );
      } else {
        toast.success(t("bulk.deleted_toast", { count: selectedIds.length }));
      }
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
      header: t("list.columns.title"),
      cell: (row: EventSummary) => (
        <Link
          href={`/${locale}/events/${row.id}`}
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
      key: "event_type",
      header: t("list.columns.event_type"),
      cell: (row: EventSummary) =>
        row.event_type ? (
          <span className="flex items-center gap-2 text-sm">
            {row.event_type.color && (
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: row.event_type.color }}
              />
            )}
            {row.event_type.name}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "start_date",
      header: t("list.columns.start_date"),
      cell: (row: EventSummary) =>
        formatPartialDate(row.start_year, row.start_month, row.start_day, locale),
      sortable: true,
      currentSort: sort,
      currentOrder: order as "asc" | "desc",
      onSort: handleSort,
    },
    {
      key: "end_date",
      header: t("list.columns.end_date"),
      cell: (row: EventSummary) =>
        formatPartialDate(row.end_year, row.end_month, row.end_day, locale),
    },
    {
      key: "parent",
      header: t("list.columns.parent"),
      cell: (row: EventSummary) =>
        row.parent ? (
          <Link
            href={`/${locale}/events/${row.parent.id}`}
            className="underline hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            {row.parent.title}
          </Link>
        ) : (
          "—"
        ),
    },
  ];

  if (
    events.length === 0 &&
    !search &&
    typeIds.length === 0 &&
    !fromYear &&
    !toYear &&
    !topLevelOnly
  ) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">{t("list.empty")}</p>
        <Link
          href={`/${locale}/events/new`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("list.empty_action")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
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

      <EventFilters
        typeIds={typeIds}
        fromYear={fromYear}
        toYear={toYear}
        topLevelOnly={topLevelOnly}
        availableTypes={availableTypes}
        onChange={handleFiltersChange}
      />

      {events.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">{t("list.empty")}</p>
      ) : (
        <DataTable
          data={events}
          columns={columns}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(id) => router.push(`/${locale}/events/${id}`)}
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "Ereignis" : "Ereignisse"}
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
