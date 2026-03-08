# Test Plan — Epic 1.4: Security Infrastructure & CI/CD

## Scope

**In scope:**

- HTTP security headers on all responses
- X-Powered-By header removal
- `/api/health` Redis field and response shape
- Cache-Control on API routes
- Rate limiting (429 after limit exceeded)
- `/api/debug` and `/api/test` blocking (404)
- Sanitize utility function
- GitHub Actions CI pipeline structure

**Out of scope:**

- CSP nonce enforcement (Epic 5.4)
- Sentry/Vercel Analytics (Epic 5.4)
- Per-PR Neon branch isolation

## Test Environment

- Browser: Chromium (primary), Firefox (secondary)
- Base URL: `http://localhost:3000`
- Required seed data: admin user `admin@evidoxa.dev` / `Demo1234!`
- Real Upstash Redis required for SEC-05 (rate limiting). Tests run with placeholder credentials produce fail-open behavior.

---

## Test Cases

### TC-01 / SEC-01: Security headers on GET /

**Objective:** Verify all 6 required security headers are present on page responses.
**Preconditions:** Dev server running.
**Steps:**

1. Open browser DevTools → Network tab.
2. Navigate to `http://localhost:3000/de`.
3. Select the `/de` response and inspect Response Headers.
   **Expected:**

- `x-content-type-options: nosniff`
- `x-frame-options: DENY`
- `x-xss-protection: 1; mode=block`
- `referrer-policy: strict-origin-when-cross-origin`
- `permissions-policy: camera=(), microphone=(), geolocation=()`
- `content-security-policy` present and non-empty (contains `default-src 'self'`)
  **Linked AC:** AC-5

---

### TC-02 / SEC-02: X-Powered-By header absent

**Objective:** Confirm Next.js does not leak server identity.
**Preconditions:** Dev server running.
**Steps:**

1. Navigate to `http://localhost:3000/de`.
2. Inspect response headers in DevTools → Network.
   **Expected:** `x-powered-by` header is **absent**.
   **Linked AC:** AC-6

---

### TC-03 / SEC-03: GET /api/health — Redis field present

**Objective:** Verify health endpoint returns Redis status in response body.
**Preconditions:** Dev server running.
**Steps:**

1. Navigate to `http://localhost:3000/api/health` (or use curl/fetch in DevTools console).
2. Inspect JSON response.
   **Expected:**

- HTTP 200
- `status` is one of `"ok"` | `"degraded"` | `"error"`
- `redis` field present with `status` and `latencyMs`
- `db` field present
- `version` string present
- `timestamp` ISO 8601 string present
  **Note:** With placeholder Upstash credentials, `redis.status` will be `"error"` and overall `status` will be `"degraded"`. This is expected until real credentials are set.
  **Linked AC:** AC-1

---

### TC-04 / SEC-04: GET /api/health — Cache-Control header

**Objective:** Verify health endpoint response carries `Cache-Control: no-store`.
**Preconditions:** Dev server running.
**Steps:**

1. In DevTools console: `fetch('/api/health').then(r => console.log(r.headers.get('cache-control')))`
2. Observe logged value.
   **Expected:** `"no-store"`
   **Linked AC:** AC-7

---

### TC-05 / SEC-05: Rate limiting on POST /api/auth/register

**Objective:** Confirm 11th request from the same IP is rejected with 429.
**Preconditions:** Real Upstash Redis credentials configured in `.env.local`. Dev server restarted.
**Steps:**

1. Open DevTools console on any page.
2. Run:

```javascript
for (let i = 0; i < 11; i++) {
  const r = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `test${i}@example.com`, name: "Test", password: "Secure1!" }),
  });
  console.log(i + 1, r.status);
}
```

3. Observe the last logged status.
   **Expected:** First 10 responses are 201 or 409 (email-dependent). 11th response is `429` with body `{ error: "auth.errors.rateLimited", retryAfter: <number> }`.
   **Linked AC:** AC-3, AC-4

---

### TC-06: /api/debug/\* returns 404

**Objective:** Debug routes are blocked at the middleware level.
**Preconditions:** Dev server running.
**Steps:**

1. Navigate to `http://localhost:3000/api/debug/anything`.
2. Observe response.
   **Expected:** HTTP 404 (not 200 or 500).
   **Linked AC:** AC-9

---

### TC-07: /api/test/\* returns 404

**Objective:** Test routes are blocked at the middleware level.
**Preconditions:** Dev server running.
**Steps:**

1. Navigate to `http://localhost:3000/api/test/foo/bar`.
2. Observe response.
   **Expected:** HTTP 404.
   **Linked AC:** AC-10

---

### TC-08: lru-cache not in dependencies

**Objective:** Verify lru-cache was removed from package.json.
**Steps:**

1. Inspect `package.json` dependencies and devDependencies.
   **Expected:** No `lru-cache` entry.
   **Linked AC:** AC-11

---

### TC-09: @upstash packages in dependencies

**Objective:** Verify new packages are correctly declared.
**Steps:**

1. Inspect `package.json` dependencies.
   **Expected:** `@upstash/redis` and `@upstash/ratelimit` both present.
   **Linked AC:** AC-12

---

### TC-10: sanitize() unit behaviour

**Objective:** Script tags stripped from user text.
**Steps:** Run `pnpm test src/lib/sanitize.test.ts`
**Expected:** All 6 sanitize tests pass. Specifically `sanitize("<script>alert(1)</script>Hello") === "Hello"`.
**Linked AC:** AC-8

---

### TC-11: GitHub Actions CI pipeline structure

**Objective:** Verify CI YAML is syntactically valid and covers all required jobs.
**Steps:**

1. Inspect `.github/workflows/ci.yml`.
2. Verify jobs: `lint`, `typecheck`, `unit-tests`, `build-test-deploy`.
3. Verify `build-test-deploy` has `needs: [lint, typecheck, unit-tests]`.
4. Verify deploy step has `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`.
   **Expected:** All jobs present. Deploy only runs on main push.
   **Linked AC:** AC-13, AC-14

---

### TC-12: health endpoint degraded on Redis failure

**Objective:** When Redis is unreachable, health still returns HTTP 200 with degraded status.
**Note:** Verifiable with placeholder credentials (Redis always unreachable locally).
**Steps:**

1. Navigate to `http://localhost:3000/api/health`.
2. With placeholder Upstash credentials, observe JSON.
   **Expected:** HTTP 200, `{ status: "degraded", redis: { status: "error" }, db: { status: "ok" } }`.
   **Linked AC:** AC-2
