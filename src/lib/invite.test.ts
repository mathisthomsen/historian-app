import { beforeEach, describe, expect, it, vi } from "vitest";

import { hashToken } from "@/lib/security";

// Strict mock: every write method on the invite model is a spy, so "no write
// calls" (I8) is an assertion about the spies, not about the absence of a stub.
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateMany = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();
const mockDeleteMany = vi.fn();
const mockTransaction = vi.fn();
const mockExecuteRaw = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    invite: {
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
      updateMany: mockUpdateMany,
      upsert: mockUpsert,
      delete: mockDelete,
      deleteMany: mockDeleteMany,
    },
    $transaction: mockTransaction,
    $executeRaw: mockExecuteRaw,
  },
}));

const { INVITE_TTL_MS, consumeInvite, resolveInvite } = await import("@/lib/invite");

const NOW = new Date("2026-10-02T12:00:00.000Z");
const RAW = "a".repeat(64);

function row(overrides: Partial<{ used_at: Date | null; expires_at: Date; email: string }> = {}) {
  return {
    id: "inv_1",
    email: "researcher@example.org",
    used_at: null,
    expires_at: new Date(NOW.getTime() + 60_000),
    ...overrides,
  };
}

function expectNoWrites(): void {
  for (const spy of [
    mockCreate,
    mockUpdate,
    mockUpdateMany,
    mockUpsert,
    mockDelete,
    mockDeleteMany,
    mockTransaction,
    mockExecuteRaw,
  ]) {
    expect(spy).not.toHaveBeenCalled();
  }
}

describe("INVITE_TTL_MS", () => {
  it("is 14 days", () => {
    expect(INVITE_TTL_MS).toBe(14 * 24 * 60 * 60 * 1000);
  });
});

describe("resolveInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([undefined, null, ""])(
    "reports %j as missing without touching the database",
    async (raw) => {
      await expect(resolveInvite(raw, NOW)).resolves.toEqual({ kind: "missing" });
      expect(mockFindUnique).not.toHaveBeenCalled();
    },
  );

  it("reports a non-string value as missing", async () => {
    await expect(resolveInvite(42 as unknown as string, NOW)).resolves.toEqual({
      kind: "missing",
    });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("looks the row up by the SHA-256 hash, never the raw token (P4)", async () => {
    mockFindUnique.mockResolvedValue(null);
    await resolveInvite(RAW, NOW);

    expect(mockFindUnique).toHaveBeenCalledOnce();
    const arg = mockFindUnique.mock.calls[0]?.[0] as { where: { token_hash: string } };
    expect(arg.where).toEqual({ token_hash: hashToken(RAW) });
    expect(arg.where.token_hash).not.toBe(RAW);
    expect(JSON.stringify(arg)).not.toContain(RAW);
  });

  it("reports an unknown token as invalid", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(resolveInvite(RAW, NOW)).resolves.toEqual({ kind: "invalid" });
    expectNoWrites();
  });

  it("reports a consumed invite as used", async () => {
    mockFindUnique.mockResolvedValue(row({ used_at: new Date(NOW.getTime() - 1000) }));
    await expect(resolveInvite(RAW, NOW)).resolves.toEqual({ kind: "used" });
    expectNoWrites();
  });

  it("reports a consumed invite that has also expired as used (table order, §4.3)", async () => {
    mockFindUnique.mockResolvedValue(
      row({
        used_at: new Date(NOW.getTime() - 5000),
        expires_at: new Date(NOW.getTime() - 1000),
      }),
    );
    await expect(resolveInvite(RAW, NOW)).resolves.toEqual({ kind: "used" });
  });

  it("reports an invite past its expiry as expired", async () => {
    mockFindUnique.mockResolvedValue(row({ expires_at: new Date(NOW.getTime() - 1) }));
    await expect(resolveInvite(RAW, NOW)).resolves.toEqual({ kind: "expired" });
    expectNoWrites();
  });

  it("treats expiry exactly at now as expired (I3)", async () => {
    mockFindUnique.mockResolvedValue(row({ expires_at: new Date(NOW.getTime()) }));
    await expect(resolveInvite(RAW, NOW)).resolves.toEqual({ kind: "expired" });
  });

  it("treats one millisecond before expiry as valid", async () => {
    mockFindUnique.mockResolvedValue(row({ expires_at: new Date(NOW.getTime() + 1) }));
    await expect(resolveInvite(RAW, NOW)).resolves.toMatchObject({ kind: "valid" });
  });

  it("returns the bound email, the row id and the raw token for a valid invite", async () => {
    mockFindUnique.mockResolvedValue(row());
    await expect(resolveInvite(RAW, NOW)).resolves.toEqual({
      kind: "valid",
      id: "inv_1",
      email: "researcher@example.org",
      token: RAW,
    });
    expectNoWrites();
  });

  it("performs no write call in any of the five states (I8)", async () => {
    const rows = [undefined, null, row({ used_at: NOW }), row({ expires_at: NOW }), row()] as const;
    for (const r of rows) {
      mockFindUnique.mockResolvedValue(r);
      await resolveInvite(r === undefined ? "" : RAW, NOW);
    }
    expectNoWrites();
  });

  it("defaults now to the current time", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(NOW);
      mockFindUnique.mockResolvedValue(row({ expires_at: NOW }));
      await expect(resolveInvite(RAW)).resolves.toEqual({ kind: "expired" });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("consumeInvite", () => {
  const txUpdateMany = vi.fn();
  const tx = { invite: { updateMany: txUpdateMany } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("issues a conditional updateMany guarded by used_at IS NULL and expires_at > now (I1, I3)", async () => {
    txUpdateMany.mockResolvedValue({ count: 1 });
    await consumeInvite(tx, "inv_1", NOW);

    expect(txUpdateMany).toHaveBeenCalledOnce();
    expect(txUpdateMany).toHaveBeenCalledWith({
      where: { id: "inv_1", used_at: null, expires_at: { gt: NOW } },
      data: { used_at: NOW },
    });
  });

  it("returns true when exactly one row was consumed", async () => {
    txUpdateMany.mockResolvedValue({ count: 1 });
    await expect(consumeInvite(tx, "inv_1", NOW)).resolves.toBe(true);
  });

  it("returns false when the predicate matched nothing (used, expired or gone)", async () => {
    txUpdateMany.mockResolvedValue({ count: 0 });
    await expect(consumeInvite(tx, "inv_1", NOW)).resolves.toBe(false);
  });

  it("returns false for any count other than exactly 1", async () => {
    txUpdateMany.mockResolvedValue({ count: 2 });
    await expect(consumeInvite(tx, "inv_1", NOW)).resolves.toBe(false);
  });

  it("uses the supplied transaction client, not the global one", async () => {
    txUpdateMany.mockResolvedValue({ count: 1 });
    await consumeInvite(tx, "inv_1", NOW);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });
});
