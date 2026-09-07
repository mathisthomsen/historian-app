import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig, devices } from "@playwright/test";

// Load .env.local into the test runner process so E2E helpers (db.ts) can
// access DATABASE_URL_UNPOOLED without requiring a separate .env file.
const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
}

const e2eOrigin = "http://localhost:3000";

// Upstash is shared with production, even when the E2E database is not. Both
// the runner and its server must use the same namespace: resetRateLimits()
// deletes under it before every test, while cache keys include the fixed seed
// project ID. CI provides a unique namespace per run; local E2E deliberately
// replaces any app-development namespace with its own stable one.
const e2eNamespace = process.env["CI"]
  ? (process.env["RATELIMIT_NAMESPACE"] ?? process.env["CACHE_NAMESPACE"])
  : "local-e2e";
if (!e2eNamespace) {
  throw new Error("E2E requires RATELIMIT_NAMESPACE or CACHE_NAMESPACE in CI.");
}
process.env["RATELIMIT_NAMESPACE"] = e2eNamespace;
process.env["CACHE_NAMESPACE"] = e2eNamespace;

// The runner inherits .env.local, which may contain a deployed origin and real
// mail settings. Set the complete mail contract here as well as on the server
// below, so an E2E helper cannot accidentally send with those inherited values.
process.env["EMAIL_TRANSPORT"] = "stub";
process.env["AUTH_URL"] = e2eOrigin;
process.env["NEXT_PUBLIC_APP_URL"] = e2eOrigin;
process.env["RESEND_API_KEY"] = "re_e2e_dummy_key";
process.env["RESEND_FROM_EMAIL"] = "e2e@evidoxa.test";

export default defineConfig({
  testDir: "./e2e",
  // Refuses to start against the production database. Runs before any spec,
  // because the per-connection guard in helpers/db.ts cannot cover specs that
  // never touch Postgres — see e2e/global-setup.ts.
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  // One worker everywhere. These specs share a single database and a single
  // Redis, so parallel files interfere: every beforeEach calls resetRateLimits(),
  // which clears every bucket *in this run's namespace* and would wipe SEC-05's
  // counter mid-test. RATELIMIT_NAMESPACE does not help here — it isolates runs
  // from each other and from production, but all workers in a run share one
  // namespace because they share one server process.
  // CI already ran with 1; matching it locally keeps local reproducible.
  workers: 1,
  reporter: "html",
  use: {
    baseURL: e2eOrigin,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
  webServer: {
    // CI builds before Playwright runs, so exercise the production server
    // there. Local runs retain Turbopack's fast feedback loop.
    command: process.env["CI"] ? "pnpm start" : "pnpm dev",
    port: 3000,
    // A server that Playwright did not start has unknown credentials and could
    // send real mail or target an unrelated database. Refuse it instead.
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      AUTH_URL: e2eOrigin,
      NEXT_PUBLIC_APP_URL: e2eOrigin,
      CACHE_NAMESPACE: e2eNamespace,
      RATELIMIT_NAMESPACE: e2eNamespace,
      EMAIL_TRANSPORT: "stub",
      // env.ts still validates these under the stub. They are deliberately
      // non-secret placeholders so E2E never requires Resend credentials.
      RESEND_API_KEY: "re_e2e_dummy_key",
      RESEND_FROM_EMAIL: "e2e@evidoxa.test",
    },
  },
});
