import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { RESEND_VERIFICATION_RATE_LIMIT_MINUTES } from "@/lib/auth-errors";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { anonymizeIp, generateToken, hashToken } from "@/lib/security";

const resendVerificationSchema = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
});

const CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Issues a fresh email-confirmation link.
 *
 * Before this route existed there was no way to obtain one: VerifyEmailCard's
 * only recovery action pointed at /auth/forgot-password, which sends a *password
 * reset*, and LoginForm offered nothing at all. A user whose verification link
 * expired — or whose registration mail silently failed to send — was stranded
 * outside the product with no self-service route back in (issue #43).
 *
 * Enumeration-neutral: the response is an identical 200 whether the address is
 * unknown, already verified, or genuinely pending, matching forgot-password.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const ipRaw =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";
  const ip = anonymizeIp(ipRaw);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON");
  }

  const parsed = resendVerificationSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() ?? "unknown";
      fields[field] = issue.message;
    }
    return jsonError(400, "VALIDATION_FAILED", { details: { fields } });
  }

  const { email } = parsed.data;

  const rateLimitResponse = await checkRateLimit(
    `resend-verification:${ip}:${email}`,
    3,
    RESEND_VERIFICATION_RATE_LIMIT_MINUTES * 60 * 1000,
  );
  if (rateLimitResponse) return rateLimitResponse;

  const neutralResponse = NextResponse.json({ message: "auth.verify.resendSent" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return neutralResponse;

  // Already verified: nothing to send, and saying so here would confirm the
  // account exists. The login screen already tells a verified user what to do.
  if (user.email_verified_at !== null) {
    await writeAuditLog({
      action: "VERIFICATION_RESENT",
      userId: user.id,
      request,
      metadata: { skipped: "already_verified" },
    });
    return neutralResponse;
  }

  // Supersede outstanding links so only the newest one works.
  await prisma.emailConfirmation.deleteMany({ where: { user_id: user.id } });

  const tokenRaw = generateToken();
  await prisma.emailConfirmation.create({
    data: {
      user_id: user.id,
      token_hash: hashToken(tokenRaw),
      expires_at: new Date(Date.now() + CONFIRMATION_TTL_MS),
    },
  });

  const acceptLang = request.headers.get("accept-language") ?? "";
  const locale = acceptLang.startsWith("en") ? "en" : "de";

  // A delivery failure must not change the deliberately generic response, but it
  // must leave a trace — otherwise a silent outage is invisible.
  let emailError: string | null = null;
  try {
    await sendVerificationEmail({
      to: email,
      name: user.name ?? email,
      token: tokenRaw,
      locale,
    });
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err);
    console.error("[resend-verification] verification email failed", {
      userId: user.id,
      error: emailError,
    });
  }

  await writeAuditLog({
    action: "VERIFICATION_RESENT",
    userId: user.id,
    request,
    metadata: {
      email_sent: emailError === null,
      ...(emailError ? { email_error: emailError } : {}),
    },
  });

  return neutralResponse;
}
