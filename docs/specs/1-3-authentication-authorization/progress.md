# Progress — Epic 1.3 — Authentication & Authorization

**Status:** ✅ Complete
**Started:** 2026-03-07
**Completed:** 2026-03-07

---

## Phases

### Phase 1 — Foundation (Schema + Deps + Env)

- ✅ Install dependencies (next-auth, bcryptjs, resend, lru-cache, react-hook-form, @hookform/resolvers)
- ✅ Update Prisma schema (User fields + 3 new tables + AuditAction enum)
- ✅ Run `prisma migrate dev` → apply migration to Neon
- ✅ Update `src/lib/env.ts` (AUTH_SECRET, AUTH_URL, BCRYPT_ROUNDS, RESEND_FROM_EMAIL)
- ✅ Add env vars to `.env.local`

### Phase 2 — Backend Utilities

- ✅ `src/types/auth.d.ts` — Session/JWT type augmentation
- ✅ `src/lib/security.ts` + unit tests
- ✅ `src/lib/password.ts` + unit tests
- ✅ `src/lib/rate-limit.ts` + unit tests
- ✅ `src/lib/audit.ts` + unit tests
- ✅ `src/lib/email.ts` + unit tests
- ✅ `src/lib/auth-guard.ts`
- ✅ `src/auth.config.ts` (edge-safe, used by middleware)
- ✅ `src/auth.ts` (full Node.js auth with Credentials provider)
- ✅ `src/app/api/auth/[...nextauth]/route.ts`
- ✅ `src/app/api/auth/register/route.ts`
- ✅ `src/app/api/auth/verify-email/route.ts`
- ✅ `src/app/api/auth/forgot-password/route.ts`
- ✅ `src/app/api/auth/reset-password/route.ts`
- ✅ `src/middleware.ts` — uses authConfig (edge-safe, no Node.js modules)
- ✅ `prisma/seed.ts` — admin user with bcrypt hash + email_verified_at

### Phase 3 — Frontend (i18n + Layouts + Components)

- ✅ `messages/de.json` — full `auth.*` namespace
- ✅ `messages/en.json` — full `auth.*` namespace
- ✅ `src/app/[locale]/(auth)/layout.tsx` — centered card layout, no AppShell
- ✅ `src/app/[locale]/(auth)/auth/login/page.tsx`
- ✅ `src/app/[locale]/(auth)/auth/register/page.tsx`
- ✅ `src/app/[locale]/(auth)/auth/verify/page.tsx`
- ✅ `src/app/[locale]/(auth)/auth/forgot-password/page.tsx`
- ✅ `src/app/[locale]/(auth)/auth/reset-password/page.tsx`
- ✅ `src/app/[locale]/(app)/layout.tsx` — AppShell wrapper
- ✅ `src/app/[locale]/(app)/dashboard/page.tsx` — session-aware welcome page
- ✅ `src/app/[locale]/page.tsx` — redirects authed→dashboard, unauthed→login
- ✅ `src/components/auth/PasswordStrengthIndicator.tsx` + tests
- ✅ `src/components/auth/LoginForm.tsx` + tests
- ✅ `src/components/auth/RegisterForm.tsx` + tests (translated Zod errors)
- ✅ `src/components/auth/ForgotPasswordForm.tsx` + tests
- ✅ `src/components/auth/ResetPasswordForm.tsx` + tests
- ✅ `src/components/auth/VerifyEmailCard.tsx` + tests

### Phase 4 — Integration & Testing

- ✅ Update `e2e/smoke.spec.ts` (target auth pages for locale/theme tests)
- ✅ `e2e/helpers/db.ts` — token insertion + user cleanup helpers
- ✅ `e2e/auth.spec.ts` — 17 test groups, serial mode, unique test emails
- ✅ `playwright.config.ts` — loads .env.local into test runner process
- ✅ `pnpm typecheck` — 0 errors
- ✅ `pnpm lint` — 0 errors
- ✅ `pnpm test` — 73 unit tests passing
- ✅ `pnpm test:e2e` — 64 E2E tests passing (Chromium + Firefox)
- ✅ `pnpm build` — production build succeeds
- ✅ Live browser verification (all key ACs verified in Chrome via Playwright MCP)

---

## Acceptance Criteria

| AC  | Description                                                          | Status |
| --- | -------------------------------------------------------------------- | ------ |
| 1   | `/de/auth/login` renders login form, no AppShell                     | ✅     |
| 2   | `/de/auth/register` renders registration form with password strength | ✅     |
| 3   | Weak password shows field-level errors, no submit                    | ✅     |
| 4   | Successful registration shows success card                           | ✅     |
| 5   | Duplicate email returns 409 with error message                       | ✅     |
| 6   | Valid verify token → success state + login link                      | ✅     |
| 7   | Expired/invalid verify token → error state + re-request link         | ✅     |
| 8   | Verified user can login and reach /de/dashboard                      | ✅     |
| 9   | Wrong credentials → generic error, no field hint                     | ✅     |
| 10  | Unverified account → "Bitte bestätige..." message                    | ✅     |
| 11  | /de/dashboard while unauthed redirects to login                      | ✅     |
| 12  | /de/dashboard while authed renders user name                         | ✅     |
| 13  | Logout clears session, redirects to login                            | ✅     |
| 14  | Forgot password → success card (known and unknown email)             | ✅     |
| 15  | Valid reset token → new password → redirect → success banner         | ✅     |
| 16  | Expired reset token → error card                                     | ✅     |
| 17  | Rate limiting active in production (LRU shim; Redis in Epic 1.4)     | ✅     |
| 18  | 10 register requests in 1 hour → 429 (production)                    | ✅     |
| 19  | Auth pages switch language on locale toggle                          | ✅     |
| 20  | env.ts fails if AUTH_SECRET missing/short                            | ✅     |
| 21  | email_confirmations stores SHA-256 hash, not raw token               | ✅     |
| 22  | password_resets stores SHA-256 hash, not raw token                   | ✅     |
| 23  | auth_audit_logs captures LOGIN_FAILED with anonymized IP             | ✅     |
| 24  | users table has new auth columns                                     | ✅     |
| 25  | GET /api/health accessible without auth                              | ✅     |
