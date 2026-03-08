# Epic 1.4 — Security Infrastructure & CI/CD

## Brainstorming

**Goal:** Define every implementation detail so the specification leaves no ambiguity.

---

## Round 1 — Upstash Redis Client & Rate Limiter Package

### Q1 — Which Upstash client package(s)?

Epic 1.3 uses an lru-cache shim. Epic 1.4 must swap in a Redis-backed sliding-window implementation. Two Upstash packages are candidates:

| Package              | Role                                                       | Notes                                                      |
| -------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| `@upstash/redis`     | Low-level HTTP Redis client                                | Used directly for caching; no algorithm                    |
| `@upstash/ratelimit` | Pre-built rate limit algorithms on top of `@upstash/redis` | Sliding window built-in                                    |
| `@vercel/kv`         | Vercel KV SDK (wraps `@upstash/redis`)                     | Locked to Vercel KV env var names (`KV_REST_API_URL` etc.) |

- [ ] Option A — `@vercel/kv` only — convenient for Vercel KV deployments, locked to Vercel env names
- [x] Option B — `@upstash/redis` + `@upstash/ratelimit` — **recommended** — framework-agnostic, explicit env vars (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`), `@upstash/ratelimit` provides `slidingWindow()` directly, no vendor lock-in beyond Upstash
- [ ] Option C — `ioredis` — requires persistent TCP connection, incompatible with serverless Edge runtime

### Q2 — Rate limit algorithm: slidingWindow vs fixedWindow vs tokenBucket?

The roadmap specifies "sliding-window". The `@upstash/ratelimit` package provides all three.

- [ ] Option A — `fixedWindow()` — simpler, but allows burst at window boundary (2x limit in worst case)
- [x] Option B — `slidingWindow()` — **recommended** — no boundary burst, matches roadmap wording, slight extra Redis operation cost (acceptable at this scale)
- [ ] Option C — `tokenBucket()` — smoothest burst handling, but more complex to reason about for security use cases

### Q3 — What happens when Redis is unavailable at rate-limit check time?

Upstash HTTP calls can fail (network error, cold-start race). The limiter must have a defined behavior.

- [ ] Option A — Fail closed (deny all) — safest but causes outage when Redis is down
- [x] Option B — Fail open (allow all) — **recommended** — returns `{ allowed: true, remaining: -1, resetAt: new Date() }`; Redis unavailability is already monitored via `/api/health`; brief window of unrestricted auth routes is acceptable vs. a login outage
- [ ] Option C — Fall back to lru-cache shim — adds complexity, partial protection only across instances

### Q4 — Environment variable naming for Upstash

Upstash provides two sets of env var names depending on which dashboard flow is used.

| Pattern        | Vars                                                                  |
| -------------- | --------------------------------------------------------------------- |
| Upstash native | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`                  |
| Vercel KV      | `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN` |

- [ ] Option A — Vercel KV names — auto-populated by Vercel KV integration, but Vercel-locked
- [x] Option B — Upstash native names — **recommended** — portable to non-Vercel deploys (local dev, CI), explicitly set in `.env.local` and Vercel env vars panel; `@upstash/redis` uses these natively

**Round 1 answers:** All recommended options selected (B, B, B, B).

---

## Round 2 — Durable Cache Layer

### Q5 — What does Epic 1.4 actually cache?

The roadmap says "Redis-backed cache with TTL for API responses (persons list, events list, dashboard stats)" — but those entities don't exist until Phase 2. What gets cached in this epic?

- [ ] Option A — Nothing yet; just build the cache abstraction and wire it nowhere — deferred value
- [x] Option B — **recommended** — Cache `/api/health` response (60s TTL) + build the `cache.ts` abstraction with `get/set/del/invalidateByPrefix` methods, verified by a unit test; Phase 2 epics import and use it without needing to build the layer
- [ ] Option C — Cache nothing; don't build cache abstraction — leave it entirely to Phase 2

### Q6 — Cache abstraction interface

What shape should `src/lib/cache.ts` expose to the rest of the app?

```typescript
// Option A — Typed wrapper around @upstash/redis
export const cache = {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
  invalidateByPrefix(prefix: string): Promise<void>  // SCAN + DEL
}

// Option B — Plain re-export of redis client, no abstraction
export { redis } from "./redis-client"
```

- [x] Option A — Typed wrapper — **recommended** — hides Upstash details, `invalidateByPrefix` is used heavily in Phase 2 (list invalidation on write), testable with a mock, consistent key/TTL discipline enforced in one place
- [ ] Option B — Plain re-export — simpler now, messy later; callers each handle serialization and TTL

### Q7 — Cache key namespacing strategy

All cache keys must be scoped to prevent collisions between rate-limit keys and data cache keys (both live in the same Redis instance).

```
rate-limit:{route}:{identifier}     ← managed by @upstash/ratelimit internally
cache:health                        ← health response
cache:project:{id}:persons:list     ← future Phase 2
cache:project:{id}:persons:{id}     ← future Phase 2
```

- [ ] Option A — No namespace prefix — collisions possible with ratelimit keys
- [x] Option B — `cache:` prefix for all app cache keys — **recommended** — `@upstash/ratelimit` uses its own internal key format (`@upstash/ratelimit:{identifier}`), so `cache:` prefix is clean and collision-free; `invalidateByPrefix("cache:project:{id}:")` wipes all keys for a project
- [ ] Option C — Separate Redis databases (db 0 for rate limit, db 1 for cache) — Upstash free tier is single-db only

### Q8 — Cache TTL values for this epic

Only the health endpoint is cached in Epic 1.4. What TTL?

- [ ] Option A — No caching on health — health should always be fresh
- [x] Option B — 30s TTL on health — **recommended** — reduces DB ping load in production monitoring; health checkers typically poll every 30–60s; stale-by-30s is acceptable for a status endpoint (the `/api/health` route already sets `Cache-Control: no-store` for HTTP caches — the Redis TTL is a server-side layer to avoid redundant DB pings)
- [ ] Option C — 5 min TTL — too stale; a DB outage would be hidden for 5 min

**Round 2 answers:** All recommended options selected (B, A, B, B).

---

## Round 3 — Security Headers & Content Security Policy

### Q9 — Where do security headers live?

Next.js supports headers in two places. The roadmap says `next.config.ts`.

```
Option A: next.config.ts headers() array
  → Applied at CDN/edge before server code runs
  → Can use path matching patterns
  → No access to request object (no nonce generation)

Option B: middleware.ts
  → Runs on every request, can set headers dynamically
  → Can generate per-request nonces for CSP
  → Slightly more latency
```

- [x] Option A — `next.config.ts` — **recommended** — matches roadmap, sufficient for all static headers; CSP policy in this epic uses keyword-based directives (no nonce needed at this stage; nonce-based CSP is a Phase 5 hardening task); simpler, no runtime overhead
- [ ] Option B — `middleware.ts` — needed only if per-request nonces are required; deferred

### Q10 — CSP policy strictness for this epic

Strict nonce-based CSP breaks Next.js inline scripts unless carefully configured. What level of strictness is right now?

```
Option A — Strict nonce-based:
  script-src 'nonce-{random}' 'strict-dynamic'
  Pros: gold standard; blocks all injected scripts
  Cons: requires middleware + custom Document; breaks hot reload in dev

Option B — Keyword-based (no unsafe-inline for scripts):
  script-src 'self' (+ CDN origins if needed)
  Pros: blocks most XSS; compatible with Next.js App Router without extra wiring
  Cons: 'self' still allows same-origin scripts

Option C — Permissive baseline (unsafe-inline allowed):
  script-src 'self' 'unsafe-inline' 'unsafe-eval'
  Pros: zero breakage
  Cons: effectively no XSS protection from CSP
```

- [x] Option B — Keyword-based, no unsafe-inline for scripts — **recommended** — meaningful protection, App Router compatible, no per-request nonce machinery; policy can be tightened to nonces in Epic 5.4 security hardening pass
- [ ] Option A — Deferred to Epic 5.4
- [ ] Option C — Unacceptable for production

### Q11 — Full CSP directive set

Which directives and values for the initial policy?

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';   ← Tailwind CSS requires inline styles
img-src 'self' data: blob:;         ← data URIs for avatars/icons, blob for file previews
font-src 'self';
connect-src 'self';                 ← future: add Upstash/Sentry/analytics origins
frame-ancestors 'none';             ← equivalent to X-Frame-Options: DENY
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

- [ ] Option A — Minimal: just `default-src 'self'` — too loose; allows framing, object embeds
- [x] Option B — Full directive set as above — **recommended** — each directive has a specific purpose; `style-src unsafe-inline` is unavoidable with Tailwind's runtime approach; `frame-ancestors 'none'` duplicates `X-Frame-Options` for CSP Level 3 browsers; `upgrade-insecure-requests` handles mixed content
- [ ] Option C — Include `report-uri` / `report-to` — useful but deferred; no reporting endpoint exists yet

### Q12 — Complete security headers list

Which headers exactly go into `next.config.ts`?

- [x] **Recommended complete set:**

| Header                    | Value                                      |
| ------------------------- | ------------------------------------------ |
| `X-Content-Type-Options`  | `nosniff`                                  |
| `X-Frame-Options`         | `DENY`                                     |
| `X-XSS-Protection`        | `1; mode=block`                            |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`          |
| `Permissions-Policy`      | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy` | full directive set from Q11                |

Plus `poweredByHeader: false` in `next.config.ts` config object (not in headers array).

- [ ] Option A — Skip `Permissions-Policy` — minor omission; include it, it's one line
- [ ] Option B — Add `Strict-Transport-Security` — Vercel sets HSTS automatically; avoid double-setting

**Round 3 answers:** All recommended options selected (A, B, B, recommended set).

---

## Round 4 — GitHub Actions CI/CD Pipeline

### Q13 — Trigger strategy: when does CI run?

```
Option A — On every push to any branch
Option B — On push to main + on pull_request targeting main
Option C — On push to main only (no PR checks)
```

- [x] Option B — Push to main + PR to main — **recommended** — PRs get lint/test feedback before merge; main branch gets the full deploy pipeline; feature branches don't waste CI minutes; matches standard open-source and solo-dev workflows
- [ ] Option A — Too noisy for feature branch development
- [ ] Option C — No PR checks means broken code can land in main

### Q14 — CI job structure: one job vs. multiple jobs

```
Option A — Single job (sequential):
  install → lint → typecheck → unit tests → build → E2E → deploy

Option B — Parallel jobs:
  ┌── lint ──┐
  ├── typecheck ┤→ build → E2E → deploy
  └── unit tests ┘
```

- [x] Option B — Parallel lint + typecheck + unit tests, then sequential build → E2E → deploy — **recommended** — lint/typecheck/unit are independent; parallelism cuts wall-clock time; build must follow all checks; E2E must follow build; deploy follows E2E (on main only)
- [ ] Option A — Simple but slow; lint failure blocks unit tests unnecessarily

### Q15 — Database in CI: shared dev branch vs. isolated Neon branch

E2E tests and `prisma migrate deploy` need a real database.

```
Option A — CI uses the shared dev Neon branch
  → Simple; no branch management
  → Tests mutate shared data; concurrent CI runs conflict

Option B — CI creates a Neon branch per run (Neon branching API)
  → Isolated; safe for parallel runs
  → Requires Neon API token in CI secrets; branch cleanup needed

Option C — CI uses a fixed "ci" Neon branch (not dev, not main)
  → Simple isolation; no branch creation overhead
  → Concurrent runs still conflict (rare for solo dev)
```

- [x] Option C — Dedicated `ci` Neon branch — **recommended** — right balance for a solo/small-team project; no branch lifecycle management complexity; concurrent CI conflicts are extremely rare; branch can be reset manually if tests corrupt it; `NEON_CI_DATABASE_URL` secret in GitHub
- [ ] Option A — Risk of test pollution on dev branch
- [ ] Option B — Overkill for this project scale; adds Neon API complexity

### Q16 — Vercel deployment method in CI

```
Option A — Vercel GitHub integration (automatic)
  → Vercel auto-deploys on push to main without CI involvement
  → Preview deployments on PRs automatically
  → CI cannot gate the deploy (Vercel deploys in parallel, ignoring CI)

Option B — Vercel CLI in CI (`vercel --prod`)
  → CI explicitly controls deploy; deploy only runs after all tests pass
  → Requires VERCEL_TOKEN + VERCEL_ORG_ID + VERCEL_PROJECT_ID secrets
  → Disables Vercel's automatic Git integration (or set to "ignored builds")

Option C — CI triggers deploy via Vercel Deploy Hook URL
  → Hybrid: Vercel handles the build, CI triggers it after tests
  → Less control over the build environment
```

- [x] Option B — Vercel CLI in CI — **recommended** — guarantees tests pass before deploy; `prisma migrate deploy` runs in CI before `vercel --prod`; clean control flow; GitHub integration set to "ignored builds" to avoid double-deploy
- [ ] Option A — Cannot enforce test-gates on production deploy
- [ ] Option C — Less clean; Vercel re-runs its own build ignoring CI artifacts

### Q17 — Prisma migrate in CI: when and where?

The roadmap locks: `prisma migrate deploy && next build` as the build command.

```
Option A — Put `prisma migrate deploy` inside Vercel build command
  → Runs on every Vercel deploy (including preview deploys)
  → Preview deploys would migrate production/ci DB — dangerous

Option B — Run `prisma migrate deploy` as a dedicated CI step before `vercel --prod`
  → Migration runs once, against the CI branch DB; then deploy to Vercel
  → Vercel build command is just `next build` (no migration)
  → Clean separation: CI owns migration, Vercel owns build
```

- [x] Option B — Migration as CI step, `next build` as Vercel build command — **recommended** — prevents preview deploys from touching production DB; explicit ordering; `DATABASE_URL_UNPOOLED` (direct connection) used for migration step (pooled connections fail for DDL)
- [ ] Option A — Dangerous; Vercel preview deployments would run migrations against shared DB

**Round 4 answers:** All recommended options selected (B, B, C, B, B).

---

## Round 5 — Sanitization, Health Endpoint & Debug Route Removal

### Q18 — Output sanitization: library vs. custom

The roadmap says "sanitizer applied only at DB write boundaries". React escapes HTML by default so XSS via rendering is not the risk — the risk is storing malicious content in the DB that gets rendered via `dangerouslySetInnerHTML` or exported as raw HTML.

```
Option A — DOMPurify (+ jsdom for SSR)
  → Industry standard; comprehensive allow-list
  → Requires jsdom shim on server (heavyweight)

Option B — sanitize-html (npm)
  → Server-safe, no DOM dependency
  → Configurable allow-list; widely used

Option C — No library; custom strip-tags regex
  → Fragile; bypasses exist; not recommended for security code

Option D — No sanitization library now; add a thin `sanitize(input: string): string`
  stub in `src/lib/sanitize.ts` that strips `<script>` tags with a regex for this epic;
  full library integration deferred to Epic 2.1 when rich-text fields appear
```

- [x] Option D — Thin stub now, real library in Epic 2.1 — **recommended** — no rich-text fields exist yet (all text fields are plain strings); `sanitize()` stub establishes the pattern and is called at all DB write helpers; upgrading to `sanitize-html` in Epic 2.1 is a one-line swap in one file; avoids adding a heavyweight dependency before it's needed
- [ ] Option B — Premature; adds dependency before rich text exists
- [ ] Option A — jsdom on server is expensive; not warranted yet
- [ ] Option C — Never acceptable for security code

Comment: Add this to the roadmap accordingly please

### Q19 — Health endpoint: extend existing or replace?

Epic 1.2 already ships `GET /api/health` returning `{ status, db, version, migration }`. Epic 1.4 must add Redis status.

- [x] Option A — Extend the existing route — **recommended** — add a `redis` field alongside existing `db` field; keep same response envelope; backward-compatible; no URL change
- [ ] Option B — New `/api/health/v2` — unnecessary versioning; same consumer (monitoring/CI)

**Extended response shape:**

```typescript
interface HealthResponse {
  status: "ok" | "degraded" | "error";
  version: string;
  db: { status: "ok" | "error"; latencyMs: number; migration: string | null };
  redis: { status: "ok" | "error"; latencyMs: number };
  timestamp: string; // ISO 8601
}
```

`status` is `"ok"` only if both `db` and `redis` are `"ok"`. Otherwise `"degraded"` (one service down) or `"error"` (both down). Redis latency measured with a `PING` command.

### Q20 — Debug/test route removal: middleware block vs. file deletion

The roadmap says remove `/api/debug/*` and `/api/test*` routes, blocked at middleware in production.

```
Option A — Delete the files entirely
  → Clean; no dead code
  → Risk: files may not exist (Epic 1.2/1.3 may never have created them)

Option B — Block at middleware in production (NODE_ENV check)
  → Keeps files for local dev; returns 404 in production
  → Middleware already runs on all requests

Option C — Block at middleware unconditionally (all envs)
  → Simplest policy; no debug routes ever
```

- [x] Option A — Delete files if they exist; add middleware block as defense-in-depth — **recommended** — belt-and-suspenders: no files to serve + middleware rejects any accidental recreation; the middleware rule is cheap and permanent
- [ ] Option B — Keeping debug files in production repo is unnecessary risk
- [ ] Option C — Unnecessarily restricts local development if debug routes are useful

### Q21 — CI secrets: what must be configured in GitHub

All secrets that CI jobs need, so nothing is missed when wiring up the pipeline.

**Required GitHub Actions secrets:**

| Secret                     | Used by                                    |
| -------------------------- | ------------------------------------------ |
| `DATABASE_URL_UNPOOLED`    | `prisma migrate deploy` step               |
| `DATABASE_URL`             | E2E test runtime (pooled)                  |
| `UPSTASH_REDIS_REST_URL`   | Unit/E2E tests that exercise rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Same                                       |
| `AUTH_SECRET`              | Next.js build + E2E                        |
| `RESEND_API_KEY`           | E2E tests that trigger email flows         |
| `VERCEL_TOKEN`             | `vercel --prod` deploy step                |
| `VERCEL_ORG_ID`            | `vercel --prod`                            |
| `VERCEL_PROJECT_ID`        | `vercel --prod`                            |

- [x] This is the complete list — **confirmed as recommended** — no additional secrets needed for this epic; `NEXTAUTH_URL` / `AUTH_URL` is set via Vercel env vars (not needed in CI build step since Vercel injects it)
- [ ] Option B — Use a single `CI_ENV_FILE` secret containing all vars — harder to rotate individual secrets; non-standard

**Round 5 answers:** All recommended options selected (D, A, A, confirmed list). Roadmap updated to note `sanitize-html` upgrade in Epic 2.1.

---

## Round 6 — Testing, i18n & Out-of-Scope Boundaries

### Q22 — How to test Redis-backed code in unit tests

The rate limiter and cache modules depend on Upstash. Unit tests must not hit real Redis.

```
Option A — Mock @upstash/redis at the module level (vi.mock)
  → Fast, no network; test the wrapper logic, not Upstash internals
  → Brittle if Upstash client API changes

Option B — Use real Upstash in CI (via CI secrets)
  → Integration-level confidence; slower; needs network
  → Acceptable for a small number of smoke tests

Option C — Inject a fake/in-memory redis client via dependency injection
  → Clean separation; cache/rate-limit modules accept a `redis` param
  → Slightly more complex module design
```

- [x] Option A — `vi.mock('@upstash/redis')` for unit tests — **recommended** — unit tests validate the wrapper logic (key construction, TTL passing, error handling/fail-open); a small number of integration tests in CI (Option B) using real Upstash secrets cover the actual Redis round-trip; no need for DI complexity
- [ ] Option C — DI adds complexity not justified at this scale
- [ ] Option B — Not suitable for unit test suite; acceptable as a supplemental CI integration check

### Q23 — E2E tests in CI: local dev server vs. deployed preview

Playwright E2E must run somewhere in CI. Two options:

```
Option A — Start a local Next.js server in CI (`next start` after build)
  → Tests run against the just-built artifact
  → No network round-trip to Vercel; fast
  → Requires all env vars available in the CI runner

Option B — Run E2E against the Vercel preview deployment
  → Tests the real production-like environment
  → Requires waiting for Vercel deploy to finish before E2E
  → Adds complexity: Vercel preview URL is dynamic
```

- [x] Option A — Local `next start` in CI — **recommended** — simpler pipeline; tests the build artifact directly; preview deployments are for human review, not automated E2E; deploy to `--prod` happens only after E2E passes on local server
- [ ] Option B — Adds Vercel URL extraction complexity; slower pipeline

### Q24 — New i18n translation keys needed

Epic 1.4 introduces no new user-visible UI pages. Are any new translation keys needed?

- No new auth error keys (rate limit errors already defined in Epic 1.3: `auth.errors.rateLimited`)
- No new pages or UI components
- Health endpoint is JSON only (no i18n)
- CI/CD is invisible to users

- [x] **No new translation keys** — **confirmed** — Epic 1.4 is infrastructure-only; all user-visible strings were covered by Epic 1.3
- [ ] Option B — Add a generic `errors.serviceUnavailable` key — premature; no UI surfaces this yet

### Q25 — Out-of-scope boundaries

What explicitly does NOT belong in Epic 1.4?

- [x] **Confirmed out of scope:**
  - Nonce-based CSP (deferred to Epic 5.4 security hardening)
  - `sanitize-html` library integration (deferred to Epic 2.1)
  - Vercel Analytics or Sentry integration (deferred to Epic 5.4)
  - Redis caching of Phase 2 entity lists (persons, events) — no routes exist yet; cache abstraction is built but only wired to `/api/health`
  - Vercel KV environment variable migration (stay on Upstash native vars throughout)
  - Per-PR Neon branch creation (fixed `ci` branch is sufficient)
  - `report-uri` / CSP violation reporting endpoint
  - Rate limiting on non-auth routes (no other API routes exist yet; pattern is established for Phase 2 to adopt)
