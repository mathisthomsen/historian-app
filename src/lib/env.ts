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

  // Epic 1.4 — Redis.
  // The Vercel Upstash integration injects KV_REST_API_URL/TOKEN and keeps them
  // current; UPSTASH_REDIS_REST_* is the legacy manual pair (still used by CI).
  // Either pair is accepted, but at least one must be complete.
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

/** Resolves the Redis REST credentials from whichever pair is configured. */
export function resolveRedisConfig(source: NodeJS.ProcessEnv = process.env): {
  url: string;
  token: string;
} {
  const url = source.KV_REST_API_URL ?? source.UPSTASH_REDIS_REST_URL;
  const token = source.KV_REST_API_TOKEN ?? source.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Redis is not configured: set KV_REST_API_URL + KV_REST_API_TOKEN " +
        "(Vercel Upstash integration) or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.",
    );
  }
  return { url, token };
}

const client = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = {
  ...server.parse(process.env),
  ...client.parse(process.env),
};

// Fail fast at boot if neither Redis credential pair is present.
resolveRedisConfig();
