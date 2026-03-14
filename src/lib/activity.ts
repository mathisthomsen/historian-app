import { type ActivityAction, type EntityType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

interface LogActivityInput {
  project_id: string;
  entity_type: EntityType;
  entity_id: string;
  user_id?: string;
  agent_name?: string;
  action: ActivityAction;
  field_path?: string;
  old_value?: unknown;
  new_value?: unknown;
  reason?: string;
  source_id?: string;
}

function toJsonValue(v: unknown): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue {
  if (v === null || v === undefined) return Prisma.JsonNull;
  return v as Prisma.InputJsonValue;
}

/**
 * Records an append-only EntityActivity row.
 * Fail-open: never throws. Call sites use: await logActivity(...).catch(console.error)
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  await prisma.entityActivity.create({
    data: {
      project_id: input.project_id,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      user_id: input.user_id ?? null,
      agent_name: input.agent_name ?? null,
      action: input.action,
      field_path: input.field_path ?? null,
      old_value: input.old_value !== undefined ? toJsonValue(input.old_value) : Prisma.JsonNull,
      new_value: input.new_value !== undefined ? toJsonValue(input.new_value) : Prisma.JsonNull,
      reason: input.reason ?? null,
      source_id: input.source_id ?? null,
    },
  });
}
