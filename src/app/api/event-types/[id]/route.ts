import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { sanitize } from "@/lib/sanitize";

const COLOR_PALETTE = [
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#ca8a04",
  "#16a34a",
  "#0d9488",
  "#0891b2",
  "#2563eb",
  "#4338ca",
  "#7c3aed",
  "#db2777",
  "#4b5563",
] as const;

const updateEventTypeSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.enum(COLOR_PALETTE).optional().nullable(),
  icon: z.string().optional().nullable(),
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

  const existing = await prisma.eventType.findFirst({
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

  const parsed = updateEventTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const data = parsed.data;

  const updateData: Parameters<typeof prisma.eventType.update>[0]["data"] = {};
  if (data.name !== undefined) updateData.name = sanitize(data.name);
  if (data.color !== undefined) updateData.color = data.color;
  if (data.icon !== undefined) updateData.icon = data.icon ? sanitize(data.icon) : null;

  let updated: { id: string; name: string; color: string | null; icon: string | null };
  try {
    updated = await prisma.eventType.update({
      where: { id },
      data: updateData,
    });
  } catch (err) {
    // Handle @@unique([project_id, name]) violation
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "DUPLICATE_NAME" },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    throw err;
  }

  // Get current event count
  const eventCount = await prisma.event.count({
    where: { event_type_id: id, deleted_at: null },
  });

  return NextResponse.json(
    {
      id: updated.id,
      name: updated.name,
      color: updated.color,
      icon: updated.icon,
      event_count: eventCount,
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

  const existing = await prisma.eventType.findFirst({
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

  // Count non-deleted events using this type
  const eventCount = await prisma.event.count({
    where: { event_type_id: id, deleted_at: null },
  });

  if (eventCount > 0) {
    return NextResponse.json(
      {
        error: "TYPE_IN_USE",
        count: eventCount,
        filter_url: `/events?typeIds=${id}`,
      },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  await prisma.eventType.delete({
    where: { id },
  });

  return NextResponse.json(
    { deleted: true },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
