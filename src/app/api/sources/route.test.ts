import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockFindMany = vi.fn();
const mockSourceCount = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockSourceCreate = vi.fn();
const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
const mockCacheInvalidate = vi.fn();
const mockSanitize = vi.fn((s: string) => s);

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  db: {
    source: {
      findMany: mockFindMany,
    },
  },
  prisma: {
    source: {
      count: mockSourceCount,
      create: mockSourceCreate,
    },
    userProject: {
      findFirst: mockUserProjectFindFirst,
    },
  },
}));

vi.mock("@/lib/cache", () => ({
  cache: {
    get: mockCacheGet,
    set: mockCacheSet,
    invalidateByPrefix: mockCacheInvalidate,
  },
}));

vi.mock("@/lib/sanitize", () => ({
  sanitize: mockSanitize,
}));

// Import AFTER mocks are registered
const { GET, POST } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  url: string,
  options?: ConstructorParameters<typeof NextRequest>[1],
): NextRequest {
  return new NextRequest(url, options as ConstructorParameters<typeof NextRequest>[1]);
}

function makeBaseSource(overrides?: object) {
  return {
    id: "src-1",
    title: "Bismarck Memoirs",
    type: "book",
    author: "Otto von Bismarck",
    reliability: "HIGH",
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/sources", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
  });

  it("returns paginated list for authenticated user", async () => {
    const source = makeBaseSource();
    mockFindMany.mockResolvedValue([source]);
    mockSourceCount.mockResolvedValue(1);

    const req = makeRequest("http://localhost/api/sources");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { id: string; title: string; reliability: string }[];
      pagination: { total: number };
    };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.title).toBe("Bismarck Memoirs");
    expect(body.data[0]?.reliability).toBe("HIGH");
    expect(body.pagination.total).toBe(1);
  });

  it("search filters on title (case-insensitive)", async () => {
    mockFindMany.mockResolvedValue([]);
    mockSourceCount.mockResolvedValue(0);

    const req = makeRequest("http://localhost/api/sources?search=bismarck");
    await GET(req);

    const callArg = mockFindMany.mock.calls[0]?.[0] as {
      where: { OR?: { title?: { contains: string; mode: string } }[] };
    };
    expect(callArg.where.OR).toBeDefined();
    const titleFilter = callArg.where.OR?.find((f) => "title" in f);
    expect(titleFilter?.title).toEqual({ contains: "bismarck", mode: "insensitive" });
  });

  it("search filters on author (case-insensitive)", async () => {
    mockFindMany.mockResolvedValue([]);
    mockSourceCount.mockResolvedValue(0);

    const req = makeRequest("http://localhost/api/sources?search=otto");
    await GET(req);

    const callArg = mockFindMany.mock.calls[0]?.[0] as {
      where: { OR?: { author?: { contains: string; mode: string } }[] };
    };
    expect(callArg.where.OR).toBeDefined();
    const authorFilter = callArg.where.OR?.find((f) => "author" in f);
    expect(authorFilter?.author).toEqual({ contains: "otto", mode: "insensitive" });
  });

  it("reliability=HIGH,MEDIUM filters correctly", async () => {
    mockFindMany.mockResolvedValue([]);
    mockSourceCount.mockResolvedValue(0);

    const req = makeRequest("http://localhost/api/sources?reliability=HIGH,MEDIUM");
    await GET(req);

    const callArg = mockFindMany.mock.calls[0]?.[0] as {
      where: { reliability?: { in: string[] } };
    };
    expect(callArg.where.reliability).toEqual({ in: ["HIGH", "MEDIUM"] });
  });

  it("type=letter filters correctly", async () => {
    mockFindMany.mockResolvedValue([]);
    mockSourceCount.mockResolvedValue(0);

    const req = makeRequest("http://localhost/api/sources?type=letter");
    await GET(req);

    const callArg = mockFindMany.mock.calls[0]?.[0] as {
      where: { type?: { equals: string; mode: string } };
    };
    expect(callArg.where.type).toEqual({ equals: "letter", mode: "insensitive" });
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUser.mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/sources");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid pageSize", async () => {
    const req = makeRequest("http://localhost/api/sources?pageSize=999");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Invalid query params");
  });

  it("returns cached result on second call", async () => {
    const cachedBody = {
      data: [makeBaseSource()],
      pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
    };
    mockCacheGet.mockResolvedValue(cachedBody);

    const req = makeRequest("http://localhost/api/sources");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as typeof cachedBody;
    expect(body.data).toHaveLength(1);
    // findMany should NOT have been called
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/sources", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockCacheInvalidate.mockResolvedValue(undefined);
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
  });

  it("creates source and returns 201", async () => {
    const createdSource = {
      id: "src-new",
      title: "Test Source",
      type: "book",
      author: "Author Name",
      date: null,
      repository: null,
      call_number: null,
      url: null,
      reliability: "UNKNOWN",
      notes: null,
      created_by_id: "user-1",
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
      _count: { relation_evidence: 0, property_evidence: 0 },
    };
    mockSourceCreate.mockResolvedValue(createdSource);

    const req = makeRequest("http://localhost/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: "proj-1",
        title: "Test Source",
        type: "book",
        author: "Author Name",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; title: string };
    expect(body.id).toBe("src-new");
    expect(body.title).toBe("Test Source");
  });

  it("returns 400 when title is missing", async () => {
    const req = makeRequest("http://localhost/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: "proj-1", type: "book" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });
});
