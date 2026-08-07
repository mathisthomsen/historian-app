import { Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { forbidden, json, jsonError, notFoundError, parseJsonBody, unauthorized } from "@/lib/api";
import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
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
  if (!user) return unauthorized();

  const { id } = await context.params;

  const existing = await prisma.eventType.findFirst({
    where: { id },
  });
  if (!existing) {
    return notFoundError();
  }

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: existing.project_id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return forbidden();
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.data;

  const parsed = updateEventTypeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_FAILED", { details: parsed.error.flatten() });
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
      return jsonError(409, "DUPLICATE_NAME");
    }
    throw err;
  }

  // Get current event count
  const eventCount = await prisma.event.count({
    where: { event_type_id: id, deleted_at: null },
  });

  // The event list embeds event_type name/color — invalidate so the writer
  // doesn't immediately read back their own stale edit.
  await cache.invalidateByPrefix(`event-list:${existing.project_id}:`);

  return json({
    id: updated.id,
    name: updated.name,
    color: updated.color,
    icon: updated.icon,
    event_count: eventCount,
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { id } = await context.params;

  const existing = await prisma.eventType.findFirst({
    where: { id },
  });
  if (!existing) {
    return notFoundError();
  }

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: existing.project_id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return forbidden();
  }

  // Count non-deleted events using this type
  const eventCount = await prisma.event.count({
    where: { event_type_id: id, deleted_at: null },
  });

  if (eventCount > 0) {
    return jsonError(409, "IN_USE", {
      details: { count: eventCount, filter_url: `/events?typeIds=${id}` },
    });
  }

  // Soft-deleted events still hold the FK (onDelete: Restrict), so a hard
  // delete would fail with P2003. Report it as a conflict, not a 500.
  const softDeletedCount = await prisma.event.count({
    where: { event_type_id: id, deleted_at: { not: null } },
  });
  if (softDeletedCount > 0) {
    return jsonError(409, "IN_USE_BY_DELETED", { details: { count: softDeletedCount } });
  }

  try {
    await prisma.eventType.delete({
      where: { id },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return jsonError(409, "IN_USE");
    }
    throw error;
  }

  return json({ deleted: true });
}
