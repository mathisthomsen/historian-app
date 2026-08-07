import { type NextRequest } from "next/server";
import { z } from "zod";

import { forbidden, json, jsonError, parseJsonBody, unauthorized } from "@/lib/api";
import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { prisma } from "@/lib/db";

const bulkSourceSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  project_id: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.data;

  const parsed = bulkSourceSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Validation failed", { details: parsed.error.flatten() });
  }

  const { ids, project_id } = parsed.data;

  const membership = await prisma.userProject.findFirst({
    where: { user_id: user.id, project_id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!membership) {
    return forbidden();
  }

  const result = await prisma.source.updateMany({
    where: {
      id: { in: ids },
      project_id,
      deleted_at: null,
    },
    data: { deleted_at: new Date() },
  });

  await cache.invalidateByPrefix(`source-list:${project_id}:`);

  return json({ deleted: result.count });
}
