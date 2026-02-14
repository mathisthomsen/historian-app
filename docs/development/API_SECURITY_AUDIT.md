# API security audit (Feb 2026)

Summary of findings and fixes for `/app/api` and related auth flows.

---

## Fixes applied

### 1. **auth/check-user** – user enumeration & info disclosure
- **Issue:** Unauthenticated POST with any email returned user id, email, emailVerified, emailVerifiedAt (enumeration + disclosure).
- **Fix:** Endpoint now requires authentication and returns only the **current session user’s** verification status. No email in body; no enumeration.
- **Login flow:** Login page no longer calls check-user first. It calls `signIn('credentials', ...)` directly. The credentials provider throws `EmailNotVerified` when the user exists but is unverified, and the client shows the resend UI when `result?.error === 'EmailNotVerified'`. If your NextAuth version does not pass this error through, you may see a generic credentials error; in that case consider a rate-limited endpoint that returns only `{ emailVerified: boolean }` and never 404.

### 2. **debug/env** – env disclosure
- **Issue:** GET returned which env vars are set and a short preview of `DATABASE_URL`.
- **Fix:** Route now returns 404 in production (`NODE_ENV === 'production'`). Safe to keep for local/debug.

### 3. **auth/reset-request** – no rate limiting
- **Issue:** Unauthenticated POST could be used to send many reset emails (DoS / email bombing).
- **Fix:** Rate limit added: 5 requests per minute per IP (same pattern as verify/resend-verification).

### 4. **auth/resend-verification** – user enumeration
- **Issue:** 404 “User not found” revealed whether an email is registered.
- **Fix:** When user is not found, respond with 200 and a generic message (no distinction from success).

### 5. **register** – no rate limiting
- **Issue:** Mass account creation possible.
- **Fix:** Rate limit added: 5 requests per minute per IP.

### 6. **Verify page** – redundant check-user call
- **Issue:** After “Invalid verification token”, the verify page called check-user with email, leaking existence.
- **Fix:** Removed that call. The verify API already returns 200 “Email is already verified” when the token is invalid but the user is verified, so the first verify response is enough.

---

## Routes left as-is (by design)

| Route | Reason |
|-------|--------|
| **auth/verify** | Token + email in URL; rate-limited; validates token and email match. |
| **auth/reset-password** | Token + email + password; single-use token; consider adding rate limit if needed. |
| **auth/[...nextauth]** | NextAuth handler; public. |
| **health** | Often public for load balancers; exposes uptime/version (optional to restrict). |

---

## Recommendations for production

### Test/debug routes
- **api/test**, **api/simple-test**, **api/test-person-event-relations**: No auth; no sensitive data. Consider removing or returning 404 in production (e.g. `if (process.env.NODE_ENV === 'production') return NextResponse.json({}, { status: 404 })`).

### Auth error handling
- **requireUser()** throws when there is no session; many routes don’t catch it, so unauthenticated requests can get 500 instead of 401. Consider a wrapper that catches and returns 401, or have `requireUser` return `null` and let each route return 401 when null.

### Optional hardening
- **auth/reset-password**: Add rate limiting (e.g. 5/min per IP) to limit token brute-force.
- **health**: If you don’t want to expose version/uptime, strip those fields or restrict by IP in production.

---

## Middleware – route protection

- **Added:** `middleware.ts` at project root using `next-auth/middleware`. Session strategy must be **JWT** (already set in `authOptions`).
- **Protected paths:** `/dashboard`, `/events`, `/persons`, `/sources`, `/statements`, `/person-relations`, `/person-event-relations`, `/locations`, `/locations-manage`, `/timeline`, `/analytics`, `/activity`, `/account`, `/bibliography-sync`, `/literature` (and all nested paths).
- **Public:** `/`, `/auth/*`, `/funktionen`, `/blog`, `/imprint`, `/privacy`, `/contact`, `/api` (API routes enforce auth via `requireUser()`), `/_next`, static assets.
- **Behavior:** Unauthenticated requests to a protected path get a redirect to `pages.signIn` (`/auth/login`). No flash of protected content; check happens at the edge before the page runs.
- **Optional:** To protect additional routes (e.g. `/datagrid-test` in production), add them to the `matcher` in `middleware.ts`.

---

## Data pages (dashboard, persons, events, sources, etc.) – reviewed

- **Secrets in client:** No `process.env` usage in data-page components except `ErrorBoundary` (only shows `NODE_ENV` and, in development, error stack). No API keys or secrets in client bundles.
- **Error handling:** Dashboard, persons, events, sources, statements use generic user-facing messages (`"Failed to load..."`, `"Serverfehler..."`, `"Bitte melden Sie sich an"`). No raw `error.message` or stack shown in production.
- **ErrorBoundary:** Error details and stack are shown only when `NODE_ENV === 'development'`; production users see a generic "Something went wrong" and retry/refresh.
- **Logging:** Email service `sendEmail` no longer logs recipient, API key presence, or from-address in production; Resend errors and success id are logged only in development.

---

## Auth UI (`/app/auth`) – reviewed

- **Redirects:** Login uses fixed redirect to `/dashboard`; no user-controlled `callbackUrl`. Logout to `/auth/login` or `/`.
- **Token/email in URL:** Verify and reset-password use query params as intended; rely on HTTPS and short-lived tokens.
- **Error handling:** Forgot-password, register, and login (resend) now check API response and show errors including 429.
- **User enumeration:** Forgot-password and resend-verification use generic messages; no “user not found” in UI.

---

## Checklist for new API routes

- [ ] Auth: Use `requireUser()` (or equivalent) for routes that need a logged-in user.
- [ ] Authorization: For project/resource access, check membership or ownership (e.g. `checkProjectAccess`) before reading/updating.
- [ ] Input: Validate and sanitize body/query (e.g. Zod); avoid raw SQL with user input.
- [ ] Rate limiting: For login, registration, password reset, and other sensitive or expensive actions, use a per-IP rate limiter.
- [ ] Responses: Avoid leaking existence of users/resources (e.g. prefer generic “Invalid request” over “User not found” where it reveals existence).
