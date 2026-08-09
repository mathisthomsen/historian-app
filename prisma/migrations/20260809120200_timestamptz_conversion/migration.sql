-- Converts every application timestamp column from `timestamp without time zone`
-- to `timestamptz` (audit follow-up to D-M4).
--
-- WHY THIS MATTERS
-- Prisma writes UTC instants, but the columns carried no zone, so Postgres
-- returned bare wall-clock values and node-postgres relabelled them against the
-- *reader's* local clock. Any consumer outside Prisma — the raw-pg E2E helpers,
-- psql sessions, ad-hoc operational queries — saw times shifted by the reader's
-- UTC offset. This already produced two wrong operational conclusions during the
-- 2026-08-09 database-separation work, where row ages had to be computed in SQL
-- (`now() - created_at`) to avoid the driver's relabelling. Storing the zone
-- removes the trap at the source rather than working around it per query.
--
-- THE `USING` CLAUSE IS LOAD-BEARING
-- `prisma migrate diff` generates these ALTERs *without* a USING clause. That
-- form converts using whatever `TimeZone` the migrating session happens to have,
-- so the same migration would produce different data on a non-UTC connection and
-- silently shift every historical timestamp. The explicit
-- `USING "col" AT TIME ZONE 'UTC'` pins the interpretation to UTC — which is what
-- Prisma actually wrote — making the conversion deterministic and lossless.
--
-- `_prisma_migrations` is deliberately untouched: Prisma owns that table and its
-- columns are already timestamptz.
--
-- Each ALTER TABLE rewrites the table under an ACCESS EXCLUSIVE lock. These
-- tables are small (production holds well under a thousand rows in total), so the
-- rewrite is near-instant; revisit if the data set grows by orders of magnitude.

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC',
ALTER COLUMN "email_verified_at" SET DATA TYPE TIMESTAMPTZ(3) USING "email_verified_at" AT TIME ZONE 'UTC',
ALTER COLUMN "last_login_at" SET DATA TYPE TIMESTAMPTZ(3) USING "last_login_at" AT TIME ZONE 'UTC',
ALTER COLUMN "locked_until" SET DATA TYPE TIMESTAMPTZ(3) USING "locked_until" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "email_confirmations" ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMPTZ(3) USING "expires_at" AT TIME ZONE 'UTC',
ALTER COLUMN "used_at" SET DATA TYPE TIMESTAMPTZ(3) USING "used_at" AT TIME ZONE 'UTC',
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "password_resets" ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMPTZ(3) USING "expires_at" AT TIME ZONE 'UTC',
ALTER COLUMN "used_at" SET DATA TYPE TIMESTAMPTZ(3) USING "used_at" AT TIME ZONE 'UTC',
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "auth_audit_logs" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC',
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMPTZ(3) USING "deleted_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "user_projects" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "persons" ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMPTZ(3) USING "deleted_at" AT TIME ZONE 'UTC',
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "person_names" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "event_types" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "events" ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMPTZ(3) USING "deleted_at" AT TIME ZONE 'UTC',
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "sources" ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMPTZ(3) USING "deleted_at" AT TIME ZONE 'UTC',
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "locations" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "literature" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "relation_types" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "relations" ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMPTZ(3) USING "deleted_at" AT TIME ZONE 'UTC',
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "relation_evidence" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "property_evidence" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';
-- AlterTable
ALTER TABLE "entity_activity" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';
