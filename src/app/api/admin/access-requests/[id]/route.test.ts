import { beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "https://app.example.com";
const NOW = new Date("2026-10-02T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;

// Everything that happens, in order, so the transaction/email ordering is
// asserted on one timeline rather than inferred from per-mock call order.
const calls: string[] = [];

const mockAuth = vi.fn();
const mockUserFindUnique = vi.fn();
const mockRequestFindUnique = vi.fn();
const mockTransaction = vi.fn();
const mockTxUserFindUnique = vi.fn();
const mockTxRequestUpdate = vi.fn();
const mockTxInviteDeleteMany = vi.fn();
const mockTxInviteCreate = vi.fn();
const mockSendInviteEmail = vi.fn();
// Writes through the top-level client are a bug: they would sit outside the
// transaction. Present so a stray call is observable instead of a TypeError.
const mockTopRequestUpdate = vi.fn();
const mockTopInviteCreate = vi.fn();
const mockTopInviteDeleteMany = vi.fn();

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/env", () => ({ env: { AUTH_URL: "https://app.example.com" } }));
vi.mock("@/lib/security", () => ({
  generateToken: () => "raw-invite-token",
  hashToken: () => "stored-token-hash",
}));
vi.mock("@/lib/email", () => ({ sendInviteEmail: mockSendInviteEmail }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
    accessRequest: { findUnique: mockRequestFindUnique, update: mockTopRequestUpdate },
    invite: { create: mockTopInviteCreate, deleteMany: mockTopInviteDeleteMany },
    $transaction: mockTransaction,
  },
}));

const routeModule = await import("@/app/api/admin/access-requests/[id]/route");
const { POST } = routeModule;

const ctx = (id = "req-1") => ({ params: Promise.resolve({ id }) });

function request(
  body: unknown = { decision: "approve" },
  init: { contentType?: string | null; origin?: string | null; raw?: string } = {},
): Request {
  const headers: Record<string, string> = {};
  const contentType = init.contentType === undefined ? "application/json" : init.contentType;
  if (contentType !== null) headers["Content-Type"] = contentType;
  const origin = init.origin === undefined ? ORIGIN : init.origin;
  if (origin !== null) headers.Origin = origin;
  return new Request(`${ORIGIN}/api/admin/access-requests/req-1`, {
    method: "POST",
    headers,
    body: init.raw ?? JSON.stringify(body),
  });
}

function pendingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "req-1",
    email: "ada@example.org",
    name: "Ada Lovelace",
    locale: "en",
    status: "PENDING",
    status_changed_at: new Date(NOW.getTime() - 1 * HOUR),
    invites: [],
    ...overrides,
  };
}

/** DB: operator `op-1` is `role`; `existingEmail` (if any) already has an account. */
function arrangeDb(opts: { role?: "ADMIN" | "USER" | null; existingEmail?: string } = {}) {
  const role = opts.role === undefined ? "ADMIN" : opts.role;
  mockUserFindUnique.mockImplementation(
    async (args: { where: { id?: string; email?: string } }) => {
      if (args.where.id !== undefined) return role === null ? null : { role };
      return null;
    },
  );
  // The existing-account check runs INSIDE the transaction (via `tx`), so a
  // redemption that commits between the read and the write is seen.
  mockTxUserFindUnique.mockImplementation(async (args: { where: { email?: string } }) =>
    args.where.email !== undefined && args.where.email === opts.existingEmail
      ? { id: "existing-user" }
      : null,
  );
}

/** A 409 from inside the transaction: nothing on the request or its invites changed. */
function expectNoTxWrites() {
  expect(mockTxRequestUpdate).not.toHaveBeenCalled();
  expect(mockTxInviteDeleteMany).not.toHaveBeenCalled();
  expect(mockTxInviteCreate).not.toHaveBeenCalled();
  expect(mockSendInviteEmail).not.toHaveBeenCalled();
}

function expectNoDbRead() {
  expect(mockUserFindUnique).not.toHaveBeenCalled();
  expect(mockRequestFindUnique).not.toHaveBeenCalled();
  expect(mockTransaction).not.toHaveBeenCalled();
}

function expectNothingWritten() {
  expect(mockTransaction).not.toHaveBeenCalled();
  expect(mockTopRequestUpdate).not.toHaveBeenCalled();
  expect(mockTopInviteCreate).not.toHaveBeenCalled();
  expect(mockTopInviteDeleteMany).not.toHaveBeenCalled();
  expect(mockSendInviteEmail).not.toHaveBeenCalled();
}

describe("POST /api/admin/access-requests/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    calls.length = 0;
    // The session's role is deliberately ADMIN everywhere: it is stale by design
    // (A2) and must never be what decides anything (I7).
    mockAuth.mockResolvedValue({ user: { id: "op-1", role: "ADMIN" } });
    arrangeDb();
    mockRequestFindUnique.mockResolvedValue(pendingRow());
    mockTxRequestUpdate.mockImplementation(async () => {
      calls.push("tx:update-request");
      return {};
    });
    mockTxInviteDeleteMany.mockImplementation(async () => {
      calls.push("tx:delete-invites");
      return { count: 0 };
    });
    mockTxInviteCreate.mockImplementation(async () => {
      calls.push("tx:create-invite");
      return { id: "inv-1" };
    });
    mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      calls.push("tx:begin");
      const result = await cb({
        user: { findUnique: mockTxUserFindUnique },
        accessRequest: { update: mockTxRequestUpdate },
        invite: { deleteMany: mockTxInviteDeleteMany, create: mockTxInviteCreate },
      });
      calls.push("tx:commit");
      return result;
    });
    mockSendInviteEmail.mockImplementation(async () => {
      calls.push("email");
    });
  });

  describe("step 1 — authentication", () => {
    it("401 without a session, reading nothing (the route calls auth() itself)", async () => {
      mockAuth.mockResolvedValue(null);
      const res = await POST(request(), ctx());
      expect(res.status).toBe(401);
      expect((await res.json()).error.code).toBe("UNAUTHORIZED");
      expect(mockAuth).toHaveBeenCalledTimes(1);
      expectNoDbRead();
    });

    it("401 for a session without a user id", async () => {
      mockAuth.mockResolvedValue({ user: {} });
      const res = await POST(request(), ctx());
      expect(res.status).toBe(401);
      expectNoDbRead();
    });
  });

  describe("step 2 — Content-Type (I14)", () => {
    it("415 for text/plain carrying valid JSON, before any DB read", async () => {
      const res = await POST(
        request({ decision: "approve" }, { contentType: "text/plain" }),
        ctx(),
      );
      expect(res.status).toBe(415);
      expect((await res.json()).error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
      expectNoDbRead();
      expectNothingWritten();
    });

    it("415 for a missing Content-Type, before any DB read", async () => {
      // A string body gets text/plain from the Request constructor; strip it.
      const req = request({ decision: "approve" });
      req.headers.delete("content-type");
      expect(req.headers.get("content-type")).toBeNull();
      const res = await POST(req, ctx());
      expect(res.status).toBe(415);
      expectNoDbRead();
    });

    it("415 for a form media type", async () => {
      const res = await POST(
        request(null, {
          contentType: "application/x-www-form-urlencoded",
          raw: "decision=approve",
        }),
        ctx(),
      );
      expect(res.status).toBe(415);
      expectNoDbRead();
    });

    it("415 for a media type that merely starts with application/json", async () => {
      const res = await POST(
        request({ decision: "approve" }, { contentType: "application/jsonp" }),
        ctx(),
      );
      expect(res.status).toBe(415);
      expectNoDbRead();
    });

    it("accepts application/json with parameters, case-insensitively", async () => {
      const res = await POST(
        request({ decision: "decline" }, { contentType: "Application/JSON; charset=UTF-8" }),
        ctx(),
      );
      expect(res.status).toBe(200);
    });
  });

  describe("step 3 — Origin (I14)", () => {
    it("403 FORBIDDEN when Origin is absent, before any DB read", async () => {
      const res = await POST(request({ decision: "approve" }, { origin: null }), ctx());
      expect(res.status).toBe(403);
      expect((await res.json()).error.code).toBe("FORBIDDEN");
      expectNoDbRead();
      expectNothingWritten();
    });

    it("403 FORBIDDEN for a foreign Origin, before any DB read", async () => {
      const res = await POST(
        request({ decision: "approve" }, { origin: "https://evil.example.net" }),
        ctx(),
      );
      expect(res.status).toBe(403);
      expect((await res.json()).error.code).toBe("FORBIDDEN");
      expectNoDbRead();
      expectNothingWritten();
    });

    it("403 for a same-site sibling host: the check is origin-exact, not site-wide", async () => {
      const res = await POST(
        request({ decision: "approve" }, { origin: "https://other.example.com" }),
        ctx(),
      );
      expect(res.status).toBe(403);
      expectNoDbRead();
    });

    it("403 for the same host on a different scheme or port", async () => {
      for (const origin of ["http://app.example.com", "https://app.example.com:8443"]) {
        const res = await POST(request({ decision: "approve" }, { origin }), ctx());
        expect(res.status).toBe(403);
      }
      expectNoDbRead();
    });

    it("passes for the same origin", async () => {
      const res = await POST(request({ decision: "decline" }, { origin: ORIGIN }), ctx());
      expect(res.status).toBe(200);
    });
  });

  describe("step 4 — operator check (I7)", () => {
    it("403 when the session says ADMIN but the database says USER", async () => {
      arrangeDb({ role: "USER" });
      mockAuth.mockResolvedValue({ user: { id: "op-1", role: "ADMIN" } });
      const res = await POST(request(), ctx());
      expect(res.status).toBe(403);
      expect((await res.json()).error.code).toBe("FORBIDDEN");
      expect(mockUserFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "op-1" } }),
      );
      expect(mockRequestFindUnique).not.toHaveBeenCalled();
      expectNothingWritten();
    });

    it("200 when the database says ADMIN even though the session says USER", async () => {
      arrangeDb({ role: "ADMIN" });
      mockAuth.mockResolvedValue({ user: { id: "op-1", role: "USER" } });
      const res = await POST(request({ decision: "decline" }), ctx());
      expect(res.status).toBe(200);
    });

    it("403 when the user no longer exists", async () => {
      arrangeDb({ role: null });
      const res = await POST(request(), ctx());
      expect(res.status).toBe(403);
      expectNothingWritten();
    });
  });

  describe("step 5 — validation, lookup, retention", () => {
    it("400 INVALID_JSON for an unparseable body", async () => {
      const res = await POST(request(null, { raw: "{not json" }), ctx());
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe("INVALID_JSON");
      expect(mockRequestFindUnique).not.toHaveBeenCalled();
    });

    it("400 VALIDATION_FAILED for an unknown decision", async () => {
      const res = await POST(request({ decision: "delete" }), ctx());
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe("VALIDATION_FAILED");
      expectNothingWritten();
    });

    it("404 NOT_FOUND for an unknown id, nothing written", async () => {
      mockRequestFindUnique.mockResolvedValue(null);
      const res = await POST(request(), ctx("nope"));
      expect(res.status).toBe(404);
      expect((await res.json()).error.code).toBe("NOT_FOUND");
      expect(mockRequestFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "nope" } }),
      );
      expectNothingWritten();
    });

    it("404 for an expired PENDING request (isExpired, exactly at the 6 h deadline)", async () => {
      mockRequestFindUnique.mockResolvedValue(
        pendingRow({ status_changed_at: new Date(NOW.getTime() - 6 * HOUR) }),
      );
      const res = await POST(request(), ctx());
      expect(res.status).toBe(404);
      expectNothingWritten();
    });

    it("200 for a PENDING request one millisecond inside its 6 h life", async () => {
      mockRequestFindUnique.mockResolvedValue(
        pendingRow({ status_changed_at: new Date(NOW.getTime() - 6 * HOUR + 1) }),
      );
      const res = await POST(request({ decision: "decline" }), ctx());
      expect(res.status).toBe(200);
    });

    it("404 for an expired DECLINED request (48 h)", async () => {
      mockRequestFindUnique.mockResolvedValue(
        pendingRow({ status: "DECLINED", status_changed_at: new Date(NOW.getTime() - 48 * HOUR) }),
      );
      const res = await POST(request(), ctx());
      expect(res.status).toBe(404);
      expectNothingWritten();
    });

    it("404 for an INVITED request whose invites are all used or expired", async () => {
      mockRequestFindUnique.mockResolvedValue(
        pendingRow({
          status: "INVITED",
          invites: [
            { used_at: NOW, expires_at: new Date(NOW.getTime() + HOUR) },
            { used_at: null, expires_at: new Date(NOW.getTime() - HOUR) },
          ],
        }),
      );
      const res = await POST(request(), ctx());
      expect(res.status).toBe(404);
      expectNothingWritten();
    });

    it("loads the request's invites so retention can be judged", async () => {
      await POST(request({ decision: "decline" }), ctx());
      const arg = mockRequestFindUnique.mock.calls[0]![0] as { include?: { invites?: unknown } };
      expect(arg.include?.invites).toBeTruthy();
    });
  });

  describe("step 6 — existing account", () => {
    it("409 EMAIL_TAKEN with nothing written when a User already has the email", async () => {
      arrangeDb({ existingEmail: "ada@example.org" });
      const res = await POST(request({ decision: "approve" }), ctx());
      expect(res.status).toBe(409);
      expect((await res.json()).error.code).toBe("EMAIL_TAKEN");
      expect(mockTxUserFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: "ada@example.org" } }),
      );
      expectNoTxWrites();
      expect(mockTopRequestUpdate).not.toHaveBeenCalled();
    });

    it("409 applies to decline too", async () => {
      arrangeDb({ existingEmail: "ada@example.org" });
      const res = await POST(request({ decision: "decline" }), ctx());
      expect(res.status).toBe(409);
      expectNoTxWrites();
    });

    it("the check runs inside the transaction: an account that appears after the read still wins", async () => {
      // Nothing at the top level knows the user; only the lookup through `tx` does.
      arrangeDb();
      mockTxUserFindUnique.mockResolvedValue({ id: "just-registered" });
      const res = await POST(request({ decision: "approve" }), ctx());
      expect(res.status).toBe(409);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expectNoTxWrites();
      expect(calls).not.toContain("tx:commit");
    });

    it("the lookup precedes every write inside the transaction", async () => {
      mockTxUserFindUnique.mockImplementation(async () => {
        calls.push("tx:find-user");
        return null;
      });
      await POST(request({ decision: "approve" }), ctx());
      expect(calls.slice(0, 3)).toEqual(["tx:begin", "tx:find-user", "tx:update-request"]);
    });
  });

  describe("step 7 — decline", () => {
    it("sets DECLINED with reviewer and clock, deletes unused invites, sends no email", async () => {
      const res = await POST(request({ decision: "decline" }), ctx());
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: "DECLINED" });

      expect(mockTxRequestUpdate).toHaveBeenCalledWith({
        where: { id: "req-1" },
        data: {
          status: "DECLINED",
          reviewed_at: NOW,
          reviewed_by_id: "op-1",
          status_changed_at: NOW,
        },
      });
      expect(mockTxInviteDeleteMany).toHaveBeenCalledWith({
        where: { email: "ada@example.org", used_at: null },
      });
      expect(mockTxInviteCreate).not.toHaveBeenCalled();
      expect(mockSendInviteEmail).not.toHaveBeenCalled();
      expect(calls).toEqual(["tx:begin", "tx:update-request", "tx:delete-invites", "tx:commit"]);
    });

    it("declining an INVITED request deletes its unused invites", async () => {
      mockRequestFindUnique.mockResolvedValue(
        pendingRow({
          status: "INVITED",
          invites: [{ used_at: null, expires_at: new Date(NOW.getTime() + HOUR) }],
        }),
      );
      const res = await POST(request({ decision: "decline" }), ctx());
      expect(res.status).toBe(200);
      expect(mockTxInviteDeleteMany).toHaveBeenCalledWith({
        where: { email: "ada@example.org", used_at: null },
      });
    });
  });

  describe("step 8 — approve (I11, I12)", () => {
    it("updates the request FIRST, then deletes unused invites, then creates one — in one transaction, email after commit", async () => {
      const res = await POST(request({ decision: "approve" }), ctx());
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: "INVITED", email_sent: true });

      expect(calls).toEqual([
        "tx:begin",
        "tx:update-request",
        "tx:delete-invites",
        "tx:create-invite",
        "tx:commit",
        "email",
      ]);
      // Nothing went through the top-level client, i.e. outside the transaction.
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockTopRequestUpdate).not.toHaveBeenCalled();
      expect(mockTopInviteCreate).not.toHaveBeenCalled();
      expect(mockTopInviteDeleteMany).not.toHaveBeenCalled();
    });

    it("marks the request INVITED with reviewer and clock", async () => {
      await POST(request({ decision: "approve" }), ctx());
      expect(mockTxRequestUpdate).toHaveBeenCalledWith({
        where: { id: "req-1" },
        data: {
          status: "INVITED",
          reviewed_at: NOW,
          reviewed_by_id: "op-1",
          status_changed_at: NOW,
        },
      });
      expect(mockTxInviteDeleteMany).toHaveBeenCalledWith({
        where: { email: "ada@example.org", used_at: null },
      });
    });

    it("stores only the token hash, with a 14-day expiry, bound to the request and its email", async () => {
      await POST(request({ decision: "approve" }), ctx());
      expect(mockTxInviteCreate).toHaveBeenCalledTimes(1);
      const arg = mockTxInviteCreate.mock.calls[0]![0] as { data: Record<string, unknown> };
      expect(arg.data).toEqual({
        email: "ada@example.org",
        token_hash: "stored-token-hash",
        access_request_id: "req-1",
        expires_at: new Date(NOW.getTime() + 14 * 24 * HOUR),
      });
      expect(JSON.stringify(mockTxInviteCreate.mock.calls)).not.toContain("raw-invite-token");
    });

    it("sends the raw token to the requester in the request's locale", async () => {
      await POST(request({ decision: "approve" }), ctx());
      expect(mockSendInviteEmail).toHaveBeenCalledTimes(1);
      expect(mockSendInviteEmail).toHaveBeenCalledWith({
        to: "ada@example.org",
        name: "Ada Lovelace",
        token: "raw-invite-token",
        locale: "en",
      });
    });

    it("mail failure reports email_sent: false and leaves the outcome unchanged (I12)", async () => {
      mockSendInviteEmail.mockRejectedValue(new Error("resend down"));
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const res = await POST(request({ decision: "approve" }), ctx());
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: "INVITED", email_sent: false });
      expect(mockTxInviteCreate).toHaveBeenCalledTimes(1);
      // The error is logged without the token or the address.
      expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("raw-invite-token");
      expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("ada@example.org");
      errorSpy.mockRestore();
    });

    it("a failed transaction sends no email", async () => {
      mockTransaction.mockRejectedValue(new Error("db down"));
      await expect(POST(request({ decision: "approve" }), ctx())).rejects.toThrow("db down");
      expect(mockSendInviteEmail).not.toHaveBeenCalled();
    });

    it("404 when the request row vanished between the read and the update (purge race)", async () => {
      mockTransaction.mockRejectedValue(Object.assign(new Error("gone"), { code: "P2025" }));
      const res = await POST(request({ decision: "approve" }), ctx());
      expect(res.status).toBe(404);
      expect(mockSendInviteEmail).not.toHaveBeenCalled();
    });
  });

  describe("step 9 — re-approve", () => {
    it("approving an INVITED request re-issues: old unused invites deleted, one new one created", async () => {
      mockRequestFindUnique.mockResolvedValue(
        pendingRow({
          status: "INVITED",
          invites: [{ used_at: null, expires_at: new Date(NOW.getTime() + HOUR) }],
        }),
      );
      const res = await POST(request({ decision: "approve" }), ctx());
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: "INVITED", email_sent: true });
      expect(calls).toEqual([
        "tx:begin",
        "tx:update-request",
        "tx:delete-invites",
        "tx:create-invite",
        "tx:commit",
        "email",
      ]);
      expect(mockSendInviteEmail).toHaveBeenCalledTimes(1);
    });
  });
});

describe("method surface", () => {
  it("exports POST only: a GET reaches Next's 405, not a handler (I8)", () => {
    expect(Object.keys(routeModule).sort()).toEqual(["POST"]);
  });
});
