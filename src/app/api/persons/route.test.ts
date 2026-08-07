import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockFindMany = vi.fn();
const mockPersonCount = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockPersonCreate = vi.fn();
const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
const mockCacheInvalidate = vi.fn();
const mockSanitize = vi.fn((s: string) => s);

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  db: {
    person: {
      findMany: mockFindMany,
    },
  },
  prisma: {
    person: {
      count: mockPersonCount,
      create: mockPersonCreate,
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

function makeBasePerson(overrides?: object) {
  return {
    id: "person-1",
    first_name: "Otto",
    last_name: "Bismarck",
    birth_year: 1815,
    birth_month: null,
    birth_day: null,
    birth_date_certainty: "CERTAIN",
    death_year: 1898,
    death_month: null,
    death_day: null,
    death_date_certainty: "CERTAIN",
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    names: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/persons", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
  });

  it("returns paginated list for authenticated user", async () => {
    const person = makeBasePerson();
    mockFindMany.mockResolvedValue([person]);
    mockPersonCount.mockResolvedValue(1);

    const req = makeRequest("http://localhost/api/persons");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { id: string; last_name: string | null }[];
      pagination: { total: number };
    };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.last_name).toBe("Bismarck");
    expect(body.pagination.total).toBe(1);
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUser.mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/persons");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when the user is not a member of the requested project", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/persons?projectId=other-project");
    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("checks project membership before reading from cache", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    mockCacheGet.mockResolvedValue({ data: [], pagination: {} });

    const req = makeRequest("http://localhost/api/persons?projectId=other-project");
    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(mockCacheGet).not.toHaveBeenCalled();
  });

  it("returns cached result on second call", async () => {
    const cachedBody = {
      data: [makeBasePerson()],
      pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
    };
    mockCacheGet.mockResolvedValue(cachedBody);

    const req = makeRequest("http://localhost/api/persons");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as typeof cachedBody;
    expect(body.data).toHaveLength(1);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/persons", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockCacheInvalidate.mockResolvedValue(undefined);
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
  });

  it("creates person and returns 201", async () => {
    const createdPerson = {
      id: "person-new",
      first_name: "Otto",
      last_name: "Bismarck",
      birth_year: null,
      birth_month: null,
      birth_day: null,
      birth_date_certainty: "UNKNOWN",
      birth_place: null,
      death_year: null,
      death_month: null,
      death_day: null,
      death_date_certainty: "UNKNOWN",
      death_place: null,
      notes: null,
      created_by_id: "user-1",
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
      names: [],
    };
    mockPersonCreate.mockResolvedValue(createdPerson);

    const req = makeRequest("http://localhost/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: "proj-1",
        first_name: "Otto",
        last_name: "Bismarck",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; last_name: string };
    expect(body.id).toBe("person-new");
    expect(body.last_name).toBe("Bismarck");
  });

  it("returns 400 when no name is provided", async () => {
    const req = makeRequest("http://localhost/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: "proj-1" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });

  it("returns 403 when the user is not a member of the target project", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: "other-project",
        first_name: "Otto",
        last_name: "Bismarck",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockPersonCreate).not.toHaveBeenCalled();
  });
});
