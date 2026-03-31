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

## Process & quality gaps

### 7. Epic scope too broad — Epic 2.4 as case study

**What happened:** Epic 2.4 ("Universal Relationship Engine") covered RelationType CRUD, Relation CRUD, PropertyEvidence per-field annotation, ActivityLog, a global `/relations` page, and RelationsTab on all entity detail pages — six distinct subsystems in one epic. Result: the developer finished backend for one subsystem while mentally logging it as done, forgetting to wire the frontend. Three tabs were left as placeholders and a backend API existed for 8 months without a UI.

**Recommendation:** Cap epics at 2–3 cohesive subsystems. "Relation engine" and "Evidence annotation" and "Activity logging" each warranted a separate epic with a separate spec, test plan, and AC table. When an epic exceeds this, split before writing the spec.

---

### 8. TypeScript does not catch API response shape mismatches

**What happened:** `evidence_count` vs `_count: { evidence: n }` — the producer (API route) and consumer (component type) both compiled cleanly in isolation. `Response.json({...})` has no enforced return type, so TypeScript cannot flag the mismatch.

**Recommendation:** Establish a convention that all API routes mapping Prisma records to response shapes must go through an explicitly typed helper function (e.g. `mapRelation(r): RelationWithDetails`). The return type annotation on the helper is where TypeScript catches shape drift. This is also the `mapRelation()` extraction noted in item 1 above.

---

### 9. E2E tests cover creation flows but not display/read-back states

**What happened:** E2E tests validated "create a relation → it appears in the list." They did not assert "open an existing relation for editing → the current entity names appear in the selectors" or "after adding evidence, the badge count reflects the addition." These second-order display assertions were never written.

**Recommendation:** Every feature involving persisted data needs two categories of E2E assertion:

1. **Write flow:** create/update/delete and verify the success state
2. **Read-back flow:** navigate away, return, and verify the display reflects the persisted state

Edit-mode assertions are a third mandatory category: open an existing record for editing and verify all fields are pre-populated.

---

### 10. Playwright Chromium launch failures silently treated as flakiness

**What happened:** If Chromium fails to launch, the E2E test runner exits before any assertions run. If this failure was treated as "infrastructure flakiness" and retried until it passed, the assertion that would have caught a bug never actually executed.

**Recommendation:** In CI, Chromium launch failures must be treated as hard failures — not retried silently. Configure the pipeline to surface them as a distinct failure type. Locally, if `pnpm test:e2e` exits before the first `test()` body runs, investigate the browser setup rather than retrying.

---

### 11. `logActivity` calls not verified by any test

**What happened:** `PUT /api/persons/[id]` was implemented without any `logActivity` call. No unit test or E2E test asserted that the Activity tab showed a new entry after a field was edited, so the omission was invisible.

**Recommendation:** Any API route that mutates data should have a corresponding test assertion that the activity log receives a new entry. For E2E, this means: perform an action → navigate to the Activity tab → assert the entry appears with the correct action type and field path.

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
