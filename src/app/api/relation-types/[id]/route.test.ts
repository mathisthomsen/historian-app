import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockRelationTypeFindFirst = vi.fn();
const mockRelationTypeUpdate = vi.fn();
const mockRelationTypeDelete = vi.fn();
const mockRelationCount = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockSanitize = vi.fn((s: string) => s);

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    relationType: {
      findFirst: mockRelationTypeFindFirst,
      update: mockRelationTypeUpdate,
      delete: mockRelationTypeDelete,
    },
    relation: {
      count: mockRelationCount,
    },
    userProject: {
      findFirst: mockUserProjectFindFirst,
    },
  },
}));

vi.mock("@/lib/sanitize", () => ({
  sanitize: mockSanitize,
}));

const { PUT, DELETE } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ id: string }> };

function makeCtx(id: string): RouteContext {
  return { params: Promise.resolve({ id }) };
}

function makePutRequest(id: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/relation-types/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost/api/relation-types/${id}`, {
    method: "DELETE",
  });
}

const existingRelationType = {
  id: "rt-1",
  project_id: "proj-1",
  name: "married to",
  inverse_name: null,
  description: null,
  color: null,
  icon: null,
  valid_from_types: ["PERSON"],
  valid_to_types: ["PERSON"],
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  _count: { relations: 0 },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PUT /api/relation-types/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "OWNER" });
    mockRelationTypeFindFirst.mockResolvedValue(existingRelationType);
    mockRelationTypeUpdate.mockResolvedValue({ ...existingRelationType, name: "spouse of" });
  });

  it("updates relation type name and returns 200", async () => {
    const res = await PUT(makePutRequest("rt-1", { name: "spouse of" }), makeCtx("rt-1"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; name: string };
    expect(body.id).toBe("rt-1");
  });

  it("returns 404 when relation type not found", async () => {
    mockRelationTypeFindFirst.mockResolvedValue(null);
    const res = await PUT(makePutRequest("bad-id", { name: "x" }), makeCtx("bad-id"));
    expect(res.status).toBe(404);
  });

  it("returns 400 when name is empty string", async () => {
    const res = await PUT(makePutRequest("rt-1", { name: "" }), makeCtx("rt-1"));
    expect(res.status).toBe(400);
  });

  it("returns 403 when user not OWNER/EDITOR", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    const res = await PUT(makePutRequest("rt-1", { name: "x" }), makeCtx("rt-1"));
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/relation-types/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "OWNER" });
    mockRelationTypeFindFirst.mockResolvedValue(existingRelationType);
    mockRelationCount.mockResolvedValue(0);
    mockRelationTypeDelete.mockResolvedValue(existingRelationType);
  });

  it("deletes relation type when not in use", async () => {
    const res = await DELETE(makeDeleteRequest("rt-1"), makeCtx("rt-1"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: boolean };
    expect(body.deleted).toBe(true);
  });

  it("returns 409 IN_USE when relations exist", async () => {
    mockRelationCount.mockResolvedValue(5);
    const res = await DELETE(makeDeleteRequest("rt-1"), makeCtx("rt-1"));
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string; count: number };
    expect(body.error).toBe("IN_USE");
    expect(body.count).toBe(5);
  });

  it("returns 404 when relation type not found", async () => {
    mockRelationTypeFindFirst.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest("bad-id"), makeCtx("bad-id"));
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUser.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest("rt-1"), makeCtx("rt-1"));
    expect(res.status).toBe(401);
  });
});
