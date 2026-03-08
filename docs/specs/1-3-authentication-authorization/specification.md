# Epic 1.3 — Authentication & Authorization
## Specification

**Phase:** 1 — Foundation & Auth
**Deliverable:** Full auth flow: register, login, email verification, password reset, session management. All pages accessible in browser.
**Verifiable:** Register → verify email → login → see dashboard shell → logout cycle works end-to-end in the browser.

---

## 1. Technology Stack

New dependencies introduced in this epic:

| Package | Version | Type | Purpose |
|---|---|---|---|
| `next-auth` | `^5.0.0` | prod | Auth.js v5 — session, JWT, Credentials provider |
| `bcryptjs` | `^2.4.3` | prod | Password hashing (pure JS, edge-compatible) |
| `@types/bcryptjs` | `^2.4.6` | dev | TypeScript types for bcryptjs |
| `resend` | `^4` | prod | Transactional email delivery |
| `lru-cache` | `^11` | prod | In-process rate limiter shim (replaced by Redis in Epic 1.4) |

> **Note:** Auth.js v5 uses `AUTH_SECRET` / `AUTH_URL` env var names (not `NEXTAUTH_SECRET` / `NEXTAUTH_URL` from v4).

---

## 2. Data Model / Schema

### 2.1 User table — new columns (migration)

Add to `model User` in `prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields unchanged ...

  // Epic 1.3 additions:
  password_hash      String?   // null = no password (future OAuth support)
  email_verified_at  DateTime? // null = not yet verified
  last_login_at      DateTime? // updated on every successful login
  failed_login_count Int       @default(0) // consecutive failures; reset on success
  locked_until       DateTime? // non-null = account temporarily locked

  // New relations:
  email_confirmations EmailConfirmation[]
  password_resets     PasswordReset[]
  auth_audit_logs     AuthAuditLog[]
}
```

### 2.2 New enum

```prisma
enum AuditAction {
  LOGIN_SUCCESS
  LOGIN_FAILED
  REGISTER
  PASSWORD_RESET_REQUESTED
  PASSWORD_RESET
  EMAIL_VERIFIED
  LOGOUT
  INVALID_TOKEN
  ACCOUNT_LOCKED
}
```

### 2.3 New tables

```prisma
/// Stores hashed email verification tokens.
/// Raw token is only ever in the email link — never persisted.
model EmailConfirmation {
  id         String    @id @default(cuid())
  user_id    String
  token_hash String    @unique // SHA-256(rawToken)
  expires_at DateTime          // created_at + 24 hours
  used_at    DateTime?         // null = still valid; set on redemption
  created_at DateTime  @default(now())

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@map("email_confirmations")
}

/// Stores hashed password reset tokens.
/// 1-hour TTL, single-use, hard-deleted on new request.
model PasswordReset {
  id         String    @id @default(cuid())
  user_id    String
  token_hash String    @unique // SHA-256(rawToken)
  expires_at DateTime          // created_at + 1 hour (locked by roadmap)
  used_at    DateTime?         // null = still valid; set on redemption
  created_at DateTime  @default(now())

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@map("password_resets")
}

/// Append-only auth event log. user_id nullable for pre-auth failures.
model AuthAuditLog {
  id         String      @id @default(cuid())
  user_id    String?     // null for unknown-email login attempts
  action     AuditAction
  ip_address String?     // GDPR-anonymized: last IPv4 octet zeroed
  user_agent String?     // truncated to 512 chars
  metadata   Json?       // event-specific: { reason, token_type, email, ... }
  created_at DateTime    @default(now())

  user User? @relation(fields: [user_id], references: [id], onDelete: SetNull)

  @@index([user_id])
  @@index([created_at])
  @@map("auth_audit_logs")
}
```

### 2.4 Token validity rule

A token is valid if and only if:

```sql
used_at IS NULL AND expires_at > NOW()
```

### 2.5 Token invalidation events

| Trigger | Action |
|---|---|
| Token redeemed successfully | Set `used_at = now()` (keep row for audit trail) |
| New token requested for same user | Delete ALL previous rows for that `user_id` |
| Password changed via reset | Delete all `PasswordReset` rows for `user_id` |
| Email verified | Delete all `EmailConfirmation` rows for `user_id` |
| Account deleted | Cascade delete via FK |

---

## 3. API Contract

### 3.1 Auth.js handler (managed)

```
GET  /api/auth/[...nextauth]   — Auth.js session endpoint
POST /api/auth/[...nextauth]   — Auth.js signIn / signOut / CSRF
```

These routes are handled entirely by Auth.js v5. No custom logic here.

---

### 3.2 POST /api/auth/register

Creates a new account and sends a verification email.

**Request body (Zod-validated):**
```typescript
interface RegisterRequest {
  email: string;    // valid email, max 254 chars
  name: string;     // 1–100 chars, trimmed
  password: string; // min 8 chars, must satisfy strength requirements
}
```

**Zod schema:**
```typescript
const registerSchema = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
  name: z.string().min(1).max(100).trim(),
  password: z
    .string()
    .min(8, "auth.errors.passwordTooShort")
    .regex(/[A-Z]/, "auth.errors.passwordNeedsUpper")
    .regex(/[a-z]/, "auth.errors.passwordNeedsLower")
    .regex(/[0-9]/, "auth.errors.passwordNeedsNumber")
    .regex(/[^A-Za-z0-9]/, "auth.errors.passwordNeedsSpecial"),
});
```

**Success response (201):**
```json
{ "message": "auth.register.verificationSent" }
```

**Error responses:**
| Status | Body | Condition |
|---|---|---|
| 400 | `{ "error": "...", "fields": {...} }` | Zod validation failed |
| 409 | `{ "error": "auth.errors.emailTaken" }` | Email already registered |
| 429 | `{ "error": "auth.errors.rateLimited", "retryAfter": 900 }` | Rate limit exceeded |
| 500 | `{ "error": "Internal server error" }` | DB or email failure |

**Server logic:**
1. Rate limit check: `register:${anonymizedIp}` — 10 req / 1 hr
2. Validate body with Zod
3. Check `users` table for duplicate email → 409 if found
4. `bcrypt.hash(password, BCRYPT_ROUNDS)` → store hash
5. Insert `User` with `email_verified_at = null`
6. Generate token: `crypto.randomBytes(32).toString('hex')` → `tokenRaw`
7. Store `SHA-256(tokenRaw)` in `EmailConfirmation`, `expires_at = now() + 24h`
8. Send verification email via Resend
9. Write `REGISTER` audit log entry
10. Return 201

**Security notes:**
- Email is lowercased before storage and lookup (`.toLowerCase()`)
- Never return different messages for duplicate vs. new email (but 409 is acceptable here since enumeration is lower risk at registration than at login)

---

### 3.3 POST /api/auth/verify-email

Redeems an email verification token.

**Request body:**
```typescript
interface VerifyEmailRequest {
  token: string; // raw 64-char hex token from URL query param
}
```

**Zod schema:**
```typescript
const verifyEmailSchema = z.object({
  token: z.string().length(64).regex(/^[0-9a-f]+$/),
});
```

**Success response (200):**
```json
{ "message": "auth.verify.success" }
```

**Error responses:**
| Status | Body | Condition |
|---|---|---|
| 400 | `{ "error": "auth.errors.tokenInvalid" }` | Token not found (hash mismatch) |
| 400 | `{ "error": "auth.errors.tokenExpired" }` | Token expired or already used |
| 429 | `{ "error": "auth.errors.rateLimited" }` | Rate limit exceeded |

**Server logic:**
1. Rate limit: `verify:${anonymizedIp}` — 5 req / 15 min
2. Validate body
3. Compute `SHA-256(token)`, look up in `email_confirmations`
4. If not found → 400 `tokenInvalid` + log `INVALID_TOKEN`
5. If `used_at IS NOT NULL OR expires_at <= now()` → 400 `tokenExpired` + log `INVALID_TOKEN`
6. Set `used_at = now()` on `EmailConfirmation`
7. Set `email_verified_at = now()` on `User`
8. Delete all other `EmailConfirmation` rows for this `user_id`
9. Write `EMAIL_VERIFIED` audit log
10. Return 200

---

### 3.4 POST /api/auth/forgot-password

Initiates password reset. Always returns 200 to prevent email enumeration.

**Request body:**
```typescript
interface ForgotPasswordRequest {
  email: string;
}
```

**Zod schema:**
```typescript
const forgotPasswordSchema = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
});
```

**Success response (200) — always:**
```json
{ "message": "auth.forgot.emailSent" }
```

**Error responses:**
| Status | Body | Condition |
|---|---|---|
| 400 | `{ "error": "...", "fields": {...} }` | Zod validation failed |
| 429 | `{ "error": "auth.errors.rateLimited" }` | Rate limit exceeded |

**Server logic:**
1. Rate limit: `forgot:${anonymizedIp}:${email}` — 3 req / 1 hr
2. Validate body
3. Look up user by email
4. **If user not found:** return 200 immediately (no email sent, no log) — prevents enumeration
5. If found: delete all existing `PasswordReset` rows for `user_id`
6. Generate `tokenRaw`, store `SHA-256(tokenRaw)` with `expires_at = now() + 1h`
7. Send reset email via Resend
8. Write `PASSWORD_RESET_REQUESTED` audit log
9. Return 200

---

### 3.5 POST /api/auth/reset-password

Redeems a password reset token and sets a new password.

**Request body:**
```typescript
interface ResetPasswordRequest {
  token: string;
  password: string;
  passwordConfirm: string;
}
```

**Zod schema:**
```typescript
const resetPasswordSchema = z
  .object({
    token: z.string().length(64).regex(/^[0-9a-f]+$/),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "auth.errors.passwordMismatch",
    path: ["passwordConfirm"],
  });
```

**Success response (200):**
```json
{ "message": "auth.reset.success" }
```

**Error responses:**
| Status | Body | Condition |
|---|---|---|
| 400 | `{ "error": "auth.errors.tokenInvalid" }` | Token not found |
| 400 | `{ "error": "auth.errors.tokenExpired" }` | Expired or already used |
| 400 | `{ "error": "...", "fields": {...} }` | Validation failed |
| 429 | `{ "error": "auth.errors.rateLimited" }` | Rate limit exceeded |

**Server logic:**
1. Rate limit: `reset:${token.slice(0, 8)}` — 5 req / 15 min (token prefix as key to resist brute force)
2. Validate body (Zod)
3. Compute `SHA-256(token)`, look up `PasswordReset`
4. If not found → 400 `tokenInvalid` + log `INVALID_TOKEN`
5. If `used_at IS NOT NULL OR expires_at <= now()` → 400 `tokenExpired` + log `INVALID_TOKEN`
6. `bcrypt.hash(newPassword, BCRYPT_ROUNDS)`
7. Set `users.password_hash = hash`, reset `failed_login_count = 0`, clear `locked_until`
8. Set `used_at = now()` on `PasswordReset`
9. Delete all other `PasswordReset` rows for `user_id`
10. Write `PASSWORD_RESET` audit log
11. Return 200

---

### 3.6 Auth.js Credentials login

Login is handled by calling `signIn('credentials', { email, password })` from the client. Auth.js routes this to the `authorize` function in `src/auth.ts`.

**`authorize` function logic:**
1. Rate limit: `login:${anonymizedIp}:${email}` — 5 req / 15 min
2. Validate input with Zod (same schema as above, email + password)
3. Fetch user by email
4. **If user not found:** run `bcrypt.compare(password, DUMMY_HASH)` to normalize timing → write `LOGIN_FAILED` log with `{ reason: 'user_not_found', email }` → return `null`
5. Check `locked_until`: if `locked_until > now()` → write `LOGIN_FAILED` log with `{ reason: 'account_locked' }` → return `null`
6. `bcrypt.compare(password, user.password_hash)`
7. If mismatch:
   - Increment `failed_login_count`
   - If `failed_login_count >= 10`: set `locked_until = now() + 30min`, write `ACCOUNT_LOCKED` log
   - Write `LOGIN_FAILED` log with `{ reason: 'wrong_password' }`
   - Return `null`
8. If email not verified: write `LOGIN_FAILED` log with `{ reason: 'email_not_verified' }` → return `null` with specific error message (enum not user enumeration — user exists and knows their own status)
9. Reset `failed_login_count = 0`, set `last_login_at = now()`
10. Write `LOGIN_SUCCESS` log
11. Return `{ id, email, name, role }`

**DUMMY_HASH constant** (in `src/auth.ts`, never logged):
```typescript
const DUMMY_HASH = "$2a$12$dummyhashfortimingnormalizationxxxxxxxxxxxxxxxxxxxxxxxx";
```

---

### 3.7 Logout

Handled by Auth.js: `signOut()` from a client component.

Server action in dashboard: sets a server-side logout flag and calls `signOut()`.
Writes `LOGOUT` audit log entry via a server action.

---

## 4. Component Architecture

### 4.1 Auth.js config files

```
src/
  auth.config.ts          Edge-safe config: providers list, session/JWT callbacks (no DB imports)
  auth.ts                 Full config: authorize function (bcrypt, Prisma), imports auth.config.ts
  app/
    api/
      auth/
        [...nextauth]/
          route.ts        Re-exports { GET, POST } from "../../auth"
```

### 4.2 Auth API route files

```
src/app/api/auth/
  register/route.ts
  verify-email/route.ts
  forgot-password/route.ts
  reset-password/route.ts
```

### 4.3 App structure with route groups

```
src/app/
  [locale]/
    layout.tsx                          ← thin locale wrapper (IntlProvider, ThemeProvider, Sonner)
    page.tsx                            ← redirect: authed → /dashboard, unauthed → /auth/login
    (auth)/
      layout.tsx                        ← centered card, no AppShell, no auth requirement
      auth/
        login/
          page.tsx                      ← LoginPage (server component shell)
        register/
          page.tsx                      ← RegisterPage
        verify/
          page.tsx                      ← VerifyEmailPage (reads ?token= from searchParams)
        forgot-password/
          page.tsx                      ← ForgotPasswordPage
        reset-password/
          page.tsx                      ← ResetPasswordPage (reads ?token= from searchParams)
    (app)/
      layout.tsx                        ← AppShell + requireUserOrRedirect()
      dashboard/
        page.tsx                        ← DashboardPage (stub)
```

### 4.4 Auth form components

All are **Client Components** (use react-hook-form + zod resolver):

```
src/components/auth/
  LoginForm.tsx
  RegisterForm.tsx
  ForgotPasswordForm.tsx
  ResetPasswordForm.tsx
  VerifyEmailCard.tsx               ← shows status (pending / success / error)
  PasswordStrengthIndicator.tsx     ← reusable segmented progress bar
```

**Props interfaces:**

```typescript
// LoginForm — no props; calls signIn() internally
export function LoginForm(): JSX.Element

// RegisterForm — no props; calls POST /api/auth/register
export function RegisterForm(): JSX.Element

// ForgotPasswordForm — no props
export function ForgotPasswordForm(): JSX.Element

// ResetPasswordForm
interface ResetPasswordFormProps {
  token: string; // extracted from URL searchParam by server page
}
export function ResetPasswordForm({ token }: ResetPasswordFormProps): JSX.Element

// VerifyEmailCard
interface VerifyEmailCardProps {
  token: string | null; // null = show "no token" error state
}
export function VerifyEmailCard({ token }: VerifyEmailCardProps): JSX.Element

// PasswordStrengthIndicator
interface PasswordStrengthIndicatorProps {
  password: string;
}
export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps): JSX.Element
```

### 4.5 Server utilities

```
src/lib/
  auth-guard.ts       requireUser() + requireUserOrRedirect()
  rate-limit.ts       RateLimiter interface + lru-cache shim
  security.ts         anonymizeIp(), hashToken(), generateToken()
  password.ts         checkPasswordStrength(), passwordSchema (Zod)
  email.ts            renderEmail(), sendVerificationEmail(), sendPasswordResetEmail()
```

**Type declarations:**

```typescript
// src/types/auth.d.ts — augment Auth.js Session and JWT

import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
    };
  }
  interface User {
    id: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}
```

---

## 5. UI/UX Specification

### 5.1 Auth layout (`(auth)/layout.tsx`)

Full-screen centered layout. No sidebar, no topbar. Theme toggle in top-right corner.

```
┌─────────────────────────────────┐
│                        [theme]  │
│                                 │
│        ┌───────────────┐        │
│        │  Evidoxa logo │        │
│        │               │        │
│        │  [form card]  │        │
│        │               │        │
│        └───────────────┘        │
│                                 │
└─────────────────────────────────┘
```

### 5.2 Login page (`/auth/login`)

```
┌─────────────────────────────┐
│ Anmelden                    │
│─────────────────────────────│
│ E-Mail                      │
│ [___________________________]│
│ Passwort                    │
│ [___________________________] [👁]
│                             │
│ [Anmelden ▶]               │
│                             │
│ Passwort vergessen?         │
│ Noch kein Konto? Registrieren│
└─────────────────────────────┘
```

- Email field: `type="email"`, `autocomplete="email"`
- Password field: `type="password"`, toggle show/hide, `autocomplete="current-password"`
- Submit button: disabled + spinner during request
- Error: single generic alert below the form — `"E-Mail oder Passwort ungültig."` (no field-level errors for credentials — prevents user enumeration)
- On unverified account error: show specific message `"Bitte bestätige zuerst deine E-Mail-Adresse."` + link to request new verification
- Success: `signIn()` redirects to `callbackUrl` (validated same-origin) or `/dashboard`

### 5.3 Register page (`/auth/register`)

```
┌─────────────────────────────┐
│ Konto erstellen             │
│─────────────────────────────│
│ Name                        │
│ [___________________________]│
│ E-Mail                      │
│ [___________________________]│
│ Passwort                    │
│ [___________________________] [👁]
│ ████████░░  Stark           │ ← PasswordStrengthIndicator
│ Passwort bestätigen         │
│ [___________________________]│
│                             │
│ [Konto erstellen ▶]         │
│                             │
│ Bereits registriert? Anmelden│
└─────────────────────────────┘
```

- Password strength indicator: 5-segment bar, shown when password field has focus or content
- Field errors: displayed below each field (Zod messages via react-hook-form)
- On success: show success card: `"Verifizierungs-E-Mail gesendet. Bitte prüfe dein Postfach."` — no redirect

### 5.4 Verify email page (`/auth/verify?token=<rawToken>`)

```
Pending (token present, verifying on mount):
┌─────────────────────────────┐
│ E-Mail bestätigen           │
│─────────────────────────────│
│ [spinner] Wird überprüft... │
└─────────────────────────────┘

Success:
┌─────────────────────────────┐
│ ✓ E-Mail bestätigt          │
│─────────────────────────────│
│ Dein Konto ist aktiv.       │
│ [Jetzt anmelden →]          │
└─────────────────────────────┘

Error (expired / used / invalid):
┌─────────────────────────────┐
│ ✗ Ungültiger Link           │
│─────────────────────────────│
│ Der Link ist abgelaufen.    │
│ [Neuen Link anfordern →]    │
└─────────────────────────────┘
```

`VerifyEmailCard` auto-calls `POST /api/auth/verify-email` on mount (once, no retry). The `token` is extracted server-side from `searchParams` in the page component and passed as prop.

### 5.5 Forgot password page (`/auth/forgot-password`)

```
┌─────────────────────────────┐
│ Passwort vergessen?         │
│─────────────────────────────│
│ E-Mail                      │
│ [___________________________]│
│ [Link anfordern ▶]          │
│                             │
│ Zurück zur Anmeldung        │
└─────────────────────────────┘

After submit (always — no enumeration):
┌─────────────────────────────┐
│ E-Mail gesendet             │
│─────────────────────────────│
│ Falls ein Konto existiert,  │
│ erhältst du einen Link.     │
└─────────────────────────────┘
```

### 5.6 Reset password page (`/auth/reset-password?token=<rawToken>`)

Server page extracts `token` from `searchParams`, passes to `ResetPasswordForm`. If `token` is missing → show "Ungültiger Link" error card.

```
┌─────────────────────────────┐
│ Neues Passwort              │
│─────────────────────────────│
│ Neues Passwort              │
│ [___________________________] [👁]
│ ████████░░  Stark           │
│ Passwort bestätigen         │
│ [___________________________]│
│ [Passwort speichern ▶]      │
└─────────────────────────────┘

On success: redirect to /auth/login?reset=1
Login page shows: "Passwort wurde zurückgesetzt. Bitte melde dich an."
```

### 5.7 Dashboard stub (`/dashboard`)

Minimal protected page for this epic. Replaced by the real dashboard in Epic 4.4.

```
┌──────────────────────────────────────────┐
│ [Sidebar] │ Willkommen, [Name]!           │
│           │                              │
│           │ Du bist angemeldet.          │
│           │                              │
│           │ [Abmelden]                   │
└──────────────────────────────────────────┘
```

Server component. Calls `requireUserOrRedirect()`. Renders AppShell from `(app)/layout.tsx`.

---

## 6. State & Data Flow

### 6.1 Registration flow

```
User fills RegisterForm
  → Client: POST /api/auth/register
    → Rate limit check
    → Zod validation
    → DB: check email uniqueness
    → DB: insert User (email_verified_at = null)
    → Crypto: generate tokenRaw (32 bytes)
    → DB: insert EmailConfirmation (token_hash = SHA-256(tokenRaw))
    → Resend: send verification email with tokenRaw in URL
    → DB: write REGISTER audit log
    → Return 201
  ← Client: show success card
```

### 6.2 Email verification flow

```
User clicks link: /de/auth/verify?token=<tokenRaw>
  → Server page: extract token from searchParams → pass to VerifyEmailCard
  → VerifyEmailCard mounts: POST /api/auth/verify-email { token: tokenRaw }
    → SHA-256(tokenRaw) → lookup in email_confirmations
    → Validate: used_at IS NULL AND expires_at > now()
    → DB: set used_at = now() on EmailConfirmation
    → DB: set email_verified_at = now() on User
    → DB: delete all other EmailConfirmation rows for user_id
    → DB: write EMAIL_VERIFIED audit log
    → Return 200
  ← Client: show success state → link to /auth/login
```

### 6.3 Login flow

```
User fills LoginForm
  → Client: signIn('credentials', { email, password, redirect: false })
    → Auth.js routes to authorize():
      → Rate limit check (login:ip:email)
      → Account locked check
      → DB: fetch user by email
      → If not found: bcrypt.compare(password, DUMMY_HASH) → LOG → return null
      → bcrypt.compare(password, user.password_hash)
      → If fail: increment failed_login_count; maybe set locked_until → LOG → return null
      → Check email_verified_at not null
      → DB: reset failed_login_count = 0, set last_login_at
      → DB: write LOGIN_SUCCESS log
      → Return { id, email, name, role }
    → Auth.js: JWT created with { id, email, name, role }
    → Auth.js: set auth cookie (HttpOnly, Secure, SameSite=Lax)
  ← Client: validate callbackUrl (same-origin) → redirect to callbackUrl or /dashboard
```

### 6.4 Session lifetime & JWT rotation

```
JWT max age: 30 days (Auth.js session.maxAge = 30 * 24 * 60 * 60)
Rolling refresh: Auth.js updateAge = 24 * 60 * 60 (refresh if >24h since last issue)

On each request to a protected route:
  middleware.ts
    → auth() validates JWT (edge, no DB)
    → If valid + age > updateAge: Auth.js silently reissues JWT (rotation)
    → If invalid/expired: redirect to /auth/login
```

### 6.5 Middleware request flow

```
Incoming request
  → next-intl: determine locale prefix, rewrite URL
  → auth(): validate JWT cookie
    → Public route (PUBLIC_PATHS set)? → proceed
    → API /api/auth/*? → proceed (Auth.js handles)
    → GET /api/health? → proceed
    → Protected route:
      → Valid JWT → proceed
      → No/invalid JWT → redirect to /[locale]/auth/login?callbackUrl=<originalPath>
```

---

## 7. Security Specification

### 7.1 Token hashing

```typescript
// src/lib/security.ts

import crypto from "crypto";

/** Generates a cryptographically random 64-char hex token. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** SHA-256 hash of a raw token. Only the hash is stored in the DB. */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/** GDPR-compliant IP anonymization. */
export function anonymizeIp(ip: string): string {
  if (ip.includes(":")) {
    // IPv6: zero last 64 bits (last 4 groups)
    const parts = ip.split(":");
    if (parts.length === 8) {
      return [...parts.slice(0, 4), "0", "0", "0", "0"].join(":");
    }
    return "::"; // compressed notation fallback
  }
  // IPv4: zero last octet
  return ip.replace(/\.\d+$/, ".0");
}
```

### 7.2 Rate limiting abstraction

```typescript
// src/lib/rate-limit.ts

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

/**
 * In-process LRU cache shim.
 * WARNING: resets on cold start / across instances.
 * Replace with Redis implementation in Epic 1.4.
 */
export function createLruRateLimiter(): RateLimiter { ... }

export const rateLimiter: RateLimiter = createLruRateLimiter();

/**
 * Helper for API routes: calls rateLimiter.check() and returns a
 * 429 NextResponse if limit exceeded, or null if allowed.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<NextResponse | null> { ... }
```

**Auth route limits (must remain stable when Epic 1.4 replaces backend):**

| Route | Limit | Window | Key pattern |
|---|---|---|---|
| POST /api/auth/register | 10 | 1 hr | `register:${anonymizedIp}` |
| POST /api/auth/login (in authorize) | 5 | 15 min | `login:${anonymizedIp}:${email}` |
| POST /api/auth/forgot-password | 3 | 1 hr | `forgot:${anonymizedIp}:${email}` |
| POST /api/auth/reset-password | 5 | 15 min | `reset:${token.slice(0,8)}` |
| POST /api/auth/verify-email | 5 | 15 min | `verify:${anonymizedIp}` |

### 7.3 Timing attack prevention

- For unknown-email logins: always run `bcrypt.compare(password, DUMMY_HASH)` before returning `null`. This prevents timing-based user enumeration.
- `DUMMY_HASH` is a valid bcrypt hash of a random string, cost 12. It is defined as a module constant and never logged.

### 7.4 Account lockout

Secondary defense layer (on top of IP rate limiting, handles password spraying from distributed IPs):

| `failed_login_count` | Action |
|---|---|
| < 10 | No lockout |
| >= 10 | Set `locked_until = now() + 30 min`, write `ACCOUNT_LOCKED` log |

`locked_until` is cleared on: successful login, successful password reset.

### 7.5 Audit logging

All auth events are written to `auth_audit_logs` with anonymized IP and truncated user agent.

```typescript
// src/lib/audit.ts
export async function writeAuditLog(params: {
  action: AuditAction;
  userId?: string | null;
  request: Request;
  metadata?: Record<string, unknown>;
}): Promise<void>
```

Negative events that MUST be logged (with metadata):

| Event | Logged when | metadata fields |
|---|---|---|
| `LOGIN_FAILED` | Any login failure | `{ reason: 'user_not_found' \| 'wrong_password' \| 'account_locked' \| 'email_not_verified', email }` |
| `INVALID_TOKEN` | Bad/expired/used token | `{ token_type: 'email_confirmation' \| 'password_reset', reason: 'not_found' \| 'expired' \| 'used' }` |
| `ACCOUNT_LOCKED` | Lockout triggered | `{ failed_count: number }` |

### 7.6 Cookie security policy

Auth.js v5 cookie configuration in `auth.config.ts`:

```typescript
cookies: {
  sessionToken: {
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
  },
}
```

`SameSite=Lax` (not `Strict`) is intentional — allows redirect-based login flows from external links.

### 7.7 JWT hardening

```typescript
// auth.config.ts
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60,     // 30 days absolute max
  updateAge: 24 * 60 * 60,        // rolling refresh threshold
},
jwt: {
  maxAge: 30 * 24 * 60 * 60,
  // Algorithm: HS256 (Auth.js v5 default with AUTH_SECRET)
},
```

`AUTH_SECRET` must be minimum 32 characters (validated at startup). Generate with:
```bash
openssl rand -hex 32
```

### 7.8 Callback URL validation

```typescript
// In Auth.js signIn callback:
function sanitizeCallbackUrl(url: string | undefined): string {
  if (!url || !url.startsWith("/")) return "/dashboard";
  // Reject protocol-relative URLs
  if (url.startsWith("//")) return "/dashboard";
  return url;
}
```

### 7.9 Input sanitization

- All string inputs pass through Zod `.trim()` before storage
- Email is normalized to lowercase before storage and all lookups
- React escapes output by default — no additional sanitization needed for display
- `user_agent` in audit log is truncated to 512 chars before storage to prevent log injection

### 7.10 HTTP response semantics

| Scenario | Response |
|---|---|
| No session / expired JWT | `401 { error: "Unauthorized" }` (API) or redirect to `/auth/login` (page) |
| Valid session, insufficient role | `403 { error: "Forbidden" }` (API) or 403 error page (page) |
| Valid session, resource not owned | `404` (preferred over 403 to avoid resource enumeration) |

---

## 8. Environment Variables

### 8.1 New required variables

Add to `.env.local`:

```bash
# Auth.js v5 (Auth.js uses AUTH_SECRET, not NEXTAUTH_SECRET)
AUTH_SECRET=<output of: openssl rand -hex 32>
AUTH_URL=http://localhost:3000

# Password hashing
BCRYPT_ROUNDS=12

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@evidoxa.com
```

### 8.2 Updated `src/lib/env.ts`

Replace optional `NEXTAUTH_*` placeholders with required auth vars:

```typescript
const server = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),

  // Epic 1.2 — DB (unchanged)
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url(),

  // Epic 1.3 — Auth
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL: z.string().url(),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),

  // Epic 1.3 — Email
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),

  // Epic 1.4 — Redis (still optional until 1.4)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});
```

> **Breaking change from Epic 1.2:** `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are removed. Update `.env.local` before running the app.

---

## 9. Auth.js Configuration Detail

### 9.1 `src/auth.config.ts` (edge-safe)

```typescript
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],  // Credentials provider added in auth.ts (requires bcrypt — Node.js only)
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
    authorized({ auth, request }) {
      // Used by middleware: returns true if user is authenticated
      // or if the route is public.
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "");
      const isPublic = PUBLIC_PATHS.has(pathnameWithoutLocale) ||
        pathnameWithoutLocale.startsWith("/api/auth") ||
        pathnameWithoutLocale === "/api/health";
      if (isPublic) return true;
      return isLoggedIn;
    },
  },
};

const PUBLIC_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/verify",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/",
]);
```

### 9.2 `src/auth.ts` (full, Node.js only)

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials, request) {
        // Full logic described in Section 3.6
      },
    }),
  ],
});
```

### 9.3 `src/middleware.ts` (updated)

```typescript
import { auth } from "./auth";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import type { NextRequest } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);

export default auth(async function middleware(request: NextRequest) {
  return intlMiddleware(request);
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
```

> **Note:** Auth.js v5's `auth()` wrapper handles the `authorized` callback. If it returns `false`, Auth.js redirects to `pages.signIn` before the inner middleware function runs.

---

## 10. Email Templates

### 10.1 `src/lib/email.ts`

```typescript
import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  token: string; // raw token (not hash)
  locale: string;
}): Promise<void>

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  token: string; // raw token (not hash)
  locale: string;
}): Promise<void>
```

**Verification email:**
- Subject (de): `"Bestätige deine E-Mail-Adresse"`
- Subject (en): `"Confirm your email address"`
- CTA URL: `${env.AUTH_URL}/${locale}/auth/verify?token=${tokenRaw}`
- Expires note: `"Dieser Link ist 24 Stunden gültig."`

**Reset email:**
- Subject (de): `"Passwort zurücksetzen"`
- Subject (en): `"Reset your password"`
- CTA URL: `${env.AUTH_URL}/${locale}/auth/reset-password?token=${tokenRaw}`
- Expires note: `"Dieser Link ist 1 Stunde gültig."`

Both emails provide a plain-text fallback alongside HTML. Templates live inline in `email.ts` as template literals.

---

## 11. i18n — Translation Keys

### German (`messages/de.json`) additions:

```json
{
  "auth": {
    "login": {
      "title": "Anmelden",
      "submit": "Anmelden",
      "forgotPassword": "Passwort vergessen?",
      "noAccount": "Noch kein Konto?",
      "register": "Registrieren",
      "resetSuccess": "Passwort wurde zurückgesetzt. Bitte melde dich an."
    },
    "register": {
      "title": "Konto erstellen",
      "submit": "Konto erstellen",
      "namePlaceholder": "Vollständiger Name",
      "alreadyHaveAccount": "Bereits registriert?",
      "login": "Anmelden",
      "verificationSent": "Verifizierungs-E-Mail gesendet. Bitte prüfe dein Postfach."
    },
    "verify": {
      "title": "E-Mail bestätigen",
      "verifying": "Wird überprüft...",
      "success": "E-Mail bestätigt",
      "successMessage": "Dein Konto ist aktiv.",
      "loginNow": "Jetzt anmelden",
      "requestNew": "Neuen Link anfordern"
    },
    "forgot": {
      "title": "Passwort vergessen?",
      "description": "Gib deine E-Mail-Adresse ein und wir senden dir einen Link.",
      "submit": "Link anfordern",
      "backToLogin": "Zurück zur Anmeldung",
      "emailSent": "E-Mail gesendet",
      "emailSentMessage": "Falls ein Konto mit dieser Adresse existiert, erhältst du einen Link."
    },
    "reset": {
      "title": "Neues Passwort",
      "newPassword": "Neues Passwort",
      "confirmPassword": "Passwort bestätigen",
      "submit": "Passwort speichern",
      "success": "Passwort erfolgreich geändert."
    },
    "dashboard": {
      "welcome": "Willkommen, {name}!",
      "loggedIn": "Du bist angemeldet.",
      "logout": "Abmelden"
    },
    "strength": {
      "label": "Passwortstärke",
      "weak": "Schwach",
      "fair": "Ausreichend",
      "good": "Gut",
      "strong": "Stark",
      "veryStrong": "Sehr stark"
    },
    "fields": {
      "email": "E-Mail",
      "password": "Passwort",
      "name": "Name"
    },
    "errors": {
      "invalidCredentials": "E-Mail oder Passwort ungültig.",
      "emailNotVerified": "Bitte bestätige zuerst deine E-Mail-Adresse.",
      "emailTaken": "Diese E-Mail-Adresse ist bereits registriert.",
      "tokenExpired": "Der Link ist abgelaufen. Bitte fordere einen neuen an.",
      "tokenInvalid": "Ungültiger Link.",
      "rateLimited": "Zu viele Versuche. Bitte warte {minutes} Minuten.",
      "passwordTooShort": "Mindestens 8 Zeichen.",
      "passwordNeedsUpper": "Mindestens ein Großbuchstabe.",
      "passwordNeedsLower": "Mindestens ein Kleinbuchstabe.",
      "passwordNeedsNumber": "Mindestens eine Zahl.",
      "passwordNeedsSpecial": "Mindestens ein Sonderzeichen.",
      "passwordMismatch": "Passwörter stimmen nicht überein.",
      "serverError": "Ein Fehler ist aufgetreten. Bitte versuche es erneut."
    }
  }
}
```

### English (`messages/en.json`) additions: same structure with English values.

---

## 12. Password Strength Indicator

```typescript
// src/lib/password.ts

export type PasswordStrength = 0 | 1 | 2 | 3 | 4 | 5;

export function checkPasswordStrength(password: string): {
  score: PasswordStrength;
  label: "weak" | "fair" | "good" | "strong" | "veryStrong";
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["weak", "weak", "fair", "good", "strong", "veryStrong"] as const;
  return { score: score as PasswordStrength, label: labels[score] };
}
```

`PasswordStrengthIndicator`: 5-segment bar. Segments filled = score. Colors: 1=red, 2=orange, 3=yellow, 4=lime, 5=green. Uses Tailwind CSS classes only.

---

## 13. Testing Plan

### 13.1 Unit tests (Vitest + RTL)

| File | What to test |
|---|---|
| `src/lib/security.test.ts` | `generateToken()` length/charset; `hashToken()` determinism; `anonymizeIp()` IPv4 + IPv6 edge cases |
| `src/lib/password.test.ts` | `checkPasswordStrength()` all 6 scores; boundary: exactly 8 chars; missing each rule |
| `src/lib/rate-limit.test.ts` | Allows N requests; blocks N+1; resets after window; different keys independent |
| `src/lib/email.test.ts` | `renderEmail()` returns string containing CTA URL and token; non-empty text fallback |
| `src/components/auth/PasswordStrengthIndicator.test.tsx` | Renders 5 segments; correct aria-label; score 0–5 changes segment colors |
| `src/components/auth/LoginForm.test.tsx` | Renders fields; shows generic error on submit failure; disables during submit |
| `src/components/auth/RegisterForm.test.tsx` | Field-level errors from Zod; strength indicator appears when typing password |

### 13.2 API route integration tests (Vitest with mocked Prisma + Resend)

| Route | Test cases |
|---|---|
| `POST /api/auth/register` | 201 happy path; 409 duplicate email; 400 weak password (each rule); 400 invalid email; 429 rate limited |
| `POST /api/auth/verify-email` | 200 valid token; 400 unknown token; 400 expired token; 400 already-used token; token hash not stored raw |
| `POST /api/auth/forgot-password` | 200 for known email (creates reset row); 200 for unknown email (no DB write — no enumeration); 429 rate limited |
| `POST /api/auth/reset-password` | 200 valid token; 400 expired; 400 used; 400 mismatch; password hash updated; previous tokens deleted |
| `authorize()` | Unknown email (timing-safe, returns null); wrong password (increments failed_count); locked account; unverified email; success |

### 13.3 E2E tests (Playwright)

**Pre-condition:** A test account is seeded in the DB with `email_verified_at` set, for login tests. A second account is seeded without verification, for verification flow tests.

```
TC-E2E-01: Full registration + verification + login + logout flow
  - Navigate to /de/auth/register
  - Fill form with test+<timestamp>@test.com
  - Submit → see success card
  - [Skip actual email: extract token from DB via test helper]
  - Navigate to /de/auth/verify?token=<rawToken>
  - See success state → click "Jetzt anmelden"
  - Fill login form → redirect to /de/dashboard
  - See welcome message
  - Click Abmelden → redirect to /de/auth/login

TC-E2E-02: Login with wrong credentials
  - Submit with wrong password → see generic error "E-Mail oder Passwort ungültig."
  - No mention of "wrong password" or "user not found"

TC-E2E-03: Login redirect with callbackUrl
  - Navigate to /de/dashboard (unauthenticated)
  - Redirect to /de/auth/login?callbackUrl=/de/dashboard
  - Login → redirect to /de/dashboard

TC-E2E-04: Forgot password flow (to verify-email redirect)
  - Submit known email → see "E-Mail gesendet" card
  - [Extract token from DB]
  - Navigate to /de/auth/reset-password?token=<token>
  - Enter matching passwords (satisfying strength)
  - Submit → redirect to /de/auth/login?reset=1
  - See success banner

TC-E2E-05: Expired / used token handling
  - Navigate to /de/auth/verify?token=invalidtoken
  - See error card
  - Navigate to /de/auth/reset-password (no token) → see error card

TC-E2E-06: Locale consistency
  - All auth pages render in German by default
  - Switch locale → see English labels on auth pages
```

**Test helper** for extracting tokens from DB:
```typescript
// e2e/helpers/db.ts
export async function getLatestVerificationToken(email: string): Promise<string>
export async function getLatestResetToken(email: string): Promise<string>
// Uses DATABASE_URL directly (raw SQL, not Prisma client) to stay fast
```

---

## 14. File Structure

New and modified files this epic creates or changes:

```
src/
  auth.config.ts                            [NEW] Edge-safe Auth.js config
  auth.ts                                   [NEW] Full Auth.js config + Credentials authorize
  middleware.ts                             [MODIFIED] Wrap with auth() + intl middleware
  types/
    auth.d.ts                               [NEW] Session/JWT type augmentation
  app/
    api/
      auth/
        [...nextauth]/
          route.ts                          [NEW] Auth.js GET/POST handler
        register/
          route.ts                          [NEW]
        verify-email/
          route.ts                          [NEW]
        forgot-password/
          route.ts                          [NEW]
        reset-password/
          route.ts                          [NEW]
    [locale]/
      layout.tsx                            [MODIFIED] Strip AppShell → thin locale wrapper
      page.tsx                              [MODIFIED] Redirect based on session
      (auth)/
        layout.tsx                          [NEW] Centered card layout
        auth/
          login/page.tsx                    [NEW]
          register/page.tsx                 [NEW]
          verify/page.tsx                   [NEW]
          forgot-password/page.tsx          [NEW]
          reset-password/page.tsx           [NEW]
      (app)/
        layout.tsx                          [NEW] AppShell + requireUserOrRedirect()
        dashboard/
          page.tsx                          [NEW] Stub dashboard
  components/
    auth/
      LoginForm.tsx                         [NEW]
      RegisterForm.tsx                      [NEW]
      ForgotPasswordForm.tsx               [NEW]
      ResetPasswordForm.tsx                [NEW]
      VerifyEmailCard.tsx                  [NEW]
      PasswordStrengthIndicator.tsx        [NEW]
  lib/
    auth-guard.ts                           [NEW]
    rate-limit.ts                           [NEW]
    security.ts                             [NEW]
    password.ts                             [NEW]
    email.ts                                [NEW]
    audit.ts                                [NEW]
    env.ts                                  [MODIFIED] Add AUTH_* + RESEND_* vars
prisma/
  schema.prisma                             [MODIFIED] User extensions + 3 new tables + AuditAction enum
  migrations/
    <timestamp>_epic_1_3_auth/
      migration.sql                         [NEW] Generated by prisma migrate dev
messages/
  de.json                                   [MODIFIED] auth.* namespace
  en.json                                   [MODIFIED] auth.* namespace
e2e/
  helpers/
    db.ts                                   [NEW] Token extraction helpers
  auth.spec.ts                              [NEW] E2E auth flows
```

---

## 15. Implementation Notes

### 15.1 Implementation order (dependency-constrained)

```
1. Prisma schema migration
   → env.ts update (AUTH_SECRET required — app won't start without it)
   → security.ts, password.ts (pure utilities, no dependencies)
   → audit.ts (depends on Prisma)
   → rate-limit.ts (lru-cache only)
   → email.ts (depends on Resend, env)
   → auth.config.ts (edge-safe, no imports from above)
   → auth.ts (depends on all of the above)
   → API routes (depend on auth.ts utilities)
   → Middleware update (depends on auth.config.ts)
   → Route group refactor + layouts
   → Auth form components (depend on layouts)
   → Dashboard stub
   → E2E test helpers + E2E tests
```

### 15.2 Route group refactor — impact on Epic 1.1 E2E tests

The existing `smoke.spec.ts` tests `/de/` expecting the AppShell to render. After this epic:
- `/de/` becomes a session-aware redirect page (no AppShell)
- The AppShell moves to `(app)/layout.tsx`
- **Action required:** Update `smoke.spec.ts` to target `/de/auth/login` for the locale switcher and theme toggle tests. Auth pages render the theme toggle and the locale switcher in the `(auth)/layout.tsx`.

### 15.3 Auth.js v5 `signIn` return value

In Auth.js v5, `signIn('credentials', { redirect: false })` returns `{ ok: boolean, error?: string }`. The `error` field contains the name thrown in `authorize()` (e.g., `"CredentialsSignin"`). Map this to the correct i18n key in `LoginForm.tsx`.

### 15.4 DUMMY_HASH for timing normalization

The `DUMMY_HASH` constant must be a valid bcrypt hash at cost 12. Generate it once:
```bash
node -e "const b = require('bcryptjs'); b.hash('dummy', 12).then(console.log)"
```
Paste the output as a string constant in `auth.ts`. Never use this hash to accept logins.

### 15.5 Seed data update

The seed in `prisma/seed.ts` creates a demo user. Update the seed to:
- Add `password_hash` (bcrypt of `"Demo1234!"`, cost 10 for fast seeding)
- Set `email_verified_at = new Date()`
- This allows immediate login after `pnpm prisma db seed`

### 15.6 `(auth)` route group path duplication

With route groups: `src/app/[locale]/(auth)/auth/login/page.tsx` has `auth` appearing twice (group name + path). This is correct — the group `(auth)` is invisible in the URL, so the path segment `auth` is still required to produce `/de/auth/login`.

### 15.7 Testing email flows without Resend in CI

- Unit/integration tests mock Resend with `vi.mock('resend')`
- E2E tests extract tokens directly from the DB (never call Resend)
- Set `RESEND_API_KEY=test_key` in `.env.test` (Resend ignores invalid keys in test mode)

---

## 16. Acceptance Criteria

1. `GET /de/auth/login` renders a login form with email and password fields and no AppShell (no sidebar).
2. `GET /de/auth/register` renders a registration form with name, email, password, confirm password fields, and a password strength indicator.
3. Registering with a weak password (e.g., "password") shows field-level validation errors without submitting.
4. Successful registration shows a success card: "Verifizierungs-E-Mail gesendet." — no redirect.
5. Attempting to register with an already-used email returns a 409 and shows `"Diese E-Mail-Adresse ist bereits registriert."`.
6. `GET /de/auth/verify?token=<validRawToken>` verifies the email and shows the success state with a "Jetzt anmelden" link.
7. `GET /de/auth/verify?token=expiredToken` shows the error state with a "Neuen Link anfordern" link.
8. A verified user can log in with correct credentials and is redirected to `/de/dashboard`.
9. A login attempt with wrong credentials shows `"E-Mail oder Passwort ungültig."` — no mention of which field is wrong.
10. Login with an unverified account shows `"Bitte bestätige zuerst deine E-Mail-Adresse."`.
11. `GET /de/dashboard` while unauthenticated redirects to `/de/auth/login?callbackUrl=/de/dashboard`.
12. `GET /de/dashboard` while authenticated renders the dashboard stub with the user's name.
13. Clicking "Abmelden" from the dashboard clears the session and redirects to `/de/auth/login`.
14. `GET /de/auth/forgot-password` → submit known email → shows success card. Submit unknown email → same success card (no enumeration).
15. Valid reset token → form accepts new password → redirects to login → shows success banner.
16. Expired reset token → shows error card.
17. `POST /api/auth/login` (via Auth.js) after 5 consecutive failures returns `null` from `authorize` (rate limited).
18. `POST /api/auth/register` after 10 requests in 1 hour returns 429.
19. All auth pages switch language correctly when locale is toggled to English.
20. `src/lib/env.ts` validation fails at startup if `AUTH_SECRET` is missing or shorter than 32 characters.
21. `SELECT token_hash FROM email_confirmations` shows a 64-char hex string — never the raw token.
22. `SELECT token_hash FROM password_resets` shows a 64-char hex string — never the raw token.
23. `SELECT * FROM auth_audit_logs` shows a LOGIN_FAILED row with anonymized IP (last octet `.0`) after a failed login attempt.
24. The `users` table has `password_hash`, `email_verified_at`, `failed_login_count`, and `locked_until` columns (verify in Prisma Studio).
25. `GET /api/health` is accessible without authentication and returns 200.

---

## 17. Out of Scope

The following are explicitly deferred to later epics:

| Item | Epic |
|---|---|
| Upstash Redis rate limiter (replaces lru-cache shim) | 1.4 |
| JWT jti blocklist on logout (requires Redis) | 1.4 |
| Security headers (CSP, X-Frame-Options, etc.) | 1.4 |
| OAuth providers (Google, GitHub) | Unscheduled |
| Two-factor authentication (TOTP) | Unscheduled |
| Account deletion / GDPR data export | Unscheduled |
| User profile page (change name, password) | 5.3 |
| Locale preference persisted in user account | 5.3 |
| Admin user management UI | Unscheduled |
| Project role enforcement in API routes | 3.1 |
| Activity log for research actions (non-auth events) | 4.4 |
