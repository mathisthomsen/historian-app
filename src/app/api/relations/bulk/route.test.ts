import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockRelationUpdateMany = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockCacheInvalidate = vi.fn();

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    relation: { updateMany: mockRelationUpdateMany },
    userProject: { findFirst: mockUserProjectFindFirst },
  },
}));

vi.mock("@/lib/cache", () => ({
  cache: { invalidateByPrefix: mockCacheInvalidate },
}));

const { POST } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/relations/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/relations/bulk", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "OWNER" });
    mockCacheInvalidate.mockResolvedValue(undefined);
  });

  it("bulk soft-deletes and returns { deleted: 2 }", async () => {
    mockRelationUpdateMany.mockResolvedValue({ count: 2 });

    const res = await POST(
      makeRequest({ action: "delete", ids: ["rel-1", "rel-2"], projectId: "proj-1" }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: number };
    expect(body.deleted).toBe(2);
    expect(mockRelationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ["rel-1", "rel-2"] },
          project_id: "proj-1",
          deleted_at: null,
        }),
        data: expect.objectContaining({ deleted_at: expect.any(Date) }),
      }),
    );
    expect(mockCacheInvalidate).toHaveBeenCalledWith("relation-list:proj-1:");
  });

  it("returns 400 when ids is empty", async () => {
    const res = await POST(makeRequest({ action: "delete", ids: [], projectId: "proj-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when action is not 'delete'", async () => {
    const res = await POST(
      makeRequest({ action: "restore", ids: ["rel-1"], projectId: "proj-1" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when not OWNER/EDITOR", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    const res = await POST(
      makeRequest({ action: "delete", ids: ["rel-1"], projectId: "proj-1" }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUser.mockResolvedValue(null);
    const res = await POST(
      makeRequest({ action: "delete", ids: ["rel-1"], projectId: "proj-1" }),
    );
    expect(res.status).toBe(401);
  });
});
