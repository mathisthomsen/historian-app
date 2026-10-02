import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  findUser: vi.fn(),
  createUser: vi.fn(),
  createConfirmation: vi.fn(),
  findInvite: vi.fn(),
  updateManyInvite: vi.fn(),
  txCreateUser: vi.fn(),
  txCreateConfirmation: vi.fn(),
  txUpdateManyInvite: vi.fn(),
  transaction: vi.fn(),
  audit: vi.fn(),
  rateLimit: vi.fn(),
  bcryptHash: vi.fn(),
}));

vi.mock("resend", () => ({ Resend: vi.fn(() => ({ emails: { send: mocks.send } })) }));
vi.mock("@/lib/env", () => ({
  env: {
    EMAIL_TRANSPORT: "resend",
    RESEND_API_KEY: "re_test_key",
    RESEND_FROM_EMAIL: "noreply@example.com",
    AUTH_URL: "http://localhost:3000",
    BCRYPT_ROUNDS: 10,
  },
}));
// The top-level client has every write spy so "nothing outside the transaction"
// is an assertion about spies. The `tx` handed to the interactive transaction is
// a separate object: a write that bypasses it lands on the top-level spies.
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: mocks.findUser, create: mocks.createUser },
    emailConfirmation: { create: mocks.createConfirmation },
    invite: { findUnique: mocks.findInvite, updateMany: mocks.updateManyInvite },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/audit", () => ({ writeAuditLog: mocks.audit }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.rateLimit }));
vi.mock("bcryptjs", () => ({ default: { hash: mocks.bcryptHash } }));
vi.mock("@/lib/security", () => ({
  anonymizeIp: () => "anon",
  generateToken: () => "confirmation-token",
  hashToken: (raw: string) => `hash:${raw}`,
}));

import { POST } from "./route";

const NOW = new Date("2026-10-02T12:00:00.000Z");
const INVITE = "raw-invite-token";
const EMAIL = "ada@example.com";

function inviteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "inv_1",
    email: EMAIL,
    used_at: null,
    expires_at: new Date(NOW.getTime() + 60_000),
    ...overrides,
  };
}

function register(body: unknown = {}, rawBody?: string): Promise<Response> {
  return POST(
    new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:
        rawBody ??
        JSON.stringify({
          email: EMAIL,
          name: "Ada",
          password: "Password123!",
          invite: INVITE,
          ...(body as object),
        }),
    }),
  );
}

async function errorCodeOf(res: Response): Promise<string | undefined> {
  return ((await res.json()) as { error?: { code?: string } }).error?.code;
}

/** Every Prisma entry point, so a test can assert none was reached. */
function prismaCalls(): number {
  return [
    mocks.findUser,
    mocks.createUser,
    mocks.createConfirmation,
    mocks.findInvite,
    mocks.updateManyInvite,
    mocks.transaction,
    mocks.audit,
  ].reduce((n, spy) => n + spy.mock.calls.length, 0);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.rateLimit.mockResolvedValue(null);
  mocks.bcryptHash.mockResolvedValue("password-hash");
  mocks.findUser.mockResolvedValue(null);
  mocks.findInvite.mockResolvedValue(inviteRow());
  mocks.txUpdateManyInvite.mockResolvedValue({ count: 1 });
  mocks.txCreateUser.mockResolvedValue({ id: "new-user" });
  mocks.txCreateConfirmation.mockResolvedValue({});
  mocks.audit.mockResolvedValue(undefined);
  mocks.send.mockResolvedValue({ data: { id: "email-id" }, error: null });
  mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
    cb({
      invite: { updateMany: mocks.txUpdateManyInvite },
      user: { create: mocks.txCreateUser },
      emailConfirmation: { create: mocks.txCreateConfirmation },
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("registration email delivery", () => {
  it("finishes registration with a recorded failure when the provider never settles", async () => {
    mocks.send.mockReturnValue(new Promise(() => {}));
    let response: Response | undefined;
    const pending = register().then((result) => {
      response = result;
    });

    await vi.advanceTimersByTimeAsync(5_000);

    expect(response, "registration must finish within the email deadline").toBeDefined();
    await pending;
    expect(response!.status).toBe(201);
    expect(await response!.json()).toEqual({
      message: "auth.register.verificationSent",
      email_sent: false,
    });
    expect(mocks.txCreateUser).toHaveBeenCalledOnce();
    expect(mocks.txCreateConfirmation).toHaveBeenCalledOnce();
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "REGISTER",
        userId: "new-user",
        metadata: {
          invite_id: "inv_1",
          email_sent: false,
          email_error: expect.any(String),
        },
      }),
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reports a resolved provider rejection as a failed email", async () => {
    mocks.send.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "Invalid sender" },
    });

    const response = await register();

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(expect.objectContaining({ email_sent: false }));
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          email_sent: false,
          email_error: expect.stringContaining("Invalid sender"),
        }),
      }),
    );
  });

  it("reports accepted mail as sent", async () => {
    const response = await register();

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(expect.objectContaining({ email_sent: true }));
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("the register gate: success", () => {
  it("I1: consumes the invite, creates the user and the confirmation in ONE transaction", async () => {
    const response = await register();

    expect(response.status).toBe(201);
    expect(mocks.transaction).toHaveBeenCalledOnce();
    // The consume carries the conditional predicate — used_at null and expiry.
    expect(mocks.txUpdateManyInvite).toHaveBeenCalledWith({
      where: { id: "inv_1", used_at: null, expires_at: { gt: NOW } },
      data: { used_at: NOW },
    });
    expect(mocks.txCreateUser).toHaveBeenCalledOnce();
    expect(mocks.txCreateConfirmation).toHaveBeenCalledOnce();
    // None of the three writes went around the transaction.
    expect(mocks.updateManyInvite).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.createConfirmation).not.toHaveBeenCalled();
  });

  it("consumes the invite before it creates the user, so a lost race creates nothing", async () => {
    await register();

    const consume = mocks.txUpdateManyInvite.mock.invocationCallOrder[0]!;
    const create = mocks.txCreateUser.mock.invocationCallOrder[0]!;
    expect(consume).toBeLessThan(create);
  });

  it("hashes the password BEFORE the transaction opens", async () => {
    await register();

    const hash = mocks.bcryptHash.mock.invocationCallOrder[0]!;
    const open = mocks.transaction.mock.invocationCallOrder[0]!;
    expect(hash).toBeLessThan(open);
  });

  it("writes a REGISTER audit row that carries the invite id", async () => {
    await register();

    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "REGISTER",
        userId: "new-user",
        metadata: expect.objectContaining({ invite_id: "inv_1", email_sent: true }),
      }),
    );
  });

  it("still leaves the account unverified (B5)", async () => {
    await register();

    expect(mocks.txCreateUser).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: EMAIL, email_verified_at: null }),
    });
  });

  it("I2: a mixed-case address matches an invite stored in lowercase", async () => {
    const response = await register({ email: "Ada@Example.COM" });

    expect(response.status).toBe(201);
  });

  it("I2: compares against an invite whose stored address is mixed case", async () => {
    mocks.findInvite.mockResolvedValue(inviteRow({ email: "ADA@example.com" }));

    const response = await register();

    expect(response.status).toBe(201);
  });
});

describe("the register gate: the invite is required", () => {
  it("rejects a missing invite with 403 INVITE_REQUIRED and touches no table", async () => {
    const response = await register(
      {},
      JSON.stringify({ email: EMAIL, name: "Ada", password: "Password123!" }),
    );

    expect(response.status).toBe(403);
    expect(await errorCodeOf(response)).toBe("INVITE_REQUIRED");
    expect(mocks.findInvite).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.txCreateUser).not.toHaveBeenCalled();
  });

  it.each([
    ["empty", ""],
    ["a number", 42],
    ["null", null],
    ["an object", { token: "x" }],
  ])("rejects an invite that is %s with 403 INVITE_REQUIRED", async (_label, invite) => {
    const response = await register({ invite });

    expect(response.status).toBe(403);
    expect(await errorCodeOf(response)).toBe("INVITE_REQUIRED");
    expect(mocks.findInvite).not.toHaveBeenCalled();
  });

  it("Q4: a missing invite with an otherwise invalid body is 403, not 400", async () => {
    const response = await register(
      {},
      JSON.stringify({ email: "not-an-email", name: "", password: "x" }),
    );

    expect(response.status).toBe(403);
    expect(await errorCodeOf(response)).toBe("INVITE_REQUIRED");
  });

  it("Q4: a present invite with an invalid body is still a 400 field error", async () => {
    const response = await register({ email: "not-an-email" });

    expect(response.status).toBe(400);
    expect(await errorCodeOf(response)).toBe("VALIDATION_FAILED");
    expect(mocks.findInvite).not.toHaveBeenCalled();
  });

  it("Q4: unparseable JSON is still 400 INVALID_JSON, ahead of the invite check", async () => {
    const response = await register({}, "{not json");

    expect(response.status).toBe(400);
    expect(await errorCodeOf(response)).toBe("INVALID_JSON");
  });

  it("I5: an existing email WITHOUT an invite gets 403, never the 409 that confirms it", async () => {
    mocks.findUser.mockResolvedValue({ id: "existing" });

    const response = await register(
      {},
      JSON.stringify({ email: EMAIL, name: "Ada", password: "Password123!" }),
    );

    expect(response.status).toBe(403);
    expect(await errorCodeOf(response)).toBe("INVITE_REQUIRED");
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it("I5: an existing email with a WRONG invite gets 403, never 409", async () => {
    mocks.findUser.mockResolvedValue({ id: "existing" });
    mocks.findInvite.mockResolvedValue(null);

    const response = await register();

    expect(response.status).toBe(403);
    expect(await errorCodeOf(response)).toBe("INVITE_INVALID");
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it("an existing user with a VALID invite for that address gets 409 and nothing is consumed", async () => {
    mocks.findUser.mockResolvedValue({ id: "existing" });

    const response = await register();

    expect(response.status).toBe(409);
    expect(await errorCodeOf(response)).toBe("EMAIL_TAKEN");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

describe("the register gate: invite rejections", () => {
  const cases: Array<[string, Record<string, unknown> | null, string, string]> = [
    ["no row", null, "INVITE_INVALID", "not_found"],
    ["used", { used_at: new Date(NOW.getTime() - 1) }, "INVITE_USED", "used"],
    ["expired", { expires_at: new Date(NOW.getTime() - 1) }, "INVITE_EXPIRED", "expired"],
    // I3: exactly at `now` is expired.
    ["expiring exactly now", { expires_at: new Date(NOW.getTime()) }, "INVITE_EXPIRED", "expired"],
    ["another address", { email: "grace@example.com" }, "INVITE_EMAIL_MISMATCH", "email_mismatch"],
  ];

  it.each(cases)(
    "%s: 403, an INVALID_TOKEN audit row, and nothing created",
    async (_label, override, code, reason) => {
      mocks.findInvite.mockResolvedValue(override === null ? null : inviteRow(override));

      const response = await register();

      expect(response.status).toBe(403);
      expect(await errorCodeOf(response)).toBe(code);
      expect(mocks.audit).toHaveBeenCalledOnce();
      expect(mocks.audit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "INVALID_TOKEN",
          userId: null,
          metadata: expect.objectContaining({ token_type: "invite", reason }),
        }),
      );
      expect(mocks.transaction).not.toHaveBeenCalled();
      expect(mocks.txCreateUser).not.toHaveBeenCalled();
      expect(mocks.bcryptHash).not.toHaveBeenCalled();
    },
  );

  it("never writes the raw token into the audit row", async () => {
    mocks.findInvite.mockResolvedValue(null);

    await register();

    expect(JSON.stringify(mocks.audit.mock.calls)).not.toContain(INVITE);
  });

  it("looks the invite up by the hash of the presented token, not the raw token", async () => {
    await register();

    expect(mocks.findInvite).toHaveBeenCalledWith(
      expect.objectContaining({ where: { token_hash: `hash:${INVITE}` } }),
    );
  });
});

describe("the register gate: single use inside the transaction", () => {
  it("I1: count 0 (a concurrent redemption won) is 403 INVITE_USED and creates nothing", async () => {
    mocks.txUpdateManyInvite.mockResolvedValue({ count: 0 });

    const response = await register();

    expect(response.status).toBe(403);
    expect(await errorCodeOf(response)).toBe("INVITE_USED");
    expect(mocks.txCreateUser).not.toHaveBeenCalled();
    expect(mocks.txCreateConfirmation).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "INVALID_TOKEN",
        metadata: expect.objectContaining({ token_type: "invite", reason: "used" }),
      }),
    );
    expect(mocks.audit).not.toHaveBeenCalledWith(expect.objectContaining({ action: "REGISTER" }));
  });

  it("an invite that expires while the password hashes is not consumed (fresh clock at consume)", async () => {
    const expiresAt = new Date(NOW.getTime() + 60_000);
    mocks.findInvite.mockResolvedValue(inviteRow({ expires_at: expiresAt }));
    // Hashing outlasts the invite: valid at lookup, expired once the transaction runs.
    mocks.bcryptHash.mockImplementation(async () => {
      vi.setSystemTime(new Date(NOW.getTime() + 120_000));
      return "password-hash";
    });
    // Evaluate the predicate the way the database would.
    mocks.txUpdateManyInvite.mockImplementation(
      async ({ where }: { where: { expires_at: { gt: Date } } }) => ({
        count: expiresAt.getTime() > where.expires_at.gt.getTime() ? 1 : 0,
      }),
    );

    const response = await register();

    expect(response.status).toBe(403);
    expect(await errorCodeOf(response)).toBe("INVITE_USED");
    expect(mocks.txUpdateManyInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          expires_at: { gt: new Date(NOW.getTime() + 120_000) },
        }),
      }),
    );
    expect(mocks.txCreateUser).not.toHaveBeenCalled();
    expect(mocks.txCreateConfirmation).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("P2002 on the user insert is 409 EMAIL_TAKEN, not a 500", async () => {
    mocks.txCreateUser.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["email"] },
      }),
    );

    const response = await register();

    expect(response.status).toBe(409);
    expect(await errorCodeOf(response)).toBe("EMAIL_TAKEN");
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalledWith(expect.objectContaining({ action: "REGISTER" }));
  });

  it("any other transaction failure propagates rather than being reported as a client error", async () => {
    mocks.txCreateUser.mockRejectedValue(new Error("connection reset"));

    await expect(register()).rejects.toThrow("connection reset");
  });
});

describe("the register gate: rate limit first (I4)", () => {
  it("a limited caller reaches no Prisma call and no body parse", async () => {
    mocks.rateLimit.mockResolvedValue(NextResponse.json({ error: "limited" }, { status: 429 }));

    const response = await register();

    expect(response.status).toBe(429);
    expect(prismaCalls()).toBe(0);
    expect(mocks.bcryptHash).not.toHaveBeenCalled();
  });

  it("a limited caller with no invite is 429, not 403", async () => {
    mocks.rateLimit.mockResolvedValue(NextResponse.json({ error: "limited" }, { status: 429 }));

    const response = await register(
      {},
      JSON.stringify({ email: EMAIL, name: "Ada", password: "Password123!" }),
    );

    expect(response.status).toBe(429);
  });

  it("checks the limit before it looks the invite up", async () => {
    await register();

    expect(mocks.rateLimit.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.findInvite.mock.invocationCallOrder[0]!,
    );
  });
});
