import { type NextRequest } from "next/server";
import { z } from "zod";

import { json, jsonError, parseJsonBody, unauthorized } from "@/lib/api";
import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { prisma } from "@/lib/db";

const bulkPersonSchema = z.object({
  ids: z.array(z.string()).min(1).max(500),
  action: z.literal("delete"),
});

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.data;

  const parsed = bulkPersonSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_FAILED", { details: parsed.error.flatten() });
  }

  const { ids } = parsed.data;

  // Verify all persons belong to a project the user has OWNER/EDITOR access to
  const persons = await prisma.person.findMany({
    where: { id: { in: ids }, deleted_at: null },
    select: { id: true, project_id: true },
  });

  if (persons.length === 0) {
    return json({ deleted: 0 });
  }

  // All must belong to the same project
  const projectIds = [...new Set(persons.map((p) => p.project_id))];

  for (const projectId of projectIds) {
    const membership = await prisma.userProject.findFirst({
      where: { user_id: user.id, project_id: projectId, role: { in: ["OWNER", "EDITOR"] } },
    });
    if (!membership) {
      return jsonError(403, "FORBIDDEN");
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

  return json({ deleted: result.count });
}
