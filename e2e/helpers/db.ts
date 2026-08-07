import { createHash, randomBytes } from "crypto";

import bcrypt from "bcryptjs";
import { Client } from "pg";

function getClient(): Client {
  const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";
  return new Client({ connectionString });
}

/** Returns the raw token for the most recent email verification for a given email. */
export async function getLatestVerificationToken(email: string): Promise<string> {
  const client = getClient();
  await client.connect();
  try {
    const result = await client.query<{ token_hash: string }>(
      `SELECT ec.token_hash
         FROM email_confirmations ec
         JOIN users u ON u.id = ec.user_id
        WHERE u.email = $1
          AND ec.used_at IS NULL
        ORDER BY ec.created_at DESC
        LIMIT 1`,
      [email.toLowerCase()],
    );
    if (!result.rows[0]) throw new Error(`No verification token found for ${email}`);
    // We only store the hash — we cannot reverse it.
    // Tests must extract the raw token from the URL or use a special test hook.
    // This function returns the stored hash for assertion purposes.
    return result.rows[0].token_hash;
  } finally {
    await client.end();
  }
}

/** Returns the raw token for the most recent password reset for a given email.
 *  NOTE: We only store the SHA-256 hash — this function returns the hash.
 *  E2E tests that need to navigate to the reset URL must intercept the email
 *  or use the insertTestResetToken helper below. */
export async function getLatestResetTokenHash(email: string): Promise<string> {
  const client = getClient();
  await client.connect();
  try {
    const result = await client.query<{ token_hash: string }>(
      `SELECT pr.token_hash
         FROM password_resets pr
         JOIN users u ON u.id = pr.user_id
        WHERE u.email = $1
          AND pr.used_at IS NULL
        ORDER BY pr.created_at DESC
        LIMIT 1`,
      [email.toLowerCase()],
    );
    if (!result.rows[0]) throw new Error(`No reset token found for ${email}`);
    return result.rows[0].token_hash;
  } finally {
    await client.end();
  }
}

/** Inserts a known raw token for testing — returns the raw token so the test can navigate to it. */
export async function insertTestVerificationToken(email: string): Promise<string> {
  const rawToken = "a".repeat(64); // deterministic test token
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const client = getClient();
  await client.connect();
  try {
    // Delete any existing tokens for this user
    await client.query(
      `DELETE FROM email_confirmations
         WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
      [email.toLowerCase()],
    );
    // Insert test token with 1 hour expiry
    await client.query(
      `INSERT INTO email_confirmations (id, user_id, token_hash, expires_at)
         VALUES (gen_random_uuid(), (SELECT id FROM users WHERE email = $1), $2, NOW() + INTERVAL '1 hour')`,
      [email.toLowerCase(), tokenHash],
    );
    return rawToken;
  } finally {
    await client.end();
  }
}

/** Inserts a known raw token for password reset testing. */
export async function insertTestResetToken(email: string): Promise<string> {
  // Random, not deterministic. The previous "b".repeat(64) had two proven
  // hazards, both of which only bite now that the limiter fails closed against
  // a live Redis:
  //   1. password_resets.token_hash is globally UNIQUE, so a leftover row for
  //      any *other* user makes this INSERT throw.
  //   2. reset-password rate-limits on `reset:${token.slice(0,8)}`, so every
  //      run of this test shared one bucket. Measured: the 6th request in a
  //      15-minute window gets a 429, and a CI run makes up to 6 (two browsers
  //      x three attempts) — so consecutive runs could start already throttled.
  // Nothing depends on the value being fixed; the caller uses the return value.
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const client = getClient();
  await client.connect();
  try {
    await client.query(
      `DELETE FROM password_resets
         WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
      [email.toLowerCase()],
    );
    await client.query(
      `INSERT INTO password_resets (id, user_id, token_hash, expires_at)
         VALUES (gen_random_uuid(), (SELECT id FROM users WHERE email = $1), $2, NOW() + INTERVAL '1 hour')`,
      [email.toLowerCase(), tokenHash],
    );
    return rawToken;
  } finally {
    await client.end();
  }
}

/**
 * Clears all Upstash rate-limit counters for auth endpoints.
 * Uses a single SCAN pass for all keys created by our rate limiters
 * (@upstash/ratelimit prefix), regardless of which AUTH_SECRET created them.
 *
 * Credentials resolve the same way the app does (src/lib/env.ts): the Vercel
 * integration's KV_REST_API_* pair first, then the legacy UPSTASH_* one.
 *
 * Throws when neither is configured. This used to no-op silently, which hid a
 * real failure: the login limiter allows 5 attempts per 15 minutes per IP+email
 * and every spec logs in as the same seeded admin from the same CI IP, so once
 * this stops clearing counters the whole suite dies of "login just times out".
 */
export async function resetRateLimits(): Promise<void> {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "resetRateLimits: Redis is not configured (KV_REST_API_URL/TOKEN or " +
        "UPSTASH_REDIS_REST_URL/TOKEN). Refusing to run auth E2E without it — " +
        "the login rate limiter fails closed and would throttle the suite.",
    );
  }

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // Single SCAN pass — clears all sliding-window keys for every auth action/IP.
  // Keys are stored as: @upstash/ratelimit:{action}:{anonIp}[:{email}]:{windowBucket}
  let cursor = "0";
  do {
    const scanUrl = new URL(`${url}/scan/${cursor}`);
    scanUrl.searchParams.set("match", "@upstash/ratelimit:*");
    scanUrl.searchParams.set("count", "100");

    const scanRes = await fetch(scanUrl, { headers });
    const { result } = (await scanRes.json()) as { result: [string, string[]] };
    [cursor] = result;
    const keys = result[1];

    if (keys.length > 0) {
      await fetch(`${url}/pipeline`, {
        method: "POST",
        headers,
        body: JSON.stringify(keys.map((k) => ["DEL", k])),
      });
    }
  } while (cursor !== "0");
}

/**
 * Creates a verified user with a known password, for tests that need to mutate
 * an account without touching the shared seeded admin.
 *
 * Idempotent: any existing user with this email is removed first.
 */
export async function createTestUser(email: string, password: string): Promise<void> {
  const password_hash = await bcrypt.hash(password, 10);
  const client = getClient();
  await client.connect();
  try {
    await client.query("DELETE FROM users WHERE email = $1", [email.toLowerCase()]);
    await client.query(
      `INSERT INTO users (id, email, name, password_hash, email_verified_at, role, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, 'E2E Test User', $2, NOW(), 'USER', NOW(), NOW())`,
      [email.toLowerCase(), password_hash],
    );
  } finally {
    await client.end();
  }
}

/** Deletes a test user by email (for cleanup after registration tests). */
export async function deleteTestUser(email: string): Promise<void> {
  const client = getClient();
  await client.connect();
  try {
    await client.query("DELETE FROM users WHERE email = $1", [email.toLowerCase()]);
  } finally {
    await client.end();
  }
}

/** Marks a user's email as verified (for login tests). */
export async function verifyUserEmail(email: string): Promise<void> {
  const client = getClient();
  await client.connect();
  try {
    await client.query("UPDATE users SET email_verified_at = NOW() WHERE email = $1", [
      email.toLowerCase(),
    ]);
  } finally {
    await client.end();
  }
}
