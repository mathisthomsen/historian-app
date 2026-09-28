# Epic 2.7 — Session & Authorization Hardening — Implementation Plan

> **Archived 2026-09-28:** task-by-task implementation plan for Epic 2.7; archived once the epic shipped. Kept for forensics only, not as authority — see `docs/archive/README.md`. The durable architectural record is `docs/specs/2-7-session-authorization-hardening/specification.md`, which stays in place.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make session invalidation and route-level authorization take effect at runtime, closing #103, #88 and #27 on a live public product.

**Architecture:** Revocation is a per-user issue-time floor in Redis, written on sign-out and read in `authConfig.callbacks.session` — the one callback that runs on every `auth()` call and that `auth.ts` delegates to, so Edge middleware and Node-side guards are covered by a single implementation. `authorized()` starts returning a real `Response` so the `PUBLIC_PATHS` allow-list stops being dead code.

**Tech Stack:** next-auth 5.0.0-beta.32 (JWT strategy), `@upstash/redis`, Vitest, Playwright.

**Spec:** `docs/specs/2-7-session-authorization-hardening/specification.md`

## Global Constraints

- **This repository is public.** No reproduction steps in any file. Class, impact and fix only — `CLAUDE.md` § "Security findings in a public repo". Tests may cite `GHSA-h32c-m6mx-pmw6` by id but must not restate its procedure in a comment.
- **Revocation must fail open.** Any Redis error, missing config, or absent/malformed `iat` ⇒ treat the session as _not_ revoked, and log. Never throw out of the session callback.
- **Fail-open must be structural.** The module must not import `src/lib/env.ts` or `src/lib/redis.ts` (both parse `process.env` through Zod at module scope; a throw there takes Edge middleware down entirely, which is not fail-open). It reads env _inside_ the function and constructs its own `@upstash/redis` client.
- **Keys must be namespaced.** CI shares one Upstash instance with production (`src/lib/rate-limit-key.ts` documents this). An un-namespaced revocation key written by an E2E test would land in production's key space and sign out a real user.
- **Revoke strictly:** `iat < floor` ⇒ revoked. Ties are not revoked.
- `pnpm` only. Baseline: 108 test files / 1502 tests. Commit messages end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

## File Structure

| Path                                | Responsibility                                                           | Task |
| ----------------------------------- | ------------------------------------------------------------------------ | ---- |
| `src/lib/session-revocation-key.ts` | key shape + namespacing, dependency-free                                 | 1    |
| `src/lib/session-revocation.ts`     | read/write the floor; owns its Redis client; fails open                  | 1    |
| `src/auth.config.ts`                | session callback consults the floor; `authorized()` returns a `Response` | 2, 3 |
| `src/auth.ts`                       | `events.signOut` writes the floor                                        | 2    |
| `e2e/session-hardening.spec.ts`     | regression coverage                                                      | 5    |

---

### Task 1: The revocation module

**Files:**

- Create: `src/lib/session-revocation-key.ts`, `src/lib/session-revocation.ts`
- Test: `src/lib/session-revocation-key.test.ts`, `src/lib/session-revocation.test.ts`

**Interfaces produced** (Tasks 2 and 4 consume these exact signatures):

```ts
export function sessionRevocationKey(userId: string, namespace?: string | undefined): string;
export async function revokeSessionsBefore(userId: string, atSeconds: number): Promise<void>;
export async function isSessionRevoked(userId: string, iat: number | undefined): Promise<boolean>;
```

- [ ] **Step 1: Write the failing key test**

```ts
// src/lib/session-revocation-key.test.ts
import { afterEach, describe, expect, it } from "vitest";

import { SESSION_REVOCATION_PREFIX, sessionRevocationKey } from "@/lib/session-revocation-key";

const ORIGINAL = process.env["CACHE_NAMESPACE"];
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env["CACHE_NAMESPACE"];
  else process.env["CACHE_NAMESPACE"] = ORIGINAL;
});

describe("sessionRevocationKey", () => {
  it("uses the bare prefix when no namespace is configured", () => {
    expect(sessionRevocationKey("user-1", undefined)).toBe(`${SESSION_REVOCATION_PREFIX}:user-1`);
  });

  it("inserts the namespace before the user id, so CI cannot write production's key", () => {
    expect(sessionRevocationKey("user-1", "ci-42-1")).toBe(
      `${SESSION_REVOCATION_PREFIX}:ci-42-1:user-1`,
    );
  });

  it("treats an empty namespace as unset rather than producing a double colon", () => {
    expect(sessionRevocationKey("user-1", "")).toBe(`${SESSION_REVOCATION_PREFIX}:user-1`);
  });

  it("reads CACHE_NAMESPACE from the environment by default", () => {
    process.env["CACHE_NAMESPACE"] = "from-env";
    expect(sessionRevocationKey("user-1")).toBe(`${SESSION_REVOCATION_PREFIX}:from-env:user-1`);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails for the right reason**

Run: `pnpm vitest run src/lib/session-revocation-key.test.ts`
Expected: FAIL — cannot resolve `@/lib/session-revocation-key`. Any other failure means the path is wrong.

- [ ] **Step 3: Write the key module**

```ts
// src/lib/session-revocation-key.ts
/**
 * Redis key namespacing for session revocation.
 *
 * Deliberately dependency-free, for the same reason as `rate-limit-key.ts`: the
 * Edge session callback imports this, and pulling in `./redis` there would
 * construct an Upstash client just to learn a string.
 *
 * The namespace is not optional hygiene. CI shares one Upstash instance with
 * production, so an un-namespaced key written by an E2E sign-out would land on
 * production's key space and revoke a real user's sessions.
 */
export const SESSION_REVOCATION_PREFIX = "session:revoked-before";

export function sessionRevocationKey(
  userId: string,
  namespace: string | undefined = process.env["CACHE_NAMESPACE"],
): string {
  return namespace
    ? `${SESSION_REVOCATION_PREFIX}:${namespace}:${userId}`
    : `${SESSION_REVOCATION_PREFIX}:${userId}`;
}
```

- [ ] **Step 4: Confirm the key tests pass**

Run: `pnpm vitest run src/lib/session-revocation-key.test.ts` → 4 passed.

- [ ] **Step 5: Write the failing revocation test**

Mock `@upstash/redis` so no network call happens. Cover: no floor, older `iat`, newer `iat`, equal `iat`, Redis throwing, missing config, `iat` undefined.

```ts
// src/lib/session-revocation.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const set = vi.fn();
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(() => ({ get, set })),
}));

const ENV = { ...process.env };
beforeEach(() => {
  vi.clearAllMocks();
  process.env["KV_REST_API_URL"] = "https://example.upstash.io";
  process.env["KV_REST_API_TOKEN"] = "token";
  delete process.env["CACHE_NAMESPACE"];
});
afterEach(() => {
  process.env = { ...ENV };
});

describe("isSessionRevoked", () => {
  it("is not revoked when no floor has been written", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockResolvedValue(null);
    expect(await isSessionRevoked("u1", 1000)).toBe(false);
  });

  it("is revoked when the token predates the floor", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockResolvedValue(2000);
    expect(await isSessionRevoked("u1", 1999)).toBe(true);
  });

  it("is not revoked when the token is newer than the floor", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockResolvedValue(2000);
    expect(await isSessionRevoked("u1", 2001)).toBe(false);
  });

  it("does not revoke on an exact tie, so a login in the same second survives its own logout", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockResolvedValue(2000);
    expect(await isSessionRevoked("u1", 2000)).toBe(false);
  });

  it("fails open when Redis throws", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    get.mockRejectedValue(new Error("upstash down"));
    expect(await isSessionRevoked("u1", 1)).toBe(false);
  });

  it("fails open when Redis is not configured", async () => {
    delete process.env["KV_REST_API_URL"];
    delete process.env["UPSTASH_REDIS_REST_URL"];
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    expect(await isSessionRevoked("u1", 1)).toBe(false);
  });

  it("fails open and logs when iat is absent, because the probe showed it is always present", async () => {
    const { isSessionRevoked } = await import("@/lib/session-revocation");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await isSessionRevoked("u1", undefined)).toBe(false);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("revokeSessionsBefore", () => {
  it("writes the floor with a 30-day TTL", async () => {
    const { revokeSessionsBefore } = await import("@/lib/session-revocation");
    await revokeSessionsBefore("u1", 1234);
    expect(set).toHaveBeenCalledWith("session:revoked-before:u1", 1234, { ex: 30 * 24 * 60 * 60 });
  });

  it("does not throw when Redis is unavailable", async () => {
    const { revokeSessionsBefore } = await import("@/lib/session-revocation");
    set.mockRejectedValue(new Error("upstash down"));
    await expect(revokeSessionsBefore("u1", 1234)).resolves.toBeUndefined();
  });
});
```

Note the `await import(...)` inside each test: the module reads env at call time, and the mock must be registered first.

- [ ] **Step 6: Run and confirm it fails**

Run: `pnpm vitest run src/lib/session-revocation.test.ts`
Expected: FAIL — cannot resolve `@/lib/session-revocation`.

- [ ] **Step 7: Write the module**

```ts
// src/lib/session-revocation.ts
import { Redis } from "@upstash/redis";

import { sessionRevocationKey } from "./session-revocation-key";

/** Equal to `authConfig.session.maxAge`: past it, no token issued before the floor can still be valid. */
const TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Own client, env read inside the function.
 *
 * This module is imported by `auth.config.ts`, which runs in Edge middleware.
 * `src/lib/env.ts` and `src/lib/redis.ts` both touch `process.env` at module
 * scope; a throw there takes middleware down for every request, which is a
 * worse outcome than the defect this module exists to fix — and is not a
 * fail-open one. Nothing here runs at import time.
 */
function client(): Redis | null {
  const url = process.env["KV_REST_API_URL"] ?? process.env["UPSTASH_REDIS_REST_URL"];
  const token = process.env["KV_REST_API_TOKEN"] ?? process.env["UPSTASH_REDIS_REST_TOKEN"];
  if (!url || !token) return null;
  try {
    return new Redis({ url, token });
  } catch (error) {
    console.error("[session-revocation] could not construct Redis client", { error });
    return null;
  }
}

/** Invalidate every session for `userId` issued before `atSeconds` (unix seconds). */
export async function revokeSessionsBefore(userId: string, atSeconds: number): Promise<void> {
  const redis = client();
  if (!redis) {
    console.error("[session-revocation] Redis unavailable; sign-out did not revoke", { userId });
    return;
  }
  try {
    await redis.set(sessionRevocationKey(userId), atSeconds, { ex: TTL_SECONDS });
  } catch (error) {
    console.error("[session-revocation] failed to write revocation floor", { userId, error });
  }
}

/** True when this token was issued before the user's revocation floor. Fails open. */
export async function isSessionRevoked(userId: string, iat: number | undefined): Promise<boolean> {
  if (typeof iat !== "number" || !Number.isFinite(iat)) {
    // next-auth issues `iat` on every token (measured 2026-09-24). Its absence
    // means an assumption has broken; be loud rather than silently permissive.
    console.error("[session-revocation] token has no usable iat; failing open", { userId, iat });
    return false;
  }
  const redis = client();
  if (!redis) return false;
  try {
    const floor = await redis.get<number | string>(sessionRevocationKey(userId));
    if (floor === null || floor === undefined) return false;
    return iat < Number(floor);
  } catch (error) {
    console.error("[session-revocation] floor unreadable; failing open", { userId, error });
    return false;
  }
}
```

- [ ] **Step 8: Confirm both suites pass and nothing else broke**

Run: `pnpm vitest run src/lib/session-revocation-key.test.ts src/lib/session-revocation.test.ts` → all pass.
Run: `pnpm test` → 110 files, baseline + these two.

- [ ] **Step 9: Commit**

```bash
git add src/lib/session-revocation-key.ts src/lib/session-revocation.ts src/lib/session-revocation-key.test.ts src/lib/session-revocation.test.ts
git commit -m "$(cat <<'MSG'
feat(auth): add a per-user session revocation floor

Revocation is by issue-time rather than token identity: next-auth regenerates
`jti` on every re-encode and `updateAge` is 24h, so a denylist of jti values
would revoke only the most recently issued token while one captured earlier in
the same session stayed valid for the rest of its 30-day maxAge.

The module owns its Redis client and reads env inside the function. It is
imported by the Edge session callback, and `env.ts`/`redis.ts` parse
`process.env` at module scope — a throw there takes middleware down for every
request, which is not a fail-open outcome.

Keys carry CACHE_NAMESPACE. CI shares one Upstash instance with production, so
an un-namespaced key written by an E2E sign-out would revoke a real user.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

### Task 2: Enforce revocation, and write the floor on sign-out

**Files:**

- Modify: `src/auth.config.ts` (the `session` callback), `src/auth.ts` (add `events`)
- Test: `src/auth-config.test.ts` _(create)_

**Interfaces consumed:** `isSessionRevoked`, `revokeSessionsBefore` from Task 1.

- [ ] **Step 1: Write the failing callback test**

The session callback must strip `user` when revoked. Mock `@/lib/session-revocation`.

```ts
// src/auth-config.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const isSessionRevoked = vi.fn();
vi.mock("@/lib/session-revocation", () => ({
  isSessionRevoked,
  revokeSessionsBefore: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

async function runSession(revoked: boolean) {
  isSessionRevoked.mockResolvedValue(revoked);
  const { authConfig } = await import("@/auth.config");
  const session = { user: { id: "", email: "a@b.c", name: null, role: "USER" }, expires: "" };
  const token = { id: "u1", role: "USER", iat: 1000 };
  return authConfig.callbacks!.session!({ session, token } as never);
}

describe("authConfig.session", () => {
  it("returns a populated session when the token is not revoked", async () => {
    const result = await runSession(false);
    expect(result.user?.id).toBe("u1");
  });

  it("strips user when the token is revoked, so every guard treats it as anonymous", async () => {
    const result = await runSession(true);
    expect(result.user).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it; confirm the second test fails**

Run: `pnpm vitest run src/auth-config.test.ts`
Expected: the first test passes, the second FAILS (`user` is still populated). If the first also fails, the callback's shape differs from the fixture — fix the fixture, not the assertion.

- [ ] **Step 3: Make the session callback async and revocation-aware**

In `src/auth.config.ts`, replace the `session` callback:

```ts
    async session({ session, token }) {
      const jwt = token as JWT;
      // Revocation is checked here, not in `jwt`: measured on 2026-08-12 and
      // recorded at src/auth.ts:148-152, `jwt` runs only on sign-in and on
      // `updateAge` rotation, so a check there would not run on an ordinary
      // page request. Stripping `user` is what invalidates the session —
      // requireUser(), requireUserOrRedirect() and authorized() all test it.
      if (await isSessionRevoked(jwt.id as string, (token as { iat?: number }).iat)) {
        return { ...session, user: undefined } as unknown as typeof session;
      }
      session.user.id = jwt.id as string;
      session.user.role = jwt.role as UserRole;
      if (jwt.projectId) session.user.projectId = jwt.projectId;
      return session;
    },
```

Add the import: `import { isSessionRevoked } from "@/lib/session-revocation";`

**Do not** change `auth.ts`'s `session` wrapper — it already `await`s the delegate.

- [ ] **Step 4: Confirm both tests pass**

Run: `pnpm vitest run src/auth-config.test.ts` → 2 passed.

- [ ] **Step 5: Write the floor on sign-out**

In `src/auth.ts`, add an `events` block to the `NextAuth({...})` call. The type is `(message: { session } | { token })`; under the JWT strategy the `token` variant arrives.

```ts
  events: {
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      const userId = (token as { id?: string } | null)?.id;
      if (!userId) {
        console.error("[auth] signOut event carried no user id; sessions not revoked");
        return;
      }
      await revokeSessionsBefore(userId, Math.floor(Date.now() / 1000));
    },
  },
```

Add the import: `import { revokeSessionsBefore } from "@/lib/session-revocation";`

- [ ] **Step 6: Prove the event actually fires with the shape assumed**

The type permits two shapes and the docs describe both. Confirm empirically rather than trusting the narrowing: add a temporary `console.log(Object.keys(message))` in the handler, run `pnpm dev`, log in, log out, and read the server output. Record what it printed in your report, then remove the log.

If it carries `session` rather than `token`, stop and report — the handler needs a different path to the user id.

- [ ] **Step 7: Full suite and commit**

Run: `pnpm test && pnpm lint`

```bash
git add src/auth.config.ts src/auth.ts src/auth-config.test.ts
git commit -m "$(cat <<'MSG'
feat(auth): reject sessions issued before a sign-out

The session callback now consults the revocation floor and strips `user` when
the token predates it. That one action invalidates the session everywhere:
requireUser(), requireUserOrRedirect() and authorized() all test `session.user`.

It has to be `session` rather than `jwt` — `jwt` runs only on sign-in and on
updateAge rotation, so a check there never executes on an ordinary page request.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

### Task 3: Make `authorized()` gate requests (#88)

**Files:**

- Modify: `src/auth.config.ts` (the `authorized` callback)
- Test: `src/auth-config.test.ts` _(extend)_

- [ ] **Step 1: Write the failing tests**

```ts
describe("authConfig.authorized", () => {
  async function run(pathname: string, loggedIn: boolean) {
    const { authConfig } = await import("@/auth.config");
    const request = { nextUrl: new URL(`https://evidoxa.test${pathname}`) };
    return authConfig.callbacks!.authorized!({
      auth: loggedIn ? ({ user: { id: "u1" } } as never) : null,
      request: request as never,
    });
  }

  it("lets a public path through", async () => {
    expect(await run("/de/changelog", false)).toBe(true);
  });

  it("lets an authenticated request through", async () => {
    expect(await run("/de/dashboard", true)).toBe(true);
  });

  it("redirects an anonymous page request to the locale-correct login", async () => {
    const result = await run("/de/dashboard", false);
    expect(result).toBeInstanceOf(Response);
    const res = result as Response;
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/de/auth/login");
  });

  it("preserves a non-default locale in the redirect", async () => {
    const res = (await run("/en/dashboard", false)) as Response;
    expect(res.headers.get("location")).toContain("/en/auth/login");
  });

  it("answers an anonymous API request with 401, never a redirect", async () => {
    const res = (await run("/api/persons", false)) as Response;
    expect(res.status).toBe(401);
    expect(res.headers.get("location")).toBeNull();
  });
});
```

- [ ] **Step 2: Run; confirm the three Response tests fail**

Run: `pnpm vitest run src/auth-config.test.ts`
Expected: the two `true` cases pass; the redirect and 401 cases FAIL because the callback returns a boolean today. That failure _is_ #88.

- [ ] **Step 3: Return a Response**

Replace the tail of `authorized()` (keep the existing `isPublic` computation exactly as it is):

```ts
if (isPublic) return true;
if (isLoggedIn) return true;

// A boolean here is silently discarded by next-auth's dispatch when a
// handler is passed to `auth()` — which is why PUBLIC_PATHS had no
// runtime effect (#88). Only a Response is honoured.
if (pathnameWithoutLocale.startsWith("/api/")) {
  // Never redirect an API caller to an HTML login page.
  return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
}
const locale = /^\/([a-z]{2})(\/|$)/.exec(pathname)?.[1] ?? "de";
return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.nextUrl));
```

Add `import { NextResponse } from "next/server";`

**No cast is needed.** Verified in `next-auth/lib/index.d.ts:47`, the callback's declared return
type is already `Awaitable<boolean | NextResponse | Response | undefined>`. If you find yourself
reaching for `as never`, something else is wrong.

- [ ] **Step 4: Confirm all five pass, and the suite is green**

Run: `pnpm vitest run src/auth-config.test.ts && pnpm test`

- [ ] **Step 5: Verify a real request, not just the unit test**

The unit test constructs the callback's arguments; it cannot prove next-auth honours the return. Run `pnpm dev` and, signed out:

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/de/dashboard
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/persons
```

Expected: `307 http://localhost:3000/de/auth/login` and `401`. Paste the actual output into your report. A `200` means the callback still is not honoured and the task is not done.

- [ ] **Step 6: Commit**

```bash
git add src/auth.config.ts src/auth-config.test.ts
git commit -m "$(cat <<'MSG'
fix(auth): make authorized() actually gate requests (#88)

next-auth honours the authorized() callback's return only when it is a
Response; the boolean returned here was silently discarded, so PUBLIC_PATHS was
dead code with no runtime effect.

Pages now get a redirect to the locale-correct login, API routes a 401 — a
single redirect response would have answered every unauthenticated API call
with an HTML login page, since isPublic exempts only /api/auth and /api/health.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

### Task 4: Revoke on credential change

**Files:**

- Modify: `src/app/api/auth/reset-password/route.ts`
- Test: alongside each route's existing test

- [ ] **Step 1: Read the route and its existing test**

The completion route is **`src/app/api/auth/reset-password/route.ts`** — that is the only place a
password is persisted today. Measured: `src/app/api/auth/` contains `register`,
`forgot-password`, `reset-password` and `resend-verification`, and **there is no
change-password-while-signed-in route**. `forgot-password` only issues a token and must not
revoke anything.

So this task touches one route, not two. If a change-password route exists by the time you read
this, it needs the same call.

Read the route and its `route.test.ts`, and follow that file's existing style rather than
inventing one.

- [ ] **Step 2: Write the failing assertion**

For each route, assert `revokeSessionsBefore` is called with the user's id after a successful password change. Mock `@/lib/session-revocation`.

- [ ] **Step 3: Run; confirm it fails**

- [ ] **Step 4: Call `revokeSessionsBefore(userId, Math.floor(Date.now() / 1000))` after the password is persisted**

Only on success, and only after the write commits — revoking before a failed write would sign the user out for nothing.

- [ ] **Step 5: Confirm green, then commit**

```bash
git commit -m "$(cat <<'MSG'
feat(auth): revoke sessions when a password changes

A credential change should invalidate sessions minted before it. Same floor,
same mechanism, no extra machinery — a reset performed because a password was
believed compromised now actually ends the sessions that compromise created.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

### Task 5: E2E regression coverage

**Files:**

- Create: `e2e/session-hardening.spec.ts`

- [ ] **Step 1: Read the existing E2E conventions**

Read `e2e/auth.spec.ts` (note `test.describe.configure({ mode: "serial" })`, the seeded admin, `loginAsAdmin`) and `e2e/helpers/db.ts`.

- [ ] **Step 2: Write the anonymous-redirect test**

```ts
test("anonymous request to a protected route gets a real HTTP redirect", async ({ request }) => {
  const res = await request.get("/de/dashboard", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(res.headers()["location"]).toContain("/de/auth/login");
});

test("anonymous API request gets 401, not a redirect", async ({ request }) => {
  const res = await request.get("/api/persons", { maxRedirects: 0 });
  expect(res.status()).toBe(401);
});
```

- [ ] **Step 3: Write the replay guard**

Automates GHSA-h32c-m6mx-pmw6. **Reference the GHSA id only — do not restate the procedure in a comment.**

Shape: sign in, capture the session cookie via `context.cookies()`, sign out through the UI, then issue a request in a _fresh_ context carrying the captured cookie and assert it is refused. Use `request.newContext()` so the signed-out browser context cannot mask the result.

- [ ] **Step 4: Run against a local dev server**

```bash
pnpm exec playwright test e2e/session-hardening.spec.ts --project=chromium
```

Requires Redis configured locally. If `CACHE_NAMESPACE` is unset locally the key is un-namespaced — acceptable on a dev machine pointed at a dev Upstash, **never** against production credentials. Confirm which instance `.env.local` points at before running, and say so in your report.

- [ ] **Step 5: Commit**

---

### Task 6: Root-cause #27, and measure the fixation property

**Files:**

- Modify: `e2e/auth.spec.ts` (only if the root cause calls for it)
- Report: findings go in the task report and onto the issues

- [ ] **Step 1: Re-run TC-AUTH-13 repeatedly**

```bash
for i in $(seq 1 20); do pnpm exec playwright test e2e/auth.spec.ts -g "TC-AUTH-13" --project=chromium || echo "FAILED on run $i"; done
```

- [ ] **Step 2: State a root cause, or say you could not establish one**

The epic is explicit: _"confirm this explicitly once #88 is fixed rather than assuming it resolved as a side effect."_ If 20 runs pass, that is evidence consistent with the meta-refresh theory — it is **not** proof. Say which it is. "It stopped failing" is not a root cause, and the alternative reading (a session outliving `signOut`) is the more serious one.

- [ ] **Step 3: Measure the fixation property**

Sign in, capture the session cookie. Sign in again as the same user. Assert the second cookie's value differs from the first — a pre-authentication identifier must not survive authentication.

Add it as a test so the property is guarded, not just observed once.

- [ ] **Step 4: Comment on #27 with the finding, and commit**

Do not close #27 — report the finding and let the maintainer close it.

---

## Self-review notes

- **Task 1 has no dependencies** and is the only task that can be reviewed purely on unit tests. Tasks 2 and 3 both edit `src/auth.config.ts`, so they must run sequentially, never in parallel.
- **Two steps deliberately verify beyond the unit test** — Task 2 Step 6 (the event's real shape) and Task 3 Step 5 (`curl` against a running server). Both exist because the unit tests construct their own inputs and therefore cannot prove next-auth's dispatch behaves as assumed. That assumption being wrong _is_ #88.
- **The riskiest change is Task 2's session callback**: it runs on every authenticated request in Edge middleware. A throw there is a site-wide outage, which is why Task 1's module can fail in no way other than returning `false`.
