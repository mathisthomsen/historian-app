import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// env.ts parses process.env at module scope, so each case sets the
// environment, resets the module cache and imports it afresh.
const BASE: Record<string, string> = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://u:p@host/db",
  DATABASE_URL_UNPOOLED: "postgresql://u:p@host/db",
  AUTH_SECRET: "a".repeat(32),
  AUTH_URL: "https://www.evidoxa.com",
  RESEND_API_KEY: "re_test",
  RESEND_FROM_EMAIL: "noreply@example.com",
  KV_REST_API_URL: "https://redis.example.com",
  KV_REST_API_TOKEN: "token",
  NEXT_PUBLIC_APP_URL: "https://www.evidoxa.com",
};

function setEnv(overrides: Record<string, string>): void {
  delete process.env["VERCEL_ENV"];
  delete process.env["PURGE_SECRET"];
  for (const [key, value] of Object.entries({ ...BASE, ...overrides })) {
    vi.stubEnv(key, value);
  }
}

const load = () => import("./env");

describe("env: PURGE_SECRET (P9 — keyed on VERCEL_ENV, not NODE_ENV)", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails to parse in a production deployment without it", async () => {
    setEnv({ VERCEL_ENV: "production" });
    await expect(load()).rejects.toThrow(/PURGE_SECRET/);
  });

  it("fails to parse in a production deployment when it is 31 characters", async () => {
    setEnv({ VERCEL_ENV: "production", PURGE_SECRET: "p".repeat(31) });
    await expect(load()).rejects.toThrow(/PURGE_SECRET/);
  });

  it("parses in a production deployment when it is 32 characters", async () => {
    setEnv({ VERCEL_ENV: "production", PURGE_SECRET: "p".repeat(32) });
    const { env } = await load();
    expect(env.PURGE_SECRET).toBe("p".repeat(32));
  });

  it("parses without it on a preview deployment, where NODE_ENV is production", async () => {
    setEnv({ VERCEL_ENV: "preview" });
    await expect(load()).resolves.toBeDefined();
  });

  it("parses without it where VERCEL_ENV is unset and NODE_ENV is production (CI's pnpm start)", async () => {
    setEnv({});
    await expect(load()).resolves.toBeDefined();
  });

  it("parses without it in development", async () => {
    setEnv({ NODE_ENV: "development", VERCEL_ENV: "development" });
    await expect(load()).resolves.toBeDefined();
  });
});
