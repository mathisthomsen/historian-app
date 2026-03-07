import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks — must be declared before imports that use them
const mockPing = vi.fn<() => Promise<number>>();
const mockGetLatestMigration = vi.fn<() => Promise<string | null>>();

vi.mock("@/lib/db", () => ({
  ping: mockPing,
  getLatestMigration: mockGetLatestMigration,
}));

// Import AFTER mocks are registered
const { GET } = await import("./route");

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set a recognisable env value so we can assert it is not leaked
    process.env.DATABASE_URL = "postgresql://secret-user:secret-pass@host/db";
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("returns 200 with status: ok when DB is reachable", async () => {
    mockPing.mockResolvedValue(42);
    mockGetLatestMigration.mockResolvedValue("20260307121802_init");

    const response = await GET();

    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    const db = body.db as Record<string, unknown>;
    expect(db.status).toBe("ok");
  });

  it("returns 503 with status: error when DB ping throws", async () => {
    mockPing.mockRejectedValue(new Error("connection refused"));

    const response = await GET();

    expect(response.status).toBe(503);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe("error");
    const db = body.db as Record<string, unknown>;
    expect(db.status).toBe("error");
  });

  it("response includes latency_ms as a number", async () => {
    mockPing.mockResolvedValue(15);
    mockGetLatestMigration.mockResolvedValue("20260307121802_init");

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    const db = body.db as Record<string, unknown>;

    expect(typeof db.latency_ms).toBe("number");
    expect(db.latency_ms).toBe(15);
  });

  it("response includes migration_version string on success", async () => {
    mockPing.mockResolvedValue(10);
    mockGetLatestMigration.mockResolvedValue("20260307121802_init");

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    const db = body.db as Record<string, unknown>;

    expect(db.migration_version).toBe("20260307121802_init");
  });

  it("response body does not contain DATABASE_URL value", async () => {
    mockPing.mockResolvedValue(10);
    mockGetLatestMigration.mockResolvedValue("20260307121802_init");

    const response = await GET();
    const text = await response.text();

    expect(text).not.toContain("secret-pass");
    expect(text).not.toContain("secret-user");
  });

  it("sets Cache-Control: no-store header", async () => {
    mockPing.mockResolvedValue(5);
    mockGetLatestMigration.mockResolvedValue("20260307121802_init");

    const response = await GET();

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("error response includes latency_ms: -1 and migration_version: null", async () => {
    mockPing.mockRejectedValue(new Error("timeout"));

    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    const db = body.db as Record<string, unknown>;

    expect(db.latency_ms).toBe(-1);
    expect(db.migration_version).toBeNull();
  });
});
