import { type NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockEventFindMany = vi.fn();
const mockEventGroupBy = vi.fn();
const mockEventUpdateMany = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockCacheInvalidate = vi.fn();

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    event: {
      findMany: mockEventFindMany,
      groupBy: mockEventGroupBy,
      updateMany: mockEventUpdateMany,
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
  return new Request("http://localhost/api/events/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/events/bulk", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
    mockCacheInvalidate.mockResolvedValue(undefined);
    mockEventGroupBy.mockResolvedValue([]);
    mockEventUpdateMany.mockResolvedValue({ count: 0 });
  });

  it("skips events with sub-events and deletes the rest, returning skipped list", async () => {
    // Two events: evt-1 has sub-events (skip), evt-2 has none (delete)
    mockEventFindMany.mockResolvedValue([{ id: "evt-1" }, { id: "evt-2" }]);

    // One groupBy replaces the per-event counts: only evt-1 has sub-events.
    mockEventGroupBy.mockResolvedValue([{ parent_id: "evt-1", _count: { _all: 2 } }]);
    mockEventUpdateMany.mockResolvedValue({ count: 1 });

    const req = makeRequest({ action: "delete", ids: ["evt-1", "evt-2"], project_id: "proj-1" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      deleted: number;
      skipped: { id: string; reason: string }[];
    };
    expect(body.deleted).toBe(1);
    expect(body.skipped).toHaveLength(1);
    expect(body.skipped[0]).toEqual({ id: "evt-1", reason: "HAS_SUB_EVENTS" });

    // Only evt-2 is deleted, and in a single updateMany rather than N updates.
    expect(mockEventUpdateMany).toHaveBeenCalledOnce();
    expect(mockEventUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ["evt-2"] }, project_id: "proj-1" }),
      }),
    );
  });

  it("returns 200 with deleted:0 when no events are found", async () => {
    mockEventFindMany.mockResolvedValue([]);

    const req = makeRequest({ action: "delete", ids: ["nonexistent-id"], project_id: "proj-1" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: number; skipped: unknown[] };
    expect(body.deleted).toBe(0);
    expect(body.skipped).toEqual([]);
  });

  it("returns 400 when ids array is empty", async () => {
    const req = makeRequest({ action: "delete", ids: [], project_id: "proj-1" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });
});
