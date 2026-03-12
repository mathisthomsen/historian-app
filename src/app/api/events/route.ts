import { type Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { db, prisma } from "@/lib/db";
import { sanitize } from "@/lib/sanitize";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  sort: z.enum(["title", "start_year", "created_at"]).default("start_year"),
  order: z.enum(["asc", "desc"]).default("asc"),
  typeIds: z.string().optional(),
  fromYear: z.coerce.number().int().optional(),
  toYear: z.coerce.number().int().optional(),
  topLevelOnly: z.string().optional(),
  projectId: z.string().optional(),
});

const createEventSchema = z
  .object({
    project_id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
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

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { searchParams } = request.nextUrl;
  const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { page, pageSize, search, sort, order, fromYear, toYear } = parsed.data;
  const topLevelOnly = parsed.data.topLevelOnly === "true";
  // TODO: Epic 3.1 — replace with project switcher
  const projectId = parsed.data.projectId ?? user.projectId;
  if (!projectId) {
    return NextResponse.json(
      { error: "No project" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const typeIds = parsed.data.typeIds ? parsed.data.typeIds.split(",").filter(Boolean) : [];
  const sortedTypeIds = [...typeIds].sort().join(",");

  const cacheKey = `event-list:${projectId}:${page}:${pageSize}:${search ?? ""}:${sort}:${order}:${sortedTypeIds}:${fromYear ?? ""}:${toYear ?? ""}:${topLevelOnly}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  const where: Prisma.EventWhereInput = {
    project_id: projectId,
  };

  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  if (typeIds.length > 0) {
    where.event_type_id = { in: typeIds };
  }

  if (topLevelOnly) {
    where.parent_id = null;
  }

  if (fromYear !== undefined || toYear !== undefined) {
    where.AND = [
      ...(toYear !== undefined ? [{ start_year: { lte: toYear } }] : []),
      ...(fromYear !== undefined
        ? [{ OR: [{ end_year: null }, { end_year: { gte: fromYear } }] }]
        : []),
    ];
  }

  const eventInclude = {
    event_type: { select: { id: true, name: true, color: true } },
    parent: { select: { id: true, title: true } },
    _count: { select: { sub_events: { where: { deleted_at: null } } } },
  };

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      include: eventInclude,
      orderBy: { [sort]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.event.count({
      where: { ...where, deleted_at: null },
    }),
  ]);

  const body = {
    data: events.map(buildEventSummary),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };

  await cache.set(cacheKey, body, 60);

  return NextResponse.json(body, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
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

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const data = parsed.data;

  // Verify user is a member of the project
  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: data.project_id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Validate parent depth limit
  if (data.parent_id) {
    const parent = await prisma.event.findFirst({
      where: { id: data.parent_id, deleted_at: null, project_id: data.project_id },
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
  if (data.event_type_id) {
    const eventType = await prisma.eventType.findFirst({
      where: { id: data.event_type_id, project_id: data.project_id },
    });
    if (!eventType) {
      return NextResponse.json(
        { error: "Invalid event_type_id: type does not belong to this project" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const event = await prisma.event.create({
    data: {
      project_id: data.project_id,
      created_by_id: user.id,
      title: sanitize(data.title),
      description: data.description ? sanitize(data.description) : null,
      event_type_id: data.event_type_id ?? null,
      start_year: data.start_year ?? null,
      start_month: data.start_month ?? null,
      start_day: data.start_day ?? null,
      start_date_certainty: data.start_date_certainty ?? "UNKNOWN",
      end_year: data.end_year ?? null,
      end_month: data.end_month ?? null,
      end_day: data.end_day ?? null,
      end_date_certainty: data.end_date_certainty ?? "UNKNOWN",
      location: data.location ? sanitize(data.location) : null,
      parent_id: data.parent_id ?? null,
      notes: data.notes ? sanitize(data.notes) : null,
    },
    include: {
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
    },
  });

  await cache.invalidateByPrefix(`event-list:${data.project_id}:`);

  const responseBody = {
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
      relations_from: 0,
      relations_to: 0,
    },
    created_at: event.created_at.toISOString(),
    description: event.description,
    notes: event.notes,
    created_by_id: event.created_by_id,
    updated_at: event.updated_at.toISOString(),
    sub_events: event.sub_events.map(buildEventSummary),
  };

  return NextResponse.json(responseBody, { status: 201, headers: { "Cache-Control": "no-store" } });
}
