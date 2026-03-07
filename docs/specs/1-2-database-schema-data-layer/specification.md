# Epic 1.2 — Database Schema & Data Layer

## Specification

**Phase:** 1 — Foundation & Auth
**Deliverable:** A clean, migration-tracked Prisma schema implementing the universal graph model, with seed data and a health check endpoint.
**Verifiable:** `prisma studio` shows all 11 tables with seed data; `GET /api/health` returns DB connection status and latest migration version.

---

## 1. Technology Stack

| Package          | Version | Purpose                       |
| ---------------- | ------- | ----------------------------- |
| `prisma`         | `^6.x`  | ORM + migration engine        |
| `@prisma/client` | `^6.x`  | Generated type-safe DB client |
| `tsx`            | `^4.x`  | Run seed script (TypeScript)  |

Neon PostgreSQL: serverless PostgreSQL. Existing project dependency — no new account needed.

---

## 2. Data Model / Schema

### 2.1 Enums

```prisma
enum UserRole {
  USER
  ADMIN
}

enum ProjectRole {
  OWNER
  EDITOR
  VIEWER
}

enum EntityType {
  PERSON
  EVENT
  SOURCE
  LOCATION
  LITERATURE
}

enum Certainty {
  CERTAIN
  PROBABLE
  POSSIBLE
  UNKNOWN
}

enum SourceReliability {
  HIGH
  MEDIUM
  LOW
  UNKNOWN
}
```

`OBJECT` and `IMAGE` are intentionally excluded from `EntityType`. They will be added via `ALTER TYPE ADD VALUE` (a metadata-only, non-destructive migration) when their backing tables are built. Including them without backing tables would create unenforceable enum values.

---

### 2.2 Full Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

enum UserRole {
  USER
  ADMIN
}

enum ProjectRole {
  OWNER
  EDITOR
  VIEWER
}

enum EntityType {
  PERSON
  EVENT
  SOURCE
  LOCATION
  LITERATURE
}

enum Certainty {
  CERTAIN
  PROBABLE
  POSSIBLE
  UNKNOWN
}

enum SourceReliability {
  HIGH
  MEDIUM
  LOW
  UNKNOWN
}

// ---------------------------------------------------------------------------
// Users & Projects
// ---------------------------------------------------------------------------

/// Minimal user record. Auth-specific fields (password_hash, email_verified,
/// etc.) are added by Epic 1.3 via a separate migration.
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  name       String?
  role       UserRole @default(USER)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  user_projects UserProject[]
  persons       Person[]      @relation("PersonCreatedBy")
  events        Event[]       @relation("EventCreatedBy")
  sources       Source[]      @relation("SourceCreatedBy")
  relations     Relation[]    @relation("RelationCreatedBy")

  @@map("users")
}

model Project {
  id          String    @id @default(cuid())
  name        String
  description String?
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime? // soft-delete; Epic 3.1 adds recovery UI

  user_projects  UserProject[]
  persons        Person[]
  events         Event[]
  sources        Source[]
  locations      Location[]
  literature     Literature[]
  relations      Relation[]
  relation_types RelationType[]

  @@map("projects")
}

model UserProject {
  id         String      @id @default(cuid())
  user_id    String
  project_id String
  role       ProjectRole @default(VIEWER)
  created_at DateTime    @default(now())

  user    User    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)

  @@unique([user_id, project_id])
  @@map("user_projects")
}

// ---------------------------------------------------------------------------
// Research Entities
// ---------------------------------------------------------------------------

model Person {
  id            String    @id @default(cuid())
  project_id    String
  created_by_id String?

  first_name String?
  last_name  String?

  // Partial date support: store year/month/day separately.
  // All three nullable; year-only is valid (month/day null).
  birth_year            Int?
  birth_month           Int?
  birth_day             Int?
  birth_date_certainty  Certainty @default(UNKNOWN)
  birth_place           String?

  death_year            Int?
  death_month           Int?
  death_day             Int?
  death_date_certainty  Certainty @default(UNKNOWN)
  death_place           String?

  notes      String?
  deleted_at DateTime?
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt

  project    Project      @relation(fields: [project_id], references: [id], onDelete: Cascade)
  created_by User?        @relation("PersonCreatedBy", fields: [created_by_id], references: [id], onDelete: SetNull)
  names      PersonName[]

  @@index([project_id])
  @@map("persons")
}

/// Stores all name variants for a person, including the primary display name.
/// language: ISO 639-1 code ("de", "en", "la", etc.) — nullable when unknown.
model PersonName {
  id         String   @id @default(cuid())
  person_id  String
  name       String
  language   String?
  is_primary Boolean  @default(false)
  created_at DateTime @default(now())

  person Person @relation(fields: [person_id], references: [id], onDelete: Cascade)

  @@index([person_id])
  @@map("person_names")
}

model Event {
  id            String    @id @default(cuid())
  project_id    String
  created_by_id String?
  parent_id     String?   // self-referential for sub-events

  title       String
  description String?
  event_type  String?   // user-defined string; Epic 2.2 adds EventType table

  start_year            Int?
  start_month           Int?
  start_day             Int?
  start_date_certainty  Certainty @default(UNKNOWN)

  end_year              Int?
  end_month             Int?
  end_day               Int?
  end_date_certainty    Certainty @default(UNKNOWN)

  // Free-text location; Epic 3.2 adds location_id FK for geocoded locations.
  location String?

  notes      String?
  deleted_at DateTime?
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt

  project    Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  created_by User?   @relation("EventCreatedBy", fields: [created_by_id], references: [id], onDelete: SetNull)
  parent     Event?  @relation("SubEvents", fields: [parent_id], references: [id])
  sub_events Event[] @relation("SubEvents")

  @@index([project_id])
  @@map("events")
}

model Source {
  id            String            @id @default(cuid())
  project_id    String
  created_by_id String?

  title       String
  // user-extendable string: archival_document | letter | newspaper |
  // official_record | photograph | other
  type        String
  author      String?
  date        String?         // free-text source date ("c. March 1848")
  repository  String?
  call_number String?
  url         String?
  reliability SourceReliability @default(UNKNOWN)
  notes       String?

  deleted_at DateTime?
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt

  project           Project            @relation(fields: [project_id], references: [id], onDelete: Cascade)
  created_by        User?              @relation("SourceCreatedBy", fields: [created_by_id], references: [id], onDelete: SetNull)
  relation_evidence RelationEvidence[]

  @@index([project_id])
  @@map("sources")
}

/// Reference-data entity. No soft-delete (not a research record).
model Location {
  id         String  @id @default(cuid())
  project_id String

  name    String
  country String?
  region  String?
  city    String?
  lat     Float?
  lng     Float?
  // geocoded_at and geocoding metadata added in Epic 3.2

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)

  @@index([project_id])
  @@map("locations")
}

/// Secondary scholarly references. Full bibliographic fields added in Epic 3.3.
/// Stub table created now to satisfy the EntityType enum membership.
model Literature {
  id         String  @id @default(cuid())
  project_id String

  title  String
  author String?
  year   Int?
  // type, publisher, doi, isbn etc. added in Epic 3.3
  notes  String?

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)

  @@index([project_id])
  @@map("literature")
}

// ---------------------------------------------------------------------------
// Universal Relation Model
// ---------------------------------------------------------------------------

/// User-defined relation type taxonomy, scoped per project.
model RelationType {
  id         String @id @default(cuid())
  project_id String

  name         String
  inverse_name String?
  description  String?
  color        String?      // hex color, e.g. "#4f46e5"
  icon         String?      // icon identifier (Lucide icon name)

  // Which entity types are valid on each side of this relation.
  // Stored as native PostgreSQL enum arrays.
  valid_from_types EntityType[]
  valid_to_types   EntityType[]

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  project   Project    @relation(fields: [project_id], references: [id], onDelete: Cascade)
  relations Relation[]

  @@index([project_id])
  @@map("relation_types")
}

/// A directed, typed, evidenced relation between any two entities.
///
/// IMPORTANT: from_id and to_id are NOT foreign keys at the DB level.
/// Because they can reference different tables (Person, Event, Source, …),
/// a conventional FK constraint cannot be declared. Referential integrity
/// for these fields must be enforced at the application layer.
model Relation {
  id            String     @id @default(cuid())
  project_id    String
  created_by_id String?

  from_type        EntityType
  from_id          String
  to_type          EntityType
  to_id            String
  relation_type_id String

  notes     String?
  certainty Certainty @default(UNKNOWN)

  deleted_at DateTime?
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt

  project       Project            @relation(fields: [project_id], references: [id], onDelete: Cascade)
  created_by    User?              @relation("RelationCreatedBy", fields: [created_by_id], references: [id], onDelete: SetNull)
  relation_type RelationType       @relation(fields: [relation_type_id], references: [id], onDelete: Restrict)
  evidence      RelationEvidence[]

  // Composite indexes required for efficient graph traversal queries.
  @@index([project_id])
  @@index([from_type, from_id])
  @@index([to_type, to_id])
  @@map("relations")
}

/// Attaches a primary Source as evidence for a Relation.
/// Notes explain what specifically in the source supports this relation.
model RelationEvidence {
  id          String   @id @default(cuid())
  relation_id String
  source_id   String
  notes       String?
  created_at  DateTime @default(now())

  relation Relation @relation(fields: [relation_id], references: [id], onDelete: Cascade)
  source   Source   @relation(fields: [source_id], references: [id], onDelete: Cascade)

  @@unique([relation_id, source_id])
  @@map("relation_evidence")
}
```

---

### 2.3 Table Summary

| Table               | Soft Delete  | created_by_id | Notes                                |
| ------------------- | ------------ | ------------- | ------------------------------------ |
| `users`             | —            | —             | Auth fields added Epic 1.3           |
| `projects`          | `deleted_at` | —             | Recovery UI in Epic 3.1              |
| `user_projects`     | —            | —             | Junction table                       |
| `persons`           | `deleted_at` | `user_id?`    | Core research entity                 |
| `person_names`      | —            | —             | Child of Person                      |
| `events`            | `deleted_at` | `user_id?`    | Self-referential for sub-events      |
| `sources`           | `deleted_at` | `user_id?`    | Primary evidence                     |
| `locations`         | —            | —             | Reference data                       |
| `literature`        | —            | —             | Stub; expanded Epic 3.3              |
| `relation_types`    | —            | —             | Per-project taxonomy                 |
| `relations`         | `deleted_at` | `user_id?`    | Polymorphic — no FK on from_id/to_id |
| `relation_evidence` | —            | —             | Links Source to Relation             |

---

## 3. API Contract

### `GET /api/health`

No authentication required. Returns JSON only (`Content-Type: application/json`).

**Success response — 200:**

```typescript
interface HealthResponse {
  status: "ok" | "degraded" | "error";
  db: {
    status: "ok" | "error";
    latency_ms: number;
    migration_version: string | null; // name of last applied migration
  };
  app: {
    version: string; // from package.json
    environment: string; // process.env.NODE_ENV
  };
  timestamp: string; // ISO 8601
}
```

**Error response — 503** (DB unreachable):

```typescript
{
  status: "error",
  db: { status: "error", latency_ms: -1, migration_version: null },
  app: { version: string, environment: string },
  timestamp: string
}
```

Rules:

- `Cache-Control: no-store` header always set (per roadmap)
- Never exposes connection strings, credentials, or internal error messages
- DB latency measured as time for a `SELECT 1` ping

---

## 4. Component Architecture

No UI components are added in this epic. The only new application code is:

- `src/lib/db.ts` — server-only module (Prisma singleton + helpers)
- `src/app/api/health/route.ts` — route handler

---

## 5. UI/UX Specification

No UI. The health endpoint is JSON only.

---

## 6. State & Data Flow

```
Request → GET /api/health
           ↓
       route.ts
           ↓
       db.ts: ping()          → SELECT 1       → measure latency_ms
       db.ts: getLatestMigration() → SELECT from _prisma_migrations
           ↓
       Build HealthResponse
           ↓
       NextResponse.json(response, {
         status: db.status === "ok" ? 200 : 503,
         headers: { "Cache-Control": "no-store" }
       })
```

---

## 7. i18n

No translation keys required for this epic. The health endpoint returns API JSON (not rendered UI). All error messages from this epic are developer-facing (startup Zod errors, migration CLI output).

---

## 8. Testing Plan

### Unit Tests (Vitest)

**`src/app/api/health/route.test.ts`**

| Test                                         | Description                                |
| -------------------------------------------- | ------------------------------------------ |
| returns 200 with `status: ok`                | Mock Prisma returns ping + migration name  |
| returns 503 with `status: error`             | Mock Prisma throws on ping                 |
| response includes `latency_ms` as number     | Assert type                                |
| response includes `migration_version` string | Assert non-null on success                 |
| response never exposes DATABASE_URL          | Assert body does not contain env var value |
| Cache-Control header is `no-store`           | Assert response header                     |

**`prisma/seed.ts` (idempotency)**

Run seed twice via `prisma db seed`; assert record counts are identical after both runs. Implemented as a separate test script or CI step, not a Vitest test.

### TypeScript Compilation

`pnpm typecheck` (i.e. `tsc --noEmit`) passing with Prisma-generated types included is treated as a contract test for the schema. No additional schema validation tests needed — Prisma enforces constraints at the DB level.

### Out of Scope for This Epic

- Integration tests against a live test DB (set up in Epic 1.4 CI/CD)
- API route authentication tests (Epic 1.3)

---

## 9. File Structure

```
prisma/
  schema.prisma          ← full schema (new)
  seed.ts                ← idempotent seed script (new)
  migrations/
    {timestamp}_init/
      migration.sql      ← auto-generated by prisma migrate dev

src/
  app/
    api/
      health/
        route.ts         ← GET /api/health (new)
        route.test.ts    ← unit tests (new)
  lib/
    db.ts                ← Prisma singleton + ping() + getLatestMigration() (new)
    env.ts               ← add DATABASE_URL, DATABASE_URL_UNPOOLED (modified)

.env.example             ← add new vars (modified)
package.json             ← add prisma.seed script (modified)
```

---

## 10. Implementation Notes

### Prisma Client Singleton (`src/lib/db.ts`)

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Measures DB round-trip. Returns latency_ms or throws on failure. */
export async function ping(): Promise<number> {
  const start = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  return Date.now() - start;
}

/** Returns the name of the last successfully applied Prisma migration. */
export async function getLatestMigration(): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ migration_name: string }[]>`
    SELECT migration_name
    FROM _prisma_migrations
    WHERE finished_at IS NOT NULL
    ORDER BY finished_at DESC
    LIMIT 1
  `;
  return rows[0]?.migration_name ?? null;
}
```

### Environment Variables (`src/lib/env.ts` additions)

```typescript
DATABASE_URL:          z.string().url(),
DATABASE_URL_UNPOOLED: z.string().url(),
```

Both are required. Missing either causes Zod validation to throw at startup.

### `.env.example` additions

```
DATABASE_URL="postgresql://..."           # Neon pooled connection (PgBouncer)
DATABASE_URL_UNPOOLED="postgresql://..."  # Neon direct connection (for migrations)
```

### Seed Script (`prisma/seed.ts`)

```typescript
// package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Seed uses `upsert` throughout keyed on deterministic unique fields (email for User, name for Project, etc.). Safe to run multiple times. Contents:

| Record           | Count | Detail                                                                        |
| ---------------- | ----- | ----------------------------------------------------------------------------- |
| User             | 1     | `admin@evidoxa.dev`, role: ADMIN                                              |
| Project          | 1     | "Evidoxa Demo"                                                                |
| UserProject      | 1     | admin owns the demo project                                                   |
| RelationType     | 4     | "ist verwandt mit" / "participated in" / "was born in" / "was colleague of"   |
| Person           | 4     | Historical figures with birth/death year-only dates, name variants in DE + LA |
| PersonName       | 8     | 2 names per person (primary + variant)                                        |
| Event            | 4     | Key events with start_year and event_type                                     |
| Source           | 3     | Archival sources with varying reliability                                     |
| Relation         | 5     | Links between the above persons and events                                    |
| RelationEvidence | 3     | Source evidence attached to 3 relations                                       |

### Polymorphic Relation Integrity

`Relation.from_id` and `Relation.to_id` are plain `String` columns with **no DB-level foreign key**. There is no way to declare a FK that conditionally references `persons`, `events`, or `sources` depending on `from_type`.

**Consequence:** The application layer is responsible for:

1. Verifying the referenced entity exists before inserting a Relation (Epic 2.4)
2. Cascade-deleting or soft-deleting Relations when their referenced entity is deleted (Epic 2.4)
3. Filtering soft-deleted entities out of Relation lookups

This is documented at the model level in the schema comment.

### Soft Delete Filtering

Soft-deleted records (`deleted_at IS NOT NULL`) are not auto-filtered by Prisma. In Epic 1.2, no query layer exists yet. When API routes are built (Phase 2), every `findMany` on Person/Event/Source/Relation **must** include `where: { deleted_at: null }`. A Prisma middleware extension to auto-filter can be added in Epic 2.1 to avoid repetition.

### Migration Ordering

1. `pnpm prisma migrate dev --name init` — generates `migrations/{timestamp}_init/migration.sql`
2. `pnpm prisma generate` — regenerates Prisma Client types
3. `pnpm prisma db seed` — populates demo data

In CI (Epic 1.4): `prisma migrate deploy` (not `dev`) is used, per the roadmap strategic decision.

---

## 11. Acceptance Criteria

1. `pnpm prisma migrate dev` completes without errors and creates the initial migration file.
2. `pnpm prisma studio` opens and shows all 12 tables: `users`, `projects`, `user_projects`, `persons`, `person_names`, `events`, `sources`, `locations`, `literature`, `relation_types`, `relations`, `relation_evidence`.
3. `pnpm prisma db seed` completes without errors.
4. Running `pnpm prisma db seed` a second time produces no duplicate records (counts are identical).
5. `GET /api/health` returns HTTP 200 with `{ status: "ok", db: { status: "ok" } }` when the database is reachable.
6. `GET /api/health` response body includes `db.latency_ms` (number ≥ 0) and `db.migration_version` (non-null string matching the migration file name).
7. `GET /api/health` response body includes `app.version` matching the `version` field in `package.json`.
8. `GET /api/health` response includes `Cache-Control: no-store` header.
9. When `DATABASE_URL` is removed from `.env`, the app fails to start with a Zod validation error (not a Prisma connection error).
10. `pnpm typecheck` passes with zero TypeScript errors (Prisma-generated types included).
11. `pnpm test` passes all unit tests for the health route handler.
12. `prisma studio` shows seed data: at least 4 Persons (each with 2 PersonName entries), 4 Events, 5 Relations, and 3 RelationEvidence records in the demo project.

---

## 12. Out of Scope

- Project management UI (Epic 3.1)
- Auth-specific User fields: `password_hash`, `email_verified`, `image` (Epic 1.3)
- `EmailConfirmation`, `PasswordReset`, `AuthAuditLog` tables (Epic 1.3)
- Rate limiting and Redis caching (Epic 1.4)
- API routes for Person, Event, Source, Relation CRUD (Phase 2)
- Location geocoding and `geocoded_at` field (Epic 3.2)
- Full Literature bibliographic fields (Epic 3.3)
- Full-text search indexes on `tsvector` (Epic 4.1)
- Activity log table (Epic 4.4)
- `OBJECT` and `IMAGE` entity types (future epic, TBD)
- Duplicate detection logic (Epic 5.2)
- Prisma middleware for auto-filtering soft-deleted records (deferred to Epic 2.1)
