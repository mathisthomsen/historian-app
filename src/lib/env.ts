import { z } from "zod";

const PURGE_SECRET_MIN_LENGTH = 32;

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
  // Transactional mail uses Resend by default. The E2E-only stub is guarded
  // again at the send boundary so a deployed process cannot select it.
  EMAIL_TRANSPORT: z.enum(["resend", "stub"]).default("resend"),
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

  // Bearer secret for POST /api/internal/purge-access-requests (#29 §4.6).
  // Length is enforced below, and only for a real production deployment.
  PURGE_SECRET: z.string().optional(),

  // Injected by Vercel only — the deployment identity (see deployment-env.ts).
  VERCEL_ENV: z.string().optional(),
});

const serverWithRules = server.superRefine((value, ctx) => {
  // Keyed on VERCEL_ENV, not NODE_ENV: NODE_ENV is "production" under CI's
  // `pnpm start` and on previews, where this secret is absent or per-run (P9).
  if (value.VERCEL_ENV !== "production") return;
  if (!value.PURGE_SECRET || value.PURGE_SECRET.length < PURGE_SECRET_MIN_LENGTH) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["PURGE_SECRET"],
      message: `PURGE_SECRET must be at least ${PURGE_SECRET_MIN_LENGTH} characters in a production deployment`,
    });
  }
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
  ...serverWithRules.parse(process.env),
  ...client.parse(process.env),
};

// Fail fast at boot if neither Redis credential pair is present.
resolveRedisConfig();
