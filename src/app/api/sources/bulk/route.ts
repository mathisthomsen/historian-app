import { type NextRequest } from "next/server";

import {
  WRITE_ROLES,
  forbidden,
  json,
  parseJsonBody,
  requireProjectMembership,
  unauthorized,
  validateBody,
} from "@/lib/api";
import { requireUser } from "@/lib/auth-guard";
import { cache } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { type BulkDeleteResult, bulkDeleteSchema } from "@/lib/schemas/bulk";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = validateBody(bulkDeleteSchema, parsedBody.data);
  if (!parsed.ok) return parsed.response;

  const { ids, project_id } = parsed.data;

  if (!(await requireProjectMembership(user.id, project_id, WRITE_ROLES))) {
    return forbidden();
  }

  const result = await prisma.source.updateMany({
    where: { id: { in: ids }, project_id, deleted_at: null },
    data: { deleted_at: new Date() },
  });

  await cache.invalidateByPrefix(`source-list:${project_id}:`);

  return json<BulkDeleteResult>({ deleted: result.count, skipped: [] });
}
