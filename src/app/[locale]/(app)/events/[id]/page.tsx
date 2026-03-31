import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { DeleteEventButton } from "@/components/research/DeleteEventButton";
import { EventDetailTabs } from "@/components/research/EventDetailTabs";
import { prisma } from "@/lib/db";
import type { EventDetail, EventSummary } from "@/types/event";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale, id } = await params;
  const t = await getTranslations("events");

  const raw = await prisma.event.findFirst({
    where: { id, deleted_at: null },
    include: {
      event_type: true,
      parent: { select: { id: true, title: true } },
      sub_events: {
        where: { deleted_at: null },
        include: {
          event_type: true,
          parent: { select: { id: true, title: true } },
          _count: { select: { sub_events: true } },
        },
        orderBy: { title: "asc" },
      },
    },
  });

  if (!raw) notFound();

  const [membership, relationCounts] = await Promise.all([
    prisma.userProject.findFirst({
      where: { user_id: session.user.id, project_id: raw.project_id },
    }),
    Promise.all([
      prisma.relation.groupBy({
        by: ["to_type"],
        where: { from_type: "EVENT", from_id: id, deleted_at: null },
        _count: { _all: true },
      }),
      prisma.relation.groupBy({
        by: ["from_type"],
        where: { to_type: "EVENT", to_id: id, deleted_at: null },
        _count: { _all: true },
      }),
    ]).then(([fromRows, toRows]) => {
      const counts: Record<string, number> = {};
      for (const row of fromRows) {
        const key = row.to_type as string;
        counts[key] = (counts[key] ?? 0) + row._count._all;
      }
      for (const row of toRows) {
        const key = row.from_type as string;
        counts[key] = (counts[key] ?? 0) + row._count._all;
      }
      return {
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        events: counts["EVENT"] ?? 0,
        persons: counts["PERSON"] ?? 0,
        sources: counts["SOURCE"] ?? 0,
      };
    }),
  ]);
  if (!membership) notFound();

  const event: EventDetail = {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    event_type: raw.event_type
      ? { id: raw.event_type.id, name: raw.event_type.name, color: raw.event_type.color }
      : null,
    start_year: raw.start_year,
    start_month: raw.start_month,
    start_day: raw.start_day,
    start_date_certainty: raw.start_date_certainty as EventDetail["start_date_certainty"],
    end_year: raw.end_year,
    end_month: raw.end_month,
    end_day: raw.end_day,
    end_date_certainty: raw.end_date_certainty as EventDetail["end_date_certainty"],
    location: raw.location,
    parent: raw.parent ? { id: raw.parent.id, title: raw.parent.title } : null,
    notes: raw.notes,
    created_by_id: raw.created_by_id,
    created_at: raw.created_at.toISOString(),
    updated_at: raw.updated_at.toISOString(),
    sub_events: raw.sub_events.map(
      (s): EventSummary => ({
        id: s.id,
        title: s.title,
        event_type: s.event_type
          ? { id: s.event_type.id, name: s.event_type.name, color: s.event_type.color }
          : null,
        start_year: s.start_year,
        start_month: s.start_month,
        start_day: s.start_day,
        start_date_certainty: s.start_date_certainty as EventSummary["start_date_certainty"],
        end_year: s.end_year,
        end_month: s.end_month,
        end_day: s.end_day,
        end_date_certainty: s.end_date_certainty as EventSummary["end_date_certainty"],
        location: s.location,
        parent: s.parent ? { id: s.parent.id, title: s.parent.title } : null,
        _count: { sub_events: s._count.sub_events },
        created_at: s.created_at.toISOString(),
      }),
    ),
    _count: {
      sub_events: raw.sub_events.length,
      relations_from: relationCounts.total,
      relations_to: 0,
    },
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/events/${id}/edit`}
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {t("edit_title")}
          </Link>
          <DeleteEventButton
            id={id}
            locale={locale}
            label={t("delete")}
            subEventCount={event._count.sub_events}
          />
        </div>
      </div>
      <EventDetailTabs event={event} locale={locale} projectId={raw.project_id} tabCounts={relationCounts} />
    </div>
  );
}
