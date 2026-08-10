import { existsSync } from "fs";
import { resolve } from "path";

import { defineConfig, devices } from "@playwright/test";

// Load .env.local into the test runner process so E2E helpers (db.ts) can
// access DATABASE_URL_UNPOOLED without requiring a separate .env file.
const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
}

// Namespace every rate-limit key this run touches. Upstash is shared with
// production even when the database is not, and resetRateLimits() deletes under
// this prefix on every beforeEach — unnamespaced, that deletes production's
// brute-force counters. CI sets a per-run value; this default covers local runs
// so no one has to remember. Both the runner and the server it spawns must
// agree, hence the explicit hand-off in webServer.env below.
process.env["RATELIMIT_NAMESPACE"] ??= "local-e2e";

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
    baseURL: "http://localhost:3000",
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
    command: "pnpm dev",
    port: 3000,
    // NOTE: with reuseExistingServer, an already-running dev server keeps its
    // own env. If it was started without RATELIMIT_NAMESPACE it writes buckets
    // under the bare prefix, resetRateLimits() clears a namespace nothing is
    // writing to, and the suite dies on rate limits instead. Restart the dev
    // server if auth specs start timing out.
    reuseExistingServer: true,
    timeout: 120000,
    env: { RATELIMIT_NAMESPACE: process.env["RATELIMIT_NAMESPACE"] ?? "local-e2e" },
  },
});
