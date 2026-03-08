# Epic 1.3 — Authentication & Authorization
## Brainstorming

**Goal:** Define every implementation detail so the specification leaves no ambiguity.

---

## Round 1 — Auth.js v5 Configuration & Session Strategy

### Q1 — Where does the Auth.js v5 config live?

Auth.js v5 (a.k.a. NextAuth v5) restructured its file layout. The config can live in multiple places depending on edge compatibility needs.

```
Option A — Single file:
  src/auth.ts          (config + handlers)
  src/app/api/auth/[...nextauth]/route.ts  (re-export)

Option B — Split config:
  src/auth.config.ts   (edge-safe config: providers, callbacks, no DB imports)
  src/auth.ts          (full config: adapter, bcrypt, DB calls)
  src/app/api/auth/[...nextauth]/route.ts  (re-export handlers)
```

- [ ] Option A — Single file — simpler, but breaks if middleware needs to import config (middleware runs on edge, can't import Node.js modules like bcrypt)
- [x] Option B — Split config — **recommended** — `auth.config.ts` is edge-safe (imported by middleware), `auth.ts` has the full Node.js config (bcrypt, DB). Standard Auth.js v5 pattern for App Router.

---

### Q2 — Session strategy: JWT or database sessions?

The roadmap locks "JWT session strategy, 30-day max age, refresh token rotation". But the details matter for security.

| Aspect | JWT (stateless) | Database sessions |
|---|---|---|
| Revocation | Only via short-lived tokens + refresh rotation | Immediate (delete row) |
| Edge performance | Fast (no DB round trip) | Requires DB read per request |
| Refresh rotation | Must be implemented manually | Built-in with adapter |
| Complexity | Medium | Low with adapter |

- [x] JWT with rotation — **recommended** — Locked by roadmap. JWTs validated in middleware without DB. Rotation: 30-day max age, 24h rolling window triggers silent refresh. On security events (password change, logout), a `jti` (JWT ID) blocklist in Redis (Epic 1.4) invalidates issued tokens. For Epic 1.3 scope: implement JWT + rotation; Redis blocklist deferred to 1.4.
- [ ] Database sessions — Not chosen; contradicts roadmap lock.

---

### Q3 — Credentials provider: bcrypt cost factor

bcrypt is locked. Cost factor affects registration/login latency on serverless.

| Cost | ~Time (M1) | ~Time (Vercel) | Notes |
|---|---|---|---|
| 10 | ~65 ms | ~100 ms | Default; acceptable |
| 12 | ~260 ms | ~400 ms | Noticeably slow on serverless cold start |
| 14 | ~1040 ms | ~1600 ms | Too slow for auth endpoint |

- [x] Cost factor 12 — **recommended** — Good security-to-performance balance. Vercel functions have 10s timeout; 400ms is fine. Cost factor should be an env var (`BCRYPT_ROUNDS`, default 12) so it can be tuned.
- [ ] Cost factor 10 — Acceptable but lower security margin.
- [ ] Cost factor 14 — Too slow for serverless cold starts under load.

---

### Q4 — Auth.js v5 adapter: PrismaAdapter or custom?

Auth.js v5 has a PrismaAdapter that maps its session/account/user model to your schema.

- [ ] Option A — PrismaAdapter — Adds Auth.js-required tables (`accounts`, `sessions`, `verification_tokens`) via the adapter. Opinionated schema that may conflict with the existing `users` table design.
- [x] Option B — No adapter (custom Credentials only) — **recommended** — We use a fully custom Credentials provider that queries our own `users` table directly with Prisma. Email magic-link is implemented as a custom token flow (not the Auth.js Email provider which requires the adapter). This keeps full control of the schema. Auth.js callbacks populate the JWT/session from our User model.
- [ ] Option C — PrismaAdapter with schema override — Complex; high risk of migration conflicts with the existing schema.

---

## Round 2 — Token Security Architecture

### Q5 — Token storage: raw vs. hashed in DB

Password reset and email verification tokens must not be stored in plaintext.

```
Flow with hashing:
  1. Generate 32-byte cryptographically random token  →  tokenRaw
  2. SHA-256(tokenRaw)                               →  tokenHash  (stored in DB)
  3. Email contains tokenRaw (URL param)
  4. On redemption: SHA-256(tokenParam) === DB hash  →  valid
  5. Row deleted on first successful use
```

- [x] SHA-256 hash stored in DB — **recommended** — One-way, no bcrypt needed (tokens are high-entropy random, not user-chosen passwords). `crypto.createHash('sha256').update(token).digest('hex')` — no extra dependency. Token in URL never touches the DB in raw form.
- [ ] Store raw token — Never acceptable; DB breach exposes all pending reset links.
- [ ] HMAC-SHA256 — Adds a secret key requirement without meaningful benefit over SHA-256 for random tokens.

---

### Q6 — EmailConfirmation and PasswordReset table design

Two dedicated tables are locked by the roadmap. We need the exact schema.

```prisma
model EmailConfirmation {
  id         String   @id @default(cuid())
  user_id    String
  token_hash String   @unique  // SHA-256(rawToken)
  expires_at DateTime           // now() + 24h
  used_at    DateTime?          // set on redemption; null = still valid
  created_at DateTime @default(now())

  user User @relation(...)
  @@index([user_id])
}

model PasswordReset {
  id         String   @id @default(cuid())
  user_id    String
  token_hash String   @unique
  expires_at DateTime           // now() + 1h  (locked by roadmap)
  used_at    DateTime?
  created_at DateTime @default(now())

  user User @relation(...)
  @@index([user_id])
}
```

- [x] Separate tables with token_hash + expires_at + used_at — **recommended** — Clean audit trail. `used_at` enables forensic analysis. Validity check: `used_at IS NULL AND expires_at > now()`. On new reset request: delete all previous rows for that user (one-time-use enforcement at the collection level, not just row level).
- [ ] Single `verification_tokens` table with a `type` column — Avoids two tables but mixes concerns and complicates the validity queries.

---

### Q7 — One-time-use enforcement: when to invalidate?

Tokens must be invalidated after use AND when a new one is requested.

```
Events that invalidate existing tokens:
  A) Token redeemed successfully         → set used_at, never delete (audit trail)
  B) New token requested for same user   → delete all previous tokens for user_id
  C) Password changed successfully       → delete all PasswordReset tokens for user_id
  D) Email verified successfully         → delete all EmailConfirmation tokens for user_id
  E) Account deleted                     → cascade delete (FK onDelete: Cascade)
```

- [x] Soft-invalidate on use (used_at), hard-delete on new request — **recommended** — Keeps audit trail for used tokens. Prevents token reuse even if email is intercepted after use. New request blows away all previous tokens immediately.
- [ ] Hard-delete on use — Simpler but loses audit trail.
- [ ] Expiry-only reliance — Never acceptable; doesn't handle stolen tokens used before expiry.

---

## Round 3 — Rate Limiting & Brute-Force Protection

### Q8 — Rate limiting in Epic 1.3 vs. Epic 1.4 scope boundary

Epic 1.4 owns the Upstash Redis rate limiter middleware. But the user's spec prompt explicitly requires rate limiting for auth routes (`/login`, `/verify`, `/reset-password`). How do we handle this without Redis in Epic 1.3?

- [ ] Option A — Skip rate limiting in 1.3, implement in 1.4 — Leaves auth routes unprotected during 1.3 development. Acceptable for local dev, not for staging/production.
- [x] Option B — In-process rate limiter (lru-cache) as a temporary shim in 1.3, replaced by Redis in 1.4 — **recommended** — Provides meaningful protection without blocking on 1.4. The rate limiter is behind a `RateLimiter` abstraction (`src/lib/rate-limit.ts`) so Epic 1.4 can swap the backend without touching auth route code. Interface: `checkRateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }>`.
- [ ] Option C — Redis in Epic 1.3 — Pulls Epic 1.4 work forward; blurs epic boundaries.

Comment: Please add remarks into the roadmap for 1.4 accordingly.

**Limits (to document regardless of backend):**
| Route | Limit | Window | Key |
|---|---|---|---|
| POST /api/auth/login | 5 | 15 min | `login:${ip}:${email}` |
| POST /api/auth/register | 10 | 1 hr | `register:${ip}` |
| POST /api/auth/forgot-password | 3 | 1 hr | `forgot:${ip}:${email}` |
| POST /api/auth/reset-password | 5 | 15 min | `reset:${token_hash_prefix}` |
| GET /api/auth/verify | 5 | 15 min | `verify:${ip}` |

---

### Q9 — IP anonymization for audit logs

GDPR requires IP anonymization. Format for stored IPs.

- [x] Last-octet zeroing for IPv4, last 64 bits zeroing for IPv6 — **recommended** — `192.168.1.123` → `192.168.1.0`. Standard GDPR-compliant approach. `::1` → `::`. Utility: `anonymizeIp(ip: string): string` in `src/lib/security.ts`.
- [ ] Full IP stored — GDPR violation risk.
- [ ] No IP stored — Loses brute-force forensic capability.

---

## Round 4 — User Table Migration & Auth Fields

### Q10 — Extending the existing User table from Epic 1.2

The current `users` table has minimal fields. Epic 1.3 must add auth-specific columns via a new migration.

```prisma
// Fields to ADD to model User (via migration):
  password_hash      String?   // null for OAuth-only users (future-proofing)
  email_verified_at  DateTime? // null = not verified; set on verification
  last_login_at      DateTime? // updated on successful login
  failed_login_count Int       @default(0)  // reset on success; used for lockout
  locked_until       DateTime? // set after N consecutive failures
```

- [x] Add columns via new Prisma migration — **recommended** — Clean migration history. `email_verified_at` is nullable so existing seed users can have it set explicitly. `failed_login_count` and `locked_until` enable account-level lockout as a secondary layer beyond IP rate limiting.
- [ ] New `user_auth` table — Unnecessary join complexity; one-to-one is cleaner as columns.

---

### Q11 — Auth audit log table design

The roadmap locks: `LOGIN_SUCCESS, LOGIN_FAILED, REGISTER, PASSWORD_RESET, EMAIL_VERIFIED`. Plus the user spec adds: `AUTH_FAILURE, INVALID_TOKEN`.

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

model AuthAuditLog {
  id           String      @id @default(cuid())
  user_id      String?     // nullable: failed login for unknown email
  action       AuditAction
  ip_address   String?     // anonymized (last octet zeroed)
  user_agent   String?     // truncated to 512 chars
  metadata     Json?       // flexible: { reason, token_type, etc. }
  created_at   DateTime    @default(now())

  user User? @relation(...)
  @@index([user_id])
  @@index([created_at])
}
```

- [x] Single `auth_audit_log` table with flexible `metadata` JSON — **recommended** — Covers all current + future events. `user_id` nullable for pre-authentication failures. `metadata` absorbs event-specific data without schema changes.
- [ ] Separate tables per event type — Massively over-engineered for a log table.

---

## Round 5 — Middleware & Route Protection

### Q12 — Middleware auth check approach

How should `middleware.ts` determine if a request is authenticated?

The current `middleware.ts` handles next-intl routing. Auth must be layered in.

```
Request flow:
  middleware.ts
    ├── next-intl: determine locale, rewrite URL
    └── auth check: is this route protected?
         ├── public route  → proceed
         └── protected route → check JWT cookie
              ├── valid JWT  → proceed (inject user into headers?)
              └── invalid    → redirect to /[locale]/auth/login?callbackUrl=...
```

- [x] Auth.js `auth()` in middleware using edge-safe config (`auth.config.ts`) — **recommended** — Auth.js v5 exports an `auth()` wrapper that middleware can use. It validates the JWT on the edge without a DB call. The edge-safe config imports no Node.js modules. Protected route matching: regex on pathname after locale prefix.
- [ ] Manual JWT verification in middleware — Reinvents what Auth.js provides; higher maintenance.
- [ ] Defer all protection to server components — No redirect for unauthenticated users; bad UX and still requires protection in API routes anyway.

---

### Q13 — Public route allow-list definition

Which routes are public? How is the list maintained?

```typescript
// Option A — Regex array
const PUBLIC_ROUTES = [
  /^\/[a-z]{2}\/auth\/.*/,
  /^\/[a-z]{2}\/$/,
  /^\/api\/health$/,
  /^\/api\/auth\/.*/,
];

// Option B — Explicit string set
const PUBLIC_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/verify',
  '/auth/forgot-password',
  '/auth/reset-password',
]);
// Check: PUBLIC_PATHS.has(pathnameWithoutLocale)
```

- [x] Option B — Explicit string set (without locale prefix) — **recommended** — Easier to audit, no regex ambiguity. Middleware strips locale prefix before checking. All unlisted paths under `/app/*` are protected by default. API routes under `/api/auth/*` always pass through to Auth.js handler; health endpoint explicitly whitelisted.
- [ ] Option A — Regex array — Harder to audit; risk of accidentally matching too broadly.

---

### Q14 — 401 vs 403 response semantics

The user spec requires explicit documentation of auth vs. authorization responses.

```
401 Unauthenticated — "I don't know who you are"
  → No valid session / expired token
  → API: { error: "Unauthorized" }
  → Page: redirect to /[locale]/auth/login?callbackUrl=...

403 Forbidden — "I know who you are but you can't do this"
  → Valid session but insufficient role/permission
  → API: { error: "Forbidden" }
  → Page: render 403 error page (not redirect to login)
```

- [x] 401 for missing/invalid auth, 403 for insufficient permission — **recommended** — Correct HTTP semantics. `requireUser()` throws 401. `requireRole(role)` throws 403. This distinction matters for API consumers and future audit logging.
- [ ] Always return 401 — Leaks no info about whether route exists but violates HTTP semantics and hinders debugging.

---

### Q15 — `requireUser()` helper implementation

Server-side auth guard for API routes and server components.

```typescript
// src/lib/auth-guard.ts

// For API routes (throws NextResponse with JSON body):
export async function requireUser(
  request: NextRequest
): Promise<{ user: SessionUser; session: Session }>

// For server components (redirects):
export async function requireUserOrRedirect(
  locale: string
): Promise<SessionUser>
```

- [x] Two-function approach: `requireUser` for API (throws), `requireUserOrRedirect` for server components (redirects) — **recommended** — Clean separation. API routes get JSON error responses. Server components get redirect behavior. Both use the same underlying `auth()` call from Auth.js v5.
- [ ] Single function with mode flag — Awkward API; conditional logic inside helpers is a code smell.

---

## Round 6 — UI/UX & i18n for Auth Pages

### Q16 — Auth page layout: separate layout vs. app shell

Auth pages (`/auth/*`) need no sidebar or topbar — just a centered card.

```
Option A: Auth pages share the [locale] layout (has AppShell)
  → Auth pages render inside the full app shell
  → Requires hiding sidebar/topbar per-page

Option B: Nested layout group
  src/app/[locale]/(auth)/layout.tsx   ← minimal layout (centered, no shell)
  src/app/[locale]/(auth)/auth/...
  src/app/[locale]/(app)/layout.tsx    ← AppShell layout (protected)
  src/app/[locale]/(app)/dashboard/...
```

- [x] Option B — Route groups for layout separation — **recommended** — Clean Next.js App Router pattern. `(auth)` group gets a minimal centered layout. `(app)` group gets the full AppShell and is protected by the auth wrapper layout. No conditional rendering hacks.
- [ ] Option A — Forces awkward conditional shell visibility logic.

---

### Q17 — Password strength indicator: library or custom?

Roadmap locks: min 8 chars, uppercase/lowercase/number/special. Strength indicator UI.

- [ ] `zxcvbn` library — Dictionary-based, very accurate, but ~800KB gzipped. Too heavy for an auth form.
- [x] Custom 5-tier checker — **recommended** — Simple rule-based: count satisfied conditions (length ≥8, uppercase, lowercase, number, special). 0-1=Weak, 2=Fair, 3=Good, 4=Strong, 5=Very Strong. Matches Zod validation rules exactly. ~20 lines of code. Displayed as a segmented progress bar component.
- [ ] `password-strength` npm package — Another dependency for something trivially implementable.

---

### Q18 — Error messages: generic vs. specific on login failure

Security consideration: does a failed login say "wrong password" vs. "email not found"?

- [ ] Specific messages — "No account found with this email" / "Incorrect password" — Better UX but enables user enumeration attacks.
- [x] Generic message — "Invalid email or password" — **recommended** — Prevents user enumeration. Consistent response time (always run bcrypt even for unknown emails with a dummy hash to prevent timing attacks). The audit log records the specific failure reason internally.
- [ ] Show "email not found" only — Worst option: full enumeration attack surface.

---

### Q19 — i18n namespace for auth strings

All auth UI strings must be in translation files.

```json
// messages/de.json (proposed additions)
{
  "auth": {
    "login": { "title": "Anmelden", "submit": "Anmelden", ... },
    "register": { "title": "Registrieren", ... },
    "forgot": { "title": "Passwort vergessen", ... },
    "reset": { "title": "Neues Passwort", ... },
    "verify": { "title": "E-Mail bestätigen", ... },
    "errors": {
      "invalidCredentials": "E-Mail oder Passwort ungültig.",
      "emailTaken": "Diese E-Mail-Adresse ist bereits registriert.",
      "tokenExpired": "Der Link ist abgelaufen. Bitte erneut anfordern.",
      "tokenInvalid": "Ungültiger Link.",
      "rateLimited": "Zu viele Versuche. Bitte warte {minutes} Minuten.",
      ...
    },
    "email": {
      "verifySubject": "E-Mail-Adresse bestätigen",
      "resetSubject": "Passwort zurücksetzen"
    }
  }
}
```

- [x] Single `auth` namespace with sub-namespaces per page + shared `errors` and `email` — **recommended** — Avoids key collision. `email` sub-namespace covers email subject lines and bodies (used server-side). All Zod validation error messages are i18n keys, not hardcoded strings.
- [ ] Flat key structure — Scales poorly; namespace grouping is best practice with next-intl.

---

## Round 7 — Email Infrastructure & Security Headers

### Q20 — Resend email integration: SDK or raw API?

Resend is locked for email delivery. SDK vs. HTTP API.

- [x] `resend` npm SDK — **recommended** — `resend.emails.send({...})`. Type-safe, maintained by the Resend team. No raw fetch with API key in URL. Install as a production dependency.
- [ ] Raw fetch to Resend API — More code, no type safety, no point.

---

### Q21 — Email template approach: React Email or inline HTML?

Auth emails (verification, password reset) need branded HTML.

- [ ] React Email (`@react-email/components`) — Beautiful DX but adds a full React rendering pipeline server-side. Heavy dependency for just 2 email templates.
- [x] Inline HTML with template literals — **recommended** — Two email templates (verify, reset) are simple enough for well-structured HTML strings. Utility: `renderEmail(template: 'verify' | 'reset', data: {...}): { html: string; text: string }` in `src/lib/email.ts`. No extra dependency. Templates co-located with the email utility.
- [ ] MJML — Another compile step; overkill for 2 templates.

---

### Q22 — Callback URL safety on login redirect

After login, users are redirected to `callbackUrl`. This can be exploited for open redirect attacks.

- [x] Validate callbackUrl against same-origin allowlist — **recommended** — Only allow redirects to paths starting with `/` (same origin). Strip any `http://` or `https://` from callbackUrl before use. Auth.js v5 has some built-in protection, but we add explicit validation in the signIn callback: `if (!callbackUrl.startsWith('/')) callbackUrl = '/dashboard'`.
- [ ] Trust callbackUrl from Auth.js — Relies entirely on Auth.js sanitization; we should own this validation explicitly.

---

### Q23 — JWT secret and algorithm configuration

JWT Hardening requirement.

```
AUTH_SECRET: minimum 32 bytes of entropy (64 hex chars)
Algorithm: HS256 (HMAC-SHA256) — Auth.js v5 default
```

- [x] AUTH_SECRET env var (32+ byte, validated at startup via env.ts Zod schema) — **recommended** — Add `AUTH_SECRET: z.string().min(32)` to `src/lib/env.ts`. Auth.js v5 uses HS256 by default with this secret. The startup validation ensures misconfiguration is caught immediately, not at first login. Also add `AUTH_URL` (full origin URL) for CSRF protection.
- [ ] Inline hardcoded secret — Never acceptable.
- [ ] RS256 asymmetric — Valid for multi-service scenarios but unnecessary complexity for a single-app JWT.

---

All major dimensions of Epic 1.3 are now covered:
- Auth.js v5 configuration pattern (split config, no adapter)
- Session strategy (JWT + rotation, 30-day max age)
- Token security (SHA-256 hashed, one-time-use, short TTL)
- Rate limiting (in-process shim for 1.3, Redis interface for 1.4)
- Schema migrations (User extensions, EmailConfirmation, PasswordReset, AuthAuditLog)
- Middleware and route protection (edge-safe config, allow-list, 401/403 semantics)
- UI/UX (route groups, password strength, generic error messages)
- i18n (auth namespace with sub-keys)
- Email (Resend SDK, inline HTML templates)
- Security hardening (IP anonymization, callback URL validation, JWT secret validation)
