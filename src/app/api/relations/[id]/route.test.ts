import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockRelationFindFirstDb = vi.fn();
const mockRelationFindFirst = vi.fn();
const mockRelationUpdate = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockCacheInvalidate = vi.fn();
const mockLogActivity = vi.fn();
const mockSanitize = vi.fn((s: string) => s);

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  db: {
    relation: { findFirst: mockRelationFindFirstDb },
  },
  prisma: {
    relation: {
      findFirst: mockRelationFindFirst,
      update: mockRelationUpdate,
    },
    userProject: { findFirst: mockUserProjectFindFirst },
  },
}));

vi.mock("@/lib/cache", () => ({
  cache: { invalidateByPrefix: mockCacheInvalidate },
}));

vi.mock("@/lib/activity", () => ({
  logActivity: mockLogActivity,
}));

vi.mock("@/lib/sanitize", () => ({
  sanitize: mockSanitize,
}));

const { GET, PUT, DELETE } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ id: string }> };

function makeCtx(id: string): RouteContext {
  return { params: Promise.resolve({ id }) };
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
  _count: { evidence: 2 },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/relations/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
    mockRelationFindFirstDb.mockResolvedValue(baseRelation);
  });

  it("returns relation with evidence count", async () => {
    const res = await GET(
      new NextRequest("http://localhost/api/relations/rel-1"),
      makeCtx("rel-1"),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; evidence_count: number };
    expect(body.id).toBe("rel-1");
    expect(body.evidence_count).toBe(2);
  });

  it("returns 404 when not found", async () => {
    mockRelationFindFirstDb.mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/relations/bad"), makeCtx("bad"));
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/relations/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "OWNER" });
    mockRelationFindFirst.mockResolvedValue(baseRelation);
    mockRelationUpdate.mockResolvedValue({ ...baseRelation, notes: "updated" });
    mockCacheInvalidate.mockResolvedValue(undefined);
    mockLogActivity.mockResolvedValue(undefined);
  });

  it("updates relation and returns 200", async () => {
    const res = await PUT(
      new NextRequest("http://localhost/api/relations/rel-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "updated" }),
      }),
      makeCtx("rel-1"),
    );

    expect(res.status).toBe(200);
    expect(mockCacheInvalidate).toHaveBeenCalledWith("relation-list:proj-1:");
    expect(mockLogActivity).toHaveBeenCalled();
  });

  it("returns 400 when certainty is invalid", async () => {
    const res = await PUT(
      new NextRequest("http://localhost/api/relations/rel-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certainty: "MAYBE" }),
      }),
      makeCtx("rel-1"),
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when not found", async () => {
    mockRelationFindFirst.mockResolvedValue(null);
    const res = await PUT(
      new NextRequest("http://localhost/api/relations/bad", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "x" }),
      }),
      makeCtx("bad"),
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/relations/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "OWNER" });
    mockRelationFindFirst.mockResolvedValue(baseRelation);
    mockRelationUpdate.mockResolvedValue({ ...baseRelation, deleted_at: new Date() });
    mockCacheInvalidate.mockResolvedValue(undefined);
    mockLogActivity.mockResolvedValue(undefined);
  });

  it("soft-deletes and returns { deleted: true }", async () => {
    const res = await DELETE(
      new NextRequest("http://localhost/api/relations/rel-1", { method: "DELETE" }),
      makeCtx("rel-1"),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: boolean };
    expect(body.deleted).toBe(true);
    expect(mockRelationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "rel-1" },
        data: expect.objectContaining({ deleted_at: expect.any(Date) }),
      }),
    );
    expect(mockLogActivity).toHaveBeenCalled();
  });

  it("returns 404 when not found", async () => {
    mockRelationFindFirst.mockResolvedValue(null);
    const res = await DELETE(
      new NextRequest("http://localhost/api/relations/bad", { method: "DELETE" }),
      makeCtx("bad"),
    );
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUser.mockResolvedValue(null);
    const res = await DELETE(
      new NextRequest("http://localhost/api/relations/rel-1", { method: "DELETE" }),
      makeCtx("rel-1"),
    );
    expect(res.status).toBe(401);
  });
});
