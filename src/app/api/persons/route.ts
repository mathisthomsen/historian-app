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
  sort: z.enum(["first_name", "last_name", "created_at"]).default("last_name"),
  order: z.enum(["asc", "desc"]).default("asc"),
  projectId: z.string().optional(),
});

const createPersonSchema = z
  .object({
    project_id: z.string().min(1),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    birth_year: z.number().int().min(1).max(2100).optional(),
    birth_month: z.number().int().min(1).max(12).optional(),
    birth_day: z.number().int().min(1).max(31).optional(),
    birth_date_certainty: z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]).optional(),
    birth_place: z.string().optional(),
    death_year: z.number().int().min(1).max(2100).optional(),
    death_month: z.number().int().min(1).max(12).optional(),
    death_day: z.number().int().min(1).max(31).optional(),
    death_date_certainty: z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]).optional(),
    death_place: z.string().optional(),
    notes: z.string().optional(),
    names: z
      .array(
        z.object({
          name: z.string().min(1),
          language: z.string().optional(),
          is_primary: z.boolean().optional(),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    const hasName =
      (data.first_name && data.first_name.trim().length > 0) ||
      (data.last_name && data.last_name.trim().length > 0) ||
      (data.names && data.names.length > 0);
    if (!hasName) {
      ctx.addIssue({
        code: "custom",
        path: ["first_name"],
        message: "name_required",
      });
    }
    if (data.birth_month && !data.birth_year) {
      ctx.addIssue({
        code: "custom",
        path: ["birth_month"],
        message: "month_requires_year",
      });
    }
    if (data.birth_day && !data.birth_month) {
      ctx.addIssue({
        code: "custom",
        path: ["birth_day"],
        message: "day_requires_month",
      });
    }
    if (data.death_month && !data.death_year) {
      ctx.addIssue({
        code: "custom",
        path: ["death_month"],
        message: "month_requires_year",
      });
    }
    if (data.death_day && !data.death_month) {
      ctx.addIssue({
        code: "custom",
        path: ["death_day"],
        message: "day_requires_month",
      });
    }
    const primaryCount = (data.names ?? []).filter((n) => n.is_primary).length;
    if (primaryCount > 1) {
      ctx.addIssue({
        code: "custom",
        path: ["names"],
        message: "Only one primary name allowed",
      });
    }
  });

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

  const { page, pageSize, search, sort, order } = parsed.data;
  // TODO: Epic 3.1 — replace with project switcher
  const projectId = parsed.data.projectId ?? user.projectId;
  if (!projectId) {
    return NextResponse.json(
      { error: "No project" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const cacheKey = `person-list:${projectId}:${page}:${pageSize}:${search ?? ""}:${sort}:${order}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  const where: Prisma.PersonWhereInput = {
    project_id: projectId,
  };

  if (search) {
    where.OR = [
      { first_name: { contains: search, mode: "insensitive" } },
      { last_name: { contains: search, mode: "insensitive" } },
      { names: { some: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [persons, total] = await Promise.all([
    db.person.findMany({
      where,
      include: { names: true },
      orderBy: { [sort]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.person.count({
      where: {
        project_id: projectId,
        deleted_at: null,
        ...(search
          ? {
              OR: [
                { first_name: { contains: search, mode: "insensitive" } },
                { last_name: { contains: search, mode: "insensitive" } },
                { names: { some: { name: { contains: search, mode: "insensitive" } } } },
              ],
            }
          : {}),
      },
    }),
  ]);

  const body = {
    data: persons.map((p) => ({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      birth_year: p.birth_year,
      birth_month: p.birth_month,
      birth_day: p.birth_day,
      birth_date_certainty: p.birth_date_certainty,
      death_year: p.death_year,
      death_month: p.death_month,
      death_day: p.death_day,
      death_date_certainty: p.death_date_certainty,
      created_at: p.created_at.toISOString(),
      names: p.names.map((n) => ({
        name: n.name,
        language: n.language,
        is_primary: n.is_primary,
      })),
    })),
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

  const parsed = createPersonSchema.safeParse(body);
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

  const createData: Prisma.PersonUncheckedCreateInput = {
    project_id: data.project_id,
    created_by_id: user.id,
    first_name: data.first_name ? sanitize(data.first_name) : null,
    last_name: data.last_name ? sanitize(data.last_name) : null,
    birth_year: data.birth_year ?? null,
    birth_month: data.birth_month ?? null,
    birth_day: data.birth_day ?? null,
    birth_date_certainty: data.birth_date_certainty ?? "UNKNOWN",
    birth_place: data.birth_place ? sanitize(data.birth_place) : null,
    death_year: data.death_year ?? null,
    death_month: data.death_month ?? null,
    death_day: data.death_day ?? null,
    death_date_certainty: data.death_date_certainty ?? "UNKNOWN",
    death_place: data.death_place ? sanitize(data.death_place) : null,
    notes: data.notes ? sanitize(data.notes) : null,
  };

  if (data.names && data.names.length > 0) {
    createData.names = {
      create: data.names.map((n) => ({
        name: sanitize(n.name),
        language: n.language ?? null,
        is_primary: n.is_primary ?? false,
      })),
    };
  }

  const person = await prisma.person.create({
    data: createData,
    include: { names: true },
  });

  // Invalidate person-list cache for this project
  await cache.invalidateByPrefix(`person-list:${data.project_id}:`);

  const responseBody = {
    id: person.id,
    first_name: person.first_name,
    last_name: person.last_name,
    birth_year: person.birth_year,
    birth_month: person.birth_month,
    birth_day: person.birth_day,
    birth_date_certainty: person.birth_date_certainty,
    birth_place: person.birth_place,
    death_year: person.death_year,
    death_month: person.death_month,
    death_day: person.death_day,
    death_date_certainty: person.death_date_certainty,
    death_place: person.death_place,
    notes: person.notes,
    created_by_id: person.created_by_id,
    created_at: person.created_at.toISOString(),
    updated_at: person.updated_at.toISOString(),
    names: person.names.map((n) => ({
      name: n.name,
      language: n.language,
      is_primary: n.is_primary,
    })),
    _count: { relations_from: 0, relations_to: 0 },
  };

  return NextResponse.json(responseBody, { status: 201, headers: { "Cache-Control": "no-store" } });
}
