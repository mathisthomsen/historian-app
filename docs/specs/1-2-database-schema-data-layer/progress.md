# Progress — Epic 1.2 — Database Schema & Data Layer

**Status:** 🚧 In Progress
**Started:** 2026-03-07

---

## Phases

### Phase 1 — Schema & Migration
- [ ] Install `prisma` + `@prisma/client` + `tsx`
- [ ] Write `prisma/schema.prisma` (full schema per spec)
- [ ] Create `.env.local` with `DATABASE_URL` + `DATABASE_URL_UNPOOLED`
- [ ] Update `src/lib/env.ts` — add both DB env vars (required)
- [ ] Update `.env.example` — add `DATABASE_URL_UNPOOLED`
- [ ] Run `pnpm prisma migrate dev --name init`
- [ ] Verify migration file created
- [ ] Run `pnpm prisma generate`

### Phase 2 — Application Code (TDD)
- [ ] Write `src/lib/db.ts` — Prisma singleton + `ping()` + `getLatestMigration()`
- [ ] Write failing tests in `src/app/api/health/route.test.ts`
- [ ] Write `src/app/api/health/route.ts`
- [ ] All unit tests green

### Phase 3 — Seed Script
- [ ] Write `prisma/seed.ts` — idempotent seed with upsert
- [ ] Add `prisma.seed` to `package.json`
- [ ] Run `pnpm prisma db seed`
- [ ] Run seed a second time — verify no duplicates

### Phase 4 — Quality Gate
- [ ] `pnpm typecheck` — zero errors
- [ ] `pnpm lint` — zero errors
- [ ] `pnpm test` — all passing
- [ ] `pnpm build` — production build passes

### Phase 5 — Browser Verification
- [ ] Write `docs/specs/1-2-database-schema-data-layer/testplan.md`
- [ ] Verify `GET /api/health` returns 200 + correct body in browser
- [ ] Verify DB connected + migration_version non-null
- [ ] Verify Cache-Control: no-store header

---

## Acceptance Criteria

| AC | Description | Status |
|----|-------------|--------|
| AC-1 | `prisma migrate dev` completes without errors | ⬜ |
| AC-2 | `prisma studio` shows all 13 tables | ⬜ |
| AC-3 | `prisma db seed` completes without errors | ⬜ |
| AC-4 | Running seed twice produces no duplicate records | ⬜ |
| AC-5 | `GET /api/health` returns 200 with `status: ok` | ⬜ |
| AC-6 | Response includes `db.latency_ms` (≥0) + `db.migration_version` (non-null) | ⬜ |
| AC-7 | Response includes `app.version` matching `package.json` | ⬜ |
| AC-8 | Response includes `Cache-Control: no-store` header | ⬜ |
| AC-9 | Missing `DATABASE_URL` causes Zod error at startup | ⬜ |
| AC-10 | `pnpm typecheck` passes with zero TypeScript errors | ⬜ |
| AC-11 | `pnpm test` passes all unit tests for health route | ⬜ |
| AC-12 | Seed data: 4 Persons (2 names each), 4 Events, 5 Relations (2 with valid_from_year), 3 RelationEvidence (1 with page_reference) | ⬜ |
