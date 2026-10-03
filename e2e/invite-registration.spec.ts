import { expect, test, type Page } from "@playwright/test";

import { resetAuthState } from "./helpers/auth";
import {
  countTestUsers,
  createTestUser,
  deleteTestAccessRequest,
  deleteTestInvites,
  deleteTestUser,
  getTestAccessRequest,
  insertTestAccessRequest,
  insertTestInvite,
  listTestInvites,
  setTestUserRole,
  verifyUserEmail,
} from "./helpers/db";

/**
 * Invite-gated registration, end to end (#29, plan T9, spec §9 and §11).
 *
 * Method: a real browser against a real server and database wherever the
 * property is about a session or a rendered page (A2, A4, I7, I13), and the
 * request fixture where it is about a status code. Invites are inserted with
 * `insertTestInvite`: CI's email stub never exposes a token (plan A7).
 *
 * Rate limits: `resetAuthState` runs `resetRateLimits()` before every test.
 * The access-request route allows 3 per hour per IP, and every test here shares
 * one IP.
 */

const ORIGIN = "http://localhost:3000";
const PASSWORD = "ValidP@ss1";
const FOREIGN_ORIGIN = "https://evil.example";

/** `access.success` (de) — one message for every accepted case (I5). */
const ACCESS_SUCCESS = /Danke\. Wenn wir Sie einladen können/;

const HOUR_MS = 60 * 60 * 1000;

test.beforeEach(resetAuthState);

/**
 * Every address a test creates is registered here and swept in `afterEach`,
 * whatever the test did with it: each delete is a no-op when nothing exists.
 */
const created: string[] = [];

/** A unique, throw-away address. Tracked for cleanup. */
function uniqueEmail(prefix: string): string {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;
  created.push(email);
  return email;
}

test.afterEach(async () => {
  const emails = created.splice(0);
  for (const email of emails) {
    await deleteTestUser(email);
    await deleteTestAccessRequest(email);
    await deleteTestInvites(email);
  }
});

/** A `createTestUser` account, promoted when `role` is ADMIN. NEVER the seeded admin (plan P11). */
async function createAccount(prefix: string, role: "USER" | "ADMIN"): Promise<string> {
  const email = uniqueEmail(prefix);
  await createTestUser(email, PASSWORD);
  if (role === "ADMIN") await setTestUserRole(email, "ADMIN");
  return email;
}

/** Signs in through the real login form and waits for the dashboard. */
async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("/de/auth/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/de\/dashboard/, { timeout: 15_000 });
}

/** The confirmation page's own 404 (`[locale]/not-found.tsx`), not the page. */
async function expectNotFoundPage(page: Page): Promise<void> {
  // Asserted on the rendered page, not the HTTP status: `(app)/loading.tsx`
  // streams a fallback first, so a `notFound()` thrown below it may arrive
  // after a 200 has been committed.
  await expect(page.getByText("Seite nicht gefunden")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "Zugangsanfrage" })).toHaveCount(0);
}

function decisionUrl(id: string): string {
  return `/api/admin/access-requests/${id}`;
}

/**
 * Fills and submits the landing page's request form (`#access`).
 *
 * The route treats an answer within 2 s of the form mounting as a bot (§4.1
 * step 4), and Playwright types faster than any person. The wait below comes
 * first so that hydration has finished before anything is typed and the 2 s
 * have passed by the time the form is submitted.
 */
async function submitAccessForm(
  page: Page,
  fields: { name: string; email: string; honeypot?: string },
): Promise<void> {
  await page.goto("/de#access");
  const form = page.locator("#access");
  await expect(form.locator("#access-name")).toBeVisible();
  await page.waitForTimeout(3_000);

  await form.locator("#access-name").fill(fields.name);
  await form.locator("#access-email").fill(fields.email);
  await form.locator("#access-institution").fill("E2E Institut");
  await form.locator("#access-research-area").fill("Stadtgeschichte");
  if (fields.honeypot !== undefined) {
    // Off-screen and aria-hidden, so a person never reaches it. `force` skips
    // the actionability checks that would refuse it for that reason.
    await form.locator('input[type="text"][tabindex="-1"]').fill(fields.honeypot, { force: true });
  }
  await form.getByRole("checkbox").click();
  await form.getByRole("button", { name: "Zugang anfragen" }).click();
}

// ---------------------------------------------------------------------------
// Request access: the public form (§4.1, I5)
// ---------------------------------------------------------------------------
test.describe("Request access through the landing form", () => {
  test("submitting shows the success copy and stores a PENDING request", async ({ page }) => {
    const email = uniqueEmail("e2e-req");
    await submitAccessForm(page, { name: "E2E Antragsteller", email });

    await expect(page.getByText(ACCESS_SUCCESS)).toBeVisible({ timeout: 10_000 });
    // The form is replaced by the message; nothing in the page says what happened to the address.
    await expect(page.locator("#access-email")).toHaveCount(0);

    const row = await getTestAccessRequest(email);
    expect(row?.status).toBe("PENDING");
    expect(row?.name).toBe("E2E Antragsteller");
  });

  test("a filled honeypot gets the same visible result and writes no row", async ({ page }) => {
    const email = uniqueEmail("e2e-trap");
    await submitAccessForm(page, { name: "E2E Bot", email, honeypot: "Acme GmbH" });

    await expect(page.getByText(ACCESS_SUCCESS)).toBeVisible({ timeout: 10_000 });
    expect(await getTestAccessRequest(email)).toBeNull();
  });

  test("an address that already has an account gets the same visible result and writes no row", async ({
    page,
  }) => {
    const email = await createAccount("e2e-existing", "USER");
    await submitAccessForm(page, { name: "E2E Existing", email });

    await expect(page.getByText(ACCESS_SUCCESS)).toBeVisible({ timeout: 10_000 });
    expect(await getTestAccessRequest(email)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// The operator's confirmation page and decision route (§4.4, §4.5, I7, I14)
// ---------------------------------------------------------------------------
test.describe("Operator decision, signed in as an ADMIN account", () => {
  let operator: string;
  let applicant: string;
  let requestId: string;

  test.beforeEach(async ({ page }) => {
    operator = await createAccount("e2e-operator", "ADMIN");
    applicant = uniqueEmail("e2e-applicant");
    requestId = await insertTestAccessRequest(applicant);
    await signIn(page, operator);
  });

  test("approving creates an email-bound invite and shows the invited outcome", async ({
    page,
  }) => {
    await page.goto(`/de/admin/access-requests/${requestId}`);
    await expect(page.getByRole("heading", { name: "Zugangsanfrage" })).toBeVisible();
    await expect(page.getByText(applicant)).toBeVisible();

    // The UI's own same-origin fetch must pass the media-type and Origin checks (I14).
    const decided = page.waitForResponse(
      (res) =>
        new URL(res.url()).pathname === decisionUrl(requestId) && res.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Einladen", exact: true }).click();
    const res = await decided;

    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: "INVITED", email_sent: true });
    await expect(
      page.getByRole("status").filter({ hasText: "per E-Mail versendet" }),
    ).toBeVisible();
    await expect(page.getByText("Eingeladen", { exact: true })).toBeVisible();

    expect((await getTestAccessRequest(applicant))?.status).toBe("INVITED");
    const invites = await listTestInvites(applicant);
    expect(invites).toHaveLength(1);
    expect(invites[0]?.email).toBe(applicant);
    expect(invites[0]?.access_request_id).toBe(requestId);
    expect(invites[0]?.used_at).toBeNull();
    expect(invites[0]!.expires_at.getTime()).toBeGreaterThan(Date.now());
  });

  test("declining sets DECLINED and creates no invite", async ({ page }) => {
    await page.goto(`/de/admin/access-requests/${requestId}`);

    const decided = page.waitForResponse(
      (res) =>
        new URL(res.url()).pathname === decisionUrl(requestId) && res.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Ablehnen", exact: true }).click();
    const res = await decided;

    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: "DECLINED" });
    await expect(page.getByRole("status").filter({ hasText: "abgelehnt" })).toBeVisible();

    expect((await getTestAccessRequest(applicant))?.status).toBe("DECLINED");
    expect(await listTestInvites(applicant)).toHaveLength(0);
  });

  test("a role demoted in the database takes effect without signing in again (A2)", async ({
    page,
  }) => {
    // Control: while ADMIN, the page renders.
    await page.goto(`/de/admin/access-requests/${requestId}`);
    await expect(page.getByRole("heading", { name: "Zugangsanfrage" })).toBeVisible();

    await setTestUserRole(operator, "USER");

    // Not vacuous: the SAME session still says ADMIN. Only a database read can
    // see the demotion, which is what the page and the route do (I7).
    const session = await page.request.get("/api/auth/session");
    expect(((await session.json()) as { user?: { role?: string } }).user?.role).toBe("ADMIN");

    await page.goto(`/de/admin/access-requests/${requestId}`);
    await expectNotFoundPage(page);

    const res = await page.request.post(decisionUrl(requestId), {
      headers: { Origin: ORIGIN },
      data: { decision: "approve" },
    });
    expect(res.status()).toBe(403);

    // Refused means refused: nothing was decided and no invite exists.
    expect((await getTestAccessRequest(applicant))?.status).toBe("PENDING");
    expect(await listTestInvites(applicant)).toHaveLength(0);
  });

  test("a foreign or absent Origin is refused with 403 and decides nothing", async ({ page }) => {
    const foreign = await page.request.post(decisionUrl(requestId), {
      headers: { Origin: FOREIGN_ORIGIN },
      data: { decision: "approve" },
    });
    expect(foreign.status()).toBe(403);

    // `APIRequestContext` sends no Origin unless asked to.
    const absent = await page.request.post(decisionUrl(requestId), {
      data: { decision: "approve" },
    });
    expect(absent.status()).toBe(403);

    expect((await getTestAccessRequest(applicant))?.status).toBe("PENDING");
    expect(await listTestInvites(applicant)).toHaveLength(0);
  });

  test("a non-JSON media type is refused with 415 and decides nothing", async ({ page }) => {
    // `text/plain` is CORS-safelisted: a cross-site form could send it with the
    // session cookie, and the body would still parse as JSON. Origin is correct
    // here so that the media type is the only thing wrong.
    const res = await page.request.post(decisionUrl(requestId), {
      headers: { "Content-Type": "text/plain", Origin: ORIGIN },
      data: JSON.stringify({ decision: "approve" }),
    });
    expect(res.status()).toBe(415);

    expect((await getTestAccessRequest(applicant))?.status).toBe("PENDING");
    expect(await listTestInvites(applicant)).toHaveLength(0);
  });

  test("the decision route answers GET with 405 (I8)", async ({ page }) => {
    const res = await page.request.get(decisionUrl(requestId));
    expect(res.status()).toBe(405);
    expect((await getTestAccessRequest(applicant))?.status).toBe("PENDING");
  });

  test("a PENDING request older than 6 hours is gone at read time", async ({ page }) => {
    const stale = uniqueEmail("e2e-stale");
    const staleId = await insertTestAccessRequest(stale, { statusChangedAgoMs: 7 * HOUR_MS });

    await page.goto(`/de/admin/access-requests/${staleId}`);
    await expectNotFoundPage(page);

    // The decision route treats it as absent too, and the purge has not run: the row is still there.
    const res = await page.request.post(decisionUrl(staleId), {
      headers: { Origin: ORIGIN },
      data: { decision: "approve" },
    });
    expect(res.status()).toBe(404);
    expect(await getTestAccessRequest(stale)).not.toBeNull();
    expect(await listTestInvites(stale)).toHaveLength(0);
  });

  test("a PENDING request younger than 6 hours is still shown", async ({ page }) => {
    const recent = uniqueEmail("e2e-recent");
    const recentId = await insertTestAccessRequest(recent, { statusChangedAgoMs: 5 * HOUR_MS });

    await page.goto(`/de/admin/access-requests/${recentId}`);
    await expect(page.getByRole("heading", { name: "Zugangsanfrage" })).toBeVisible();
    await expect(page.getByText(recent)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Who may not decide (§4.4, §4.5, I7, A3)
// ---------------------------------------------------------------------------
test.describe("Operator surface for everyone else", () => {
  test("a signed-in non-operator gets 404 on the page and 403 from the route", async ({ page }) => {
    const user = await createAccount("e2e-plain", "USER");
    const applicant = uniqueEmail("e2e-applicant");
    const requestId = await insertTestAccessRequest(applicant);
    await signIn(page, user);

    await page.goto(`/de/admin/access-requests/${requestId}`);
    await expectNotFoundPage(page);

    const res = await page.request.post(decisionUrl(requestId), {
      headers: { Origin: ORIGIN },
      data: { decision: "approve" },
    });
    expect(res.status()).toBe(403);

    expect((await getTestAccessRequest(applicant))?.status).toBe("PENDING");
    expect(await listTestInvites(applicant)).toHaveLength(0);
  });

  test("an anonymous visitor is sent to the login page", async ({ page }) => {
    const applicant = uniqueEmail("e2e-applicant");
    const requestId = await insertTestAccessRequest(applicant);

    await page.goto(`/de/admin/access-requests/${requestId}`);
    await expect(page).toHaveURL(/\/de\/auth\/login/, { timeout: 10_000 });
  });

  test("an anonymous decision POST gets 401 and decides nothing", async ({ request }) => {
    const applicant = uniqueEmail("e2e-applicant");
    const requestId = await insertTestAccessRequest(applicant);

    const res = await request.post(decisionUrl(requestId), {
      headers: { Origin: ORIGIN },
      data: { decision: "approve" },
    });
    expect(res.status()).toBe(401);

    expect((await getTestAccessRequest(applicant))?.status).toBe("PENDING");
    expect(await listTestInvites(applicant)).toHaveLength(0);
  });

  test("a sibling path of the admin route is not opened to anonymous callers (A3, I9)", async ({
    request,
  }) => {
    // `/api/access-request` is open by exact match; `/api/access-requests/x`
    // must not ride along on it.
    const post = await request.post("/api/access-requests/x", { data: {} });
    expect(post.status()).toBe(401);
    const get = await request.get("/api/access-requests/x");
    expect(get.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Registration with an invite (§4.2, §4.3, I1, I2, I8, I13)
// ---------------------------------------------------------------------------
test.describe("Invited registration", () => {
  test("registers from the invite link and cannot sign in until verified (I13)", async ({
    page,
  }) => {
    const email = uniqueEmail("e2e-invited");
    const invite = await insertTestInvite(email);

    await page.goto(`/de/auth/register?invite=${invite}`);
    await expect(page.getByLabel("E-Mail")).toHaveValue(email);
    await expect(page.getByLabel("E-Mail")).not.toBeEditable();
    await expect(page.getByText(`Eingeladen als ${email}`)).toBeVisible();

    await page.getByLabel("Name").fill("E2E Invited User");
    await page.getByLabel("Passwort", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Passwort bestätigen").fill(PASSWORD);
    await page.getByRole("button", { name: "Konto erstellen" }).click();
    await expect(page.getByText("Verifizierungs-E-Mail gesendet")).toBeVisible({ timeout: 10_000 });

    expect(await countTestUsers(email)).toBe(1);
    const invites = await listTestInvites(email);
    expect(invites).toHaveLength(1);
    expect(invites[0]?.used_at).not.toBeNull();

    // Registered is not verified: sign-in is refused, and stays on the login page.
    await page.goto("/de/auth/login");
    await page.getByLabel("E-Mail").fill(email);
    await page.getByLabel("Passwort", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Anmelden" }).click();
    await expect(page.getByText("Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/\/de\/auth\/login/);

    // Control: verification is the only thing that was missing.
    await verifyUserEmail(email);
    await signIn(page, email);
  });

  test("opening the invite page twice writes nothing, and registering still succeeds (I8)", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("e2e-preview");
    const invite = await insertTestInvite(email);

    await page.goto(`/de/auth/register?invite=${invite}`);
    await expect(page.getByLabel("E-Mail")).toHaveValue(email);
    await page.goto(`/de/auth/register?invite=${invite}`);
    await expect(page.getByLabel("E-Mail")).toHaveValue(email);

    const before = await listTestInvites(email);
    expect(before).toHaveLength(1);
    expect(before[0]?.used_at).toBeNull();

    const res = await request.post("/api/auth/register", {
      data: { invite, email, name: "E2E Preview", password: PASSWORD },
    });
    expect(res.status()).toBe(201);
  });

  test("two parallel registrations on one invite create exactly one account (A5, I1)", async ({
    request,
  }) => {
    const email = uniqueEmail("e2e-race");
    const invite = await insertTestInvite(email);

    const attempt = () =>
      request.post("/api/auth/register", {
        data: { invite, email, name: "E2E Race", password: PASSWORD },
      });
    const [first, second] = await Promise.all([attempt(), attempt()]);
    const statuses = [first.status(), second.status()].sort((a, b) => a - b);

    // Exactly one wins. The loser is refused by the conditional consume
    // (403 INVITE_USED) or, if both read the invite as unused and one then
    // fails on the unique constraint, 409 EMAIL_TAKEN. Never a 5xx.
    expect(statuses[0]).toBe(201);
    expect([403, 409]).toContain(statuses[1]);
    const loser = first.status() === 201 ? second : first;
    if (loser.status() === 403) {
      expect(((await loser.json()) as { error: { code: string } }).error.code).toBe("INVITE_USED");
    }

    expect(await countTestUsers(email)).toBe(1);
    const invites = await listTestInvites(email);
    expect(invites).toHaveLength(1);
    expect(invites[0]?.used_at).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Every refusal, on the page and from the API (§4.2, §4.3, I2, I3)
// ---------------------------------------------------------------------------
test.describe("Invite states", () => {
  const cases = [
    {
      name: "no invite",
      card: "Die Registrierung ist nur mit Einladung möglich.",
      link: { name: "Zugang anfragen", href: "/de#access" },
      code: "INVITE_REQUIRED",
      invite: async () => null,
    },
    {
      name: "an unknown invite",
      card: "Dieser Einladungslink ist ungültig.",
      link: { name: "Zugang anfragen", href: "/de#access" },
      code: "INVITE_INVALID",
      invite: async () => "0".repeat(64),
    },
    {
      name: "an expired invite",
      card: "Dieser Einladungslink ist abgelaufen.",
      link: { name: "Zugang erneut anfragen", href: "/de#access" },
      code: "INVITE_EXPIRED",
      invite: async (email: string) => insertTestInvite(email, { expiresInMs: -60_000 }),
    },
    {
      name: "a used invite",
      card: "Dieser Einladungslink wurde bereits verwendet.",
      link: { name: "Zur Anmeldung", href: "/de/auth/login" },
      code: "INVITE_USED",
      invite: async (email: string) => insertTestInvite(email, { used: true }),
    },
  ];

  for (const c of cases) {
    test(`${c.name}: the page shows its state and the API refuses with ${c.code}`, async ({
      page,
      request,
    }) => {
      const email = uniqueEmail("e2e-state");
      const invite = await c.invite(email);

      await page.goto(invite === null ? "/de/auth/register" : `/de/auth/register?invite=${invite}`);
      await expect(page.getByText(c.card)).toBeVisible();
      await expect(page.getByLabel("Passwort", { exact: true })).toHaveCount(0);
      await expect(page.getByRole("link", { name: c.link.name, exact: true })).toHaveAttribute(
        "href",
        c.link.href,
      );

      const res = await request.post("/api/auth/register", {
        data: {
          ...(invite === null ? {} : { invite }),
          email,
          name: "E2E State",
          password: PASSWORD,
        },
      });
      expect(res.status()).toBe(403);
      expect(((await res.json()) as { error: { code: string } }).error.code).toBe(c.code);
      expect(await countTestUsers(email)).toBe(0);
    });
  }

  test("an invite for another address is refused with INVITE_EMAIL_MISMATCH", async ({
    page,
    request,
  }) => {
    const invitedEmail = uniqueEmail("e2e-invited-for");
    const otherEmail = uniqueEmail("e2e-someone-else");
    const invite = await insertTestInvite(invitedEmail);

    // The page can only ever offer the invited address, read-only.
    await page.goto(`/de/auth/register?invite=${invite}`);
    await expect(page.getByLabel("E-Mail")).toHaveValue(invitedEmail);
    await expect(page.getByLabel("E-Mail")).not.toBeEditable();

    const res = await request.post("/api/auth/register", {
      data: { invite, email: otherEmail, name: "E2E Other", password: PASSWORD },
    });
    expect(res.status()).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe(
      "INVITE_EMAIL_MISMATCH",
    );

    // Refused without spending it: the invited address can still register.
    expect(await countTestUsers(otherEmail)).toBe(0);
    const [row] = await listTestInvites(invitedEmail);
    expect(row?.used_at).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Purge route (§4.6, I10)
// ---------------------------------------------------------------------------
test.describe("Purge route", () => {
  const PURGE_URL = "/api/internal/purge-access-requests";

  /** The runner and the server share the job's environment in CI (`ci.yml`). */
  function purgeSecret(): string {
    const secret = process.env["PURGE_SECRET"];
    if (!secret) {
      if (process.env["CI"]) throw new Error("PURGE_SECRET is not set in the CI environment.");
      test.skip(true, "PURGE_SECRET is not set; the purge route refuses every call without it.");
    }
    return secret ?? "";
  }

  test("the right secret purges expired rows and keeps live ones", async ({ request }) => {
    const secret = purgeSecret();
    const expired = uniqueEmail("e2e-purge-old");
    const live = uniqueEmail("e2e-purge-new");
    await insertTestAccessRequest(expired, { statusChangedAgoMs: 7 * HOUR_MS });
    await insertTestAccessRequest(live, { statusChangedAgoMs: 5 * HOUR_MS });

    const res = await request.post(PURGE_URL, { headers: { Authorization: `Bearer ${secret}` } });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as {
      deleted: { pending: number; declined: number; invited: number; invites: number };
    };
    expect(Object.keys(body.deleted).sort()).toEqual(["declined", "invited", "invites", "pending"]);
    expect(body.deleted.pending).toBeGreaterThanOrEqual(1);

    expect(await getTestAccessRequest(expired)).toBeNull();
    expect(await getTestAccessRequest(live)).not.toBeNull();
  });

  test("a wrong or missing secret is refused with 401 and deletes nothing", async ({ request }) => {
    const secret = purgeSecret();
    const expired = uniqueEmail("e2e-purge-kept");
    await insertTestAccessRequest(expired, { statusChangedAgoMs: 7 * HOUR_MS });

    const wrong = await request.post(PURGE_URL, {
      headers: { Authorization: "Bearer not-the-secret" },
    });
    expect(wrong.status()).toBe(401);
    // Same length as the real one, so the refusal is not a length check.
    const sameLength = await request.post(PURGE_URL, {
      headers: { Authorization: `Bearer ${"x".repeat(secret.length)}` },
    });
    expect(sameLength.status()).toBe(401);
    const missing = await request.post(PURGE_URL);
    expect(missing.status()).toBe(401);

    expect(await getTestAccessRequest(expired)).not.toBeNull();
  });

  test("GET is refused with 405", async ({ request }) => {
    const res = await request.get(PURGE_URL);
    expect(res.status()).toBe(405);
    expect(res.headers()["allow"]).toBe("POST");
  });
});
