import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockEntityActivityFindMany = vi.fn();
const mockEntityActivityCount = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockValidateEntityExists = vi.fn();

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    entityActivity: {
      findMany: mockEntityActivityFindMany,
      count: mockEntityActivityCount,
    },
    userProject: { findFirst: mockUserProjectFindFirst },
  },
}));

vi.mock("@/lib/entity-validation", () => ({
  validateEntityExists: mockValidateEntityExists,
}));

const { GET } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ type: string; id: string }> };

function makeCtx(type: string, id: string): RouteContext {
  return { params: Promise.resolve({ type, id }) };
}

function makeGetRequest(type: string, id: string, qs = ""): NextRequest {
  return new NextRequest(
    `http://localhost/api/entities/${type}/${id}/activity?projectId=proj-1${qs}`,
  );
}

const baseActivity = {
  id: "act-1",
  project_id: "proj-1",
  entity_type: "PERSON",
  entity_id: "person-1",
  action: "CREATE",
  field_path: null,
  old_value: null,
  new_value: null,
  reason: null,
  source_id: null,
  agent_name: null,
  user_id: "user-1",
  user: { id: "user-1", name: "Max Müller", email: "max@example.com" },
  created_at: new Date("2026-01-01T00:00:00.000Z"),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/entities/[type]/[id]/activity", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
    mockValidateEntityExists.mockResolvedValue(true);
    mockEntityActivityFindMany.mockResolvedValue([baseActivity]);
    mockEntityActivityCount.mockResolvedValue(1);
  });

  it("returns paginated activity log with user_name", async () => {
    const res = await GET(makeGetRequest("PERSON", "person-1"), makeCtx("PERSON", "person-1"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { id: string; user_name: string | null }[];
      total: number;
    };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.user_name).toBe("Max Müller");
    expect(body.total).toBe(1);
  });

  it("is case-insensitive for entity type (person -> PERSON)", async () => {
    const res = await GET(makeGetRequest("person", "person-1"), makeCtx("person", "person-1"));
    expect(res.status).toBe(200);
  });

  it("returns 400 for unknown entity type", async () => {
    const res = await GET(makeGetRequest("BUILDING", "b-1"), makeCtx("BUILDING", "b-1"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when entity does not exist", async () => {
    mockValidateEntityExists.mockResolvedValue(false);
    const res = await GET(makeGetRequest("PERSON", "bad-id"), makeCtx("PERSON", "bad-id"));
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUser.mockResolvedValue(null);
    const res = await GET(makeGetRequest("PERSON", "person-1"), makeCtx("PERSON", "person-1"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when not a project member", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    const res = await GET(makeGetRequest("PERSON", "person-1"), makeCtx("PERSON", "person-1"));
    expect(res.status).toBe(403);
  });
});
