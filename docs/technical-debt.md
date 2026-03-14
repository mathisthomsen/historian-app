# Technical Debt & Refactoring Notes

This file records known improvement opportunities discovered during code review. Each item is noted with its location, the problem, and the recommended approach. Items here are intentionally deferred — they are not blocking current functionality but should be addressed in future iterations.

---

## Near-term (low effort, high value)

### 1. Duplicated relation response mapping

**Location:** `src/app/api/relations/route.ts` (GET + POST), `src/app/api/relations/[id]/route.ts` (GET + PUT)

**Problem:** The logic that maps a Prisma `Relation` record to a `RelationWithDetails` API response is copy-pasted across 4 files. Any shape change requires 4 edits.

**Recommendation:** Extract a shared `mapRelation(r: PrismaRelation): RelationWithDetails` helper in `src/lib/relations.ts` and call it from all 4 routes.

---

### 2. Inconsistent `_count` → flat field pattern in API responses

**Location:** All entity API routes that return counts (relations, evidence, etc.)

**Problem:** Some routes return `_count: { field: n }` (Prisma's raw shape), others flatten to `field_count: n`. This causes type mismatches and makes client code inconsistent.

**Recommendation:** Establish a convention: always flatten `_count` fields in API responses. Add a lint rule or code review note to enforce this.

---

## Medium-term (requires design)

### 3. Bulk evidence assignment — "Apply source to all fields"

**Context:** Documented in `docs/specs/2-1_2-4 cleanup/specification.md` Section 5.

**Problem:** Assigning a source individually to each field of an entity is laborious when one source covers all data.

**Option A (recommended first step):** When adding evidence to any field, provide a checkbox "Als Quelle für alle Felder dieser Person verwenden" that creates `PropertyEvidence` records for all `ALLOWED_PROPERTIES` in a single batch POST. No schema changes required.

**Option B:** Primary source per entity — a `Hauptquelle` concept at the entity level that auto-covers all fields, with per-field overrides. Semantically richer but requires schema changes and more UI design work.

Start with Option A; revisit Option B if users still find it laborious.

---

### 4. PropertyEvidence `ALLOWED_PROPERTIES` duplication

**Location:** `src/app/api/property-evidence/route.ts`

**Problem:** The allowed property names per entity type are hardcoded in the API route. If new fields are added to an entity, the allowed list must be manually updated.

**Recommendation:** Move `ALLOWED_PROPERTIES` to a shared constants file (`src/lib/entity-properties.ts`) so it can be imported by both the API and any future UI that needs to enumerate fields.

---

## Low priority / Nice to have

### 5. ActivityLog has no real-time updates

**Location:** `src/components/relations/ActivityLog.tsx`

**Problem:** The log is fetched on mount (and on `refreshKey` change), but there is no live/push mechanism. In collaborative scenarios, one user won't see another user's changes without a reload.

**Recommendation:** Add SSE or polling (e.g. 30s interval) as a future enhancement when real-time collaboration becomes a priority.

---

### 6. Rate limiting disabled in dev/test

**Location:** `src/lib/rate-limit.ts`

**Problem:** In-process LRU rate limiter is disabled in `NODE_ENV !== 'production'`. This means rate limiting is never exercised in development or test environments.

**Recommendation:** Add an integration test that runs with `NODE_ENV=production` to verify rate limiting behaviour, or introduce a `RATE_LIMIT_ENABLED` env flag for finer control.
