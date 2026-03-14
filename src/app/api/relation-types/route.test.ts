import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockRelationTypeFindMany = vi.fn();
const mockRelationTypeCreate = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockSanitize = vi.fn((s: string) => s);

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    relationType: {
      findMany: mockRelationTypeFindMany,
      create: mockRelationTypeCreate,
    },
    userProject: {
      findFirst: mockUserProjectFindFirst,
    },
  },
}));

vi.mock("@/lib/sanitize", () => ({
  sanitize: mockSanitize,
}));

const { GET, POST } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGetRequest(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/relation-types${qs}`);
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/relation-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/relation-types", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
  });

  it("returns list with _count.relations", async () => {
    mockRelationTypeFindMany.mockResolvedValue([
      {
        id: "rt-1",
        name: "married to",
        inverse_name: "spouse of",
        description: null,
        color: "#4f46e5",
        icon: null,
        valid_from_types: ["PERSON"],
        valid_to_types: ["PERSON"],
        created_at: new Date("2026-01-01T00:00:00.000Z"),
        updated_at: new Date("2026-01-01T00:00:00.000Z"),
        _count: { relations: 3 },
      },
    ]);

    const res = await GET(makeGetRequest("?projectId=proj-1"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string; _count: { relations: number } }[] };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?._count.relations).toBe(3);
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUser.mockResolvedValue(null);
    const res = await GET(makeGetRequest("?projectId=proj-1"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when not a project member", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    const res = await GET(makeGetRequest("?projectId=proj-1"));
    expect(res.status).toBe(403);
  });
});

describe("POST /api/relation-types", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "OWNER" });
  });

  it("creates relation type and returns 201", async () => {
    mockRelationTypeCreate.mockResolvedValue({
      id: "rt-new",
      name: "is child of",
      inverse_name: "is parent of",
      description: null,
      color: "#4f46e5",
      icon: null,
      valid_from_types: ["PERSON"],
      valid_to_types: ["PERSON"],
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
    });

    const res = await POST(
      makePostRequest({
        project_id: "proj-1",
        name: "is child of",
        inverse_name: "is parent of",
        color: "#4f46e5",
        valid_from_types: ["PERSON"],
        valid_to_types: ["PERSON"],
      }),
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; name: string; _count: { relations: number } };
    expect(body.id).toBe("rt-new");
    expect(body._count.relations).toBe(0);
  });

  it("returns 400 when valid_from_types is empty", async () => {
    const res = await POST(
      makePostRequest({
        project_id: "proj-1",
        name: "test",
        valid_from_types: [],
        valid_to_types: ["PERSON"],
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 when color is not a valid hex", async () => {
    const res = await POST(
      makePostRequest({
        project_id: "proj-1",
        name: "test",
        color: "not-a-color",
        valid_from_types: ["PERSON"],
        valid_to_types: ["PERSON"],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when user is not OWNER/EDITOR", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    const res = await POST(
      makePostRequest({
        project_id: "proj-1",
        name: "test",
        valid_from_types: ["PERSON"],
        valid_to_types: ["PERSON"],
      }),
    );
    expect(res.status).toBe(403);
  });
});
