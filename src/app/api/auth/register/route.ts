import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { REGISTER_RATE_LIMIT_MINUTES } from "@/lib/auth-errors";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitize } from "@/lib/sanitize";
import { anonymizeIp, generateToken, hashToken } from "@/lib/security";

const registerSchema = z.object({
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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError(409, "EMAIL_TAKEN");
  }

  const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, name, password_hash, email_verified_at: null },
  });

  const tokenRaw = generateToken();
  const token_hash = hashToken(tokenRaw);
  await prisma.emailConfirmation.create({
    data: {
      user_id: user.id,
      token_hash,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

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
