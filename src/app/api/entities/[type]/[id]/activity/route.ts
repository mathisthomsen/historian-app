import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { validateEntityExists } from "@/lib/entity-validation";

const VALID_ENTITY_TYPES = ["PERSON", "EVENT", "SOURCE", "LOCATION", "LITERATURE"] as const;
type ValidEntityType = (typeof VALID_ENTITY_TYPES)[number];

const listQuerySchema = z.object({
  projectId: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

type RouteContext = { params: Promise<{ type: string; id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { type: rawType, id } = await context.params;

  // Validate entity type (case-insensitive)
  const upperType = rawType.toUpperCase() as ValidEntityType;
  if (!VALID_ENTITY_TYPES.includes(upperType)) {
    return NextResponse.json(
      { error: "Invalid entity type", valid: VALID_ENTITY_TYPES },
      { status: 400, headers: { "Cache-Control": "no-store" } },
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

  const { projectId, page, pageSize } = parsed.data;

  // Verify project membership
  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: projectId },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Verify entity exists
  const entityExists = await validateEntityExists(upperType, id, projectId);
  if (!entityExists) {
    return NextResponse.json(
      { error: "Entity not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const [records, total] = await Promise.all([
    prisma.entityActivity.findMany({
      where: {
        project_id: projectId,
        entity_type: upperType,
        entity_id: id,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.entityActivity.count({
      where: {
        project_id: projectId,
        entity_type: upperType,
        entity_id: id,
      },
    }),
  ]);

  const data = records.map((r) => ({
    id: r.id,
    project_id: r.project_id,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    action: r.action,
    field_path: r.field_path,
    old_value: r.old_value,
    new_value: r.new_value,
    reason: r.reason,
    source_id: r.source_id,
    agent_name: r.agent_name,
    user_id: r.user_id,
    user_name: r.user?.name ?? r.user?.email ?? null,
    created_at: r.created_at.toISOString(),
  }));

  return NextResponse.json(
    { data, total, page, pageSize },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
