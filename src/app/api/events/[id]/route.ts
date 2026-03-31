import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { db, prisma } from "@/lib/db";
import { sanitize } from "@/lib/sanitize";

const updateEventSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    event_type_id: z.string().optional().nullable(),
    start_year: z.number().int().optional().nullable(),
    start_month: z.number().int().min(1).max(12).optional().nullable(),
    start_day: z.number().int().min(1).max(31).optional().nullable(),
    start_date_certainty: z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]).optional(),
    end_year: z.number().int().optional().nullable(),
    end_month: z.number().int().min(1).max(12).optional().nullable(),
    end_day: z.number().int().min(1).max(31).optional().nullable(),
    end_date_certainty: z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]).optional(),
    location: z.string().optional().nullable(),
    parent_id: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.start_month && !data.start_year) {
      ctx.addIssue({
        code: "custom",
        path: ["start_month"],
        message: "month_requires_year",
      });
    }
    if (data.start_day && !data.start_month) {
      ctx.addIssue({
        code: "custom",
        path: ["start_day"],
        message: "day_requires_month",
      });
    }
    if (data.end_month && !data.end_year) {
      ctx.addIssue({
        code: "custom",
        path: ["end_month"],
        message: "month_requires_year",
      });
    }
    if (data.end_day && !data.end_month) {
      ctx.addIssue({
        code: "custom",
        path: ["end_day"],
        message: "day_requires_month",
      });
    }
  });

type RouteContext = { params: Promise<{ id: string }> };

const eventDetailInclude = {
  event_type: { select: { id: true, name: true, color: true } },
  parent: { select: { id: true, title: true } },
  sub_events: {
    where: { deleted_at: null },
    include: {
      event_type: { select: { id: true, name: true, color: true } },
      parent: { select: { id: true, title: true } },
      _count: { select: { sub_events: { where: { deleted_at: null } } } },
    },
  },
  _count: {
    select: {
      sub_events: { where: { deleted_at: null } },
    },
  },
} as const;

function buildEventSummary(event: {
  id: string;
  title: string;
  event_type: { id: string; name: string; color: string | null } | null;
  start_year: number | null;
  start_month: number | null;
  start_day: number | null;
  start_date_certainty: string;
  end_year: number | null;
  end_month: number | null;
  end_day: number | null;
  end_date_certainty: string;
  location: string | null;
  parent: { id: string; title: string } | null;
  _count: { sub_events: number };
  created_at: Date;
}) {
  return {
    id: event.id,
    title: event.title,
    event_type: event.event_type
      ? { id: event.event_type.id, name: event.event_type.name, color: event.event_type.color }
      : null,
    start_year: event.start_year,
    start_month: event.start_month,
    start_day: event.start_day,
    start_date_certainty: event.start_date_certainty,
    end_year: event.end_year,
    end_month: event.end_month,
    end_day: event.end_day,
    end_date_certainty: event.end_date_certainty,
    location: event.location,
    parent: event.parent ? { id: event.parent.id, title: event.parent.title } : null,
    _count: { sub_events: event._count.sub_events },
    created_at: event.created_at.toISOString(),
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await context.params;

  const event = await db.event.findFirst({
    where: { id },
    include: eventDetailInclude,
  });

  if (!event) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Check project membership
  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: event.project_id },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const [relationsFromCount, relationsToCount] = await Promise.all([
    prisma.relation.count({ where: { from_type: "EVENT", from_id: id, deleted_at: null } }),
    prisma.relation.count({ where: { to_type: "EVENT", to_id: id, deleted_at: null } }),
  ]);

  const body = {
    id: event.id,
    title: event.title,
    event_type: event.event_type
      ? { id: event.event_type.id, name: event.event_type.name, color: event.event_type.color }
      : null,
    start_year: event.start_year,
    start_month: event.start_month,
    start_day: event.start_day,
    start_date_certainty: event.start_date_certainty,
    end_year: event.end_year,
    end_month: event.end_month,
    end_day: event.end_day,
    end_date_certainty: event.end_date_certainty,
    location: event.location,
    parent: event.parent ? { id: event.parent.id, title: event.parent.title } : null,
    _count: {
      sub_events: event._count.sub_events,
      relations_from: relationsFromCount,
      relations_to: relationsToCount,
    },
    created_at: event.created_at.toISOString(),
    description: event.description,
    notes: event.notes,
    created_by_id: event.created_by_id,
    updated_at: event.updated_at.toISOString(),
    sub_events: event.sub_events.map(buildEventSummary),
  };

  return NextResponse.json(body, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await context.params;

  const existing = await prisma.event.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: existing.project_id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const data = parsed.data;

  // Validate parent depth limit
  if (data.parent_id !== undefined && data.parent_id !== null) {
    const parent = await prisma.event.findFirst({
      where: { id: data.parent_id, deleted_at: null, project_id: existing.project_id },
      select: { id: true, title: true, parent_id: true },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Parent event not found" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (parent.parent_id !== null) {
      return NextResponse.json(
        {
          error: "DEPTH_LIMIT_EXCEEDED",
          message: "Cannot nest events more than one level deep",
          parent_title: parent.title,
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  // Validate event_type_id belongs to same project
  if (data.event_type_id !== undefined && data.event_type_id !== null) {
    const eventType = await prisma.eventType.findFirst({
      where: { id: data.event_type_id, project_id: existing.project_id },
    });
    if (!eventType) {
      return NextResponse.json(
        { error: "Invalid event_type_id: type does not belong to this project" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const updateData: Parameters<typeof prisma.event.update>[0]["data"] = {};
  if (data.title !== undefined) updateData.title = sanitize(data.title);
  if (data.description !== undefined)
    updateData.description = data.description ? sanitize(data.description) : null;
  if (data.event_type_id !== undefined) updateData.event_type_id = data.event_type_id;
  if (data.start_year !== undefined) updateData.start_year = data.start_year;
  if (data.start_month !== undefined) updateData.start_month = data.start_month;
  if (data.start_day !== undefined) updateData.start_day = data.start_day;
  if (data.start_date_certainty !== undefined)
    updateData.start_date_certainty = data.start_date_certainty;
  if (data.end_year !== undefined) updateData.end_year = data.end_year;
  if (data.end_month !== undefined) updateData.end_month = data.end_month;
  if (data.end_day !== undefined) updateData.end_day = data.end_day;
  if (data.end_date_certainty !== undefined)
    updateData.end_date_certainty = data.end_date_certainty;
  if (data.location !== undefined)
    updateData.location = data.location ? sanitize(data.location) : null;
  if (data.parent_id !== undefined) updateData.parent_id = data.parent_id;
  if (data.notes !== undefined) updateData.notes = data.notes ? sanitize(data.notes) : null;

  const updated = await prisma.event.update({
    where: { id },
    data: updateData,
    include: eventDetailInclude,
  });

  const loggableFields = [
    "title",
    "description",
    "event_type_id",
    "start_year",
    "start_month",
    "start_day",
    "start_date_certainty",
    "end_year",
    "end_month",
    "end_day",
    "end_date_certainty",
    "location",
    "parent_id",
    "notes",
  ] as const;

  for (const field of loggableFields) {
    if (!(field in data)) continue;
    const oldVal = existing[field];
    const newVal = updated[field];
    if (oldVal !== newVal) {
      await logActivity({
        project_id: existing.project_id,
        entity_type: "EVENT",
        entity_id: id,
        user_id: user.id,
        action: "UPDATE",
        field_path: field,
        old_value: oldVal,
        new_value: newVal,
      }).catch(console.error);
    }
  }

  await cache.invalidateByPrefix(`event-list:${existing.project_id}:`);

  const [relationsFromCount, relationsToCount] = await Promise.all([
    prisma.relation.count({ where: { from_type: "EVENT", from_id: id, deleted_at: null } }),
    prisma.relation.count({ where: { to_type: "EVENT", to_id: id, deleted_at: null } }),
  ]);

  const responseBody = {
    id: updated.id,
    title: updated.title,
    event_type: updated.event_type
      ? {
          id: updated.event_type.id,
          name: updated.event_type.name,
          color: updated.event_type.color,
        }
      : null,
    start_year: updated.start_year,
    start_month: updated.start_month,
    start_day: updated.start_day,
    start_date_certainty: updated.start_date_certainty,
    end_year: updated.end_year,
    end_month: updated.end_month,
    end_day: updated.end_day,
    end_date_certainty: updated.end_date_certainty,
    location: updated.location,
    parent: updated.parent ? { id: updated.parent.id, title: updated.parent.title } : null,
    _count: {
      sub_events: updated._count.sub_events,
      relations_from: relationsFromCount,
      relations_to: relationsToCount,
    },
    created_at: updated.created_at.toISOString(),
    description: updated.description,
    notes: updated.notes,
    created_by_id: updated.created_by_id,
    updated_at: updated.updated_at.toISOString(),
    sub_events: updated.sub_events.map(buildEventSummary),
  };

  return NextResponse.json(responseBody, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await context.params;

  const event = await prisma.event.findFirst({
    where: { id, deleted_at: null },
  });
  if (!event) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: event.project_id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Check if event has active sub-events
  const subEventCount = await prisma.event.count({
    where: { parent_id: id, deleted_at: null },
  });
  if (subEventCount > 0) {
    return NextResponse.json(
      {
        error: "HAS_SUB_EVENTS",
        message: "Cannot delete an event that has active sub-events",
        count: subEventCount,
      },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  await prisma.event.update({
    where: { id },
    data: { deleted_at: new Date() },
  });

  await cache.invalidateByPrefix(`event-list:${event.project_id}:`);

  return NextResponse.json(
    { deleted: true },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
