import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { prisma } from "@/lib/db";

const bulkEventSchema = z.object({
  ids: z.array(z.string()).min(1).max(500),
  action: z.literal("delete"),
});

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

  const parsed = bulkEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { ids } = parsed.data;

  // Fetch all requested events (non-deleted)
  const events = await prisma.event.findMany({
    where: { id: { in: ids }, deleted_at: null },
    select: { id: true, project_id: true },
  });

  if (events.length === 0) {
    return NextResponse.json(
      { deleted: 0, skipped: [] },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Verify membership for all projects
  const projectIds = [...new Set(events.map((e) => e.project_id))];
  for (const projectId of projectIds) {
    const membership = await prisma.userProject.findFirst({
      where: { user_id: user.id, project_id: projectId, role: { in: ["OWNER", "EDITOR"] } },
    });
    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  let deleted = 0;
  const skipped: { id: string; reason: "HAS_SUB_EVENTS" }[] = [];

  for (const event of events) {
    const subEventCount = await prisma.event.count({
      where: { parent_id: event.id, deleted_at: null },
    });

    if (subEventCount > 0) {
      skipped.push({ id: event.id, reason: "HAS_SUB_EVENTS" });
    } else {
      await prisma.event.update({
        where: { id: event.id },
        data: { deleted_at: new Date() },
      });
      deleted += 1;
    }
  }

  for (const projectId of projectIds) {
    await cache.invalidateByPrefix(`event-list:${projectId}:`);
  }

  return NextResponse.json(
    { deleted, skipped },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
