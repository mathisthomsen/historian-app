# Test Plan — Epic 1.3 Authentication & Authorization

## Scope

Full auth flow: register → verify email → login → dashboard → logout.
Covers all auth pages, form validation, API routes, JWT session, i18n.

Out of scope: OAuth providers, Redis rate limiting (Epic 1.4).

## Test Environment

- Browser: Chromium + Firefox (Playwright)
- Base URL: http://localhost:3000
- Seed data: `admin@evidoxa.dev` / `Demo1234!` (verified, `USER` role)
- E2E helpers: `e2e/helpers/db.ts` for token insertion and user cleanup

---

## Test Cases

### TC-AUTH-01: Login page structure

**Objective:** Login page renders auth layout (no AppShell/sidebar)
**Steps:**

1. Navigate to `/de/auth/login`
2. Assert E-Mail field, Passwort field, and Anmelden button visible
3. Assert `aside` is NOT visible
   **Expected:** Auth layout with centered card, no sidebar
   **Linked AC:** AC-01

---

### TC-AUTH-02: Register page

**Objective:** Register form renders all required fields
**Steps:**

1. Navigate to `/de/auth/register`
2. Assert Name, E-Mail, Passwort (exact), Passwort bestätigen fields visible
   **Expected:** All four fields rendered with Passwortstärke indicator
   **Linked AC:** AC-02

---

### TC-AUTH-03: Weak password validation

**Objective:** Submitting a weak password shows field-level translated errors without a server roundtrip
**Steps:**

1. Navigate to `/de/auth/register`
2. Fill Name, E-Mail, Passwort = "password" (no uppercase), Passwort bestätigen = "password"
3. Click "Konto erstellen"
4. Assert error text matching `/Großbuchstabe/i` is visible
5. Assert URL still matches `/auth/register`
   **Expected:** Field error shown immediately; no API call made
   **Linked AC:** AC-03

---

### TC-AUTH-04: Successful registration

**Objective:** Registering with a valid unique email shows verification sent message
**Steps:**

1. Navigate to `/de/auth/register`
2. Fill all fields with valid data (unique test email, `ValidP@ss1`)
3. Click "Konto erstellen"
4. Assert "Verifizierungs-E-Mail gesendet" text visible
5. Assert URL still on `/auth/register`
   **Expected:** Success card shown; user created in DB; email_confirmation row created
   **Linked AC:** AC-04

---

### TC-AUTH-05: Duplicate email registration

**Objective:** Registering an already-registered email returns 409 with error message
**Steps:**

1. Navigate to `/de/auth/register`
2. Fill form with `admin@evidoxa.dev` (seed email)
3. Click "Konto erstellen"
4. Assert "bereits registriert" text visible
   **Expected:** 409 error displayed; no new user created
   **Linked AC:** AC-05

---

### TC-AUTH-06: Valid email verification token

**Objective:** A valid unhashed token in the URL verifies the user's email
**Preconditions:** Unverified user created via register API; test token inserted via `insertTestVerificationToken`
**Steps:**

1. Insert test token for user
2. Navigate to `/de/auth/verify?token={rawToken}`
3. Wait for API call to complete
4. Assert "E-Mail bestätigt" text visible
5. Assert "Dein Konto ist aktiv" and "Jetzt anmelden" visible
   **Expected:** Email confirmed; `email_verified_at` set in DB
   **Linked AC:** AC-06

---

### TC-AUTH-07: Invalid verification token

**Objective:** Invalid or missing token shows error state
**Steps (case 1 — invalid token):**

1. Navigate to `/de/auth/verify?token=000...000` (64 zeros)
2. Assert "Ungültiger Link" text visible
3. Assert "Neuen Link anfordern" link visible
   **Steps (case 2 — no token):**
4. Navigate to `/de/auth/verify`
5. Assert "Ungültiger Link" text visible immediately
   **Expected:** Error state shown; no DB changes
   **Linked AC:** AC-07

---

### TC-AUTH-08: Successful login

**Objective:** Verified user logs in and reaches dashboard
**Steps:**

1. Navigate to `/de/auth/login`
2. Fill email `admin@evidoxa.dev`, password `Demo1234!`
3. Click "Anmelden"
4. Wait for redirect to `/de/dashboard`
5. Assert "Evidoxa Admin" name visible
6. Assert "Du bist angemeldet." visible
   **Expected:** JWT session created; dashboard rendered with AppShell
   **Linked AC:** AC-08

---

### TC-AUTH-09: Wrong credentials

**Objective:** Generic error message without revealing which field is wrong
**Steps:**

1. Navigate to `/de/auth/login`
2. Fill correct email, wrong password
3. Click "Anmelden"
4. Assert "E-Mail oder Passwort ungültig" visible
5. Assert no text matching `/wrong password|user not found/i`
   **Expected:** Generic error only; no field-specific leak
   **Linked AC:** AC-09

---

### TC-AUTH-11: Protected route redirect

**Objective:** Unauthenticated access to dashboard redirects to login
**Steps:**

1. (No cookies/session)
2. Navigate to `/de/dashboard`
3. Assert redirect to URL matching `/auth/login`
   **Expected:** middleware `authorized` callback redirects to signIn page
   **Linked AC:** AC-11

---

### TC-AUTH-12: Authenticated dashboard

**Objective:** Logged-in user sees welcome message with their name
**Steps:**

1. Login as admin
2. Assert "Willkommen, Evidoxa Admin!" heading visible
3. Assert "Du bist angemeldet." text visible
   **Expected:** Dashboard renders with personalised welcome
   **Linked AC:** AC-12

---

### TC-AUTH-13: Logout

**Objective:** Logout clears session and redirects to login; subsequent dashboard visit redirects
**Steps:**

1. Login as admin
2. Click "Abmelden"
3. Assert redirect to `/auth/login`
4. Navigate to `/de/dashboard`
5. Assert redirect to `/auth/login`
   **Expected:** Session cookie cleared; middleware blocks dashboard access
   **Linked AC:** AC-13

---

### TC-AUTH-14: Forgot password — enumeration safe

**Objective:** Known and unknown emails both show the same success card
**Steps (known):**

1. Navigate to `/de/auth/forgot-password`
2. Fill `admin@evidoxa.dev`, click "Link anfordern"
3. Assert "Falls ein Konto" text visible
   **Steps (unknown):**
4. Fill `unknown@nowhere.test`, click "Link anfordern"
5. Assert same "Falls ein Konto" text visible
   **Expected:** Identical response regardless of whether email exists
   **Linked AC:** AC-14

---

### TC-AUTH-15: Password reset — valid token

**Objective:** Valid reset token allows setting a new password; redirects to login with success banner
**Preconditions:** Test reset token inserted via `insertTestResetToken`
**Steps:**

1. Navigate to `/de/auth/reset-password?token={rawToken}`
2. Assert "Neues Passwort" field visible
3. Fill new password and confirm, click "Passwort speichern"
4. Assert redirect to URL matching `/auth/login?reset=1`
5. Assert "Passwort wurde zurückgesetzt" text visible
   **Expected:** `password_hash` updated; `password_resets.used_at` set; login shows success banner
   **Linked AC:** AC-15

---

### TC-AUTH-16: Expired/invalid reset token

**Objective:** Invalid reset token shows error; missing token shows invalid link error immediately
**Steps (invalid token):**

1. Navigate to `/de/auth/reset-password?token=ccc...ccc`
2. Fill password fields, click "Passwort speichern"
3. Assert error alert visible
   **Steps (no token):**
4. Navigate to `/de/auth/reset-password`
5. Assert "Ungültiger Link" visible immediately
   **Expected:** Appropriate error states; no DB changes
   **Linked AC:** AC-16

---

### TC-AUTH-19: i18n on auth pages

**Objective:** Auth pages render in German by default; switching locale updates labels
**Steps (German):**

1. Navigate to `/de/auth/login` — assert "Anmelden" button
2. Navigate to `/de/auth/register` — assert "Konto erstellen" button
3. Navigate to `/de/auth/forgot-password` — assert "Link anfordern" button
   **Steps (switch to English):**
4. On `/de/auth/login`, click EN switcher
5. Assert redirect to `/en/auth/login`
6. Assert "Sign in" button visible
   **Expected:** Labels follow active locale
   **Linked AC:** AC-19
