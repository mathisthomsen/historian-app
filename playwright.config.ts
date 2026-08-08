import { existsSync } from "fs";
import { resolve } from "path";

import { defineConfig, devices } from "@playwright/test";

// Load .env.local into the test runner process so E2E helpers (db.ts) can
// access DATABASE_URL_UNPOOLED without requiring a separate .env file.
const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  // One worker everywhere. These specs share a single database and a single
  // Redis, so parallel files interfere: every beforeEach calls resetRateLimits(),
  // which clears *all* buckets and would wipe SEC-05's counter mid-test.
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
    reuseExistingServer: true,
    timeout: 120000,
  },
});
