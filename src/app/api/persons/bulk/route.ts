import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { prisma } from "@/lib/db";

const bulkPersonSchema = z.object({
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

  const parsed = bulkPersonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { ids } = parsed.data;

  // Verify all persons belong to a project the user has OWNER/EDITOR access to
  const persons = await prisma.person.findMany({
    where: { id: { in: ids }, deleted_at: null },
    select: { id: true, project_id: true },
  });

  if (persons.length === 0) {
    return NextResponse.json(
      { deleted: 0 },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  // All must belong to the same project
  const projectIds = [...new Set(persons.map((p) => p.project_id))];

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

  const foundIds = persons.map((p) => p.id);
  const result = await prisma.person.updateMany({
    where: { id: { in: foundIds } },
    data: { deleted_at: new Date() },
  });

  for (const projectId of projectIds) {
    await cache.invalidateByPrefix(`person-list:${projectId}:`);
  }

  return NextResponse.json(
    { deleted: result.count },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
