import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { anonymizeIp, hashToken } from "@/lib/security";

const verifyEmailSchema = z.object({
  token: z.string().length(64).regex(/^[0-9a-f]+$/),
});

export async function POST(request: Request): Promise<NextResponse> {
  const ipRaw =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";
  const ip = anonymizeIp(ipRaw);

  const rateLimitResponse = await checkRateLimit(`verify:${ip}`, 5, 15 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "auth.errors.tokenInvalid" }, { status: 400 });
  }

  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "auth.errors.tokenInvalid" }, { status: 400 });
  }

  const tokenHash = hashToken(parsed.data.token);
  const confirmation = await prisma.emailConfirmation.findUnique({
    where: { token_hash: tokenHash },
  });

  if (!confirmation) {
    await writeAuditLog({
      action: "INVALID_TOKEN",
      userId: null,
      request,
      metadata: { token_type: "email_confirmation", reason: "not_found" },
    });
    return NextResponse.json({ error: "auth.errors.tokenInvalid" }, { status: 400 });
  }

  if (confirmation.used_at !== null || confirmation.expires_at <= new Date()) {
    await writeAuditLog({
      action: "INVALID_TOKEN",
      userId: confirmation.user_id,
      request,
      metadata: { token_type: "email_confirmation", reason: confirmation.used_at ? "used" : "expired" },
    });
    return NextResponse.json({ error: "auth.errors.tokenExpired" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.emailConfirmation.update({
      where: { id: confirmation.id },
      data: { used_at: new Date() },
    }),
    prisma.user.update({
      where: { id: confirmation.user_id },
      data: { email_verified_at: new Date() },
    }),
    prisma.emailConfirmation.deleteMany({
      where: { user_id: confirmation.user_id, id: { not: confirmation.id } },
    }),
  ]);

  await writeAuditLog({ action: "EMAIL_VERIFIED", userId: confirmation.user_id, request });

  return NextResponse.json({ message: "auth.verify.success" });
}
