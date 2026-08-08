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
import { type BulkDeleteResult, type BulkSkipped, bulkDeleteSchema } from "@/lib/schemas/bulk";

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

  // Scoped to the caller's project, so a request can never span projects.
  const events = await prisma.event.findMany({
    where: { id: { in: ids }, project_id, deleted_at: null },
    select: { id: true },
  });

  if (events.length === 0) {
    return json<BulkDeleteResult>({ deleted: 0, skipped: [] });
  }

  const eventIds = events.map((e) => e.id);

  // One groupBy instead of a count per event — this was up to 500 sequential
  // queries followed by 500 sequential updates (audit A-M6).
  const subEventCounts = await prisma.event.groupBy({
    by: ["parent_id"],
    where: { parent_id: { in: eventIds }, deleted_at: null },
    _count: { _all: true },
  });
  const hasSubEvents = new Set(
    subEventCounts.map((row) => row.parent_id).filter((id): id is string => id !== null),
  );

  const skipped: BulkSkipped[] = eventIds
    .filter((id) => hasSubEvents.has(id))
    .map((id) => ({ id, reason: "HAS_SUB_EVENTS" }));
  const deletableIds = eventIds.filter((id) => !hasSubEvents.has(id));

  // Single transactional updateMany: a crash can no longer commit a partial
  // delete with no report of what was actually removed.
  const result =
    deletableIds.length > 0
      ? await prisma.event.updateMany({
          where: { id: { in: deletableIds }, project_id, deleted_at: null },
          data: { deleted_at: new Date() },
        })
      : { count: 0 };

  await cache.invalidateByPrefix(`event-list:${project_id}:`);

  return json<BulkDeleteResult>({ deleted: result.count, skipped });
}
