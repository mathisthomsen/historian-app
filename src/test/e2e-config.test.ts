import { afterEach, describe, expect, it, vi } from "vitest";

const { mockExistsSync } = vi.hoisted(() => ({ mockExistsSync: vi.fn(() => false) }));

vi.mock("node:fs", () => ({
  default: { existsSync: mockExistsSync },
  existsSync: mockExistsSync,
}));

type WebServer = {
  command: string;
  port: number;
  reuseExistingServer: boolean;
  env: Record<string, string>;
};

async function loadWebServer(options: {
  ci?: string;
  rateLimitNamespace?: string;
  cacheNamespace?: string;
}): Promise<WebServer> {
  vi.resetModules();
  mockExistsSync.mockClear();
  vi.stubEnv("CI", options.ci ?? "");
  vi.stubEnv("RATELIMIT_NAMESPACE", options.rateLimitNamespace ?? "");
  vi.stubEnv("CACHE_NAMESPACE", options.cacheNamespace ?? "");
  vi.stubEnv("EMAIL_TRANSPORT", "resend");
  vi.stubEnv("AUTH_URL", "https://production.example");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://production.example");
  vi.stubEnv("RESEND_API_KEY", "re_live_key");
  vi.stubEnv("RESEND_FROM_EMAIL", "mail@production.example");

  const config = (await import("../../playwright.config")).default;
  return config.webServer as WebServer;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Playwright E2E server configuration", () => {
  it("overrides inherited local app settings with the isolated dev server contract", async () => {
    const webServer = await loadWebServer({
      rateLimitNamespace: "development-rate-limits",
      cacheNamespace: "development-cache",
    });

    expect(mockExistsSync).toHaveBeenCalledOnce();
    expect(webServer).toMatchObject({
      command: "pnpm dev",
      port: 3000,
      reuseExistingServer: false,
      env: {
        AUTH_URL: "http://localhost:3000",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        CACHE_NAMESPACE: "local-e2e",
        RATELIMIT_NAMESPACE: "local-e2e",
        EMAIL_TRANSPORT: "stub",
        RESEND_API_KEY: "re_e2e_dummy_key",
        RESEND_FROM_EMAIL: "e2e@evidoxa.test",
      },
    });
    expect(process.env).toMatchObject({
      AUTH_URL: "http://localhost:3000",
      CACHE_NAMESPACE: "local-e2e",
      RATELIMIT_NAMESPACE: "local-e2e",
      EMAIL_TRANSPORT: "stub",
      RESEND_API_KEY: "re_e2e_dummy_key",
      RESEND_FROM_EMAIL: "e2e@evidoxa.test",
    });
  });

  it("uses CI's per-run namespace and starts the already-built production server", async () => {
    const namespace = "ci-12345-1";
    const webServer = await loadWebServer({
      ci: "true",
      rateLimitNamespace: namespace,
      cacheNamespace: namespace,
    });

    expect(webServer).toMatchObject({
      command: "pnpm start",
      port: 3000,
      reuseExistingServer: false,
      env: {
        AUTH_URL: "http://localhost:3000",
        CACHE_NAMESPACE: namespace,
        RATELIMIT_NAMESPACE: namespace,
        EMAIL_TRANSPORT: "stub",
        RESEND_API_KEY: "re_e2e_dummy_key",
        RESEND_FROM_EMAIL: "e2e@evidoxa.test",
      },
    });
  });
});
