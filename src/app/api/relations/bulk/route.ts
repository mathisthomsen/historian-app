import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { prisma } from "@/lib/db";

const bulkRelationSchema = z.object({
  action: z.literal("delete"),
  ids: z.array(z.string()).min(1).max(500),
  projectId: z.string().min(1),
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

  const parsed = bulkRelationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { ids, projectId } = parsed.data;

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: projectId, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const result = await prisma.relation.updateMany({
    where: {
      id: { in: ids },
      project_id: projectId,
      deleted_at: null,
    },
    data: { deleted_at: new Date() },
  });

  await cache.invalidateByPrefix(`relation-list:${projectId}:`);

  return NextResponse.json(
    { deleted: result.count },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
