import type { Prisma } from "@prisma/client";
import type { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { isExpired } from "@/lib/access-retention";
import { forbidden, json, jsonError, notFoundError, parseJsonBody, validateBody } from "@/lib/api";
import { prisma } from "@/lib/db";
import { sendInviteEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { INVITE_TTL_MS } from "@/lib/invite";
import { isOperator } from "@/lib/operators";
import { generateToken, hashToken } from "@/lib/security";

const decisionSchema = z.object({ decision: z.enum(["approve", "decline"]) });

type RouteContext = { params: Promise<{ id: string }> };

/** `application/json`, ignoring parameters (`; charset=utf-8`) and case. */
function isJsonMediaType(contentType: string | null): boolean {
  const mediaType = (contentType ?? "").split(";")[0]?.trim().toLowerCase();
  return mediaType === "application/json";
}

/** Prisma's "record to update not found" — the row was purged after we read it. */
function isRecordNotFound(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === "P2025";
}

/** Thrown inside a decision transaction when a User already holds the address. */
class EmailTakenError extends Error {}

/**
 * Step 6, inside the transaction and before any write, so a 409 leaves nothing
 * behind. Under READ COMMITTED a redemption can still commit between this read
 * and our commit; the residual window is bounded by A5 (`User.email` is unique),
 * so a second account cannot result — at worst an unusable invite is issued.
 */
async function assertNoAccount(
  tx: Pick<Prisma.TransactionClient, "user">,
  email: string,
): Promise<void> {
  if (await tx.user.findUnique({ where: { email }, select: { id: true } })) {
    throw new EmailTakenError();
  }
}

/**
 * POST /api/admin/access-requests/[id] — the operator's decision (spec §4.5).
 *
 * The step order is the security argument; do not reorder it. Steps 2 and 3
 * (media type, Origin) run before any database read so a cross-origin request
 * cannot even probe for ids (D3, I14).
 */
export async function POST(request: Request, { params }: RouteContext): Promise<NextResponse> {
  // 1. Authentication. The middleware already refuses anonymous requests (A3);
  //    the route does not rely on that alone.
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return jsonError(401, "UNAUTHORIZED");

  // 2. Same-origin JSON only. `text/plain` is CORS-safelisted, so without this a
  //    cross-site form could deliver a body that `request.json()` happily parses.
  if (!isJsonMediaType(request.headers.get("content-type"))) {
    return jsonError(415, "UNSUPPORTED_MEDIA_TYPE");
  }

  // 3. SameSite is site-scoped, not origin-scoped (A4): pin the request to the
  //    application's own origin. An absent Origin is refused, not waved through.
  const origin = request.headers.get("origin");
  if (origin === null || origin !== new URL(env.AUTH_URL).origin) {
    return forbidden();
  }

  // 4. Operator = the database's role, now (I7). The session's role is stale
  //    for up to 30 days and is never read here.
  if (!(await isOperator(userId))) return forbidden();

  // 5. Body, then the row. An expired row is absent (I6).
  const parsedJson = await parseJsonBody(request);
  if (!parsedJson.ok) return parsedJson.response;
  const parsed = validateBody(decisionSchema, parsedJson.data);
  if (!parsed.ok) return parsed.response;
  const { decision } = parsed.data;

  const { id } = await params;
  const accessRequest = await prisma.accessRequest.findUnique({
    where: { id },
    include: { invites: { select: { used_at: true, expires_at: true } } },
  });
  if (!accessRequest) return notFoundError();

  const now = new Date();
  const retentionRow =
    accessRequest.status === "INVITED"
      ? {
          status: "INVITED" as const,
          status_changed_at: accessRequest.status_changed_at,
          invites: accessRequest.invites,
        }
      : { status: accessRequest.status, status_changed_at: accessRequest.status_changed_at };
  if (isExpired(retentionRow, now)) return notFoundError();

  // 6. An account already exists for this address: nothing to decide. Checked
  //    inside each transaction below (assertNoAccount), not here.

  const reviewed = {
    reviewed_at: now,
    reviewed_by_id: userId,
    // Every status change moves the retention clock (§3, I6).
    status_changed_at: now,
  };

  // 7. Decline: DECLINED, and any invite still usable is revoked. No email.
  if (decision === "decline") {
    try {
      await prisma.$transaction(async (tx) => {
        await assertNoAccount(tx, accessRequest.email);
        await tx.accessRequest.update({
          where: { id: accessRequest.id },
          data: { status: "DECLINED", ...reviewed },
        });
        await tx.invite.deleteMany({ where: { email: accessRequest.email, used_at: null } });
      });
    } catch (err) {
      if (err instanceof EmailTakenError) return jsonError(409, "EMAIL_TAKEN");
      if (isRecordNotFound(err)) return notFoundError();
      throw err;
    }
    return json({ status: "DECLINED" as const });
  }

  // 8. Approve. I11: update the request row FIRST — that takes its row lock, so
  //    two concurrent approvals serialise — then revoke old unused invites, then
  //    create the one new invite. Only the hash is stored.
  const rawToken = generateToken();
  try {
    await prisma.$transaction(async (tx) => {
      await assertNoAccount(tx, accessRequest.email);
      await tx.accessRequest.update({
        where: { id: accessRequest.id },
        data: { status: "INVITED", ...reviewed },
      });
      await tx.invite.deleteMany({ where: { email: accessRequest.email, used_at: null } });
      await tx.invite.create({
        data: {
          email: accessRequest.email,
          token_hash: hashToken(rawToken),
          access_request_id: accessRequest.id,
          expires_at: new Date(now.getTime() + INVITE_TTL_MS),
        },
      });
    });
  } catch (err) {
    if (err instanceof EmailTakenError) return jsonError(409, "EMAIL_TAKEN");
    if (isRecordNotFound(err)) return notFoundError();
    throw err;
  }

  // The email goes out AFTER the commit and never changes the outcome (I12): the
  // invite exists, and the operator can approve again to re-issue (step 9).
  // Logged without the token or the address.
  let emailSent = true;
  try {
    await sendInviteEmail({
      to: accessRequest.email,
      name: accessRequest.name,
      token: rawToken,
      locale: accessRequest.locale,
    });
  } catch (err) {
    emailSent = false;
    console.error("[access-request] invite email failed", {
      requestId: accessRequest.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return json({ status: "INVITED" as const, email_sent: emailSent });
}
