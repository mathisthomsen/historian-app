import { type Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { validateEntityExists } from "@/lib/entity-validation";
import { sanitize } from "@/lib/sanitize";

const entityTypeEnum = z.enum(["PERSON", "EVENT", "SOURCE", "LOCATION", "LITERATURE"]);
const certaintyEnum = z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]);

// Allowed property fields per entity type
const ALLOWED_PROPERTIES: Record<string, string[]> = {
  PERSON: [
    "first_name",
    "last_name",
    "birth_year",
    "birth_month",
    "birth_day",
    "birth_place",
    "death_year",
    "death_month",
    "death_day",
    "death_place",
    "notes",
  ],
  EVENT: [
    "title",
    "description",
    "start_year",
    "start_month",
    "start_day",
    "end_year",
    "end_month",
    "end_day",
    "location",
    "notes",
  ],
  SOURCE: ["title", "author", "date", "repository", "call_number", "url", "notes"],
};

const listQuerySchema = z.object({
  projectId: z.string().min(1),
  entityType: entityTypeEnum.optional(),
  entityId: z.string().optional(),
  property: z.string().optional(),
});

const createPropertyEvidenceSchema = z.object({
  project_id: z.string().min(1),
  entity_type: entityTypeEnum,
  entity_id: z.string().min(1),
  property: z.string().min(1),
  source_id: z.string().min(1),
  notes: z.string().optional().nullable(),
  page_reference: z.string().optional().nullable(),
  quote: z.string().optional().nullable(),
  raw_transcription: z.string().optional().nullable(),
  confidence: certaintyEnum.optional(),
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

  const { projectId, entityType, entityId, property } = parsed.data;

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

  const where: Prisma.PropertyEvidenceWhereInput = { project_id: projectId };
  if (entityType) where.entity_type = entityType;
  if (entityId) where.entity_id = entityId;
  if (property) where.property = property;

  const records = await prisma.propertyEvidence.findMany({
    where,
    include: {
      source: { select: { id: true, title: true, type: true } },
    },
    orderBy: { created_at: "desc" },
  });

  const data = records.map((r) => ({
    id: r.id,
    project_id: r.project_id,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    property: r.property,
    source_id: r.source_id,
    source: r.source,
    notes: r.notes,
    page_reference: r.page_reference,
    quote: r.quote,
    raw_transcription: r.raw_transcription,
    confidence: r.confidence,
    created_at: r.created_at.toISOString(),
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

  const parsed = createPropertyEvidenceSchema.safeParse(body);
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

  // Validate property against allowed list
  const allowed = ALLOWED_PROPERTIES[data.entity_type] ?? [];
  if (!allowed.includes(data.property)) {
    return NextResponse.json(
      { error: "INVALID_PROPERTY", allowed },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Validate entity exists
  const entityExists = await validateEntityExists(data.entity_type, data.entity_id, data.project_id);
  if (!entityExists) {
    return NextResponse.json(
      { error: "Entity not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Validate source belongs to same project
  const source = await prisma.source.findFirst({
    where: { id: data.source_id, project_id: data.project_id, deleted_at: null },
    select: { id: true },
  });
  if (!source) {
    return NextResponse.json(
      { error: "Source does not belong to this project" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const record = await prisma.propertyEvidence.create({
    data: {
      project_id: data.project_id,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      property: data.property,
      source_id: data.source_id,
      notes: data.notes ? sanitize(data.notes) : null,
      page_reference: data.page_reference ? sanitize(data.page_reference) : null,
      quote: data.quote ? sanitize(data.quote) : null,
      raw_transcription: data.raw_transcription ? sanitize(data.raw_transcription) : null,
      confidence: data.confidence ?? "UNKNOWN",
    },
    include: {
      source: { select: { id: true, title: true, type: true } },
    },
  });

  await logActivity({
    project_id: data.project_id,
    entity_type: data.entity_type,
    entity_id: data.entity_id,
    user_id: user.id,
    action: "CREATE",
    field_path: data.property,
    new_value: { source_id: data.source_id, confidence: record.confidence },
  }).catch(console.error);

  return NextResponse.json(
    {
      id: record.id,
      project_id: record.project_id,
      entity_type: record.entity_type,
      entity_id: record.entity_id,
      property: record.property,
      source_id: record.source_id,
      source: record.source,
      notes: record.notes,
      page_reference: record.page_reference,
      quote: record.quote,
      raw_transcription: record.raw_transcription,
      confidence: record.confidence,
      created_at: record.created_at.toISOString(),
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
