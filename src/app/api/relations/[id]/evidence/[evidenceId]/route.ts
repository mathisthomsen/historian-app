import { type NextRequest } from "next/server";

import { forbidden, json, notFoundError, unauthorized } from "@/lib/api";
import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { db, prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string; evidenceId: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { id, evidenceId } = await context.params;

  // Verify the evidence exists and belongs to the given relation
  const evidence = await prisma.relationEvidence.findFirst({
    where: { id: evidenceId, relation_id: id },
    select: { id: true, relation_id: true },
  });
  if (!evidence) {
    return notFoundError();
  }

  // Get the relation to check project membership (use db for soft-delete exclusion)
  const relation = await db.relation.findFirst({
    where: { id },
    select: { project_id: true },
  });
  if (!relation) {
    return notFoundError();
  }

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: relation.project_id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return forbidden();
  }

  await prisma.relationEvidence.delete({ where: { id: evidenceId } });

  // The relation list embeds evidence_count — it goes stale on every removal.
  await cache.invalidateByPrefix(`relation-list:${relation.project_id}:`);

  return json({ deleted: true });
}
