import { createHash } from "node:crypto";

import type * as NextServer from "next/server";
import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Prisma, Redis and email are mocked (plan §1: a unit test must never reach
// `src/lib/redis.ts` — the CI unit job holds real Upstash credentials). The
// REAL `anonymizeIp`, `isExpired` and `jsonError` are used. Stranger text is
// stored verbatim (#150, `docs/specs/150-plain-text-storage/plan.md`): nothing
// is encoded or stripped on write, so the arguments handed to Prisma and to the
// notification are asserted against the raw input.
const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  findUser: vi.fn(),
  findRequest: vi.fn(),
  createRequest: vi.fn(),
  updateRequest: vi.fn(),
  deleteManyRequests: vi.fn(),
  notify: vi.fn(),
  sendNotice: vi.fn(),
  throttleCheck: vi.fn(),
  isExpired: vi.fn(),
  // Callbacks handed to next/server's `after()`, in scheduling order.
  afterTasks: [] as Array<() => unknown>,
}));

// `after()` only works inside a Next request scope. Capture what the route
// schedules; tests run it explicitly, which is what Next does after the response.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof NextServer>()),
  after: (task: () => unknown) => {
    mocks.afterTasks.push(task);
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: mocks.findUser },
    accessRequest: {
      findUnique: mocks.findRequest,
      create: mocks.createRequest,
      update: mocks.updateRequest,
      deleteMany: mocks.deleteManyRequests,
    },
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  claimOnce: mocks.throttleCheck,
}));
vi.mock("@/lib/email", () => ({
  sendAccessRequestNotification: mocks.notify,
  sendExistingAccountNotice: mocks.sendNotice,
}));
vi.mock("@/lib/access-retention", async (importOriginal) => {
  const actual = await importOriginal<typeof Retention>();
  return { ...actual, isExpired: mocks.isExpired };
});

import type * as Retention from "@/lib/access-retention";
import { anonymizeIp } from "@/lib/security";
import { verbatimCases } from "@/test/verbatim-text";

import { POST } from "./route";

const realRetention = await vi.importActual<typeof Retention>("@/lib/access-retention");

const NOW = new Date("2026-10-02T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const RAW_IP = "203.0.113.9";
const IP_KEY = `access-request:${anonymizeIp(RAW_IP)}`;
const HOUR_WINDOW = HOUR;

function validBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    email: "ada@example.com",
    name: "Ada Lovelace",
    institution: "Royal Society",
    research_area: "Computing history",
    tool_gap: "Which letters survive?",
    locale: "de",
    consent: true,
    company: "",
    rendered_at: NOW.getTime() - 10_000,
    ...overrides,
  };
}

function makeRequest(body: unknown, rawBody?: string): Request {
  return new Request("http://localhost:3000/api/access-request", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `${RAW_IP}, 10.0.0.1` },
    body: rawBody ?? JSON.stringify(body),
  });
}

/** Runs everything the route handed to `after()`, as Next does once the response is out. */
async function runAfterTasks(): Promise<void> {
  for (const task of mocks.afterTasks.splice(0)) await task();
}

/** POST, then let the post-response work run — the shape most tests care about. */
async function post(overrides: Record<string, unknown> = {}): Promise<Response> {
  const response = await POST(makeRequest(validBody(overrides)));
  await runAfterTasks();
  return response;
}

/** Everything that would write state or send mail. */
function anyWriteOrMail(): boolean {
  return (
    mocks.createRequest.mock.calls.length > 0 ||
    mocks.updateRequest.mock.calls.length > 0 ||
    mocks.deleteManyRequests.mock.calls.length > 0 ||
    mocks.notify.mock.calls.length > 0
  );
}

function row(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "req_existing",
    email: "ada@example.com",
    status: "PENDING",
    status_changed_at: new Date(NOW.getTime() - 1 * HOUR),
    invites: [],
    ...overrides,
  };
}

const created = {
  id: "req_new",
  name: "Ada Lovelace",
  email: "ada@example.com",
  institution: "Royal Society",
  research_area: "Computing history",
  tool_gap: "Which letters survive?",
  locale: "de",
  status_changed_at: NOW,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.afterTasks.length = 0;
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  // The REAL retention rule; one test overrides it once to reach a defensive branch.
  mocks.isExpired.mockImplementation(realRetention.isExpired);
  mocks.checkRateLimit.mockResolvedValue(null);
  mocks.findUser.mockResolvedValue(null);
  mocks.findRequest.mockResolvedValue(null);
  mocks.createRequest.mockResolvedValue(created);
  mocks.updateRequest.mockResolvedValue({ ...created, id: "req_existing" });
  mocks.deleteManyRequests.mockResolvedValue({ count: 1 });
  mocks.notify.mockResolvedValue(undefined);
  mocks.sendNotice.mockResolvedValue(undefined);
  mocks.throttleCheck.mockResolvedValue({ claimed: true, degraded: false });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function logged(): string {
  return JSON.stringify([
    ...vi.mocked(console.warn).mock.calls,
    ...vi.mocked(console.error).mock.calls,
    ...vi.mocked(console.info).mock.calls,
  ]);
}

describe("rate limiting (I4, Q9)", () => {
  it("runs both limiters, per-IP then global, before the body is parsed", async () => {
    const order: string[] = [];
    mocks.checkRateLimit.mockImplementation(async (key: string) => {
      order.push(`limit:${key}`);
      return null;
    });
    const request = makeRequest(validBody());
    const realJson = request.json.bind(request);
    request.json = async () => {
      order.push("parse");
      return realJson();
    };

    await POST(request);

    expect(order.slice(0, 3)).toEqual([`limit:${IP_KEY}`, "limit:access-request:global", "parse"]);
    expect(mocks.checkRateLimit).toHaveBeenNthCalledWith(1, IP_KEY, 3, HOUR_WINDOW);
    expect(mocks.checkRateLimit).toHaveBeenNthCalledWith(
      2,
      "access-request:global",
      30,
      HOUR_WINDOW,
    );
  });

  it("answers 429 from the per-IP limiter without parsing or touching Prisma", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 }),
    );
    const request = makeRequest(validBody());
    const jsonSpy = vi.spyOn(request, "json");

    const res = await POST(request);

    expect(res.status).toBe(429);
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(mocks.checkRateLimit).toHaveBeenCalledTimes(1);
    expect(mocks.findUser).not.toHaveBeenCalled();
    expect(mocks.findRequest).not.toHaveBeenCalled();
    expect(anyWriteOrMail()).toBe(false);
  });

  it("answers 429 from the global limiter without parsing or touching Prisma", async () => {
    mocks.checkRateLimit
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(
        NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 }),
      );
    const request = makeRequest(validBody());
    const jsonSpy = vi.spyOn(request, "json");

    const res = await POST(request);

    expect(res.status).toBe(429);
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(mocks.findUser).not.toHaveBeenCalled();
    expect(mocks.findRequest).not.toHaveBeenCalled();
    expect(anyWriteOrMail()).toBe(false);
  });

  it.each([
    ["per-IP", 0, "ip"],
    ["global", 1, "global"],
  ])("logs a %s 429 naming the limiter, with no PII", async (_name, index, limiter) => {
    for (let i = 0; i < index; i++) mocks.checkRateLimit.mockResolvedValueOnce(null);
    mocks.checkRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 }),
    );

    await post();

    const warned = vi.mocked(console.warn).mock.calls;
    expect(warned).toHaveLength(1);
    expect(warned[0]).toEqual(["[access-request] rate limited", { limiter }]);
    expect(logged()).not.toContain(RAW_IP);
    expect(logged()).not.toContain(anonymizeIp(RAW_IP));
    expect(logged()).not.toContain("ada@example.com");
  });

  it("passes a degraded-limiter 503 through without logging it as a 429", async () => {
    mocks.checkRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE" } }, { status: 503 }),
    );

    const res = await post();

    expect(res.status).toBe(503);
    expect(console.warn).not.toHaveBeenCalled();
    expect(mocks.findUser).not.toHaveBeenCalled();
  });
});

describe("request shape", () => {
  it("rejects a body that is not JSON with 400 INVALID_JSON", async () => {
    const res = await POST(makeRequest(null, "{not json"));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_JSON");
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it.each([
    ["an invalid email", { email: "not-an-email" }, "email"],
    ["a missing name", { name: "" }, "name"],
    ["a name over 100 characters", { name: "x".repeat(101) }, "name"],
    ["a tool_gap over 2000 characters", { tool_gap: "x".repeat(2001) }, "tool_gap"],
    ["missing consent", { consent: false }, "consent"],
    ["an unknown locale", { locale: "fr" }, "locale"],
    ["a missing timestamp", { rendered_at: undefined }, "rendered_at"],
  ])("rejects %s with field-keyed 400 VALIDATION_FAILED", async (_name, overrides, field) => {
    const res = await post(overrides);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.details.fields).toHaveProperty(field);
    expect(mocks.findUser).not.toHaveBeenCalled();
    expect(anyWriteOrMail()).toBe(false);
  });

  it("rejects a name that is blank after trimming instead of storing it", async () => {
    const res = await post({ name: " \t " });

    expect(res.status).toBe(400);
    expect((await res.json()).error.details.fields).toHaveProperty("name");
    expect(anyWriteOrMail()).toBe(false);
  });
});

describe("uniform response (I5)", () => {
  async function bodyOf(res: Response): Promise<{ status: number; type: string; text: string }> {
    return {
      status: res.status,
      type: res.headers.get("content-type") ?? "",
      text: await res.text(),
    };
  }

  it("returns byte-identical bodies for trap, existing-user and real submissions", async () => {
    // honeypot
    const honeypot = await bodyOf(await post({ company: "Acme" }));
    // timing
    const tooFast = await bodyOf(await post({ rendered_at: NOW.getTime() - 500 }));
    // existing user
    mocks.findUser.mockResolvedValueOnce({ id: "user_1" });
    const existingUser = await bodyOf(await post());
    // real new submission
    const real = await bodyOf(await post());

    expect(real.status).toBe(200);
    expect(real.text).toBe(JSON.stringify({ ok: true }));
    expect(honeypot).toEqual(real);
    expect(tooFast).toEqual(real);
    expect(existingUser).toEqual(real);
  });

  it("answers an empty name identically whether or not the email has an account", async () => {
    // A name with nothing in it (blank after trim) is a validation failure. It
    // must be decided before any lookup, or the 400-vs-200 split reveals which
    // addresses have accounts (I5). Markup is no longer "nothing": `<b></b>`
    // is stored as typed, so it is accepted (see the verbatim tests below).
    const blank = { name: "   " };
    mocks.findUser.mockResolvedValueOnce({ id: "user_1" });
    const existingUser = await bodyOf(await post(blank));
    const unknownUser = await bodyOf(await post(blank));

    expect(unknownUser.status).toBe(400);
    expect(existingUser).toEqual(unknownUser);
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it("returns the same bytes for every step-7 outcome that is not a validation failure", async () => {
    const real = await (await post()).text();

    mocks.findRequest.mockResolvedValueOnce(row());
    const pending = await (await post()).text();

    mocks.findRequest.mockResolvedValueOnce(
      row({
        status: "INVITED",
        invites: [{ used_at: null, expires_at: new Date(NOW.getTime() + HOUR) }],
      }),
    );
    const invited = await (await post()).text();

    mocks.createRequest.mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "P2002" }));
    const raced = await (await post()).text();

    expect([pending, invited, raced]).toEqual([real, real, real]);
  });

  it("writes nothing and sends nothing for a honeypot submission", async () => {
    await post({ company: "Acme" });
    expect(anyWriteOrMail()).toBe(false);
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it.each([
    ["under two seconds", NOW.getTime() - 1_999],
    ["exactly now", NOW.getTime()],
    ["in the future", NOW.getTime() + 60_000],
  ])("treats a form rendered %s ago as a bot: no write, no mail", async (_name, renderedAt) => {
    const res = await post({ rendered_at: renderedAt });
    expect(res.status).toBe(200);
    expect(anyWriteOrMail()).toBe(false);
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it("accepts a form rendered exactly two seconds ago", async () => {
    await post({ rendered_at: NOW.getTime() - 2_000 });
    expect(mocks.createRequest).toHaveBeenCalledTimes(1);
  });

  it("writes nothing and sends nothing when a user already has this address", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });

    const res = await post();

    expect(res.status).toBe(200);
    expect(mocks.findUser).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "ada@example.com" } }),
    );
    expect(mocks.findRequest).not.toHaveBeenCalled();
    expect(anyWriteOrMail()).toBe(false);
  });

  it("a real new submission creates the PENDING row and notifies the operators", async () => {
    const res = await post();

    expect(res.status).toBe(200);
    expect(mocks.createRequest).toHaveBeenCalledTimes(1);
    expect(mocks.createRequest.mock.calls[0]![0].data).toMatchObject({
      email: "ada@example.com",
      name: "Ada Lovelace",
      institution: "Royal Society",
      research_area: "Computing history",
      tool_gap: "Which letters survive?",
      locale: "de",
      status: "PENDING",
      consent_at: NOW,
      ip_hash: anonymizeIp(RAW_IP),
    });
    expect(mocks.notify).toHaveBeenCalledTimes(1);
    expect(mocks.notify).toHaveBeenCalledWith({
      requestId: "req_new",
      name: "Ada Lovelace",
      email: "ada@example.com",
      institution: "Royal Society",
      researchArea: "Computing history",
      toolGap: "Which letters survive?",
      locale: "de",
      statusChangedAt: NOW,
    });
  });

  it("lowercases and trims the email before every lookup and write", async () => {
    await post({ email: "  Ada@Example.COM " });

    expect(mocks.findUser).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "ada@example.com" } }),
    );
    expect(mocks.findRequest).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "ada@example.com" } }),
    );
    expect(mocks.createRequest.mock.calls[0]![0].data.email).toBe("ada@example.com");
  });

  it("stores empty optional fields as null", async () => {
    await post({ institution: "", research_area: undefined, tool_gap: "   " });

    expect(mocks.createRequest.mock.calls[0]![0].data).toMatchObject({
      institution: null,
      research_area: null,
      tool_gap: null,
    });
  });
});

describe("§4.1 step 7 — upsert branches", () => {
  it("new row: creates PENDING and notifies", async () => {
    await post();
    expect(mocks.createRequest).toHaveBeenCalledTimes(1);
    expect(mocks.updateRequest).not.toHaveBeenCalled();
    expect(mocks.deleteManyRequests).not.toHaveBeenCalled();
    expect(mocks.notify).toHaveBeenCalledTimes(1);
  });

  it("existing PENDING: updates the fields, does not notify, and leaves status_changed_at alone (I6)", async () => {
    mocks.findRequest.mockResolvedValue(row());

    const res = await post({ name: "Ada King", tool_gap: "New question" });

    expect(res.status).toBe(200);
    expect(mocks.createRequest).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.updateRequest).toHaveBeenCalledTimes(1);
    const { where, data } = mocks.updateRequest.mock.calls[0]![0];
    expect(where).toEqual({ id: "req_existing" });
    expect(data).toMatchObject({ name: "Ada King", tool_gap: "New question" });
    expect(data).not.toHaveProperty("status_changed_at");
    expect(data).not.toHaveProperty("status");
  });

  it("existing INVITED with a live invite: changes nothing and does not notify", async () => {
    mocks.findRequest.mockResolvedValue(
      row({
        status: "INVITED",
        invites: [{ used_at: null, expires_at: new Date(NOW.getTime() + HOUR) }],
      }),
    );

    const res = await post();

    expect(res.status).toBe(200);
    expect(anyWriteOrMail()).toBe(false);
  });

  it("existing INVITED without a live invite (defensive branch): re-opens as PENDING and notifies", async () => {
    // Unreachable after the read-time check — `isExpired` treats an INVITED row
    // with no live invite as expired and the row is deleted first (T3). The
    // branch is kept as a guard in case `isExpired` ever changes, so it is
    // exercised here by forcing `isExpired` to report "not expired".
    mocks.isExpired.mockReturnValueOnce(false);
    mocks.findRequest.mockResolvedValue(row({ status: "INVITED", invites: [] }));

    await post();

    expect(mocks.deleteManyRequests).not.toHaveBeenCalled();
    expect(mocks.updateRequest).toHaveBeenCalledTimes(1);
    expect(mocks.updateRequest.mock.calls[0]![0].data).toMatchObject({
      status: "PENDING",
      status_changed_at: NOW,
      reviewed_at: null,
      reviewed_by_id: null,
    });
    expect(mocks.notify).toHaveBeenCalledTimes(1);
  });

  it("existing DECLINED within 48 h: re-opens as PENDING, clears reviewed_*, starts the clock, notifies", async () => {
    mocks.findRequest.mockResolvedValue(
      row({ status: "DECLINED", status_changed_at: new Date(NOW.getTime() - 47 * HOUR) }),
    );

    await post();

    expect(mocks.deleteManyRequests).not.toHaveBeenCalled();
    expect(mocks.updateRequest.mock.calls[0]![0].data).toMatchObject({
      status: "PENDING",
      status_changed_at: NOW,
      reviewed_at: null,
      reviewed_by_id: null,
    });
    expect(mocks.notify).toHaveBeenCalledTimes(1);
    expect(mocks.notify.mock.calls[0]![0].requestId).toBe("req_existing");
  });

  it.each([
    ["PENDING after 6 h", row({ status_changed_at: new Date(NOW.getTime() - 6 * HOUR) })],
    [
      "DECLINED after 48 h",
      row({ status: "DECLINED", status_changed_at: new Date(NOW.getTime() - 48 * HOUR) }),
    ],
    [
      "INVITED whose invite expired",
      row({
        status: "INVITED",
        invites: [{ used_at: null, expires_at: new Date(NOW.getTime() - 1) }],
      }),
    ],
  ])("expired %s: deleted first, then recreated as a new request", async (_name, expired) => {
    mocks.findRequest.mockResolvedValue(expired);
    const order: string[] = [];
    mocks.deleteManyRequests.mockImplementation(async () => {
      order.push("delete");
      return { count: 1 };
    });
    mocks.createRequest.mockImplementation(async () => {
      order.push("create");
      return created;
    });

    const res = await post();

    expect(res.status).toBe(200);
    expect(mocks.deleteManyRequests).toHaveBeenCalledWith({ where: { id: "req_existing" } });
    expect(order).toEqual(["delete", "create"]);
    expect(mocks.updateRequest).not.toHaveBeenCalled();
    expect(mocks.notify).toHaveBeenCalledTimes(1);
  });

  it("a PENDING row at 5 h 59 min is still live: updated in place, not recreated", async () => {
    mocks.findRequest.mockResolvedValue(
      row({ status_changed_at: new Date(NOW.getTime() - (6 * HOUR - 60_000)) }),
    );

    await post();

    expect(mocks.deleteManyRequests).not.toHaveBeenCalled();
    expect(mocks.createRequest).not.toHaveBeenCalled();
    expect(mocks.updateRequest).toHaveBeenCalledTimes(1);
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("loads the invites of the existing row, so an INVITED row's liveness can be judged", async () => {
    await post();
    const arg = mocks.findRequest.mock.calls[0]![0];
    expect(arg.where).toEqual({ email: "ada@example.com" });
    expect(JSON.stringify(arg)).toContain("invites");
  });
});

// #163: an address that already has an account is told by email, never on screen.
describe("existing account notice (#163)", () => {
  const EMAIL_HASH = createHash("sha256").update("ada@example.com").digest("hex");

  /** Status, every header and the raw body: all that a caller can observe. */
  async function observable(res: Response) {
    return {
      status: res.status,
      headers: [...res.headers.entries()].sort(([a], [b]) => a.localeCompare(b)),
      body: await res.text(),
    };
  }

  it("answers byte-identically for a new request, an existing PENDING request, an existing user and a trap", async () => {
    const fresh = await observable(await post());

    mocks.findRequest.mockResolvedValueOnce(row());
    const pending = await observable(await post());

    mocks.findUser.mockResolvedValueOnce({ id: "user_1" });
    const existingUser = await observable(await post());

    const trap = await observable(await post({ company: "Acme" }));

    expect(fresh.status).toBe(200);
    expect(fresh.body).toBe(JSON.stringify({ ok: true }));
    expect(fresh.headers.length).toBeGreaterThan(0);
    expect(pending).toEqual(fresh);
    expect(existingUser).toEqual(fresh);
    expect(trap).toEqual(fresh);
  });

  it("the existing-user response does not depend on whether the notice is sent, throttled or failing", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });
    const sent = await observable(await post());

    mocks.throttleCheck.mockResolvedValueOnce({ claimed: false, degraded: false });
    const throttled = await observable(await post());

    mocks.throttleCheck.mockResolvedValueOnce({ claimed: false, degraded: true });
    const degraded = await observable(await post());

    mocks.sendNotice.mockRejectedValueOnce(new Error("provider down"));
    const failing = await observable(await post());

    mocks.throttleCheck.mockRejectedValueOnce(new Error("redis exploded"));
    const throwing = await observable(await post());

    expect(sent.status).toBe(200);
    for (const other of [throttled, degraded, failing, throwing]) expect(other).toEqual(sent);
  });

  it("schedules the notice for an existing account, to that address and in the request's locale", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });

    await post({ locale: "en" });

    expect(mocks.sendNotice).toHaveBeenCalledTimes(1);
    expect(mocks.sendNotice).toHaveBeenCalledWith({ to: "ada@example.com", locale: "en" });
  });

  it("creates no access request and sends no operator notification for an existing account", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });

    await post();

    expect(mocks.findRequest).not.toHaveBeenCalled();
    expect(mocks.createRequest).not.toHaveBeenCalled();
    expect(mocks.updateRequest).not.toHaveBeenCalled();
    expect(mocks.deleteManyRequests).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("does not hand the typed name, or any other form field, to the notice", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });

    await post({ name: "Mallory <b>Stranger</b>", institution: "Evil Corp", tool_gap: "pwn" });

    const args = JSON.stringify(mocks.sendNotice.mock.calls);
    expect(args).not.toMatch(/Mallory|Evil Corp|pwn/);
  });

  it("is sent after the response, not before it", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });

    const res = await POST(makeRequest(validBody()));

    expect(res.status).toBe(200);
    expect(mocks.sendNotice).not.toHaveBeenCalled();
    expect(mocks.throttleCheck).not.toHaveBeenCalled();
    await runAfterTasks();
    expect(mocks.sendNotice).toHaveBeenCalledTimes(1);
  });

  it("does not wait on a notice that never settles", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });
    mocks.sendNotice.mockReturnValue(new Promise(() => {}));

    const res = await POST(makeRequest(validBody()));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("throttles per recipient: one notice per 24 h, keyed on the hash of the lowercased address", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });
    // A stateful stand-in for the claim: the first call takes it, every later
    // one within its lifetime does not.
    const seen = new Set<string>();
    mocks.throttleCheck.mockImplementation(async (key: string) => {
      const allowed = !seen.has(key);
      seen.add(key);
      return { claimed: allowed, degraded: false };
    });

    const first = await observable(await post());
    const second = await observable(await post());
    const third = await observable(await post({ email: "  ADA@Example.COM " }));

    expect(mocks.throttleCheck).toHaveBeenCalledTimes(3);
    for (const call of mocks.throttleCheck.mock.calls) {
      expect(call).toEqual([`access-request:existing-notice:${EMAIL_HASH}`, 24 * HOUR]);
    }
    expect(mocks.sendNotice).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
    expect(third).toEqual(first);
  });

  it("a different address has its own bucket", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });
    const seen = new Set<string>();
    mocks.throttleCheck.mockImplementation(async (key: string) => {
      const allowed = !seen.has(key);
      seen.add(key);
      return { claimed: allowed, degraded: false };
    });

    await post();
    await post({ email: "grace@example.com" });

    expect(mocks.sendNotice).toHaveBeenCalledTimes(2);
  });

  it("never puts the raw address in the key", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });

    await post();

    expect(JSON.stringify(mocks.throttleCheck.mock.calls)).not.toContain("ada");
  });

  it("sends nothing when the limiter is degraded (fails closed for the email)", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });
    mocks.throttleCheck.mockResolvedValue({ claimed: false, degraded: true });

    const res = await post();

    expect(mocks.throttleCheck).toHaveBeenCalledTimes(1);
    expect(mocks.sendNotice).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("sends nothing when the limiter throws", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });
    mocks.throttleCheck.mockRejectedValue(new Error("redis exploded"));

    await post();

    expect(mocks.sendNotice).not.toHaveBeenCalled();
  });

  it("a failing send is caught and logged without the address", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });
    mocks.sendNotice.mockRejectedValue(new Error("550 ada@example.com rejected"));

    const res = await post();

    expect(res.status).toBe(200);
    expect(logged()).toContain("existing-account notice failed");
    expect(logged()).not.toMatch(/ada|example\.com|Lovelace/);
  });

  it("logs nothing that identifies the address when the notice is skipped", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });
    mocks.throttleCheck.mockResolvedValue({ claimed: false, degraded: false });

    await post();

    expect(logged()).not.toMatch(/ada|example\.com|Lovelace/);
    expect(logged()).not.toContain(EMAIL_HASH);
  });

  it("a trap and an existing request send no notice", async () => {
    await post({ company: "Acme" });
    mocks.findRequest.mockResolvedValueOnce(row());
    await post();

    expect(mocks.sendNotice).not.toHaveBeenCalled();
    expect(mocks.throttleCheck).not.toHaveBeenCalled();
  });
});

describe("create race (Q6)", () => {
  it("treats P2002 on create as an existing PENDING row: uniform 200, no notification", async () => {
    mocks.createRequest.mockRejectedValue(
      Object.assign(new Error("Unique constraint failed on the fields: (`email`)"), {
        code: "P2002",
        meta: { target: ["email"] },
      }),
    );

    const res = await post();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("does not swallow other database errors", async () => {
    mocks.createRequest.mockRejectedValue(Object.assign(new Error("boom"), { code: "P2024" }));

    await expect(post()).rejects.toThrow("boom");
    expect(mocks.notify).not.toHaveBeenCalled();
  });
});

describe("the notification is off the response path (no timing side channel)", () => {
  const scheduled = () => mocks.afterTasks.length;

  it("a real new submission returns BEFORE the notification runs, and schedules exactly one", async () => {
    const res = await POST(makeRequest(validBody()));

    expect(res.status).toBe(200);
    expect(scheduled()).toBe(1);
    expect(mocks.notify).not.toHaveBeenCalled();

    await runAfterTasks();
    expect(mocks.notify).toHaveBeenCalledTimes(1);
  });

  it("does not wait on a notification that never settles", async () => {
    mocks.notify.mockReturnValue(new Promise(() => {}));

    const res = await POST(makeRequest(validBody()));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("an existing account schedules exactly one task: the existing-account notice, not the operator notification", async () => {
    mocks.findUser.mockResolvedValue({ id: "user_1" });
    await POST(makeRequest(validBody()));
    expect(scheduled()).toBe(1);
    expect(mocks.sendNotice).not.toHaveBeenCalled();
    await runAfterTasks();
    expect(mocks.sendNotice).toHaveBeenCalledTimes(1);
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("a trap (honeypot) schedules nothing", async () => {
    await POST(makeRequest(validBody({ company: "Acme" })));
    expect(scheduled()).toBe(0);
  });

  it("a too-fast submission schedules nothing", async () => {
    await POST(makeRequest(validBody({ rendered_at: NOW.getTime() - 100 })));
    expect(scheduled()).toBe(0);
  });

  it("a P2002 create race schedules nothing", async () => {
    mocks.createRequest.mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002" }));
    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(200);
    expect(scheduled()).toBe(0);
  });

  it("an existing PENDING request schedules nothing", async () => {
    mocks.findRequest.mockResolvedValue(row());
    await POST(makeRequest(validBody()));
    expect(scheduled()).toBe(0);
  });

  it("a DECLINED re-open schedules exactly one", async () => {
    mocks.findRequest.mockResolvedValue(row({ status: "DECLINED" }));
    await POST(makeRequest(validBody()));
    expect(scheduled()).toBe(1);
  });

  it("a throwing notification is caught inside the callback and logged by request id", async () => {
    mocks.notify.mockRejectedValue(new Error("Resend exploded for ada@example.com"));
    await POST(makeRequest(validBody()));

    await expect(runAfterTasks()).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalledWith("[access-request] notification failed", {
      requestId: "req_new",
    });
  });
});

describe("notification failure (I12)", () => {
  it("still returns the uniform 200 and logs only the request id", async () => {
    mocks.notify.mockRejectedValue(new Error("Resend exploded for ada@example.com"));

    const res = await post();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(console.error).toHaveBeenCalledWith("[access-request] notification failed", {
      requestId: "req_new",
    });
    expect(logged()).not.toContain("ada@example.com");
    expect(logged()).not.toContain("Ada Lovelace");
  });
});

describe("stranger text is stored verbatim (#150)", () => {
  // Nothing is encoded or stripped on write. The operator notification escapes
  // every interpolation itself (`src/lib/html.ts`, #150 T2), so the stored
  // value and the value handed to it are the raw input, trimmed by Zod.
  const hostile = {
    name: 'Ada <b>"the"</b> <script>alert(1)</script>& Co',
    institution: 'Inst <img src=x onerror="alert(1)"> "quoted"',
    research_area: '<a href="http://evil.example">area</a> & "more"',
    tool_gap: 'Line one <i>two</i>\n"three" <svg onload=alert(1)>',
  };

  it.each(verbatimCases("access_requests"))(
    "%s: %j reaches create unchanged",
    async (column, payload) => {
      await post({ [column]: payload });

      expect(mocks.createRequest.mock.calls[0]![0].data[column]).toBe(payload);
    },
  );

  it("create: every free-text field is stored as typed", async () => {
    await post(hostile);

    const { data } = mocks.createRequest.mock.calls[0]![0];
    expect(data.name).toBe(hostile.name);
    expect(data.institution).toBe(hostile.institution);
    expect(data.research_area).toBe(hostile.research_area);
    expect(data.tool_gap).toBe(hostile.tool_gap);
  });

  it("a name that is only markup is a name, stored as typed", async () => {
    // It used to be stripped to nothing and refused. Markup is text now.
    const res = await post({ name: "<b></b>" });

    expect(res.status).toBe(200);
    expect(mocks.createRequest.mock.calls[0]![0].data.name).toBe("<b></b>");
  });

  it("an optional field that is blank after trim is stored as null", async () => {
    await post({ institution: "   ", research_area: "", tool_gap: "\n" });

    const { data } = mocks.createRequest.mock.calls[0]![0];
    expect(data.institution).toBeNull();
    expect(data.research_area).toBeNull();
    expect(data.tool_gap).toBeNull();
  });

  it("create: the notification receives the raw values", async () => {
    await post(hostile);

    const params = mocks.notify.mock.calls[0]![0];
    expect(params.name).toBe(hostile.name);
    expect(params.institution).toBe(hostile.institution);
    expect(params.researchArea).toBe(hostile.research_area);
    expect(params.toolGap).toBe(hostile.tool_gap);
  });

  it("PENDING update: the stored value is the input", async () => {
    mocks.findRequest.mockResolvedValue(row());

    await post(hostile);

    const { data } = mocks.updateRequest.mock.calls[0]![0];
    expect(data.name).toBe(hostile.name);
    expect(data.institution).toBe(hostile.institution);
    expect(data.research_area).toBe(hostile.research_area);
    expect(data.tool_gap).toBe(hostile.tool_gap);
  });

  it("DECLINED re-open: the stored value is the input", async () => {
    mocks.findRequest.mockResolvedValue(
      row({ status: "DECLINED", status_changed_at: new Date(NOW.getTime() - HOUR) }),
    );

    await post(hostile);

    const { data } = mocks.updateRequest.mock.calls[0]![0];
    expect(data.name).toBe(hostile.name);
    expect(data.institution).toBe(hostile.institution);
    expect(data.research_area).toBe(hostile.research_area);
    expect(data.tool_gap).toBe(hostile.tool_gap);
  });
});
