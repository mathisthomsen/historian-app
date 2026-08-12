import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError } from "@/lib/api";
import { writeAuditLog } from "@/lib/audit";
import { RESET_PASSWORD_RATE_LIMIT_MINUTES } from "@/lib/auth-errors";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashToken } from "@/lib/security";

const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .length(64)
      .regex(/^[0-9a-f]+$/),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "auth.errors.passwordMismatch",
    path: ["passwordConfirm"],
  });

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON");
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "unknown";
      fields[key] = issue.message;
    }
    return jsonError(400, "VALIDATION_FAILED", { details: { fields } });
  }

  const { token, password } = parsed.data;

  const rateLimitResponse = await checkRateLimit(
    `reset:${token.slice(0, 8)}`,
    5,
    RESET_PASSWORD_RATE_LIMIT_MINUTES * 60 * 1000,
  );
  if (rateLimitResponse) return rateLimitResponse;

  const tokenHash = hashToken(token);
  const resetRow = await prisma.passwordReset.findUnique({ where: { token_hash: tokenHash } });

  if (!resetRow) {
    await writeAuditLog({
      action: "INVALID_TOKEN",
      userId: null,
      request,
      metadata: { token_type: "password_reset", reason: "not_found" },
    });
    return jsonError(400, "TOKEN_INVALID");
  }

  // Same collapse as verify-email: a link already used is not an expired one,
  // and the recovery advice for the two differs (issue #43).
  if (resetRow.used_at !== null) {
    await writeAuditLog({
      action: "INVALID_TOKEN",
      userId: resetRow.user_id,
      request,
      metadata: { token_type: "password_reset", reason: "used" },
    });
    return jsonError(400, "TOKEN_ALREADY_USED");
  }

  if (resetRow.expires_at <= new Date()) {
    await writeAuditLog({
      action: "INVALID_TOKEN",
      userId: resetRow.user_id,
      request,
      metadata: { token_type: "password_reset", reason: "expired" },
    });
    return jsonError(400, "TOKEN_EXPIRED");
  }

  const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRow.user_id },
      data: { password_hash, failed_login_count: 0, locked_until: null },
    }),
    prisma.passwordReset.update({
      where: { id: resetRow.id },
      data: { used_at: new Date() },
    }),
    prisma.passwordReset.deleteMany({
      where: { user_id: resetRow.user_id, id: { not: resetRow.id } },
    }),
  ]);

  await writeAuditLog({ action: "PASSWORD_RESET", userId: resetRow.user_id, request });

  return NextResponse.json({ message: "auth.reset.success" });
}
