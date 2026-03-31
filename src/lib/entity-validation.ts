import { type EntityType } from "@prisma/client";

import { prisma } from "@/lib/db";

/**
 * Returns true if entity exists and is not soft-deleted.
 * PERSON, EVENT, SOURCE, and RELATION have deleted_at; LOCATION and LITERATURE do not.
 * Uses prisma (base client) — explicitly passes deleted_at: null for soft-deletable types.
 */
export async function validateEntityExists(
  type: EntityType,
  id: string,
  projectId: string,
): Promise<boolean> {
  switch (type) {
    case "PERSON": {
      const record = await prisma.person.findFirst({
        where: { id, project_id: projectId, deleted_at: null },
        select: { id: true },
      });
      return record !== null;
    }
    case "EVENT": {
      const record = await prisma.event.findFirst({
        where: { id, project_id: projectId, deleted_at: null },
        select: { id: true },
      });
      return record !== null;
    }
    case "SOURCE": {
      const record = await prisma.source.findFirst({
        where: { id, project_id: projectId, deleted_at: null },
        select: { id: true },
      });
      return record !== null;
    }
    case "LOCATION": {
      const record = await prisma.location.findFirst({
        where: { id, project_id: projectId },
        select: { id: true },
      });
      return record !== null;
    }
    case "LITERATURE": {
      const record = await prisma.literature.findFirst({
        where: { id, project_id: projectId },
        select: { id: true },
      });
      return record !== null;
    }
    default: {
      return false;
    }
  }
}
