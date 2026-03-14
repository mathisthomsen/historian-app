import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockRelationFindMany = vi.fn();
const mockRelationCount = vi.fn();
const mockRelationCreate = vi.fn();
const mockRelationTypeFindFirst = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockPersonFindMany = vi.fn();
const mockEventFindMany = vi.fn();
const mockSourceFindMany = vi.fn();
const mockLocationFindMany = vi.fn();
const mockLiteratureFindMany = vi.fn();
const mockPersonFindFirst = vi.fn();
const mockEventFindFirst = vi.fn();
const mockSourceFindFirst = vi.fn();
const mockLocationFindFirst = vi.fn();
const mockLiteratureFindFirst = vi.fn();
const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
const mockCacheInvalidate = vi.fn();
const mockLogActivity = vi.fn();
const mockValidateEntityExists = vi.fn();
const mockSanitize = vi.fn((s: string) => s);

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  db: {
    relation: { findMany: mockRelationFindMany },
  },
  prisma: {
    relation: { count: mockRelationCount, create: mockRelationCreate },
    relationType: { findFirst: mockRelationTypeFindFirst },
    userProject: { findFirst: mockUserProjectFindFirst },
    person: { findMany: mockPersonFindMany, findFirst: mockPersonFindFirst },
    event: { findMany: mockEventFindMany, findFirst: mockEventFindFirst },
    source: { findMany: mockSourceFindMany, findFirst: mockSourceFindFirst },
    location: { findMany: mockLocationFindMany, findFirst: mockLocationFindFirst },
    literature: { findMany: mockLiteratureFindMany, findFirst: mockLiteratureFindFirst },
  },
}));

vi.mock("@/lib/cache", () => ({
  cache: {
    get: mockCacheGet,
    set: mockCacheSet,
    invalidateByPrefix: mockCacheInvalidate,
  },
}));

vi.mock("@/lib/activity", () => ({
  logActivity: mockLogActivity,
}));

vi.mock("@/lib/entity-validation", () => ({
  validateEntityExists: mockValidateEntityExists,
}));

vi.mock("@/lib/sanitize", () => ({
  sanitize: mockSanitize,
}));

const { GET, POST } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGetRequest(qs: string): NextRequest {
  return new NextRequest(`http://localhost/api/relations${qs}`);
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/relations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const baseRelation = {
  id: "rel-1",
  project_id: "proj-1",
  from_type: "PERSON",
  from_id: "person-1",
  to_type: "PERSON",
  to_id: "person-2",
  relation_type_id: "rt-1",
  relation_type: { id: "rt-1", name: "married to", inverse_name: null, color: null, icon: null },
  notes: null,
  certainty: "UNKNOWN",
  valid_from_year: null,
  valid_from_month: null,
  valid_from_cert: "UNKNOWN",
  valid_to_year: null,
  valid_to_month: null,
  valid_to_cert: "UNKNOWN",
  deleted_at: null,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  created_by_id: "user-1",
  _count: { evidence: 0 },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/relations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
    mockRelationFindMany.mockResolvedValue([baseRelation]);
    mockRelationCount.mockResolvedValue(1);
    // Default: all label queries return empty (labels fall back to id)
    mockPersonFindMany.mockResolvedValue([]);
    mockEventFindMany.mockResolvedValue([]);
    mockSourceFindMany.mockResolvedValue([]);
    mockLocationFindMany.mockResolvedValue([]);
    mockLiteratureFindMany.mockResolvedValue([]);
  });

  it("returns paginated list with from_label and to_label", async () => {
    mockPersonFindMany.mockResolvedValue([
      { id: "person-1", first_name: "Max", last_name: "Müller", names: [] },
      { id: "person-2", first_name: "Anna", last_name: "Müller", names: [] },
    ]);

    const res = await GET(makeGetRequest("?projectId=proj-1"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { id: string; from_label: string; to_label: string }[];
      total: number;
    };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.from_label).toBe("Max Müller");
    expect(body.data[0]?.to_label).toBe("Anna Müller");
    expect(body.total).toBe(1);
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUser.mockResolvedValue(null);
    const res = await GET(makeGetRequest("?projectId=proj-1"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when projectId is missing", async () => {
    const res = await GET(makeGetRequest(""));
    expect(res.status).toBe(400);
  });

  it("returns 403 when not a project member", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    const res = await GET(makeGetRequest("?projectId=proj-1"));
    expect(res.status).toBe(403);
  });

  it("returns cached result when cache hit", async () => {
    const cachedBody = { data: [], total: 0, page: 1, pageSize: 20 };
    mockCacheGet.mockResolvedValue(cachedBody);

    const res = await GET(makeGetRequest("?projectId=proj-1"));
    expect(res.status).toBe(200);
    expect(mockRelationFindMany).not.toHaveBeenCalled();
  });

  it("applies entityType/entityId OR filter when both provided", async () => {
    mockRelationFindMany.mockResolvedValue([]);
    mockRelationCount.mockResolvedValue(0);

    const res = await GET(
      makeGetRequest("?projectId=proj-1&entityType=PERSON&entityId=person-1"),
    );

    expect(res.status).toBe(200);
    const callArg = mockRelationFindMany.mock.calls[0]?.[0] as {
      where: { OR?: unknown[] };
    };
    expect(Array.isArray(callArg.where.OR)).toBe(true);
  });
});

describe("POST /api/relations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "OWNER" });
    mockCacheInvalidate.mockResolvedValue(undefined);
    mockLogActivity.mockResolvedValue(undefined);
    mockValidateEntityExists.mockResolvedValue(true);
    mockRelationTypeFindFirst.mockResolvedValue({
      id: "rt-1",
      project_id: "proj-1",
      valid_from_types: ["PERSON"],
      valid_to_types: ["PERSON"],
    });
    mockRelationCreate.mockResolvedValue({ ...baseRelation });
  });

  it("creates relation and returns 201", async () => {
    const res = await POST(
      makePostRequest({
        project_id: "proj-1",
        from_type: "PERSON",
        from_id: "person-1",
        to_type: "PERSON",
        to_id: "person-2",
        relation_type_id: "rt-1",
      }),
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string };
    expect(body.id).toBe("rel-1");
    expect(mockCacheInvalidate).toHaveBeenCalledWith("relation-list:proj-1:");
  });

  it("returns 422 when from_type is not in valid_from_types", async () => {
    mockRelationTypeFindFirst.mockResolvedValue({
      id: "rt-1",
      project_id: "proj-1",
      valid_from_types: ["EVENT"],
      valid_to_types: ["PERSON"],
    });

    const res = await POST(
      makePostRequest({
        project_id: "proj-1",
        from_type: "PERSON",
        from_id: "person-1",
        to_type: "PERSON",
        to_id: "person-2",
        relation_type_id: "rt-1",
      }),
    );

    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("INVALID_FROM_TYPE");
  });

  it("returns 422 when to_type is not in valid_to_types", async () => {
    mockRelationTypeFindFirst.mockResolvedValue({
      id: "rt-1",
      project_id: "proj-1",
      valid_from_types: ["PERSON"],
      valid_to_types: ["EVENT"],
    });

    const res = await POST(
      makePostRequest({
        project_id: "proj-1",
        from_type: "PERSON",
        from_id: "person-1",
        to_type: "PERSON",
        to_id: "person-2",
        relation_type_id: "rt-1",
      }),
    );

    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("INVALID_TO_TYPE");
  });

  it("returns 404 when relation_type_id not in project", async () => {
    mockRelationTypeFindFirst.mockResolvedValue(null);

    const res = await POST(
      makePostRequest({
        project_id: "proj-1",
        from_type: "PERSON",
        from_id: "person-1",
        to_type: "PERSON",
        to_id: "person-2",
        relation_type_id: "bad-rt",
      }),
    );

    expect(res.status).toBe(404);
  });

  it("returns 400 when required fields missing", async () => {
    const res = await POST(makePostRequest({ project_id: "proj-1" }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });
});
