import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPasswordResetFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockPasswordResetUpdate = vi.fn();
const mockPasswordResetDeleteMany = vi.fn();
const mockTransaction = vi.fn();
const mockWriteAuditLog = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockRevokeSessionsBefore = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { update: mockUserUpdate },
    passwordReset: {
      findUnique: mockPasswordResetFindUnique,
      update: mockPasswordResetUpdate,
      deleteMany: mockPasswordResetDeleteMany,
    },
    $transaction: mockTransaction,
  },
}));
vi.mock("@/lib/env", () => ({ env: { BCRYPT_ROUNDS: 10 } }));

vi.mock("@/lib/audit", () => ({ writeAuditLog: mockWriteAuditLog }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mockCheckRateLimit }));
vi.mock("@/lib/security", () => ({ hashToken: (t: string) => `hash:${t}` }));
vi.mock("@/lib/session-revocation", () => ({ revokeSessionsBefore: mockRevokeSessionsBefore }));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("new-hash") } }));

const { POST } = await import("@/app/api/auth/reset-password/route");

const VALID_TOKEN = "a".repeat(64);

function request(body: unknown): Request {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validBody(overrides: Partial<{ token: string; password: string }> = {}): unknown {
  return {
    token: overrides.token ?? VALID_TOKEN,
    password: overrides.password ?? "Password123!",
    passwordConfirm: overrides.password ?? "Password123!",
  };
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue(null);
    mockWriteAuditLog.mockResolvedValue(undefined);
    mockUserUpdate.mockReturnValue({});
    mockPasswordResetUpdate.mockReturnValue({});
    mockPasswordResetDeleteMany.mockReturnValue({});
    mockTransaction.mockResolvedValue([{}, {}, {}]);
  });

  it("revokes sessions minted before the reset once the new password is persisted", async () => {
    const before = Date.now();
    mockPasswordResetFindUnique.mockResolvedValue({
      id: "reset-1",
      user_id: "user-1",
      token_hash: "hash:" + VALID_TOKEN,
      used_at: null,
      expires_at: new Date(Date.now() + 60_000),
    });

    const res = await POST(request(validBody()));

    expect(res.status).toBe(200);
    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(mockRevokeSessionsBefore).toHaveBeenCalledOnce();
    const [userId, atMs] = mockRevokeSessionsBefore.mock.calls[0] as [string, number];
    expect(userId).toBe("user-1");
    expect(atMs).toBeGreaterThanOrEqual(before);

    // Placement: revocation must not race the write it depends on.
    const transactionOrder = mockTransaction.mock.invocationCallOrder[0]!;
    const revokeOrder = mockRevokeSessionsBefore.mock.invocationCallOrder[0]!;
    expect(revokeOrder).toBeGreaterThan(transactionOrder);
  });

  it("does not revoke anything for an invalid token", async () => {
    mockPasswordResetFindUnique.mockResolvedValue(null);

    const res = await POST(request(validBody()));

    expect(res.status).toBe(400);
    expect(mockRevokeSessionsBefore).not.toHaveBeenCalled();
  });

  it("does not revoke anything for an already-used token", async () => {
    mockPasswordResetFindUnique.mockResolvedValue({
      id: "reset-1",
      user_id: "user-1",
      token_hash: "hash:" + VALID_TOKEN,
      used_at: new Date(),
      expires_at: new Date(Date.now() + 60_000),
    });

    const res = await POST(request(validBody()));

    expect(res.status).toBe(400);
    expect(mockRevokeSessionsBefore).not.toHaveBeenCalled();
  });

  it("does not revoke anything for an expired token", async () => {
    mockPasswordResetFindUnique.mockResolvedValue({
      id: "reset-1",
      user_id: "user-1",
      token_hash: "hash:" + VALID_TOKEN,
      used_at: null,
      expires_at: new Date(Date.now() - 60_000),
    });

    const res = await POST(request(validBody()));

    expect(res.status).toBe(400);
    expect(mockRevokeSessionsBefore).not.toHaveBeenCalled();
  });

  it("does not revoke anything when the password write fails", async () => {
    mockPasswordResetFindUnique.mockResolvedValue({
      id: "reset-1",
      user_id: "user-1",
      token_hash: "hash:" + VALID_TOKEN,
      used_at: null,
      expires_at: new Date(Date.now() + 60_000),
    });
    mockTransaction.mockRejectedValue(new Error("db unavailable"));

    await expect(POST(request(validBody()))).rejects.toThrow("db unavailable");
    expect(mockRevokeSessionsBefore).not.toHaveBeenCalled();
  });

  it("still revokes sessions when the audit write rejects, since revocation runs first", async () => {
    // Regression for the ordering bug: revocation used to sit after
    // writeAuditLog, so a fallible audit write throwing meant the password
    // had already changed but no sessions were revoked, and the caller got
    // a 500 anyway. Revocation now runs first — it never throws — so an
    // audit failure can no longer cost us the revocation.
    mockPasswordResetFindUnique.mockResolvedValue({
      id: "reset-1",
      user_id: "user-1",
      token_hash: "hash:" + VALID_TOKEN,
      used_at: null,
      expires_at: new Date(Date.now() + 60_000),
    });
    mockWriteAuditLog.mockRejectedValue(new Error("audit db unavailable"));

    await expect(POST(request(validBody()))).rejects.toThrow("audit db unavailable");

    expect(mockRevokeSessionsBefore).toHaveBeenCalledOnce();
    expect(mockRevokeSessionsBefore).toHaveBeenCalledWith("user-1", expect.any(Number));

    const revokeOrder = mockRevokeSessionsBefore.mock.invocationCallOrder[0]!;
    const auditOrder = mockWriteAuditLog.mock.invocationCallOrder[0]!;
    expect(revokeOrder).toBeLessThan(auditOrder);
  });
});
