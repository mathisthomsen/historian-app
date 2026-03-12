import { type NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockEventFindMany = vi.fn();
const mockEventCount = vi.fn();
const mockEventUpdate = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockCacheInvalidate = vi.fn();

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    event: {
      findMany: mockEventFindMany,
      count: mockEventCount,
      update: mockEventUpdate,
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
    mockEventUpdate.mockResolvedValue({});
  });

  it("skips events with sub-events and deletes the rest, returning skipped list", async () => {
    // Two events: evt-1 has sub-events (skip), evt-2 has none (delete)
    mockEventFindMany.mockResolvedValue([
      { id: "evt-1", project_id: "proj-1" },
      { id: "evt-2", project_id: "proj-1" },
    ]);

    // evt-1 has 2 sub-events; evt-2 has 0
    mockEventCount
      .mockResolvedValueOnce(2) // evt-1
      .mockResolvedValueOnce(0); // evt-2

    const req = makeRequest({ ids: ["evt-1", "evt-2"], action: "delete" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      deleted: number;
      skipped: { id: string; reason: string }[];
    };
    expect(body.deleted).toBe(1);
    expect(body.skipped).toHaveLength(1);
    expect(body.skipped[0]).toEqual({ id: "evt-1", reason: "HAS_SUB_EVENTS" });

    // Verify only evt-2 was soft-deleted
    expect(mockEventUpdate).toHaveBeenCalledOnce();
    expect(mockEventUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "evt-2" } }),
    );
  });

  it("returns 200 with deleted:0 when no events are found", async () => {
    mockEventFindMany.mockResolvedValue([]);

    const req = makeRequest({ ids: ["nonexistent-id"], action: "delete" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: number; skipped: unknown[] };
    expect(body.deleted).toBe(0);
    expect(body.skipped).toEqual([]);
  });

  it("returns 400 when ids array is empty", async () => {
    const req = makeRequest({ ids: [], action: "delete" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });
});
