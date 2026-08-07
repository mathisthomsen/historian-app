import { type Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";
import { z } from "zod";

import {
  WRITE_ROLES,
  forbidden,
  json,
  jsonError,
  parseJsonBody,
  requireProjectMembership,
  unauthorized,
  validateBody,
} from "@/lib/api";
import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { db, prisma } from "@/lib/db";
import { sanitize } from "@/lib/sanitize";
import { createPersonSchema } from "@/lib/schemas/person";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  sort: z.enum(["first_name", "last_name", "created_at"]).default("last_name"),
  order: z.enum(["asc", "desc"]).default("asc"),
  projectId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { searchParams } = request.nextUrl;
  const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return jsonError(400, "Invalid query params", { details: parsed.error.flatten() });
  }

  const { page, pageSize, search, sort, order } = parsed.data;
  // TODO: Epic 3.1 — replace with project switcher
  const projectId = parsed.data.projectId ?? user.projectId;
  if (!projectId) return jsonError(403, "No project");

  // Must precede the cache lookup: serving cached data before the membership
  // check is exactly how the C1 IDOR leaked cross-tenant rows.
  if (!(await requireProjectMembership(user.id, projectId))) return forbidden();

  const cacheKey = `person-list:${projectId}:${page}:${pageSize}:${search ?? ""}:${sort}:${order}`;
  const cached = await cache.get(cacheKey);
  if (cached) return json(cached);

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

  return json(body);
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = validateBody(createPersonSchema, parsedBody.data);
  if (!parsed.ok) return parsed.response;

  const data = parsed.data;

  if (!(await requireProjectMembership(user.id, data.project_id, WRITE_ROLES))) {
    return forbidden();
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

  return json(responseBody, { status: 201 });
}
