import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/security";

/** An invite is valid for 14 days from the moment an operator approves (§3, §4.5). */
export const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export type ResolvedInvite =
  | { kind: "missing" }
  | { kind: "invalid" } // no row for hashToken(raw)
  | { kind: "used" }
  | { kind: "expired" }
  | {
      kind: "valid";
      /** Invite row id, for `consumeInvite` and the REGISTER audit metadata. */
      id: string;
      /** The address the invite is bound to (lowercased at write time). */
      email: string;
      /** The raw token as presented, so the register form can send it back. */
      token: string;
    };

/**
 * Read-only classification of a presented invite token (§4.2, §4.3 steps 3–4).
 *
 * Performs NO write (I8): the register page calls this on every GET. Lookup is
 * by SHA-256 hash, so the raw token is never part of a query (P4). `used` is
 * checked before `expired`, matching the table order in §4.3. An expiry exactly
 * at `now` counts as expired (I3).
 *
 * This is advisory only. The authoritative single-use guarantee is
 * `consumeInvite`, because two requests can both pass this check.
 */
export async function resolveInvite(
  rawToken: string | null | undefined,
  now: Date = new Date(),
): Promise<ResolvedInvite> {
  if (typeof rawToken !== "string" || rawToken.length === 0) {
    return { kind: "missing" };
  }

  const row = await prisma.invite.findUnique({
    where: { token_hash: hashToken(rawToken) },
    select: { id: true, email: true, used_at: true, expires_at: true },
  });

  if (!row) return { kind: "invalid" };
  if (row.used_at !== null) return { kind: "used" };
  if (row.expires_at.getTime() <= now.getTime()) return { kind: "expired" };

  return { kind: "valid", id: row.id, email: row.email, token: rawToken };
}

/**
 * Consumes an invite inside the caller's interactive transaction (§4.3 step 7).
 *
 * The predicate lives in the UPDATE itself — `used_at IS NULL` (I1) and
 * `expires_at > now` (I3) — so a concurrent redemption that committed first is
 * observed as `count: 0` rather than overwritten. A read-then-`update` is not
 * equivalent: two requests would both read `used_at = null`.
 *
 * @returns `true` when this call consumed the invite; `false` when it was
 * already used, expired, or gone. The caller must abort the transaction on
 * `false`.
 */
export async function consumeInvite(
  tx: { invite: Pick<Prisma.TransactionClient["invite"], "updateMany"> },
  inviteId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const result = await tx.invite.updateMany({
    where: { id: inviteId, used_at: null, expires_at: { gt: now } },
    data: { used_at: now },
  });
  return result.count === 1;
}
