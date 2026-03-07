import { createHash } from "crypto";

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
  const rawToken = "b".repeat(64); // deterministic test reset token
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
