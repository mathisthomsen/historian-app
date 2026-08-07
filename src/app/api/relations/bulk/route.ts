import { type NextRequest } from "next/server";
import { z } from "zod";

import { forbidden, json, jsonError, parseJsonBody, unauthorized } from "@/lib/api";
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
  if (!user) return unauthorized();

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.data;

  const parsed = bulkRelationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Validation failed", { details: parsed.error.flatten() });
  }

  const { ids, projectId } = parsed.data;

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id: projectId, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return forbidden();
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

  return json({ deleted: result.count });
}
