import { type NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockSourceFindFirst = vi.fn();
const mockSourceUpdate = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockCacheInvalidate = vi.fn();
const mockSanitize = vi.fn((s: string) => s);

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  db: {
    source: {
      findFirst: mockSourceFindFirst,
    },
  },
  prisma: {
    source: {
      findFirst: mockSourceFindFirst,
      update: mockSourceUpdate,
    },
    userProject: {
      findFirst: mockUserProjectFindFirst,
    },
  },
}));

vi.mock("@/lib/cache", () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    invalidateByPrefix: mockCacheInvalidate,
  },
}));

vi.mock("@/lib/sanitize", () => ({
  sanitize: mockSanitize,
}));

// Import AFTER mocks are registered
const { GET, PUT, DELETE } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new Request(url, options) as unknown as NextRequest;
}

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeBaseSource(overrides?: object) {
  return {
    id: "src-1",
    title: "Bismarck Memoirs",
    type: "book",
    author: "Otto von Bismarck",
    date: "1898",
    repository: "Bundesarchiv",
    call_number: "BA-123",
    url: null,
    reliability: "HIGH",
    notes: "Primary source",
    project_id: "proj-1",
    created_by_id: "user-1",
    deleted_at: null,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
    _count: { relation_evidence: 2, property_evidence: 1 },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/sources/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
  });

  it("returns full SourceDetail with _count", async () => {
    mockSourceFindFirst.mockResolvedValue(makeBaseSource());

    const req = makeRequest("http://localhost/api/sources/src-1");
    const res = await GET(req, makeContext("src-1"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      id: string;
      title: string;
      _count: { relation_evidence: number; property_evidence: number };
    };
    expect(body.id).toBe("src-1");
    expect(body.title).toBe("Bismarck Memoirs");
    expect(body._count.relation_evidence).toBe(2);
    expect(body._count.property_evidence).toBe(1);
  });

  it("returns 404 for soft-deleted source", async () => {
    mockSourceFindFirst.mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/sources/src-deleted");
    const res = await GET(req, makeContext("src-deleted"));

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Not found");
  });

  it("returns 403 for non-member", async () => {
    mockSourceFindFirst.mockResolvedValue(makeBaseSource());
    mockUserProjectFindFirst.mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/sources/src-1");
    const res = await GET(req, makeContext("src-1"));

    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Forbidden");
  });
});

describe("PUT /api/sources/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
    mockCacheInvalidate.mockResolvedValue(undefined);
  });

  it("updates fields and sanitizes text inputs", async () => {
    mockSourceFindFirst.mockResolvedValue(makeBaseSource());
    const updatedSource = makeBaseSource({ title: "Updated Title", notes: "Updated notes" });
    mockSourceUpdate.mockResolvedValue(updatedSource);

    const req = makeRequest("http://localhost/api/sources/src-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title", notes: "Updated notes" }),
    });

    const res = await PUT(req, makeContext("src-1"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string; notes: string };
    expect(body.title).toBe("Updated Title");
    expect(mockSanitize).toHaveBeenCalledWith("Updated Title");
    expect(mockSanitize).toHaveBeenCalledWith("Updated notes");
  });

  it("returns 400 for invalid URL format", async () => {
    mockSourceFindFirst.mockResolvedValue(makeBaseSource());

    const req = makeRequest("http://localhost/api/sources/src-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "not-a-valid-url" }),
    });

    const res = await PUT(req, makeContext("src-1"));

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });
});

describe("DELETE /api/sources/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
    mockCacheInvalidate.mockResolvedValue(undefined);
    mockSourceUpdate.mockResolvedValue({});
  });

  it("soft-deletes the source (sets deleted_at)", async () => {
    mockSourceFindFirst.mockResolvedValue(makeBaseSource());

    const req = makeRequest("http://localhost/api/sources/src-1", { method: "DELETE" });
    const res = await DELETE(req, makeContext("src-1"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);

    expect(mockSourceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "src-1" },
        data: expect.objectContaining({ deleted_at: expect.any(Date) }),
      }),
    );
    expect(mockCacheInvalidate).toHaveBeenCalledWith("source-list:proj-1:");
  });

  it("returns 404 for already-deleted source", async () => {
    mockSourceFindFirst.mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/sources/src-deleted", { method: "DELETE" });
    const res = await DELETE(req, makeContext("src-deleted"));

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Not found");
  });
});
