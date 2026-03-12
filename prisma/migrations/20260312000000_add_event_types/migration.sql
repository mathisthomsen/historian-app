-- CreateTable
CREATE TABLE "event_types" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_types_project_id_idx" ON "event_types"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_types_project_id_name_key" ON "event_types"("project_id", "name");

-- AlterTable: add event_type_id column
ALTER TABLE "events" ADD COLUMN "event_type_id" TEXT;

-- AddForeignKey for event_types → projects
ALTER TABLE "event_types" ADD CONSTRAINT "event_types_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for events → event_types
ALTER TABLE "events" ADD CONSTRAINT "events_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: drop old event_type string column
ALTER TABLE "events" DROP COLUMN IF EXISTS "event_type";
