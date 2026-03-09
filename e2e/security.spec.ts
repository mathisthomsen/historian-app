import { expect, test } from "@playwright/test";

import { resetRateLimits } from "./helpers/db";

const BASE_URL = "http://localhost:3000";

test.beforeEach(async ({ context, page }) => {
  await resetRateLimits();
  await context.clearCookies();
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

test.describe("SEC-01: Security headers on GET /", () => {
  test("all required security headers are present with correct values", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/de`);
    expect(response).not.toBeNull();

    const headers = response!.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-xss-protection"]).toBe("1; mode=block");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["content-security-policy"]).toBeTruthy();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
  });
});

test.describe("SEC-02: X-Powered-By header absent", () => {
  test("X-Powered-By is not present in response headers", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/de`);
    expect(response).not.toBeNull();
    const headers = response!.headers();
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});

test.describe("SEC-03: GET /api/health — status and redis field", () => {
  test("returns status: ok with redis field and HTTP 200", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(["ok", "degraded", "error"]).toContain(body.status);
    expect(body.redis).toBeDefined();
    expect(["ok", "error"]).toContain(body.redis.status);
    expect(typeof body.redis.latencyMs).toBe("number");
    expect(body.db).toBeDefined();
    expect(body.version).toBeTruthy();
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

test.describe("SEC-04: GET /api/health — Cache-Control header", () => {
  test("response has Cache-Control: no-store", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.headers()["cache-control"]).toBe("no-store");
  });
});

test.describe("SEC-05: Rate limiting on POST /api/auth/register", () => {
  test("11th request from same IP returns HTTP 429", async ({ request }) => {
    // Use a unique email prefix per run to avoid state leakage across test runs
    const runId = Date.now().toString(36);
    const limit = 10;

    let lastResponse: Awaited<ReturnType<typeof request.post>> | null = null;

    for (let i = 1; i <= limit + 1; i++) {
      lastResponse = await request.post(`${BASE_URL}/api/auth/register`, {
        data: {
          email: `sec05-${runId}-${i}@example.com`,
          name: "Test User",
          password: "SecurePass1!",
        },
        headers: {
          // Simulate same IP by using a fixed X-Forwarded-For header
          "X-Forwarded-For": `198.51.100.${runId.slice(-2).padStart(3, "0").slice(0, 3)}`,
        },
      });
    }

    expect(lastResponse!.status()).toBe(429);
    const body = await lastResponse!.json();
    expect(body.error).toBe("auth.errors.rateLimited");
    expect(typeof body.retryAfter).toBe("number");

    // Verify rate limit response headers
    expect(lastResponse!.headers()["retry-after"]).toBeTruthy();
    expect(lastResponse!.headers()["x-ratelimit-reset"]).toBeTruthy();
  });
});
