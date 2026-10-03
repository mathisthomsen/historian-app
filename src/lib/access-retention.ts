import { prisma } from "@/lib/db";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Retention periods for access requests (§4.6, owner's decision 2026-10-02).
 * INVITED rows have no fixed period: they live while an invite is live.
 */
export const RETENTION = {
  PENDING_MS: 6 * HOUR_MS,
  DECLINED_MS: 48 * HOUR_MS,
} as const;

export interface InviteLife {
  used_at: Date | null;
  expires_at: Date;
}

/**
 * The fields of an access request that decide its expiry. `updated_at` and
 * `created_at` are deliberately absent: only a status change moves the clock
 * (I6), so resubmitting a PENDING request does not extend its life.
 *
 * An INVITED row must carry its invites — the type makes forgetting to load
 * them a compile error rather than a request that never expires.
 */
export type RetentionRow =
  | { status: "PENDING" | "DECLINED"; status_changed_at: Date }
  | { status: "INVITED"; status_changed_at: Date; invites: InviteLife[] };

/** An invite is live when it is unused and its expiry is strictly in the future (I3). */
function isLive(invite: InviteLife, now: Date): boolean {
  return invite.used_at === null && invite.expires_at.getTime() > now.getTime();
}

/** The instant a PENDING request created or re-opened at `statusChangedAt` is gone. */
export function pendingDeadline(statusChangedAt: Date): Date {
  return new Date(statusChangedAt.getTime() + RETENTION.PENDING_MS);
}

/**
 * Read-time expiry (I6) — the guarantee. Every read path calls this and treats
 * an expired row as absent, so correctness never depends on when the purge last
 * ran.
 *
 * The deadline instant itself counts as expired (as for invites, I3): a request
 * created at 23:00 is gone at 05:00, which is the clock time the operator's
 * notification states.
 *
 * INVITED is expired once no invite is live: all used, all expired, or none.
 */
export function isExpired(row: RetentionRow, now: Date = new Date()): boolean {
  switch (row.status) {
    case "PENDING":
      return now.getTime() - row.status_changed_at.getTime() >= RETENTION.PENDING_MS;
    case "DECLINED":
      return now.getTime() - row.status_changed_at.getTime() >= RETENTION.DECLINED_MS;
    case "INVITED":
      return !row.invites.some((invite) => isLive(invite, now));
  }
}

export interface PurgeCounts {
  pending: number;
  declined: number;
  invited: number;
  invites: number;
}

/**
 * Physical deletion (§4.6, step 2) — built from the same constants and the same
 * predicates as `isExpired`. Idempotent. Counts only, so a log carries no PII.
 *
 * Requests go first: whether an INVITED request has a live invite is judged on
 * intact invites. Invites are deleted last (they outlive a deleted request:
 * the FK is `SetNull`).
 */
export async function purgeExpired(now: Date = new Date()): Promise<PurgeCounts> {
  const pending = await prisma.accessRequest.deleteMany({
    where: {
      status: "PENDING",
      status_changed_at: { lte: new Date(now.getTime() - RETENTION.PENDING_MS) },
    },
  });
  const declined = await prisma.accessRequest.deleteMany({
    where: {
      status: "DECLINED",
      status_changed_at: { lte: new Date(now.getTime() - RETENTION.DECLINED_MS) },
    },
  });
  const invited = await prisma.accessRequest.deleteMany({
    where: {
      status: "INVITED",
      invites: { none: { used_at: null, expires_at: { gt: now } } },
    },
  });
  const invites = await prisma.invite.deleteMany({
    where: { OR: [{ used_at: { not: null } }, { expires_at: { lte: now } }] },
  });

  return {
    pending: pending.count,
    declined: declined.count,
    invited: invited.count,
    invites: invites.count,
  };
}
