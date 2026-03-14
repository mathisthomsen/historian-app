import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { sanitize } from "@/lib/sanitize";

const entityTypeSchema = z.enum(["PERSON", "EVENT", "SOURCE", "LOCATION", "LITERATURE"]);

const createRelationTypeSchema = z.object({
  project_id: z.string().min(1),
  name: z.string().min(1).max(100),
  inverse_name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  icon: z.string().max(50).optional(),
  valid_from_types: z.array(entityTypeSchema).min(1),
  valid_to_types: z.array(entityTypeSchema).min(1),
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
  const projectId = searchParams.get("projectId") ?? user.projectId;
  if (!projectId) {
    return NextResponse.json(
      { error: "No project" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

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

  const relationTypes = await prisma.relationType.findMany({
    where: { project_id: projectId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { relations: { where: { deleted_at: null } } },
      },
    },
  });

  const data = relationTypes.map((rt) => ({
    id: rt.id,
    name: rt.name,
    inverse_name: rt.inverse_name,
    description: rt.description,
    color: rt.color,
    icon: rt.icon,
    valid_from_types: rt.valid_from_types,
    valid_to_types: rt.valid_to_types,
    created_at: rt.created_at.toISOString(),
    updated_at: rt.updated_at.toISOString(),
    _count: { relations: rt._count.relations },
  }));

  return NextResponse.json({ data }, { status: 200, headers: { "Cache-Control": "no-store" } });
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

  const parsed = createRelationTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const data = parsed.data;

  // Verify OWNER/EDITOR membership
  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: data.project_id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const relationType = await prisma.relationType.create({
    data: {
      project_id: data.project_id,
      name: sanitize(data.name),
      inverse_name: data.inverse_name ? sanitize(data.inverse_name) : null,
      description: data.description ? sanitize(data.description) : null,
      color: data.color ?? null,
      icon: data.icon ? sanitize(data.icon) : null,
      valid_from_types: data.valid_from_types,
      valid_to_types: data.valid_to_types,
    },
  });

  return NextResponse.json(
    {
      id: relationType.id,
      name: relationType.name,
      inverse_name: relationType.inverse_name,
      description: relationType.description,
      color: relationType.color,
      icon: relationType.icon,
      valid_from_types: relationType.valid_from_types,
      valid_to_types: relationType.valid_to_types,
      created_at: relationType.created_at.toISOString(),
      updated_at: relationType.updated_at.toISOString(),
      _count: { relations: 0 },
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
