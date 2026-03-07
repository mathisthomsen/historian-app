import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
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

  const rateLimitResponse = await checkRateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() ?? "unknown";
      fields[field] = issue.message;
    }
    return NextResponse.json({ error: "Validation failed", fields }, { status: 400 });
  }

  const { email, name, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "auth.errors.emailTaken" }, { status: 409 });
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

  try {
    await sendVerificationEmail({ to: email, name, token: tokenRaw, locale });
  } catch {
    // Email failure: still created user, log but don't fail
  }

  await writeAuditLog({ action: "REGISTER", userId: user.id, request });

  return NextResponse.json({ message: "auth.register.verificationSent" }, { status: 201 });
}
