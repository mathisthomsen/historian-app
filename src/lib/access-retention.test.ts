import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequestDeleteMany = vi.fn();
const mockInviteDeleteMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    accessRequest: { deleteMany: mockRequestDeleteMany },
    invite: { deleteMany: mockInviteDeleteMany },
  },
}));

const { RETENTION, isExpired, pendingDeadline, purgeExpired } =
  await import("@/lib/access-retention");

const HOUR = 60 * 60 * 1000;
const NOW = new Date("2026-10-02T12:00:00.000Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const ahead = (ms: number) => new Date(NOW.getTime() + ms);

describe("RETENTION", () => {
  it("is 6 h for PENDING and 48 h for DECLINED (§4.6)", () => {
    expect(RETENTION.PENDING_MS).toBe(6 * HOUR);
    expect(RETENTION.DECLINED_MS).toBe(48 * HOUR);
  });
});

describe("pendingDeadline", () => {
  it("is status_changed_at + 6 h", () => {
    expect(pendingDeadline(NOW).getTime()).toBe(NOW.getTime() + 6 * HOUR);
  });
});

describe("isExpired — PENDING (6 h from status_changed_at)", () => {
  it("is live just inside the window", () => {
    expect(isExpired({ status: "PENDING", status_changed_at: ago(6 * HOUR - 1) }, NOW)).toBe(false);
  });

  it("is expired exactly at 6 h (the deadline instant counts as gone, I3-style)", () => {
    expect(isExpired({ status: "PENDING", status_changed_at: ago(6 * HOUR) }, NOW)).toBe(true);
  });

  it("is expired just past 6 h", () => {
    expect(isExpired({ status: "PENDING", status_changed_at: ago(6 * HOUR + 1) }, NOW)).toBe(true);
  });

  it("the 5 h and 7 h cases of the E2E retention read-back", () => {
    expect(isExpired({ status: "PENDING", status_changed_at: ago(5 * HOUR) }, NOW)).toBe(false);
    expect(isExpired({ status: "PENDING", status_changed_at: ago(7 * HOUR) }, NOW)).toBe(true);
  });

  it("counts only from status_changed_at: a field update does not extend life (I6)", () => {
    // updated_at is deliberately not part of the contract. A row whose
    // updated_at is recent but whose status_changed_at is 7 h old is expired.
    const row = {
      status: "PENDING" as const,
      status_changed_at: ago(7 * HOUR),
      updated_at: ago(60_000),
      created_at: ago(7 * HOUR),
    };
    expect(isExpired(row, NOW)).toBe(true);
  });

  it("a status change to PENDING restarts the clock", () => {
    expect(isExpired({ status: "PENDING", status_changed_at: ago(1000) }, NOW)).toBe(false);
  });
});

describe("isExpired — DECLINED (48 h from status_changed_at)", () => {
  it("is live just inside the window", () => {
    expect(isExpired({ status: "DECLINED", status_changed_at: ago(48 * HOUR - 1) }, NOW)).toBe(
      false,
    );
  });

  it("is expired exactly at 48 h", () => {
    expect(isExpired({ status: "DECLINED", status_changed_at: ago(48 * HOUR) }, NOW)).toBe(true);
  });

  it("is still live at 7 h (the PENDING window does not apply)", () => {
    expect(isExpired({ status: "DECLINED", status_changed_at: ago(7 * HOUR) }, NOW)).toBe(false);
  });
});

describe("isExpired — INVITED (until its invite is used or expires)", () => {
  const invited = (invites: { used_at: Date | null; expires_at: Date }[]) => ({
    status: "INVITED" as const,
    status_changed_at: ago(100 * HOUR), // age is irrelevant for INVITED
    invites,
  });

  it("is live while an invite is unused and unexpired", () => {
    expect(isExpired(invited([{ used_at: null, expires_at: ahead(1) }]), NOW)).toBe(false);
  });

  it("is expired when the only invite expires exactly now", () => {
    expect(isExpired(invited([{ used_at: null, expires_at: NOW }]), NOW)).toBe(true);
  });

  it("is expired when the only invite is used", () => {
    expect(isExpired(invited([{ used_at: ago(1000), expires_at: ahead(HOUR) }]), NOW)).toBe(true);
  });

  it("is live while any one invite is live (latest invite wins)", () => {
    expect(
      isExpired(
        invited([
          { used_at: null, expires_at: ago(HOUR) },
          { used_at: null, expires_at: ahead(HOUR) },
        ]),
        NOW,
      ),
    ).toBe(false);
  });

  it("is expired when it has no invite at all", () => {
    expect(isExpired(invited([]), NOW)).toBe(true);
  });
});

describe("purgeExpired", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequestDeleteMany.mockResolvedValue({ count: 0 });
    mockInviteDeleteMany.mockResolvedValue({ count: 0 });
  });

  it("deletes PENDING rows whose status_changed_at is at or before now - 6 h", async () => {
    await purgeExpired(NOW);
    expect(mockRequestDeleteMany).toHaveBeenCalledWith({
      where: { status: "PENDING", status_changed_at: { lte: ago(6 * HOUR) } },
    });
  });

  it("deletes DECLINED rows at or before now - 48 h", async () => {
    await purgeExpired(NOW);
    expect(mockRequestDeleteMany).toHaveBeenCalledWith({
      where: { status: "DECLINED", status_changed_at: { lte: ago(48 * HOUR) } },
    });
  });

  it("deletes INVITED rows with no live invite (same predicate as isExpired)", async () => {
    await purgeExpired(NOW);
    expect(mockRequestDeleteMany).toHaveBeenCalledWith({
      where: {
        status: "INVITED",
        invites: { none: { used_at: null, expires_at: { gt: NOW } } },
      },
    });
  });

  it("deletes used or expired invites (expiry exactly at now included)", async () => {
    await purgeExpired(NOW);
    expect(mockInviteDeleteMany).toHaveBeenCalledWith({
      where: { OR: [{ used_at: { not: null } }, { expires_at: { lte: NOW } }] },
    });
  });

  it("removes requests before invites, so INVITED liveness is judged on intact invites", async () => {
    const order: string[] = [];
    mockRequestDeleteMany.mockImplementation(async () => {
      order.push("request");
      return { count: 0 };
    });
    mockInviteDeleteMany.mockImplementation(async () => {
      order.push("invite");
      return { count: 0 };
    });
    await purgeExpired(NOW);
    expect(order.lastIndexOf("request")).toBeLessThan(order.indexOf("invite"));
  });

  it("reports counts only", async () => {
    mockRequestDeleteMany
      .mockResolvedValueOnce({ count: 3 }) // PENDING
      .mockResolvedValueOnce({ count: 2 }) // DECLINED
      .mockResolvedValueOnce({ count: 1 }); // INVITED
    mockInviteDeleteMany.mockResolvedValueOnce({ count: 4 });

    await expect(purgeExpired(NOW)).resolves.toEqual({
      pending: 3,
      declined: 2,
      invited: 1,
      invites: 4,
    });
  });

  it("is idempotent: a second run over nothing deletes nothing", async () => {
    await expect(purgeExpired(NOW)).resolves.toEqual({
      pending: 0,
      declined: 0,
      invited: 0,
      invites: 0,
    });
  });

  it("defaults now to the current time", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(NOW);
      await purgeExpired();
      expect(mockRequestDeleteMany).toHaveBeenCalledWith({
        where: { status: "PENDING", status_changed_at: { lte: ago(6 * HOUR) } },
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
