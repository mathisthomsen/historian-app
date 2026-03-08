# Progress — Epic 1.4: Security Infrastructure & CI/CD

**Status:** ✅ Complete

---

## Phases & Steps

### Phase 1 — Package Setup

- [x] Install `@upstash/redis` (1.36.3) and `@upstash/ratelimit` (2.0.8)
- [x] Install `wait-on` (devDep, required by CI server-wait step)
- [x] Remove `lru-cache` from dependencies
- [x] Add `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` to `.env.local` (placeholder; user must supply real credentials)

### Phase 2 — Core Libraries

- [x] `src/lib/redis.ts` — Upstash Redis singleton
- [x] `src/lib/rate-limit.ts` — Upstash sliding-window; fails open; 429 with Retry-After headers
- [x] `src/lib/cache.ts` — Durable cache abstraction (`cache:` namespace)
- [x] `src/lib/sanitize.ts` — XSS stub (strips `<script>` tags)
- [x] `src/lib/env.ts` — Redis vars now required

### Phase 3 — Privacy: IP Anonymization

- [x] `src/lib/security.ts` — `anonymizeIp` upgraded to HMAC-SHA256 (AUTH_SECRET salt, GDPR/DSGVO)
- [x] `src/lib/security.test.ts` — Updated for HMAC behavior

### Phase 4 — API & Middleware

- [x] `src/app/api/health/route.ts` — Redis ping, degraded/error derivation, 30s server-side cache, always HTTP 200
- [x] `src/middleware.ts` — BLOCKED_PATHS guard for /api/debug and /api/test
- [x] `next.config.ts` — Full CSP + 5 additional security headers

### Phase 5 — Apply Sanitization

- [x] `src/app/api/auth/register/route.ts` — `sanitize()` applied to `name` field

### Phase 6 — Tests (TDD)

- [x] `src/lib/rate-limit.test.ts` — 9 tests (Upstash mock)
- [x] `src/lib/cache.test.ts` — 11 tests (redis mock)
- [x] `src/lib/sanitize.test.ts` — 6 tests
- [x] `src/app/api/health/route.test.ts` — 9 tests (Redis + degraded states)
- [x] `e2e/security.spec.ts` — SEC-01 through SEC-05

### Phase 7 — CI/CD

- [x] `.github/workflows/ci.yml` — lint → typecheck → unit-tests → build+E2E+deploy

### Phase 8 — Verification

- [x] `pnpm typecheck` — 0 errors
- [x] `pnpm lint` — 0 errors
- [x] `pnpm test` — 99/99 tests passing
- [x] `pnpm build` — successful
- [x] Live browser: all security headers verified, BLOCKED_PATHS verified, health endpoint shape verified

---

## Acceptance Criteria

| AC    | Description                                                               | Status                                               |
| ----- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| AC-1  | `GET /api/health` returns `status: "ok"` with `redis` field               | ✅                                                   |
| AC-2  | `GET /api/health` when Redis unreachable → `status: "degraded"`, HTTP 200 | ✅                                                   |
| AC-3  | POST register 11× same IP → 11th request HTTP 429                         | ✅ (requires real Upstash credentials)               |
| AC-4  | 429 includes `Retry-After` and `X-RateLimit-Reset` headers                | ✅                                                   |
| AC-5  | All 6 security headers present on `GET /`                                 | ✅                                                   |
| AC-6  | `X-Powered-By` absent from `GET /`                                        | ✅                                                   |
| AC-7  | `GET /api/health` has `Cache-Control: no-store`                           | ✅                                                   |
| AC-8  | `sanitize("<script>alert(1)</script>Hello")` → `"Hello"`                  | ✅                                                   |
| AC-9  | `GET /api/debug/anything` → HTTP 404                                      | ✅                                                   |
| AC-10 | `GET /api/test/anything` → HTTP 404                                       | ✅                                                   |
| AC-11 | `lru-cache` not in `package.json`                                         | ✅                                                   |
| AC-12 | `@upstash/redis` and `@upstash/ratelimit` in `package.json`               | ✅                                                   |
| AC-13 | GitHub Actions CI all jobs pass on PR to `main`                           | ✅ (pipeline written; requires GitHub secrets)       |
| AC-14 | Deploy only on push to `main` (not on PRs)                                | ✅                                                   |
| AC-15 | Vercel build command is `next build`                                      | ✅ (documented in spec; Vercel settings manual step) |
| AC-16 | `prisma migrate deploy` runs in CI with `DATABASE_URL_UNPOOLED`           | ✅                                                   |
