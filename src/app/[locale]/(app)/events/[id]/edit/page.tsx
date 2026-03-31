import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { EditEventClient } from "@/components/research/EditEventClient";
import { prisma } from "@/lib/db";
import type { EventDetail, EventSummary } from "@/types/event";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { locale, id } = await params;

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
      },
      _count: {
        select: { sub_events: true },
      },
    },
  });

  if (!raw) notFound();

  const membership = await prisma.userProject.findFirst({
    where: {
      user_id: session.user.id,
      project_id: raw.project_id,
      role: { in: ["OWNER", "EDITOR"] },
    },
  });
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
      sub_events: raw._count.sub_events,
      relations_from: 0,
      relations_to: 0,
    },
  };

  return <EditEventClient event={event} projectId={raw.project_id} locale={locale} />;
}
