import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, type ErrorCode } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { REGISTER_RATE_LIMIT_MINUTES } from "@/lib/auth-errors";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { consumeInvite, resolveInvite } from "@/lib/invite";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitize } from "@/lib/sanitize";
import { anonymizeIp, generateToken, hashToken } from "@/lib/security";

const registerSchema = z.object({
  invite: z.string().min(1),
  email: z.string().email().max(254).toLowerCase().trim(),
  name: z.string().min(1).max(100).trim(),
  password: z
    .string()
    .min(8, "auth.errors.passwordTooShort")
    .regex(/[A-Z]/, "auth.errors.passwordNeedsUpper")
    .regex(/[a-z]/, "auth.errors.passwordNeedsLower")
    .regex(/[0-9]/, "auth.errors.passwordNeedsNumber")
    .regex(/[^A-Za-z0-9]/, "auth.errors.passwordNeedsSpecial"),
});

/** Thrown inside the transaction when the conditional consume matched no row. */
class InviteUsedError extends Error {}

/** The §4.3 step 4 table: what a non-valid or mismatched invite is refused with. */
function inviteRejection(invite: Awaited<ReturnType<typeof resolveInvite>>): {
  code: ErrorCode;
  reason: string;
} {
  switch (invite.kind) {
    case "used":
      return { code: "INVITE_USED", reason: "used" };
    case "expired":
      return { code: "INVITE_EXPIRED", reason: "expired" };
    case "valid":
      return { code: "INVITE_EMAIL_MISMATCH", reason: "email_mismatch" };
    // "missing" cannot happen here (presence was checked); treated as not found.
    default:
      return { code: "INVITE_INVALID", reason: "not_found" };
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const ipRaw =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";
  const ip = anonymizeIp(ipRaw);

  const rateLimitResponse = await checkRateLimit(
    `register:${ip}`,
    10,
    REGISTER_RATE_LIMIT_MINUTES * 60 * 1000,
  );
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON");
  }

  // Invite PRESENCE comes before Zod (spec §4.3 step 2, Q4): an uninvited caller
  // gets the one answer that applies to them whatever else the body holds, and
  // never a field-level hint that the form is otherwise reachable.
  const presented =
    typeof body === "object" && body !== null ? (body as { invite?: unknown }).invite : undefined;
  if (typeof presented !== "string" || presented.length === 0) {
    return jsonError(403, "INVITE_REQUIRED");
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() ?? "unknown";
      fields[field] = issue.message;
    }
    return jsonError(400, "VALIDATION_FAILED", { details: { fields } });
  }

  const { email, password } = parsed.data;
  const name = sanitize(parsed.data.name);

  // §4.3 steps 3-4. This read is advisory — the authoritative single-use check
  // is the conditional update inside the transaction below (I1) — but it must
  // run before the existing-user lookup, or an uninvited probe could tell which
  // addresses are registered (I5).
  const now = new Date();
  const invite = await resolveInvite(presented, now);
  if (invite.kind !== "valid" || invite.email.toLowerCase() !== email.toLowerCase()) {
    const rejection = inviteRejection(invite);
    await writeAuditLog({
      action: "INVALID_TOKEN",
      userId: null,
      request,
      metadata: {
        token_type: "invite",
        reason: rejection.reason,
        ...(invite.kind === "valid" ? { invite_id: invite.id } : {}),
      },
    });
    return jsonError(403, rejection.code);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError(409, "EMAIL_TAKEN");
  }

  // Outside the transaction, to keep the row lock on the invite short.
  const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  const tokenRaw = generateToken();
  const token_hash = hashToken(tokenRaw);

  let user: { id: string };
  try {
    user = await prisma.$transaction(async (tx) => {
      // Consume first: a concurrent redemption that committed before us is
      // observed as `false`, and nothing below runs (I1).
      if (!(await consumeInvite(tx, invite.id, now))) throw new InviteUsedError();
      const created = await tx.user.create({
        data: { email, name, password_hash, email_verified_at: null },
      });
      await tx.emailConfirmation.create({
        data: {
          user_id: created.id,
          token_hash,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      return created;
    });
  } catch (err) {
    if (err instanceof InviteUsedError) {
      await writeAuditLog({
        action: "INVALID_TOKEN",
        userId: null,
        request,
        metadata: { token_type: "invite", reason: "used", invite_id: invite.id },
      });
      return jsonError(403, "INVITE_USED");
    }
    // A second registration for the same address that passed the existence
    // check above. The whole transaction rolled back, so the invite is intact.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return jsonError(409, "EMAIL_TAKEN");
    }
    throw err;
  }

  // Determine locale from Accept-Language or default to "de"
  const acceptLang = request.headers.get("accept-language") ?? "";
  const locale = acceptLang.startsWith("en") ? "en" : "de";

  // Email failure must not fail registration, but it must leave a trace —
  // otherwise a user who never receives their verification mail is invisible.
  let emailError: string | null = null;
  try {
    await sendVerificationEmail({ to: email, name, token: tokenRaw, locale });
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err);
    console.error("[register] verification email failed", { userId: user.id, error: emailError });
  }

  await writeAuditLog({
    action: "REGISTER",
    userId: user.id,
    request,
    metadata: {
      invite_id: invite.id,
      email_sent: emailError === null,
      ...(emailError ? { email_error: emailError } : {}),
    },
  });

  // The success screen used to assert a mail was on its way in exactly the case
  // where it was not. Report what actually happened so the client can offer a
  // resend instead of a false reassurance (issue #43).
  return NextResponse.json(
    { message: "auth.register.verificationSent", email_sent: emailError === null },
    { status: 201 },
  );
}
