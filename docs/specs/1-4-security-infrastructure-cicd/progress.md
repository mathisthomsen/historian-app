# Progress — Epic 1.4: Security Infrastructure & CI/CD

**Status:** 🚧 In Progress

---

## Phases & Steps

### Phase 1 — Package Setup

- [x] Install `@upstash/redis` (1.36.3) and `@upstash/ratelimit` (2.0.8)
- [x] Install `wait-on` (devDep, required by CI server-wait step)
- [x] Remove `lru-cache` from dependencies
- [ ] Add `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` to `.env.local`

### Phase 2 — Core Libraries

- [ ] `src/lib/redis.ts` — Upstash Redis singleton
- [ ] `src/lib/rate-limit.ts` — Replace lru-cache shim with Upstash sliding-window
- [ ] `src/lib/cache.ts` — Durable cache abstraction (`cache:` namespace)
- [ ] `src/lib/sanitize.ts` — XSS stub (strips `<script>` tags)
- [ ] `src/lib/env.ts` — Make Redis vars required

### Phase 3 — Privacy: IP Anonymization

- [ ] `src/lib/security.ts` — Update `anonymizeIp` to HMAC-SHA256 with salt (GDPR/DSGVO)
- [ ] Update `src/lib/security.test.ts` for new behavior

### Phase 4 — API & Middleware

- [ ] `src/app/api/health/route.ts` — Add Redis ping + update response shape
- [ ] `src/middleware.ts` — Add BLOCKED_PATHS guard for /api/debug and /api/test
- [ ] `next.config.ts` — Add `headers()` with all security headers, CSP

### Phase 5 — Apply Sanitization

- [ ] `src/app/api/auth/register/route.ts` — Call `sanitize()` on `name` field

### Phase 6 — Tests (TDD)

- [ ] `src/lib/rate-limit.test.ts` — Rewrite for Upstash (mock `@upstash/ratelimit`)
- [ ] `src/lib/cache.test.ts` — New (mock `src/lib/redis`)
- [ ] `src/lib/sanitize.test.ts` — New
- [ ] `src/app/api/health/route.test.ts` — Extend with Redis tests
- [ ] `e2e/security.spec.ts` — SEC-01 through SEC-05

### Phase 7 — CI/CD

- [ ] `.github/workflows/ci.yml` — lint / typecheck / unit / build / E2E / deploy

### Phase 8 — Verification

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` all pass
- [ ] `pnpm build` succeeds
- [ ] Live browser verification of all ACs

---

## Acceptance Criteria

| AC    | Description                                                               | Status |
| ----- | ------------------------------------------------------------------------- | ------ |
| AC-1  | `GET /api/health` returns `status: "ok"` with `redis` field               | ⬜     |
| AC-2  | `GET /api/health` when Redis unreachable → `status: "degraded"`, HTTP 200 | ⬜     |
| AC-3  | POST register 11× same IP → 11th request HTTP 429                         | ⬜     |
| AC-4  | 429 includes `Retry-After` and `X-RateLimit-Reset` headers                | ⬜     |
| AC-5  | All 6 security headers present on `GET /`                                 | ⬜     |
| AC-6  | `X-Powered-By` absent from `GET /`                                        | ⬜     |
| AC-7  | `GET /api/health` has `Cache-Control: no-store`                           | ⬜     |
| AC-8  | `sanitize("<script>alert(1)</script>Hello")` → `"Hello"`                  | ⬜     |
| AC-9  | `GET /api/debug/anything` → HTTP 404                                      | ⬜     |
| AC-10 | `GET /api/test/anything` → HTTP 404                                       | ⬜     |
| AC-11 | `lru-cache` not in `package.json`                                         | ⬜     |
| AC-12 | `@upstash/redis` and `@upstash/ratelimit` in `package.json`               | ⬜     |
| AC-13 | GitHub Actions CI all jobs pass on PR to `main`                           | ⬜     |
| AC-14 | Deploy only on push to `main` (not on PRs)                                | ⬜     |
| AC-15 | Vercel build command is `next build`                                      | ⬜     |
| AC-16 | `prisma migrate deploy` runs in CI with `DATABASE_URL_UNPOOLED`           | ⬜     |
