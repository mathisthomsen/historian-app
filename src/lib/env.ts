import { z } from "zod";

const server = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),

  // Epic 1.2 — DB
  DATABASE_URL: z.string().url().optional(),

  // Epic 1.3 — Auth
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),

  // Epic 1.4 — Redis
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
