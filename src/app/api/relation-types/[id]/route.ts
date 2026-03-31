import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-guard";
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

  await prisma.relationType.delete({ where: { id } });

  return NextResponse.json(
    { deleted: true },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
