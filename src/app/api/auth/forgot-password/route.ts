import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { anonymizeIp, generateToken, hashToken } from "@/lib/security";

const forgotPasswordSchema = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
});

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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() ?? "unknown";
      fields[field] = issue.message;
    }
    return NextResponse.json({ error: "Validation failed", fields }, { status: 400 });
  }

  const { email } = parsed.data;

  const rateLimitResponse = await checkRateLimit(`forgot:${ip}:${email}`, 3, 60 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return 200 — no enumeration
  if (!user) {
    return NextResponse.json({ message: "auth.forgot.emailSent" });
  }

  await prisma.passwordReset.deleteMany({ where: { user_id: user.id } });

  const tokenRaw = generateToken();
  await prisma.passwordReset.create({
    data: {
      user_id: user.id,
      token_hash: hashToken(tokenRaw),
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const acceptLang = request.headers.get("accept-language") ?? "";
  const locale = acceptLang.startsWith("en") ? "en" : "de";

  try {
    await sendPasswordResetEmail({ to: email, name: user.name ?? email, token: tokenRaw, locale });
  } catch {
    // Email failure logged but not returned
  }

  await writeAuditLog({ action: "PASSWORD_RESET_REQUESTED", userId: user.id, request });

  return NextResponse.json({ message: "auth.forgot.emailSent" });
}
