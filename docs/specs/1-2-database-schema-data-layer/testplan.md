# Test Plan — Epic 1.2 — Database Schema & Data Layer

## Scope

Covers the API health endpoint and database connectivity introduced in Epic 1.2. The Prisma schema, migration, and seed data are verified via the health endpoint response and database inspection.

Out of scope: UI components (none added), auth (Epic 1.3), CRUD API routes (Phase 2).

## Test Environment

- Browser: Chrome (Chromium)
- Base URL: `http://localhost:3000`
- Required state: `pnpm prisma migrate dev` applied, `pnpm prisma db seed` executed
- Dev server must be running: `pnpm dev`

---

## Test Cases

### TC-01: Health endpoint returns 200 + status ok

**Objective:** Verify `GET /api/health` returns HTTP 200 with correct status field.
**Preconditions:** Dev server running, Neon DB reachable.
**Steps:**
1. Navigate to `http://localhost:3000/api/health`
2. Observe the JSON response body.
**Expected:**
- HTTP status 200
- `{ "status": "ok", "db": { "status": "ok", ... } }`
**Linked AC:** AC-5

---

### TC-02: Health endpoint includes db.latency_ms (number ≥ 0)

**Objective:** Verify `db.latency_ms` is a non-negative number in the response.
**Preconditions:** Same as TC-01.
**Steps:**
1. Navigate to `http://localhost:3000/api/health`
2. Inspect `db.latency_ms` field.
**Expected:**
- `db.latency_ms` is a number ≥ 0
**Linked AC:** AC-6

---

### TC-03: Health endpoint includes db.migration_version (non-null string)

**Objective:** Verify `db.migration_version` identifies the last applied migration.
**Preconditions:** Migration `20260307121802_init` applied.
**Steps:**
1. Navigate to `http://localhost:3000/api/health`
2. Inspect `db.migration_version` field.
**Expected:**
- `db.migration_version` is a non-null string containing `_init`
**Linked AC:** AC-6

---

### TC-04: Health endpoint includes app.version matching package.json

**Objective:** Verify `app.version` matches the project version.
**Preconditions:** Same as TC-01.
**Steps:**
1. Navigate to `http://localhost:3000/api/health`
2. Inspect `app.version` field.
**Expected:**
- `app.version` equals `"0.1.0"` (current `package.json` version)
**Linked AC:** AC-7

---

### TC-05: Cache-Control: no-store header is set

**Objective:** Verify the response never gets cached.
**Preconditions:** Browser DevTools open on Network tab.
**Steps:**
1. Open DevTools → Network tab
2. Navigate to `http://localhost:3000/api/health`
3. Select the `/api/health` request
4. Inspect response headers.
**Expected:**
- `Cache-Control: no-store` header is present
**Linked AC:** AC-8

---

### TC-06: Response includes timestamp in ISO 8601 format

**Objective:** Verify `timestamp` field is a valid ISO 8601 datetime string.
**Preconditions:** Same as TC-01.
**Steps:**
1. Navigate to `http://localhost:3000/api/health`
2. Inspect `timestamp` field.
**Expected:**
- `timestamp` matches pattern `YYYY-MM-DDTHH:mm:ss.sssZ`
**Linked AC:** AC-5

---

### TC-07: Response does not expose credentials or connection strings

**Objective:** Verify no sensitive env var values appear in the response body.
**Preconditions:** Same as TC-01.
**Steps:**
1. Navigate to `http://localhost:3000/api/health`
2. Use browser Find (Ctrl+F) to search for `neondb_owner`, `npg_`, or `postgresql://`
**Expected:**
- None of these strings appear in the response body
**Linked AC:** AC-5 (security: no credential leakage)

---

### TC-08: Response content-type is application/json

**Objective:** Verify the endpoint only returns JSON.
**Preconditions:** Browser DevTools open.
**Steps:**
1. Navigate to `http://localhost:3000/api/health`
2. Inspect `Content-Type` response header.
**Expected:**
- `Content-Type: application/json` (with optional charset suffix)
**Linked AC:** AC-5

---

### TC-09: Seed data present — 4 Persons visible

**Objective:** Verify seed created 4 Person records.
**Preconditions:** `pnpm prisma db seed` executed.
**Steps:**
1. Run: `pnpm prisma studio` (opens browser UI)
2. Navigate to `persons` table.
3. Confirm 4 rows: Goethe, Schiller, Humboldt, Caroline von Humboldt.
**Expected:**
- 4 persons visible, each with `birth_year` and `death_year` populated
**Linked AC:** AC-12

---

### TC-10: Seed data — PersonNames (2 per person)

**Objective:** Verify 8 PersonName records (2 per person: DE + LA).
**Preconditions:** Same as TC-09.
**Steps:**
1. In Prisma Studio, navigate to `person_names` table.
2. Confirm 8 rows, each with `language` set to `de` or `la`.
**Expected:**
- 8 rows, each linked to one of the 4 persons
**Linked AC:** AC-12

---

### TC-11: Seed data — 5 Relations, at least 2 with valid_from_year

**Objective:** Verify temporal validity columns are populated on Relations.
**Preconditions:** Same as TC-09.
**Steps:**
1. In Prisma Studio, navigate to `relations` table.
2. Confirm 5 rows.
3. Check that at least 2 rows have `valid_from_year` set (non-null).
**Expected:**
- 5 relations; rows for Goethe–Schiller and Schiller–Klassik have `valid_from_year`
**Linked AC:** AC-12

---

### TC-12: Seed data — 3 RelationEvidence, at least 1 with page_reference

**Objective:** Verify archival citation data (page_reference) is stored.
**Preconditions:** Same as TC-09.
**Steps:**
1. In Prisma Studio, navigate to `relation_evidence` table.
2. Confirm 3 rows.
3. Check at least 1 row has `page_reference` set.
**Expected:**
- 3 rows; `seed-re-1` has `page_reference = "S. 47, Brief vom 27. Juli 1794"`
**Linked AC:** AC-12
