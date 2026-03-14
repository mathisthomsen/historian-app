import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-guard";
import { db, prisma } from "@/lib/db";
import { sanitize } from "@/lib/sanitize";

const createEvidenceSchema = z.object({
  source_id: z.string().min(1),
  notes: z.string().max(1000).optional().nullable(),
  page_reference: z.string().max(200).optional().nullable(),
  quote: z.string().max(2000).optional().nullable(),
  confidence: z.enum(["CERTAIN", "PROBABLE", "POSSIBLE", "UNKNOWN"]).optional(),
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

  // Use db (soft-delete filtered) for relation lookup
  const relation = await db.relation.findFirst({
    where: { id },
    select: { id: true, project_id: true },
  });
  if (!relation) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: relation.project_id },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const evidence = await prisma.relationEvidence.findMany({
    where: { relation_id: id },
    include: {
      source: { select: { id: true, title: true, type: true } },
    },
    orderBy: { created_at: "asc" },
  });

  const data = evidence.map((e) => ({
    id: e.id,
    relation_id: e.relation_id,
    source_id: e.source_id,
    source: e.source,
    notes: e.notes,
    page_reference: e.page_reference,
    quote: e.quote,
    confidence: e.confidence,
    created_at: e.created_at.toISOString(),
  }));

  return NextResponse.json({ data }, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await context.params;

  // Use db (soft-delete filtered) for relation lookup
  const relation = await db.relation.findFirst({
    where: { id },
    select: { id: true, project_id: true },
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = createEvidenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const data = parsed.data;

  // Verify source belongs to same project
  const source = await prisma.source.findFirst({
    where: { id: data.source_id, project_id: relation.project_id, deleted_at: null },
    select: { id: true },
  });
  if (!source) {
    return NextResponse.json(
      { error: "Source does not belong to this project" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let evidence: {
    id: string;
    relation_id: string;
    source_id: string;
    notes: string | null;
    page_reference: string | null;
    quote: string | null;
    confidence: string;
    created_at: Date;
    source: { id: string; title: string; type: string };
  };
  try {
    evidence = await prisma.relationEvidence.create({
      data: {
        relation_id: id,
        source_id: data.source_id,
        notes: data.notes ? sanitize(data.notes) : null,
        page_reference: data.page_reference ? sanitize(data.page_reference) : null,
        quote: data.quote ? sanitize(data.quote) : null,
        confidence: data.confidence ?? "UNKNOWN",
      },
      include: {
        source: { select: { id: true, title: true, type: true } },
      },
    });
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "DUPLICATE_EVIDENCE", message: "This source is already attached as evidence" },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    throw err;
  }

  return NextResponse.json(
    {
      id: evidence.id,
      relation_id: evidence.relation_id,
      source_id: evidence.source_id,
      source: evidence.source,
      notes: evidence.notes,
      page_reference: evidence.page_reference,
      quote: evidence.quote,
      confidence: evidence.confidence,
      created_at: evidence.created_at.toISOString(),
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
