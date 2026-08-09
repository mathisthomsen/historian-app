-- Reconciles audit finding D-M4: live-DB drift on `entity_activity`.
--
-- The Epic 2.4 migration (20260314180300_epic_2_4_entity_activity) was written by
-- hand rather than generated, and diverged from what schema.prisma implies in
-- three ways:
--   1. `created_at` was declared `TIMESTAMP` (precision 6); Prisma emits TIMESTAMP(3).
--   2. Both foreign keys omitted `ON UPDATE CASCADE`, which Prisma always emits.
--   3. The composite index was named `entity_activity_entity_type_id_idx` instead
--      of Prisma's derived name `entity_activity_entity_type_entity_id_idx`.
--
-- Left alone, the next `prisma migrate dev` would emit this exact corrective SQL
-- as a surprise migration in the middle of unrelated feature work. The statements
-- below are Prisma's own output from
--   `prisma migrate diff --from-schema-datasource --to-schema-datamodel --script`
-- applied deliberately instead.
--
-- Data-safe: precision 6 -> 3 truncates sub-millisecond digits only, and Prisma
-- has always written millisecond precision to this column.

-- DropForeignKey
ALTER TABLE "entity_activity" DROP CONSTRAINT "entity_activity_project_id_fkey";

-- DropForeignKey
ALTER TABLE "entity_activity" DROP CONSTRAINT "entity_activity_user_id_fkey";

-- AlterTable
ALTER TABLE "entity_activity" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "entity_activity" ADD CONSTRAINT "entity_activity_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_activity" ADD CONSTRAINT "entity_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "entity_activity_entity_type_id_idx" RENAME TO "entity_activity_entity_type_entity_id_idx";
