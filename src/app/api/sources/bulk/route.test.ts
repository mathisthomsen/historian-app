import { type NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockSourceUpdateMany = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockCacheInvalidate = vi.fn();

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    source: {
      updateMany: mockSourceUpdateMany,
    },
    userProject: {
      findFirst: mockUserProjectFindFirst,
    },
  },
}));

vi.mock("@/lib/cache", () => ({
  cache: {
    invalidateByPrefix: mockCacheInvalidate,
  },
}));

// Import AFTER mocks are registered
const { POST } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/sources/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/sources/bulk", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
    mockCacheInvalidate.mockResolvedValue(undefined);
  });

  it("bulk deletes 2 sources and returns { deleted: 2 }", async () => {
    mockSourceUpdateMany.mockResolvedValue({ count: 2 });

    const req = makeRequest({ ids: ["src-1", "src-2"], project_id: "proj-1" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: number };
    expect(body.deleted).toBe(2);

    expect(mockSourceUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ["src-1", "src-2"] },
          project_id: "proj-1",
          deleted_at: null,
        }),
        data: expect.objectContaining({ deleted_at: expect.any(Date) }),
      }),
    );
    expect(mockCacheInvalidate).toHaveBeenCalledWith("source-list:proj-1:");
  });

  it("silently skips IDs not belonging to project (returns actual count)", async () => {
    // Only 1 of the 2 IDs belongs to the project — updateMany handles this via where clause
    mockSourceUpdateMany.mockResolvedValue({ count: 1 });

    const req = makeRequest({ ids: ["src-proj1", "src-other-project"], project_id: "proj-1" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: number };
    expect(body.deleted).toBe(1);
  });

  it("returns 400 for empty ids array", async () => {
    const req = makeRequest({ ids: [], project_id: "proj-1" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });
});
