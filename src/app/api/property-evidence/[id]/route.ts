import { type NextRequest } from "next/server";

import { logActivity } from "@/lib/activity";
import { forbidden, json, notFoundError, unauthorized } from "@/lib/api";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const { id } = await context.params;

  // Look up the record first to get entity info for logging
  const record = await prisma.propertyEvidence.findFirst({
    where: { id },
    select: {
      id: true,
      project_id: true,
      entity_type: true,
      entity_id: true,
      property: true,
      source_id: true,
    },
  });
  if (!record) {
    return notFoundError();
  }

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: record.project_id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return forbidden();
  }

  await prisma.propertyEvidence.delete({ where: { id } });

  await logActivity({
    project_id: record.project_id,
    entity_type: record.entity_type,
    entity_id: record.entity_id,
    user_id: user.id,
    action: "DELETE",
    field_path: record.property,
    old_value: { source_id: record.source_id },
  }).catch(console.error);

  return json({ deleted: true });
}
