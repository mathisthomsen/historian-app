-- Migration: epic_2_4_entity_activity
-- Create ActivityAction enum and entity_activity append-only audit log table.
-- No DELETE endpoint will ever be created for entity_activity (AX roadmap §7).

CREATE TYPE "ActivityAction" AS ENUM (
  'CREATE',
  'UPDATE',
  'DELETE',
  'MERGE',
  'SUGGEST',
  'ACCEPT',
  'REJECT'
);

CREATE TABLE "entity_activity" (
  "id"          TEXT             NOT NULL,
  "project_id"  TEXT             NOT NULL,
  "entity_type" "EntityType"     NOT NULL,
  "entity_id"   TEXT             NOT NULL,
  "user_id"     TEXT,
  "agent_name"  TEXT,
  "action"      "ActivityAction" NOT NULL,
  "field_path"  TEXT,
  "old_value"   JSONB,
  "new_value"   JSONB,
  "reason"      TEXT,
  "source_id"   TEXT,
  "created_at"  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "entity_activity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "entity_activity_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "entity_activity_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "entity_activity_project_id_idx"     ON "entity_activity"("project_id");
CREATE INDEX "entity_activity_entity_type_id_idx" ON "entity_activity"("entity_type", "entity_id");
CREATE INDEX "entity_activity_created_at_idx"     ON "entity_activity"("created_at");
