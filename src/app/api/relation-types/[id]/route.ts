import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { sanitize } from "@/lib/sanitize";

const entityTypeSchema = z.enum(["PERSON", "EVENT", "SOURCE", "LOCATION", "LITERATURE"]);

const updateRelationTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  inverse_name: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .nullable(),
  icon: z.string().max(50).optional().nullable(),
  valid_from_types: z.array(entityTypeSchema).min(1).optional(),
  valid_to_types: z.array(entityTypeSchema).min(1).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await context.params;

  const existing = await prisma.relationType.findFirst({
    where: { id },
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

  const parsed = updateRelationTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const data = parsed.data;

  const updateData: Parameters<typeof prisma.relationType.update>[0]["data"] = {};
  if (data.name !== undefined) updateData.name = sanitize(data.name);
  if (data.inverse_name !== undefined)
    updateData.inverse_name = data.inverse_name ? sanitize(data.inverse_name) : null;
  if (data.description !== undefined)
    updateData.description = data.description ? sanitize(data.description) : null;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.icon !== undefined) updateData.icon = data.icon ? sanitize(data.icon) : null;
  if (data.valid_from_types !== undefined) updateData.valid_from_types = data.valid_from_types;
  if (data.valid_to_types !== undefined) updateData.valid_to_types = data.valid_to_types;

  const updated = await prisma.relationType.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: { relations: { where: { deleted_at: null } } },
      },
    },
  });

  // The relation list embeds relation_type name/inverse_name/color/icon —
  // invalidate so the writer doesn't immediately read back their own stale edit.
  await cache.invalidateByPrefix(`relation-list:${existing.project_id}:`);

  return NextResponse.json(
    {
      id: updated.id,
      name: updated.name,
      inverse_name: updated.inverse_name,
      description: updated.description,
      color: updated.color,
      icon: updated.icon,
      valid_from_types: updated.valid_from_types,
      valid_to_types: updated.valid_to_types,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
      _count: { relations: updated._count.relations },
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
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

  const existing = await prisma.relationType.findFirst({
    where: { id },
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

  // Check if any non-deleted relations use this type
  const relationCount = await prisma.relation.count({
    where: { relation_type_id: id, deleted_at: null },
  });
  if (relationCount > 0) {
    return NextResponse.json(
      { error: "IN_USE", count: relationCount },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Soft-deleted relations still hold the FK (onDelete: Restrict), so a hard
  // delete would fail with P2003. Report it as a conflict, not a 500.
  const softDeletedCount = await prisma.relation.count({
    where: { relation_type_id: id, deleted_at: { not: null } },
  });
  if (softDeletedCount > 0) {
    return NextResponse.json(
      { error: "IN_USE_BY_DELETED", count: softDeletedCount },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await prisma.relationType.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "IN_USE" },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    throw error;
  }

  return NextResponse.json(
    { deleted: true },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
