import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { db, prisma } from "@/lib/db";
import { sanitize } from "@/lib/sanitize";

const updateSourceSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  author: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  repository: z.string().optional().nullable(),
  call_number: z.string().optional().nullable(),
  url: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" ? null : (v ?? null))),
  reliability: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]).optional(),
  notes: z.string().optional().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

const sourceDetailInclude = {
  _count: {
    select: {
      relation_evidence: true,
      property_evidence: true,
    },
  },
} as const;

export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await context.params;

  const source = await db.source.findFirst({
    where: { id },
    include: sourceDetailInclude,
  });

  if (!source) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: source.project_id },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = {
    id: source.id,
    title: source.title,
    type: source.type,
    author: source.author,
    date: source.date,
    repository: source.repository,
    call_number: source.call_number,
    url: source.url,
    reliability: source.reliability as "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN",
    notes: source.notes,
    created_by_id: source.created_by_id,
    created_at: source.created_at.toISOString(),
    updated_at: source.updated_at.toISOString(),
    _count: {
      relation_evidence: source._count.relation_evidence,
      property_evidence: source._count.property_evidence,
    },
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

  const existing = await prisma.source.findFirst({
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

  const parsed = updateSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const data = parsed.data;

  const updateData: Parameters<typeof prisma.source.update>[0]["data"] = {};
  if (data.title !== undefined) updateData.title = sanitize(data.title);
  if (data.type !== undefined) updateData.type = sanitize(data.type);
  if (data.author !== undefined) updateData.author = data.author ? sanitize(data.author) : null;
  if (data.date !== undefined) updateData.date = data.date ? sanitize(data.date) : null;
  if (data.repository !== undefined)
    updateData.repository = data.repository ? sanitize(data.repository) : null;
  if (data.call_number !== undefined)
    updateData.call_number = data.call_number ? sanitize(data.call_number) : null;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.reliability !== undefined) updateData.reliability = data.reliability;
  if (data.notes !== undefined) updateData.notes = data.notes ? sanitize(data.notes) : null;

  const updated = await prisma.source.update({
    where: { id },
    data: updateData,
    include: sourceDetailInclude,
  });

  await cache.invalidateByPrefix(`source-list:${existing.project_id}:`);

  const responseBody = {
    id: updated.id,
    title: updated.title,
    type: updated.type,
    author: updated.author,
    date: updated.date,
    repository: updated.repository,
    call_number: updated.call_number,
    url: updated.url,
    reliability: updated.reliability as "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN",
    notes: updated.notes,
    created_by_id: updated.created_by_id,
    created_at: updated.created_at.toISOString(),
    updated_at: updated.updated_at.toISOString(),
    _count: {
      relation_evidence: updated._count.relation_evidence,
      property_evidence: updated._count.property_evidence,
    },
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

  const source = await prisma.source.findFirst({
    where: { id, deleted_at: null },
  });
  if (!source) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: source.project_id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  await prisma.source.update({
    where: { id },
    data: { deleted_at: new Date() },
  });

  await cache.invalidateByPrefix(`source-list:${source.project_id}:`);

  return NextResponse.json(
    { success: true },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
