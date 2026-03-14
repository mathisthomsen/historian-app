import { type NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth-guard";
import { db, prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string; evidenceId: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id, evidenceId } = await context.params;

  // Verify the evidence exists and belongs to the given relation
  const evidence = await prisma.relationEvidence.findFirst({
    where: { id: evidenceId, relation_id: id },
    select: { id: true, relation_id: true },
  });
  if (!evidence) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Get the relation to check project membership (use db for soft-delete exclusion)
  const relation = await db.relation.findFirst({
    where: { id },
    select: { project_id: true },
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

  await prisma.relationEvidence.delete({ where: { id: evidenceId } });

  return NextResponse.json(
    { deleted: true },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
