# Epic 1.4 — Security Infrastructure & CI/CD

## Specification

**Phase:** 1 — Foundation & Auth
**Deliverable:** Production-grade security primitives and automated deployment pipeline.
**Verifiable:** Rate limiter returns 429 after limit; security headers visible in DevTools; health endpoint returns all-green JSON; GitHub Actions CI pipeline runs and deploys to Vercel.

---

## 1. Technology Stack

New dependencies introduced in this epic:

| Package              | Version  | Type | Purpose                                        |
| -------------------- | -------- | ---- | ---------------------------------------------- |
| `@upstash/redis`     | `^2.0.0` | prod | HTTP Redis client (serverless/edge-compatible) |
| `@upstash/ratelimit` | `^2.0.0` | prod | Sliding-window rate limiting on Upstash Redis  |

**Removed:**

| Package     | Reason                                                             |
| ----------- | ------------------------------------------------------------------ |
| `lru-cache` | Replaced by `@upstash/ratelimit`; in-process shim no longer needed |

**New environment variables:**

| Variable                   | Description                     | Required |
| -------------------------- | ------------------------------- | -------- |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST endpoint URL | yes      |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST auth token   | yes      |

Both must be added to `.env.local`, `env.ts` Zod schema, GitHub Actions secrets, and Vercel project environment variables.

---

## 2. Redis Client & Rate Limiter

### 2.1 Redis singleton

```typescript
// src/lib/redis.ts

import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

### 2.2 Rate limiter replacement (`src/lib/rate-limit.ts`)

**Full replacement** of the Epic 1.3 file. The `RateLimiter` interface and `checkRateLimit()` signature are **identical** — auth route files do not change.

```typescript
// src/lib/rate-limit.ts

import { Ratelimit } from "@upstash/ratelimit";
import type { NextResponse } from "next/server";
import { redis } from "./redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

/** Converts milliseconds to the Upstash Duration string format. */
function msToDuration(
  ms: number,
): `${number} ms` | `${number} s` | `${number} m` | `${number} h` | `${number} d` {
  if (ms % 86_400_000 === 0) return `${ms / 86_400_000} d`;
  if (ms % 3_600_000 === 0) return `${ms / 3_600_000} h`;
  if (ms % 60_000 === 0) return `${ms / 60_000} m`;
  if (ms % 1_000 === 0) return `${ms / 1_000} s`;
  return `${ms} ms`;
}

/**
 * Redis-backed sliding-window rate limiter via Upstash.
 * Fails open: if Redis is unavailable the request is allowed through.
 */
export function createRedisRateLimiter(): RateLimiter {
  return {
    async check(key, limit, windowMs): Promise<RateLimitResult> {
      try {
        const limiter = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(limit, msToDuration(windowMs)),
          prefix: "@upstash/ratelimit",
        });
        const { success, remaining, reset } = await limiter.limit(key);
        return { allowed: success, remaining, resetAt: new Date(reset) };
      } catch {
        // Fail open: Redis unavailability is monitored via /api/health
        return { allowed: true, remaining: -1, resetAt: new Date() };
      }
    },
  };
}

export const rateLimiter: RateLimiter = createRedisRateLimiter();

/**
 * Drop-in helper for API routes. Returns a 429 NextResponse if rate limited,
 * or null if the request is allowed. Identical signature to Epic 1.3 shim.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const { NextResponse } = await import("next/server");
  const result = await rateLimiter.check(key, limit, windowMs);
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
    return NextResponse.json(
      { error: "auth.errors.rateLimited", retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetAt.toISOString(),
        },
      },
    );
  }
  return null;
}
```

**Auth route rate limit values (unchanged from Epic 1.3):**

| Route                          | Limit | Window | Key pattern                       |
| ------------------------------ | ----- | ------ | --------------------------------- |
| POST /api/auth/register        | 10    | 1 hr   | `register:${anonymizedIp}`        |
| POST /api/auth/login           | 5     | 15 min | `login:${anonymizedIp}:${email}`  |
| POST /api/auth/forgot-password | 3     | 1 hr   | `forgot:${anonymizedIp}:${email}` |
| POST /api/auth/reset-password  | 5     | 15 min | `reset:${token.slice(0,8)}`       |
| POST /api/auth/verify-email    | 5     | 15 min | `verify:${anonymizedIp}`          |

---

## 3. Durable Cache Abstraction

```typescript
// src/lib/cache.ts

import { redis } from "./redis";

/**
 * Application-level durable cache backed by Upstash Redis.
 * All keys use the "cache:" prefix to avoid collision with rate-limit keys.
 * All methods fail silently — cache misses/errors are non-fatal.
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      return await redis.get<T>(`cache:${key}`);
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(`cache:${key}`, value, { ex: ttlSeconds });
    } catch {}
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(`cache:${key}`);
    } catch {}
  },

  /**
   * Deletes all cache keys matching the given prefix (without the "cache:" namespace).
   * Example: invalidateByPrefix("project:abc123:") deletes all keys for that project.
   * Uses SCAN to avoid blocking Redis on large keyspaces.
   */
  async invalidateByPrefix(prefix: string): Promise<void> {
    try {
      let cursor = 0;
      do {
        const [nextCursor, keys] = await redis.scan(cursor, {
          match: `cache:${prefix}*`,
          count: 100,
        });
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...(keys as [string, ...string[]]));
        }
      } while (cursor !== 0);
    } catch {}
  },
};
```

**Key namespace convention (for Phase 2 implementors):**

```
cache:health                           ← /api/health response (30s TTL)
cache:project:{id}:persons:list        ← Phase 2: persons list queries
cache:project:{id}:persons:{personId}  ← Phase 2: single person
cache:project:{id}:events:list         ← Phase 2: events list
cache:project:{id}:stats               ← Phase 4: dashboard stats
```

**Health endpoint caching (only cache usage in this epic):**

The `/api/health` route uses `cache.get` / `cache.set` with a **30-second TTL** to avoid redundant DB and Redis pings from monitoring tools. The HTTP `Cache-Control: no-store` header is still set (prevents CDN/browser caching); the 30s TTL is server-side only.

---

## 4. Output Sanitization Stub

```typescript
// src/lib/sanitize.ts

/**
 * Strips <script> tags from user-supplied strings before DB writes.
 * Applied at all write boundaries where user text is stored.
 *
 * NOTE: Replace with sanitize-html in Epic 2.1 when rich-text fields are introduced.
 * The upgrade is a single-line change in this file; all call sites remain unchanged.
 */
export function sanitize(input: string): string {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}
```

**Where to apply:** Call `sanitize()` on all free-text user inputs before `db.create()` / `db.update()` calls. In this epic, no entity write routes exist yet — the function is defined here and called by auth routes on the `name` field in `POST /api/auth/register`.

---

## 5. Environment Variable Validation (`env.ts`)

Add to the existing `env.ts` Zod schema:

```typescript
// src/lib/env.ts — additions to server schema

UPSTASH_REDIS_REST_URL: z.string().url(),
UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
```

---

## 6. Security Headers (`next.config.ts`)

Full replacement of `next.config.ts`. Two additions: `poweredByHeader: false` and the `headers()` export.

```typescript
// next.config.ts

import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'", // required: Tailwind CSS inline styles
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      // Security headers on all routes
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Cache-Control: no-store on all API routes
      {
        source: "/api/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
```

**Notes:**

- `style-src 'unsafe-inline'` is required by Tailwind CSS v4 (CSS-in-JS injection at runtime). Tightening to nonces is deferred to Epic 5.4.
- `Strict-Transport-Security` is intentionally omitted — Vercel sets it automatically on all production deployments.
- `frame-ancestors 'none'` duplicates `X-Frame-Options: DENY` for CSP Level 3 browser coverage.

---

## 7. API Health Endpoint Extension

Modify `src/app/api/health/route.ts` to add Redis status alongside the existing DB status.

**Response shape:**

```typescript
interface HealthResponse {
  status: "ok" | "degraded" | "error";
  version: string;
  db: {
    status: "ok" | "error";
    latencyMs: number;
    migration: string | null;
  };
  redis: {
    status: "ok" | "error";
    latencyMs: number;
  };
  timestamp: string; // ISO 8601
}
```

**`status` derivation:**

| DB    | Redis | `status`     |
| ----- | ----- | ------------ |
| ok    | ok    | `"ok"`       |
| ok    | error | `"degraded"` |
| error | ok    | `"degraded"` |
| error | error | `"error"`    |

**Redis check implementation:**

```typescript
const redisStart = Date.now();
let redisStatus: "ok" | "error" = "error";
try {
  const pong = await redis.ping();
  if (pong === "PONG") redisStatus = "ok";
} catch {}
const redisLatencyMs = Date.now() - redisStart;
```

**HTTP status code:** Always `200`. Consumers check the JSON `status` field, not the HTTP status, to distinguish degraded from healthy. (Monitoring tools that need non-200 for alerting can be configured to check the JSON body.)

**Example response:**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "db": { "status": "ok", "latencyMs": 11, "migration": "20250301000000_init" },
  "redis": { "status": "ok", "latencyMs": 7 },
  "timestamp": "2026-03-07T10:00:00.000Z"
}
```

---

## 8. Debug & Test Route Removal

### 8.1 File deletion

Delete these files if they exist (created speculatively during earlier epics):

```
src/app/api/debug/         ← delete entire directory
src/app/api/test/          ← delete entire directory
```

### 8.2 Middleware defense-in-depth

Add to `src/middleware.ts` — block any debug/test API paths regardless of environment:

```typescript
// In the middleware matcher config or early in the middleware function:
const BLOCKED_PATHS = [/^\/api\/debug(\/|$)/, /^\/api\/test(\/|$)/];

if (BLOCKED_PATHS.some((re) => re.test(request.nextUrl.pathname))) {
  return new NextResponse(null, { status: 404 });
}
```

Place this check **before** the next-intl and auth checks so it is always applied.

---

## 9. GitHub Actions CI/CD Pipeline

### 9.1 Workflow file

```yaml
# .github/workflows/ci.yml

name: CI / CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: "9" }
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: "9" }
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: "9" }
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
        env:
          UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
          UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}

  build-test-deploy:
    name: Build → E2E → Deploy
    needs: [lint, typecheck, unit-tests]
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      DATABASE_URL_UNPOOLED: ${{ secrets.DATABASE_URL_UNPOOLED }}
      AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
      UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
      UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}
      RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: "9" }
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile

      - name: Run DB migrations
        run: pnpm prisma migrate deploy
        env:
          # Migrations require a direct (non-pooled) connection
          DATABASE_URL: ${{ secrets.DATABASE_URL_UNPOOLED }}

      - name: Build
        run: pnpm build

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Start server
        run: pnpm start &

      - name: Wait for server
        run: pnpm exec wait-on http://localhost:3000 --timeout 30000

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Deploy to Vercel
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: pnpm dlx vercel --prod --yes --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 9.2 Vercel build command

In the Vercel project settings, set:

| Setting          | Value                            |
| ---------------- | -------------------------------- |
| Build Command    | `next build`                     |
| Install Command  | `pnpm install --frozen-lockfile` |
| Output Directory | `.next`                          |
| Root Directory   | _(leave empty — monorepo root)_  |

`prisma migrate deploy` is **not** in the Vercel build command. It runs as a dedicated CI step with `DATABASE_URL_UNPOOLED` before `next build`. This prevents preview deployments from running migrations.

### 9.3 Vercel automatic Git integration

Disable Vercel's automatic GitHub deployment in the Vercel project settings → Git → "Ignored Build Step". Set the ignored build command to `exit 0` (always skip auto-deploys). CI controls all deployments exclusively.

### 9.4 Required GitHub Actions secrets

| Secret                     | Used in                                     |
| -------------------------- | ------------------------------------------- |
| `DATABASE_URL`             | E2E test runtime (pooled connection)        |
| `DATABASE_URL_UNPOOLED`    | `prisma migrate deploy` (direct connection) |
| `AUTH_SECRET`              | Build + E2E runtime                         |
| `UPSTASH_REDIS_REST_URL`   | Unit tests + build + E2E runtime            |
| `UPSTASH_REDIS_REST_TOKEN` | Same                                        |
| `RESEND_API_KEY`           | E2E tests that trigger email flows          |
| `VERCEL_TOKEN`             | `vercel --prod` deploy step                 |
| `VERCEL_ORG_ID`            | `vercel --prod`                             |
| `VERCEL_PROJECT_ID`        | `vercel --prod`                             |

`DATABASE_URL` and `DATABASE_URL_UNPOOLED` point to the **dedicated `ci` Neon branch** — not the `main` branch and not the `dev` branch. This branch must be created once via the Neon console and have migrations applied before first CI run.

---

## 10. Testing Plan

### Unit tests (all mocked — no real Redis)

**`src/lib/rate-limit.test.ts`**

Mock `@upstash/ratelimit` at module level:

```typescript
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: {
    slidingWindow: vi.fn(),
    // constructor mock set per test
  },
}));
```

| Test                                                  | Assertion                                            |
| ----------------------------------------------------- | ---------------------------------------------------- |
| allowed: limiter returns `success: true`              | `result.allowed === true`, `result.remaining === N`  |
| denied: limiter returns `success: false`              | `result.allowed === false`, `result.remaining === 0` |
| fail open: limiter throws                             | `result.allowed === true`, `result.remaining === -1` |
| `checkRateLimit` returns null when allowed            | response is `null`                                   |
| `checkRateLimit` returns 429 NextResponse when denied | status 429, body has `retryAfter`                    |
| `msToDuration` converts 3600000 → `"1 h"`             | string equality                                      |
| `msToDuration` converts 900000 → `"15 m"`             | string equality                                      |

**`src/lib/cache.test.ts`**

Mock `src/lib/redis.ts`:

| Test                                                             | Assertion                                           |
| ---------------------------------------------------------------- | --------------------------------------------------- |
| `get()` returns null on cache miss                               | `redis.get` returns null → `cache.get` returns null |
| `get()` returns typed value on hit                               | `redis.get` returns `{ foo: 1 }` → typed result     |
| `get()` returns null when redis throws                           | no exception propagated                             |
| `set()` calls `redis.set` with `cache:` prefix and `{ ex: ttl }` | mock called with correct args                       |
| `set()` is silent when redis throws                              | no exception                                        |
| `del()` calls `redis.del` with `cache:` prefix                   | mock called                                         |
| `invalidateByPrefix()` scans and deletes matching keys           | SCAN mock returns keys, DEL called                  |
| `invalidateByPrefix()` is silent when redis throws               | no exception                                        |

**`src/lib/sanitize.test.ts`**

| Test                              | Assertion |
| --------------------------------- | --------- |
| Strips inline `<script>`          | `"Hello"` |
| Strips `<script>` with attributes | `""`      |
| Strips multi-line `<script>`      | stripped  |
| Passes clean string unchanged     | identity  |
| Empty string → empty string       | identity  |

**`src/app/api/health/route.test.ts`** (extend existing)

Mock `src/lib/redis.ts`:

| Test                                          | Assertion                                     |
| --------------------------------------------- | --------------------------------------------- |
| Both DB and Redis OK                          | `status: "ok"`, `redis.status: "ok"`          |
| Redis fails, DB OK                            | `status: "degraded"`, `redis.status: "error"` |
| DB fails, Redis OK                            | `status: "degraded"`, `db.status: "error"`    |
| Both fail                                     | `status: "error"`                             |
| Response includes `timestamp` ISO string      | regex match                                   |
| Response includes `redis.latencyMs` as number | `typeof result.redis.latencyMs === "number"`  |

### E2E tests

Add to `e2e/security.spec.ts`:

| Test ID | Scenario                              | Assertion                                       |
| ------- | ------------------------------------- | ----------------------------------------------- |
| SEC-01  | GET `/` — security headers            | All 6 headers present with correct values       |
| SEC-02  | GET `/` — no X-Powered-By             | Header absent                                   |
| SEC-03  | GET `/api/health`                     | `status: "ok"`, `redis` field present, HTTP 200 |
| SEC-04  | GET `/api/health` — Cache-Control     | `Cache-Control: no-store` header present        |
| SEC-05  | POST `/api/auth/register` 11× same IP | 11th response is HTTP 429 with `retryAfter`     |

**Note on SEC-05:** Hit the endpoint 11 times in a tight loop within the test. The 11th must be 429. After the test, the rate limit key in Redis will persist — the E2E suite must use a unique test email/IP pattern to avoid state leakage between runs (or flush the test key via the Redis client in `afterEach`).

---

## 11. i18n

No new translation keys. All rate limit error messages (`auth.errors.rateLimited`) were defined in Epic 1.3.

---

## 12. File Structure

New and modified files this epic touches:

```
src/
  lib/
    redis.ts              NEW — Upstash Redis singleton
    rate-limit.ts         REPLACE — swap lru-cache shim for Upstash sliding window
    cache.ts              NEW — durable cache abstraction
    sanitize.ts           NEW — thin sanitize() stub
    env.ts                MODIFY — add UPSTASH_REDIS_REST_URL / TOKEN to schema
  app/
    api/
      health/
        route.ts          MODIFY — add redis ping + redis field in response
      debug/              DELETE (if exists)
      test/               DELETE (if exists)
  middleware.ts            MODIFY — add BLOCKED_PATHS guard at top

next.config.ts             MODIFY — add poweredByHeader, headers(), CSP

.github/
  workflows/
    ci.yml                NEW — lint / typecheck / unit / build / E2E / deploy

e2e/
  security.spec.ts         NEW — SEC-01 through SEC-05
```

---

## 13. Implementation Notes

1. **`pnpm add wait-on`** as a dev dependency — required by the CI "wait for server" step. Add to `devDependencies`.

2. **`@upstash/ratelimit` instance creation per call:** The `Ratelimit` class holds no TCP connection — it is safe to instantiate per `check()` call. State lives in Redis, not in the object. This keeps the `RateLimiter` interface simple (no factory lookup by limit/window combination).

3. **`cache:` prefix is applied inside `cache.ts`:** Callers pass bare keys (`"health"`, `"project:abc:persons:list"`). The module adds the `cache:` prefix internally. This avoids callers accidentally omitting the namespace.

4. **`invalidateByPrefix` SCAN loop:** Redis `SCAN` with `count: 100` is a hint, not a guarantee — Redis may return more or fewer keys. The `cursor === 0` termination condition is correct regardless of batch size.

5. **Vercel environment variables:** After setting up CI secrets, also add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to the Vercel project env vars (Settings → Environment Variables) for production runtime. The CI job only provides them at build time.

6. **`prisma generate` in CI:** The `pnpm install` step does not always regenerate the Prisma client. Add `pnpm prisma generate` as an explicit step before `pnpm build` if the build fails with "PrismaClient is not a constructor" errors.

7. **E2E rate limit test cleanup:** The `ci` Neon branch is shared across runs. Rate limit keys in Redis may persist. Use a unique identifier per test run (e.g., timestamp-based email) and flush test keys in `afterAll` using the Redis client directly.

8. **CSP and Next.js dev mode:** In `next dev`, Next.js injects hot-reload scripts from `localhost`. If CSP blocks HMR, add a `NODE_ENV === "development"` guard in `next.config.ts` to skip or relax the CSP header locally.

---

## 14. Acceptance Criteria

1. `GET /api/health` returns `{ status: "ok", db: { status: "ok", ... }, redis: { status: "ok", latencyMs: <number> }, version: "...", timestamp: "..." }` in both local dev and production.
2. `GET /api/health` when Redis is unreachable returns `{ status: "degraded", redis: { status: "error" } }` — HTTP status is still 200.
3. Hitting `POST /api/auth/register` 11 times in quick succession from the same IP returns HTTP 429 on the 11th request, with `{ error: "auth.errors.rateLimited", retryAfter: <number> }` in the body.
4. The 429 response includes `Retry-After` and `X-RateLimit-Reset` headers.
5. `GET /` (or any page) response includes all of: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), ...`, `Content-Security-Policy` (non-empty directive set).
6. `GET /` response does **not** include an `X-Powered-By` header.
7. `GET /api/health` response includes `Cache-Control: no-store` header.
8. `sanitize("<script>alert(1)</script>Hello")` returns `"Hello"` (unit test passes).
9. `GET /api/debug/anything` returns HTTP 404 in all environments.
10. `GET /api/test/anything` returns HTTP 404 in all environments.
11. `lru-cache` is not present in `package.json` dependencies.
12. `@upstash/redis` and `@upstash/ratelimit` are present in `package.json` dependencies.
13. GitHub Actions CI pipeline: all jobs (lint, typecheck, unit tests, build, E2E) pass on a PR to `main`.
14. On push to `main`, the pipeline deploys to Vercel **after** all test jobs pass — deploy job does not run on PRs.
15. Vercel build command is `next build` — confirmed in Vercel project settings (no `prisma migrate deploy` in Vercel build).
16. `prisma migrate deploy` runs in CI against the `ci` Neon branch, using `DATABASE_URL_UNPOOLED`.

---

## 15. Out of Scope

- Nonce-based CSP policy — deferred to Epic 5.4 security hardening
- `sanitize-html` library — deferred to Epic 2.1 (see roadmap note)
- Sentry error tracking and Vercel Analytics — deferred to Epic 5.4
- Redis caching of Phase 2 entity lists (persons, events, dashboard stats) — no routes exist; `cache.ts` abstraction is built, not yet wired to entity routes
- Per-PR isolated Neon branch creation — fixed `ci` branch is sufficient
- `report-uri` / CSP violation reporting endpoint
- Rate limiting on non-auth API routes — pattern established, implementation deferred to Phase 2 as routes are built
- Vercel KV environment variable migration — stay on Upstash native vars throughout all phases
