import { type EntityType, type Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { db, prisma } from "@/lib/db";
import { validateEntityExists } from "@/lib/entity-validation";
import { sanitize } from "@/lib/sanitize";

const entityTypeEnum = z.enum(["PERSON", "EVENT", "SOURCE", "LOCATION", "LITERATURE"]);
const certaintyEnum = z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]);

const listQuerySchema = z.object({
  projectId: z.string().min(1),
  fromType: entityTypeEnum.optional(),
  fromId: z.string().optional(),
  toType: entityTypeEnum.optional(),
  toId: z.string().optional(),
  entityType: entityTypeEnum.optional(),
  entityId: z.string().optional(),
  relationTypeId: z.string().optional(),
  certainty: certaintyEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const createRelationSchema = z.object({
  project_id: z.string().min(1),
  from_type: entityTypeEnum,
  from_id: z.string().min(1),
  to_type: entityTypeEnum,
  to_id: z.string().min(1),
  relation_type_id: z.string().min(1),
  notes: z.string().optional().nullable(),
  certainty: certaintyEnum.optional(),
  valid_from_year: z.number().int().optional().nullable(),
  valid_from_month: z.number().int().min(1).max(12).optional().nullable(),
  valid_from_cert: certaintyEnum.optional(),
  valid_to_year: z.number().int().optional().nullable(),
  valid_to_month: z.number().int().min(1).max(12).optional().nullable(),
  valid_to_cert: certaintyEnum.optional(),
});

// ---------------------------------------------------------------------------
// Label resolution helpers
// ---------------------------------------------------------------------------

type LabelMap = Map<string, string>;

async function resolveLabels(
  ids: string[],
  type: EntityType,
  projectId: string,
): Promise<LabelMap> {
  const map: LabelMap = new Map();
  if (ids.length === 0) return map;

  switch (type) {
    case "PERSON": {
      // No deleted_at filter: labels must resolve even for soft-deleted entities
      const rows = await prisma.person.findMany({
        where: { id: { in: ids }, project_id: projectId },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          names: { select: { name: true, is_primary: true } },
        },
      });
      for (const row of rows) {
        const primary = row.names.find((n) => n.is_primary);
        const composed = [row.first_name, row.last_name].filter(Boolean).join(" ");
        const label = primary?.name ?? (composed.length > 0 ? composed : row.id);
        map.set(row.id, label);
      }
      break;
    }
    case "EVENT": {
      const rows = await prisma.event.findMany({
        where: { id: { in: ids }, project_id: projectId },
        select: { id: true, title: true },
      });
      for (const row of rows) map.set(row.id, row.title);
      break;
    }
    case "SOURCE": {
      const rows = await prisma.source.findMany({
        where: { id: { in: ids }, project_id: projectId },
        select: { id: true, title: true },
      });
      for (const row of rows) map.set(row.id, row.title);
      break;
    }
    case "LOCATION": {
      const rows = await prisma.location.findMany({
        where: { id: { in: ids }, project_id: projectId },
        select: { id: true, name: true },
      });
      for (const row of rows) map.set(row.id, row.name);
      break;
    }
    case "LITERATURE": {
      const rows = await prisma.literature.findMany({
        where: { id: { in: ids }, project_id: projectId },
        select: { id: true, title: true },
      });
      for (const row of rows) map.set(row.id, row.title);
      break;
    }
  }

  return map;
}

async function batchResolveLabels(
  relations: { from_type: EntityType; from_id: string; to_type: EntityType; to_id: string }[],
  projectId: string,
): Promise<{ from: LabelMap; to: LabelMap }> {
  // Group by type
  const fromByType = new Map<EntityType, string[]>();
  const toByType = new Map<EntityType, string[]>();

  for (const r of relations) {
    if (!fromByType.has(r.from_type)) fromByType.set(r.from_type, []);
    fromByType.get(r.from_type)!.push(r.from_id);
    if (!toByType.has(r.to_type)) toByType.set(r.to_type, []);
    toByType.get(r.to_type)!.push(r.to_id);
  }

  const fromMaps: LabelMap[] = await Promise.all(
    Array.from(fromByType.entries()).map(([type, ids]) => resolveLabels(ids, type, projectId)),
  );
  const toMaps: LabelMap[] = await Promise.all(
    Array.from(toByType.entries()).map(([type, ids]) => resolveLabels(ids, type, projectId)),
  );

  const mergeIntoSingle = (maps: LabelMap[]): LabelMap => {
    const result: LabelMap = new Map();
    for (const m of maps) for (const [k, v] of m) result.set(k, v);
    return result;
  };

  return { from: mergeIntoSingle(fromMaps), to: mergeIntoSingle(toMaps) };
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

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

  const {
    projectId,
    fromType,
    fromId,
    toType,
    toId,
    entityType,
    entityId,
    relationTypeId,
    certainty,
    page,
    pageSize,
  } = parsed.data;

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

  const cacheKey = `relation-list:${projectId}:${page}:${pageSize}:${fromType ?? ""}:${fromId ?? ""}:${toType ?? ""}:${toId ?? ""}:${entityType ?? ""}:${entityId ?? ""}:${relationTypeId ?? ""}:${certainty ?? ""}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  const where: Prisma.RelationWhereInput = { project_id: projectId };

  if (fromType) where.from_type = fromType;
  if (fromId) where.from_id = fromId;
  if (toType) where.to_type = toType;
  if (toId) where.to_id = toId;
  if (relationTypeId) where.relation_type_id = relationTypeId;
  if (certainty) where.certainty = certainty;

  if (entityType && entityId) {
    where.OR = [
      { from_type: entityType, from_id: entityId },
      { to_type: entityType, to_id: entityId },
    ];
  }

  const [relations, total] = await Promise.all([
    db.relation.findMany({
      where,
      include: {
        relation_type: {
          select: { id: true, name: true, inverse_name: true, color: true, icon: true },
        },
        _count: { select: { evidence: true } },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.relation.count({ where: { ...where, deleted_at: null } }),
  ]);

  // Batch-resolve labels
  const { from: fromLabels, to: toLabels } = await batchResolveLabels(relations, projectId);

  const data = relations.map((r) => ({
    id: r.id,
    project_id: r.project_id,
    from_type: r.from_type,
    from_id: r.from_id,
    from_label: fromLabels.get(r.from_id) ?? r.from_id,
    to_type: r.to_type,
    to_id: r.to_id,
    to_label: toLabels.get(r.to_id) ?? r.to_id,
    relation_type: r.relation_type,
    notes: r.notes,
    certainty: r.certainty,
    valid_from_year: r.valid_from_year,
    valid_from_month: r.valid_from_month,
    valid_from_cert: r.valid_from_cert,
    valid_to_year: r.valid_to_year,
    valid_to_month: r.valid_to_month,
    valid_to_cert: r.valid_to_cert,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
    evidence_count: r._count.evidence,
  }));

  const body = { data, total, page, pageSize };

  await cache.set(cacheKey, body, 60);

  return NextResponse.json(body, { status: 200, headers: { "Cache-Control": "no-store" } });
}

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

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

  const parsed = createRelationSchema.safeParse(body);
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

  // Validate from_id exists
  const fromExists = await validateEntityExists(data.from_type, data.from_id, data.project_id);
  if (!fromExists) {
    return NextResponse.json(
      { error: "ENTITY_NOT_FOUND", field: "from_id" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Validate to_id exists
  const toExists = await validateEntityExists(data.to_type, data.to_id, data.project_id);
  if (!toExists) {
    return NextResponse.json(
      { error: "ENTITY_NOT_FOUND", field: "to_id" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Validate relation_type belongs to same project and check valid types
  const relationType = await prisma.relationType.findFirst({
    where: { id: data.relation_type_id, project_id: data.project_id },
  });
  if (!relationType) {
    return NextResponse.json(
      { error: "relation_type_id not found or not in this project" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!relationType.valid_from_types.includes(data.from_type)) {
    return NextResponse.json(
      {
        error: "INVALID_FROM_TYPE",
        message: `from_type '${data.from_type}' is not valid for this relation type`,
        valid_from_types: relationType.valid_from_types,
      },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!relationType.valid_to_types.includes(data.to_type)) {
    return NextResponse.json(
      {
        error: "INVALID_TO_TYPE",
        message: `to_type '${data.to_type}' is not valid for this relation type`,
        valid_to_types: relationType.valid_to_types,
      },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const relation = await prisma.relation.create({
    data: {
      project_id: data.project_id,
      created_by_id: user.id,
      from_type: data.from_type,
      from_id: data.from_id,
      to_type: data.to_type,
      to_id: data.to_id,
      relation_type_id: data.relation_type_id,
      notes: data.notes ? sanitize(data.notes) : null,
      certainty: data.certainty ?? "UNKNOWN",
      valid_from_year: data.valid_from_year ?? null,
      valid_from_month: data.valid_from_month ?? null,
      valid_from_cert: data.valid_from_cert ?? "UNKNOWN",
      valid_to_year: data.valid_to_year ?? null,
      valid_to_month: data.valid_to_month ?? null,
      valid_to_cert: data.valid_to_cert ?? "UNKNOWN",
    },
    include: {
      relation_type: {
        select: { id: true, name: true, inverse_name: true, color: true, icon: true },
      },
      _count: { select: { evidence: true } },
    },
  });

  await logActivity({
    project_id: data.project_id,
    entity_type: "PERSON", // use from_type as the primary entity anchor
    entity_id: data.from_id,
    user_id: user.id,
    action: "CREATE",
    new_value: { relation_id: relation.id, to_type: data.to_type, to_id: data.to_id },
  }).catch(console.error);

  await cache.invalidateByPrefix(`relation-list:${data.project_id}:`);

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
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
