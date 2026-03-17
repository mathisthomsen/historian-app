import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { db, prisma } from "@/lib/db";
import { sanitize } from "@/lib/sanitize";

const certaintyEnum = z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]);

const updateRelationSchema = z.object({
  notes: z.string().optional().nullable(),
  certainty: certaintyEnum.optional(),
  valid_from_year: z.number().int().optional().nullable(),
  valid_from_month: z.number().int().min(1).max(12).optional().nullable(),
  valid_from_cert: certaintyEnum.optional(),
  valid_to_year: z.number().int().optional().nullable(),
  valid_to_month: z.number().int().min(1).max(12).optional().nullable(),
  valid_to_cert: certaintyEnum.optional(),
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

  const relation = await db.relation.findFirst({
    where: { id },
    include: {
      relation_type: {
        select: { id: true, name: true, inverse_name: true, color: true, icon: true },
      },
      _count: { select: { evidence: true } },
    },
  });

  if (!relation) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Verify project membership
  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: relation.project_id },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      id: relation.id,
      project_id: relation.project_id,
      from_type: relation.from_type,
      from_id: relation.from_id,
      to_type: relation.to_type,
      to_id: relation.to_id,
      relation_type: relation.relation_type,
      notes: relation.notes,
      certainty: relation.certainty,
      valid_from_year: relation.valid_from_year,
      valid_from_month: relation.valid_from_month,
      valid_from_cert: relation.valid_from_cert,
      valid_to_year: relation.valid_to_year,
      valid_to_month: relation.valid_to_month,
      valid_to_cert: relation.valid_to_cert,
      created_at: relation.created_at.toISOString(),
      updated_at: relation.updated_at.toISOString(),
      evidence_count: relation._count.evidence,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
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

  const existing = await prisma.relation.findFirst({
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

  const parsed = updateRelationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const data = parsed.data;

  const updateData: Parameters<typeof prisma.relation.update>[0]["data"] = {};
  if (data.notes !== undefined) updateData.notes = data.notes ? sanitize(data.notes) : null;
  if (data.certainty !== undefined) updateData.certainty = data.certainty;
  if (data.valid_from_year !== undefined) updateData.valid_from_year = data.valid_from_year;
  if (data.valid_from_month !== undefined) updateData.valid_from_month = data.valid_from_month;
  if (data.valid_from_cert !== undefined) updateData.valid_from_cert = data.valid_from_cert;
  if (data.valid_to_year !== undefined) updateData.valid_to_year = data.valid_to_year;
  if (data.valid_to_month !== undefined) updateData.valid_to_month = data.valid_to_month;
  if (data.valid_to_cert !== undefined) updateData.valid_to_cert = data.valid_to_cert;

  const updated = await prisma.relation.update({
    where: { id },
    data: updateData,
    include: {
      relation_type: {
        select: { id: true, name: true, inverse_name: true, color: true, icon: true },
      },
      _count: { select: { evidence: true } },
    },
  });

  await logActivity({
    project_id: existing.project_id,
    entity_type: existing.from_type,
    entity_id: existing.from_id,
    user_id: user.id,
    action: "UPDATE",
    new_value: data,
  }).catch(console.error);

  await cache.invalidateByPrefix(`relation-list:${existing.project_id}:`);

  return NextResponse.json(
    {
      id: updated.id,
      project_id: updated.project_id,
      from_type: updated.from_type,
      from_id: updated.from_id,
      to_type: updated.to_type,
      to_id: updated.to_id,
      relation_type: updated.relation_type,
      notes: updated.notes,
      certainty: updated.certainty,
      valid_from_year: updated.valid_from_year,
      valid_from_month: updated.valid_from_month,
      valid_from_cert: updated.valid_from_cert,
      valid_to_year: updated.valid_to_year,
      valid_to_month: updated.valid_to_month,
      valid_to_cert: updated.valid_to_cert,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
      evidence_count: updated._count.evidence,
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

  const relation = await prisma.relation.findFirst({
    where: { id, deleted_at: null },
  });
  if (!relation) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: relation.project_id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  await prisma.relation.update({
    where: { id },
    data: { deleted_at: new Date() },
  });

  await logActivity({
    project_id: relation.project_id,
    entity_type: relation.from_type,
    entity_id: relation.from_id,
    user_id: user.id,
    action: "DELETE",
  }).catch(console.error);

  await cache.invalidateByPrefix(`relation-list:${relation.project_id}:`);

  return NextResponse.json(
    { deleted: true },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
