import { z } from "zod";

const server = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),

  // Epic 1.2 — DB
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url(),

  // Epic 1.3 — Auth
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL: z.string().url(),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),

  // Epic 1.3 — Email
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),

  // Epic 1.4 — Redis (still optional until 1.4)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

const client = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = {
  ...server.parse(process.env),
  ...client.parse(process.env),
};
