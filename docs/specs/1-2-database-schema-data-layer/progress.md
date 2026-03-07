# Progress — Epic 1.2 — Database Schema & Data Layer

**Status:** ✅ Complete
**Started:** 2026-03-07

---

## Phases

### Phase 1 — Schema & Migration

- [x] Install `prisma` + `@prisma/client` + `tsx`
- [x] Write `prisma/schema.prisma` (full schema per spec)
- [x] Create `.env.local` with `DATABASE_URL` + `DATABASE_URL_UNPOOLED`
- [x] Update `src/lib/env.ts` — add both DB env vars (required)
- [x] Update `.env.example` — add `DATABASE_URL_UNPOOLED`
- [x] Run `pnpm prisma migrate dev --name init`
- [x] Verify migration file created
- [x] Run `pnpm prisma generate`

### Phase 2 — Application Code (TDD)

- [x] Write `src/lib/db.ts` — Prisma singleton + `ping()` + `getLatestMigration()`
- [x] Write failing tests in `src/app/api/health/route.test.ts`
- [x] Write `src/app/api/health/route.ts`
- [x] All unit tests green

### Phase 3 — Seed Script

- [x] Write `prisma/seed.ts` — idempotent seed with upsert
- [x] Add `prisma.seed` to `package.json`
- [x] Run `pnpm prisma db seed`
- [x] Run seed a second time — verify no duplicates

### Phase 4 — Quality Gate

- [x] `pnpm typecheck` — zero errors
- [x] `pnpm lint` — zero errors
- [x] `pnpm test` — all passing
- [x] `pnpm build` — production build passes

### Phase 5 — Browser Verification

- [x] Write `docs/specs/1-2-database-schema-data-layer/testplan.md`
- [x] Verify `GET /api/health` returns 200 + correct body in browser
- [x] Verify DB connected + migration_version non-null
- [x] Verify Cache-Control: no-store header

---

## Acceptance Criteria

| AC    | Description                                                                                                                     | Status |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | ------ |
| AC-1  | `prisma migrate dev` completes without errors                                                                                   | ✅     |
| AC-2  | `prisma studio` shows all 13 tables                                                                                             | ✅     |
| AC-3  | `prisma db seed` completes without errors                                                                                       | ✅     |
| AC-4  | Running seed twice produces no duplicate records                                                                                | ✅     |
| AC-5  | `GET /api/health` returns 200 with `status: ok`                                                                                 | ✅     |
| AC-6  | Response includes `db.latency_ms` (≥0) + `db.migration_version` (non-null)                                                      | ✅     |
| AC-7  | Response includes `app.version` matching `package.json`                                                                         | ✅     |
| AC-8  | Response includes `Cache-Control: no-store` header                                                                              | ✅     |
| AC-9  | Missing `DATABASE_URL` causes Zod error at startup                                                                              | ✅     |
| AC-10 | `pnpm typecheck` passes with zero TypeScript errors                                                                             | ✅     |
| AC-11 | `pnpm test` passes all unit tests for health route                                                                              | ✅     |
| AC-12 | Seed data: 4 Persons (2 names each), 4 Events, 5 Relations (3 with valid_from_year), 3 RelationEvidence (2 with page_reference) | ✅     |
