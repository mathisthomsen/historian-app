import { Prisma, type AuditAction } from "@prisma/client";

import { prisma } from "@/lib/db";
import { anonymizeIp } from "@/lib/security";

export async function writeAuditLog(params: {
  action: AuditAction;
  userId?: string | null;
  request: Request;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { action, userId, request, metadata } = params;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const ua = request.headers.get("user-agent");

  await prisma.authAuditLog.create({
    data: {
      action,
      user_id: userId ?? null,
      ip_address: ip ? anonymizeIp(ip) : null,
      user_agent: ua ? ua.slice(0, 512) : null,
      metadata: metadata ? (metadata as Prisma.InputJsonObject) : Prisma.JsonNull,
    },
  });
}
