import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { EventsListClient } from "@/components/research/EventsListClient";
import { prisma } from "@/lib/db";
import type { EventSummary } from "@/types/event";
import type { EventType } from "@/types/event-type";

export const metadata: Metadata = {
  title: "Ereignisse",
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    order?: string;
    typeIds?: string;
    fromYear?: string;
    toYear?: string;
    topLevelOnly?: string;
  }>;
}

export default async function EventsPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale } = await params;
  const {
    page: pageStr = "1",
    search = "",
    sort = "title",
    order = "asc",
    typeIds: typeIdsStr = "",
    fromYear: fromYearStr = "",
    toYear: toYearStr = "",
    topLevelOnly: topLevelOnlyStr = "",
  } = await searchParams;

  const t = await getTranslations("events");
  const projectId = session.user.projectId;

  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const pageSize = 25;

  const typeIds = typeIdsStr ? typeIdsStr.split(",").filter(Boolean) : [];
  const fromYear = fromYearStr ? parseInt(fromYearStr, 10) || null : null;
  const toYear = toYearStr ? parseInt(toYearStr, 10) || null : null;
  const topLevelOnly = topLevelOnlyStr === "1";

  let events: EventSummary[] = [];
  let total = 0;
  let availableTypes: EventType[] = [];

  if (projectId) {
    const validSort = ["title", "start_year", "created_at"].includes(sort) ? sort : "title";
    const validOrder = order === "desc" ? "desc" : "asc";

    // Build where clause
    const where: Record<string, unknown> = {
      project_id: projectId,
      deleted_at: null,
      ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
      ...(typeIds.length > 0 ? { event_type_id: { in: typeIds } } : {}),
      ...(topLevelOnly ? { parent_id: null } : {}),
    };

    // Date range overlap filter
    if (fromYear !== null || toYear !== null) {
      const rangeConditions: Record<string, unknown>[] = [];
      if (fromYear !== null) {
        rangeConditions.push({
          OR: [{ end_year: { gte: fromYear } }, { end_year: null }],
        });
      }
      if (toYear !== null) {
        rangeConditions.push({ start_year: { lte: toYear } });
      }
      if (rangeConditions.length > 0) {
        where.AND = rangeConditions;
      }
    }

    const [rawEvents, count, rawTypes] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          event_type: true,
          parent: { select: { id: true, title: true } },
          _count: { select: { sub_events: true } },
        },
        orderBy: { [validSort]: validOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.event.count({ where }),
      prisma.eventType.findMany({
        where: { project_id: projectId },
        include: { _count: { select: { events: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

    events = rawEvents.map((e) => ({
      id: e.id,
      title: e.title,
      event_type: e.event_type
        ? { id: e.event_type.id, name: e.event_type.name, color: e.event_type.color }
        : null,
      start_year: e.start_year,
      start_month: e.start_month,
      start_day: e.start_day,
      start_date_certainty: e.start_date_certainty as EventSummary["start_date_certainty"],
      end_year: e.end_year,
      end_month: e.end_month,
      end_day: e.end_day,
      end_date_certainty: e.end_date_certainty as EventSummary["end_date_certainty"],
      location: e.location,
      parent: e.parent ? { id: e.parent.id, title: e.parent.title } : null,
      _count: { sub_events: e._count.sub_events },
      created_at: e.created_at.toISOString(),
    }));
    total = count;

    availableTypes = rawTypes.map((et) => ({
      id: et.id,
      name: et.name,
      color: et.color,
      icon: et.icon,
      event_count: et._count.events,
    }));
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link
          href={`/${locale}/events/new`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("create")}
        </Link>
      </div>
      <EventsListClient
        events={events}
        total={total}
        page={page}
        totalPages={totalPages}
        locale={locale}
        projectId={projectId ?? ""}
        search={search}
        sort={sort}
        order={order}
        typeIds={typeIds}
        fromYear={fromYear}
        toYear={toYear}
        topLevelOnly={topLevelOnly}
        availableTypes={availableTypes}
      />
    </div>
  );
}
