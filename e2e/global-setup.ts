import { Client } from "pg";

import { assertNotProductionBranch } from "./helpers/guard";

/**
 * Refuses to start the suite when it is pointed at the production database.
 *
 * This runs once, before any spec, and that placement is the point. The
 * per-connection guard in `helpers/db.ts` only fires for specs that actually
 * query Postgres — and `security.spec.ts` does not. It drives the app purely
 * over HTTP and its only helper is `resetRateLimits()`, which talks to Upstash.
 * That is precisely the spec that put 20 fixture accounts into the live
 * database on 2026-08-09, so a guard it can bypass is not a guard.
 *
 * Known limitation: this checks the database the *test runner* is configured
 * for. If someone starts the app server with production credentials but runs
 * the runner against dev, this will not catch it. In every real setup here
 * (local, CI) one environment feeds both, so it holds — but it is a check on
 * configuration, not proof of what the server under test is talking to.
 */
export default async function globalSetup(): Promise<void> {
  const connectionString =
    process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"] ?? "";
  if (!connectionString) {
    throw new Error(
      "E2E database guard: neither DATABASE_URL_UNPOOLED nor DATABASE_URL is set. " +
        "Refusing to start — the suite cannot verify which database it would write to.",
    );
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query<{ branch: string | null }>(
      "SELECT current_setting('neon.branch_id', true) AS branch",
    );
    assertNotProductionBranch(res.rows[0]?.branch);
  } finally {
    await client.end();
  }
}
