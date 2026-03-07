# Epic 1.2 — Database Schema & Data Layer

## Brainstorming

**Goal:** Define every implementation detail so the specification leaves no ambiguity.

---

## Round 1 — Person Names & Date Representation

### Q1 — Person name variants: JSON array vs. separate PersonName table

The roadmap flags this as explicitly open. The choice affects query complexity, full-text search, and schema normalization.

```
Option A: JSON array on Person
  Person { name_variants: String[] }
  → Simple, one record, no JOIN for display
  → Full-text search via PostgreSQL jsonb or GIN index
  → No separate table to maintain

Option B: Separate PersonName table
  PersonName { id, person_id, name, language, is_primary }
  → Fully relational, each variant queryable independently
  → Can attach metadata (language, date range of usage, is_preferred)
  → JOIN required for display; migration simpler for future changes
```

- [ ] Option A — JSON array on Person — simpler, fewer tables, adequate for MVP
- [x] Option B — **recommended** — separate `PersonName` table — Phase 4 full-text search across name variants benefits from relational storage; language-tagged variants (e.g., "Karl" in DE, "Charles" in EN) are a real use case for historical research; GIN on JSON is a workaround, not a design
- [ ] Option C — Hybrid: store primary name on Person, variants as JSON — worst of both worlds

---

### Q2 — Date storage format for uncertain historical dates

Persons have `birth_date`/`death_date`; Events have `start_date`/`end_date`. These are historical dates that are often approximate ("c. 1850", "before 1900", "1790?"). PostgreSQL `DATE` type cannot represent this natively.

```
Option A: ISO string column (VARCHAR)
  birth_date: String?   // "1850", "c. 1850", "1790-03-15"
  → Free-form, accepts any value
  → No date arithmetic, no range queries without parsing

Option B: Structured multi-column approach
  birth_year:  Int?
  birth_month: Int?
  birth_day:   Int?
  birth_date_certainty: Certainty  // CERTAIN/PROBABLE/POSSIBLE/UNKNOWN
  → Full precision possible, partial dates supported (year only, year+month, full)
  → Range queries work natively on year/month/day
  → More verbose schema

Option C: ISO DATE + a nullable "display override" string
  birth_date:         DateTime?   // null if fully unknown
  birth_date_display: String?     // "c. 1850" if approximate
  birth_date_certainty: Certainty
  → Enables date arithmetic on known dates
  → Display override used when date is approximate
  → Risk of display/data divergence
```

- [ ] Option A — too lossy for querying
- [x] Option B — **recommended** — separate year/month/day Int columns — cleanest for historical data; partial dates (year-only) are extremely common; enables Phase 4 date-range filtering; aligns with how historians actually record dates; slightly more columns but semantically unambiguous
- [ ] Option C — display override creates sync risk and two sources of truth

---

### Q3 — Project scoping: which tables carry project_id?

All user data must be scoped to a project (Phase 3 multi-project). The question is whether to enforce this at the schema level from day one or add it in Epic 3.1.

```
Tables:          Person  Event  Source  Location  Literature  Relation  RelationType
Option A: All carry project_id now → true isolation, correct FK constraints
Option B: Add project_id in Epic 3.1  → simpler now, risky migration later
Option C: Single default project seeded; project_id present but not enforced at API level yet
```

- [ ] Option B — deferring to Epic 3.1 creates a painful migration with data reshuffling
- [ ] Option C — half-measure that still requires a later migration
- [x] Option A — **recommended** — add `project_id` to all user-data tables now — Epic 1.2 seeds a default project; Epic 3.1 adds the project management UI and enforcement. Schema correctness from the start avoids breaking migrations later.

---

## Round 2 — Entity Types, Enums & Relation Model

### Q4 — EntityType enum: where defined and what values?

The Relation table uses `from_type` and `to_type` to reference any entity. A PostgreSQL enum or application-level enum must enumerate all valid entity types.

```sql
enum EntityType {
  PERSON
  EVENT
  SOURCE
  LOCATION
  LITERATURE   // Phase 3 — include now or add later?
}
```

- [ ] Option A — Include only Phase 1/2 types (PERSON, EVENT, SOURCE, LOCATION) — simpler now, requires enum migration in Phase 3
- [x] Option B — **recommended** — Include all planned types upfront: PERSON, EVENT, SOURCE, LOCATION, LITERATURE — PostgreSQL enum additions are a schema migration; including LITERATURE now avoids a future ALTER TYPE. Unused values cost nothing.
- [ ] Option C — Use a String column instead of enum — loses DB-level constraint, allows typos

COMMENT: There are Entities that were not indcluded in the legacy app, but could at some point play a role (stretch) . should we also integrate them now to avoid migrations later, at the risk of having unused Entities for the first Versions of the App? That would be "Objects" and "Images"

---

## Round 7 — Stretch Entity Types (Objects & Images)

### Q17 — Include OBJECT and IMAGE in EntityType enum now?

The cost of adding enum values to PostgreSQL later is a schema migration (`ALTER TYPE`). The cost of including them now is dead values in the enum for potentially 2–3 phases. The question is whether the migration pain outweighs the noise.

Two considerations pull in different directions:

- **Migration cost is low** — `ALTER TYPE ... ADD VALUE` in PostgreSQL does not require a table rewrite; it's a metadata-only operation and safe to run on large tables. Prisma generates this as a single-line migration. This is fundamentally different from changing a column type or adding a NOT NULL column.
- **Schema semantics matter** — An unused `OBJECT` value in the EntityType enum has no corresponding table or API in Phase 1–3. Any Relation row with `from_type = OBJECT` would have an orphaned `from_id` since there's no Object table yet. The enum value gives a false impression of completeness.

```
EntityType enum options:
  A: PERSON, EVENT, SOURCE, LOCATION, LITERATURE                      ← Phase 1-3 only
  B: PERSON, EVENT, SOURCE, LOCATION, LITERATURE, OBJECT, IMAGE       ← all stretch included
  C: PERSON, EVENT, SOURCE, LOCATION, LITERATURE, OBJECT, IMAGE, ...  ← open-ended (bad)
```

- [x] Option A — **recommended** — add OBJECT and IMAGE only when their tables exist — the migration is a single safe SQL line when the time comes; adding them now without corresponding tables creates a schema that lies about what the system supports; enum values without backing tables cannot be enforced at the DB level anyway; keeping the enum honest is more valuable than avoiding one future migration

- [ ] Option B — pre-including them is tempting but misleading; a Relation with `from_type = OBJECT` and no Object table means the FK constraint cannot exist, so the enum value provides no actual integrity guarantee until the table is built

---

### Q5 — RelationType valid_from_types / valid_to_types: array column type

The roadmap specifies `valid_from_types` and `valid_to_types` as arrays on RelationType. PostgreSQL supports native arrays.

```
Option A: EntityType[] native PostgreSQL array
  valid_from_types EntityType[]
  → Native array, queryable with @> operator
  → Prisma supports this with @db.Array or similar

Option B: Comma-separated string column
  valid_from_types String   // "PERSON,EVENT"
  → Manual parsing everywhere
  → No DB-level constraint

Option C: Separate junction table RelationTypeEntityType
  → Fully relational, over-engineered for this use case
```

- [x] Option A — **recommended** — native PostgreSQL `EntityType[]` array — Prisma supports `@db.Enum` arrays in PostgreSQL; clean and DB-enforced; @> overlap queries work for filtering valid relation types by entity pair
- [ ] Option B — string parsing is error-prone
- [ ] Option C — unnecessary join complexity for what is essentially metadata

---

### Q6 — Soft delete strategy

Some entities (persons, events, sources) may be accidentally deleted. The roadmap specifies soft-delete for Projects (Epic 3.1) with 30-day recovery. Should other entities also soft-delete?

```
Option A: Hard delete everywhere except Project
  → Simpler queries (no deleted_at filter needed)
  → Relations with deleted entity become orphaned (cascade delete)
  → No recovery possible

Option B: Soft delete on all user-data entities (deleted_at timestamp)
  → Recovery possible for all entities
  → Every query needs WHERE deleted_at IS NULL
  → Prisma middleware can auto-filter

Option C: Soft delete only on Person, Event, Source (not Location, Literature, RelationType)
  → Pragmatic: the entities users are most likely to accidentally delete
  → Less complexity than full soft-delete everywhere
```

- [ ] Option A — too destructive, no recovery
- [ ] Option B — adds complexity to every query; overkill for MVP
- [x] Option C — **recommended** — soft delete on Person, Event, Source, Relation only — these are the research records users most likely accidentally delete; Location and RelationType are configuration/reference data and less likely to need recovery; implement `deleted_at: DateTime?` with a Prisma middleware extension

---

## Round 3 — Database Connection, Migration & Health Endpoint

### Q7 — Neon connection setup: where and how?

Neon requires two connection strings: pooled (PgBouncer, for serverless API routes) and unpooled (direct, for migrations). These must be configured in env vars and used correctly.

```
.env variables needed:
  DATABASE_URL          → pooled (used by Prisma Client at runtime)
  DATABASE_URL_UNPOOLED → direct (used by prisma migrate)

prisma/schema.prisma:
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DATABASE_URL_UNPOOLED")
  }
```

- [x] **Confirmed pattern** — `url` = pooled for Prisma Client; `directUrl` = unpooled for migrations — this is Neon's documented pattern and Prisma's recommended setup. No alternatives considered; this is the only correct approach for Neon + Prisma.

---

### Q8 — Health endpoint: `/api/health` response shape

The roadmap specifies the health endpoint returns DB status and migration version. The exact shape and what constitutes "healthy" must be defined.

```typescript
// Option A: minimal
{ status: "ok" | "error", db: "ok" | "error" }

// Option B: detailed (roadmap intent)
{
  status: "ok" | "degraded" | "error",
  db: {
    status: "ok" | "error",
    latency_ms: number,
    migration_version: string | null  // last applied migration name
  },
  app: {
    version: string,        // from package.json
    environment: string     // NODE_ENV
  },
  timestamp: string         // ISO 8601
}
```

- [ ] Option A — too minimal; doesn't meet roadmap requirement for migration version
- [x] Option B — **recommended** — detailed shape — latency_ms gives ops visibility; migration_version lets you verify deployment applied migrations; app version enables version tracking across deploys; timestamp for log correlation. No secrets exposed (no connection strings, no user data).

---

### Q9 — How to retrieve migration version from DB?

Prisma applies migrations and stores history in `_prisma_migrations` table. To return the latest applied migration in the health endpoint we need to query it.

```typescript
// Option A: Prisma raw query
const result = await prisma.$queryRaw`
  SELECT migration_name FROM _prisma_migrations
  WHERE finished_at IS NOT NULL
  ORDER BY finished_at DESC LIMIT 1
`;

// Option B: Read from filesystem (migration folder)
// → Only shows what's on disk, not what's applied to DB
// → Wrong approach

// Option C: Expose Prisma's migration table via a dedicated lib function
// → Same as A but wrapped in src/lib/db.ts
```

- [x] Option A/C — **recommended** — Prisma raw query wrapped in `src/lib/db.ts` as `getLatestMigration()` — the `_prisma_migrations` table is Prisma-managed and stable; wrapping in a lib function keeps the route handler clean
- [ ] Option B — filesystem read doesn't reflect actual DB state

---

## Round 4 — Seed Data & Testing

### Q10 — Seed data scope and structure

The roadmap requires: demo project, sample persons, events, and relations. The question is how much seed data and whether it should be idempotent.

```
Proposed seed structure:
  1 default Project ("Evidoxa Demo")
  1 admin User (seeded, for dev only)
  3-5 Person records (historical figures, real or fictional)
  3-5 Event records (with start dates using the year/month/day columns)
  3-5 RelationType records (seeded defaults: "is related to", "participated in", "was born in")
  3-5 Relation records linking the above
  2-3 Source records

Idempotency options:
  Option A: upsert by unique field (name/slug) — safe to re-run
  Option B: deleteMany + create — destructive, loses custom data
  Option C: skip if data exists check — fragile
```

- [x] Option A — **recommended** — upsert pattern throughout seed — `prisma.$transaction` with upsert by deterministic unique fields; seed is safe to run multiple times during development; `prisma db seed` called via `package.json "seed"` script

---

### Q11 — Testing approach for the data layer

Epic 1.2 is primarily schema + seed + health endpoint. What should be tested?

```
Candidates:
  A: Unit test the health endpoint route handler (mock Prisma)
  B: Integration test against a real test DB (separate DATABASE_URL for tests)
  C: Test seed script idempotency (run twice, assert no duplicates)
  D: Schema validation tests (field types, required fields, constraints)
  E: Prisma Client type generation (TypeScript compile = test)
```

- [x] Option: A + C + E — **recommended combination**
  - Unit test `/api/health` with mocked Prisma (Vitest)
  - Test seed idempotency with a real test DB or in-memory via `prisma-client-js` mock
  - TypeScript strict compilation as schema contract test
  - Skip D (Prisma enforces this) and B (integration DB adds CI complexity; defer to Epic 1.4 CI setup)

---

## Round 5 — File Structure & Prisma Client Setup

### Q12 — Prisma Client singleton pattern

In serverless/Next.js, naive `new PrismaClient()` per module causes connection pool exhaustion. The singleton pattern must be established in Epic 1.2.

```typescript
// src/lib/db.ts — recommended singleton
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [x] **Confirmed pattern** — global singleton via `globalThis` — this is the canonical Next.js + Prisma pattern; prevents hot-reload from creating multiple client instances in development. No alternatives; this is the only correct approach.

---

### Q13 — File structure for new files in this epic

Where do schema, seed, lib, and API files live?

```
prisma/
  schema.prisma
  seed.ts
  migrations/
    {timestamp}_init/
      migration.sql

src/
  app/
    api/
      health/
        route.ts
  lib/
    db.ts          ← Prisma singleton + helper functions
```

- [x] **Confirmed** — standard Prisma conventions; no alternatives needed.

---

### Q14 — env.ts additions for new environment variables

Epic 1.2 introduces `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. These must be added to the Zod env validation established in Epic 1.1.

```typescript
// additions to src/lib/env.ts
DATABASE_URL:          z.string().url(),
DATABASE_URL_UNPOOLED: z.string().url(),
```

- [x] **Confirmed** — both vars required (not optional) — if either is missing the app fails at startup with a clear error, which is the intended behavior of env.ts.

---

## Round 6 — Timestamps, Audit Fields & Missing Entities

### Q15 — Standard timestamp fields across all tables

Every table needs consistent audit columns. Should we also track `updated_by` at the DB level?

```
Option A: created_at + updated_at only (Prisma @updatedAt)
Option B: created_at + updated_at + created_by_id + updated_by_id
Option C: created_at + updated_at; audit trail deferred to Epic 4.4 activity_log
```

- [ ] Option B — `updated_by_id` on every table is premature; Epic 4.4 builds a dedicated activity_log
- [x] Option C — **recommended** — `created_at` + `updated_at` on all tables; `created_by_id: user_id?` on the primary research entities (Person, Event, Source, Relation) only — gives basic attribution; full audit trail is Epic 4.4's concern

---

### Q16 — User and Project schema: what belongs in Epic 1.2 vs. 1.3?

Epic 1.3 adds auth-specific tables (EmailConfirmation, PasswordReset, AuthAuditLog). Epic 1.2 must define User and Project tables. Where is the line?

```
Epic 1.2 owns:
  User:        id, email, name, role (UserRole), created_at, updated_at
  Project:     id, name, description, created_at, updated_at, deleted_at
  UserProject: id, user_id, project_id, role (ProjectRole), created_at

Epic 1.3 adds to User:
  email_verified, password_hash, image
  + EmailConfirmation, PasswordReset, AuthAuditLog tables
```

- [x] **Recommended split** — Epic 1.2 defines minimal User (id, email, name, system role) and Project structure; Epic 1.3 adds all auth-specific fields and tables. This avoids blocking the data layer on auth decisions, and Epic 1.3 will run a migration adding those columns.

---
