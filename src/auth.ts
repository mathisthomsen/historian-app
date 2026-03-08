import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { rateLimiter } from "@/lib/rate-limit";
import { anonymizeIp } from "@/lib/security";

import { authConfig } from "./auth.config";

// A valid bcrypt hash at cost 12 for timing normalization on unknown-email logins
const DUMMY_HASH = "$2a$12$dummyhashfortimingnormalization.000000000000000000000000";

const credentialsSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const ipRaw =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip") ??
          "127.0.0.1";
        const ip = anonymizeIp(ipRaw);

        // Rate limit per IP + email
        const rlKey = `login:${ip}:${email}`;
        const rl = await rateLimiter.check(rlKey, 5, 15 * 60 * 1000);
        if (!rl.allowed) return null;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password_hash) {
          // Timing normalization
          await bcrypt.compare(password, DUMMY_HASH);
          await writeAuditLog({
            action: "LOGIN_FAILED",
            userId: null,
            request,
            metadata: { reason: "user_not_found", email },
          });
          return null;
        }

        // Account locked check
        if (user.locked_until && user.locked_until > new Date()) {
          await writeAuditLog({
            action: "LOGIN_FAILED",
            userId: user.id,
            request,
            metadata: { reason: "account_locked" },
          });
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
          const newCount = user.failed_login_count + 1;
          const updates: Parameters<typeof prisma.user.update>[0]["data"] = {
            failed_login_count: newCount,
          };
          if (newCount >= 10) {
            updates.locked_until = new Date(Date.now() + 30 * 60 * 1000);
            await writeAuditLog({
              action: "ACCOUNT_LOCKED",
              userId: user.id,
              request,
              metadata: { failed_count: newCount },
            });
          }
          await prisma.user.update({ where: { id: user.id }, data: updates });
          await writeAuditLog({
            action: "LOGIN_FAILED",
            userId: user.id,
            request,
            metadata: { reason: "wrong_password" },
          });
          return null;
        }

        if (!user.email_verified_at) {
          await writeAuditLog({
            action: "LOGIN_FAILED",
            userId: user.id,
            request,
            metadata: { reason: "email_not_verified" },
          });
          // Return a custom error string that LoginForm can detect
          throw new Error("email_not_verified");
        }

        // Success
        await prisma.user.update({
          where: { id: user.id },
          data: { failed_login_count: 0, locked_until: null, last_login_at: new Date() },
        });
        await writeAuditLog({ action: "LOGIN_SUCCESS", userId: user.id, request });

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
