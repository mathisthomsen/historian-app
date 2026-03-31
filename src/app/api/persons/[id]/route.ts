import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { db, prisma } from "@/lib/db";
import { sanitize } from "@/lib/sanitize";

const updatePersonSchema = z
  .object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    birth_year: z.number().int().min(1).max(2100).optional().nullable(),
    birth_month: z.number().int().min(1).max(12).optional().nullable(),
    birth_day: z.number().int().min(1).max(31).optional().nullable(),
    birth_date_certainty: z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]).optional(),
    birth_place: z.string().optional().nullable(),
    death_year: z.number().int().min(1).max(2100).optional().nullable(),
    death_month: z.number().int().min(1).max(12).optional().nullable(),
    death_day: z.number().int().min(1).max(31).optional().nullable(),
    death_date_certainty: z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]).optional(),
    death_place: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    names: z
      .array(
        z.object({
          name: z.string().min(1),
          language: z.string().optional().nullable(),
          is_primary: z.boolean().optional(),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
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
  });

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await context.params;

  const person = await db.person.findFirst({
    where: { id },
    include: {
      names: true,
    },
  });

  if (!person) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Check project membership
  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: person.project_id },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = {
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

  // Find the person (using prisma directly to bypass soft-delete filter for lookup)
  const existing = await prisma.person.findFirst({
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

  const parsed = updatePersonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const data = parsed.data;

  const updateData: Parameters<typeof prisma.person.update>[0]["data"] = {};
  if (data.first_name !== undefined)
    updateData.first_name = data.first_name ? sanitize(data.first_name) : null;
  if (data.last_name !== undefined)
    updateData.last_name = data.last_name ? sanitize(data.last_name) : null;
  if (data.birth_year !== undefined) updateData.birth_year = data.birth_year;
  if (data.birth_month !== undefined) updateData.birth_month = data.birth_month;
  if (data.birth_day !== undefined) updateData.birth_day = data.birth_day;
  if (data.birth_date_certainty !== undefined)
    updateData.birth_date_certainty = data.birth_date_certainty;
  if (data.birth_place !== undefined)
    updateData.birth_place = data.birth_place ? sanitize(data.birth_place) : null;
  if (data.death_year !== undefined) updateData.death_year = data.death_year;
  if (data.death_month !== undefined) updateData.death_month = data.death_month;
  if (data.death_day !== undefined) updateData.death_day = data.death_day;
  if (data.death_date_certainty !== undefined)
    updateData.death_date_certainty = data.death_date_certainty;
  if (data.death_place !== undefined)
    updateData.death_place = data.death_place ? sanitize(data.death_place) : null;
  if (data.notes !== undefined) updateData.notes = data.notes ? sanitize(data.notes) : null;

  let updatedPerson: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    birth_year: number | null;
    birth_month: number | null;
    birth_day: number | null;
    birth_date_certainty: string;
    birth_place: string | null;
    death_year: number | null;
    death_month: number | null;
    death_day: number | null;
    death_date_certainty: string;
    death_place: string | null;
    notes: string | null;
    created_by_id: string | null;
    created_at: Date;
    updated_at: Date;
    names: { name: string; language: string | null; is_primary: boolean }[];
    _count: { relations_from: number; relations_to: number };
  };

  if (data.names !== undefined) {
    const [updated] = await prisma.$transaction([
      prisma.person.update({ where: { id }, data: updateData }),
      prisma.personName.deleteMany({ where: { person_id: id } }),
      ...(data.names.length > 0
        ? [
            prisma.personName.createMany({
              data: data.names.map((n) => ({
                person_id: id,
                name: sanitize(n.name),
                language: n.language ?? null,
                is_primary: n.is_primary ?? false,
              })),
            }),
          ]
        : []),
    ]);

    const names = await prisma.personName.findMany({ where: { person_id: id } });
    updatedPerson = { ...updated, names, _count: { relations_from: 0, relations_to: 0 } };
  } else {
    const updated = await prisma.person.update({ where: { id }, data: updateData });
    const names = await prisma.personName.findMany({ where: { person_id: id } });
    updatedPerson = { ...updated, names, _count: { relations_from: 0, relations_to: 0 } };
  }

  // Log per-field changes
  const loggableFields = [
    "first_name",
    "last_name",
    "birth_year",
    "birth_month",
    "birth_day",
    "birth_place",
    "birth_date_certainty",
    "death_year",
    "death_month",
    "death_day",
    "death_place",
    "death_date_certainty",
    "notes",
  ] as const;

  for (const field of loggableFields) {
    if (!(field in data)) continue;
    const oldVal = existing[field];
    const newVal = updatedPerson[field];
    if (oldVal !== newVal) {
      await logActivity({
        project_id: existing.project_id,
        entity_type: "PERSON",
        entity_id: id,
        user_id: user.id,
        action: "UPDATE",
        field_path: field,
        old_value: oldVal,
        new_value: newVal,
      }).catch(console.error);
    }
  }

  await cache.invalidateByPrefix(`person-list:${existing.project_id}:`);

  const responseBody = {
    id: updatedPerson.id,
    first_name: updatedPerson.first_name,
    last_name: updatedPerson.last_name,
    birth_year: updatedPerson.birth_year,
    birth_month: updatedPerson.birth_month,
    birth_day: updatedPerson.birth_day,
    birth_date_certainty: updatedPerson.birth_date_certainty,
    birth_place: updatedPerson.birth_place,
    death_year: updatedPerson.death_year,
    death_month: updatedPerson.death_month,
    death_day: updatedPerson.death_day,
    death_date_certainty: updatedPerson.death_date_certainty,
    death_place: updatedPerson.death_place,
    notes: updatedPerson.notes,
    created_by_id: updatedPerson.created_by_id,
    created_at: updatedPerson.created_at.toISOString(),
    updated_at: updatedPerson.updated_at.toISOString(),
    names: updatedPerson.names.map((n) => ({
      name: n.name,
      language: n.language,
      is_primary: n.is_primary,
    })),
    _count: updatedPerson._count,
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

  const person = await prisma.person.findFirst({
    where: { id, deleted_at: null },
  });
  if (!person) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: person.project_id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  await prisma.person.update({
    where: { id },
    data: { deleted_at: new Date() },
  });

  await cache.invalidateByPrefix(`person-list:${person.project_id}:`);

  return NextResponse.json(
    { deleted: true },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
