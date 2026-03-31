import { type NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockEventFindFirst = vi.fn();
const mockEventCount = vi.fn();
const mockEventUpdate = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockRelationCount = vi.fn();
const mockCacheInvalidate = vi.fn();

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  db: {
    event: {
      findFirst: vi.fn(),
    },
  },
  prisma: {
    event: {
      findFirst: mockEventFindFirst,
      count: mockEventCount,
      update: mockEventUpdate,
    },
    userProject: {
      findFirst: mockUserProjectFindFirst,
    },
    relation: {
      count: mockRelationCount,
    },
  },
}));

vi.mock("@/lib/cache", () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    invalidateByPrefix: mockCacheInvalidate,
  },
}));

vi.mock("@/lib/sanitize", () => ({
  sanitize: vi.fn((s: string) => s),
}));

vi.mock("@/lib/activity", () => ({
  logActivity: vi.fn(() => Promise.resolve()),
}));

// Import AFTER mocks are registered
const { DELETE } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new Request(url, options) as unknown as NextRequest;
}

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeBaseEvent(overrides?: object) {
  return {
    id: "evt-1",
    title: "Erster Weltkrieg",
    project_id: "proj-1",
    deleted_at: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DELETE /api/events/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
    mockCacheInvalidate.mockResolvedValue(undefined);
    mockEventUpdate.mockResolvedValue({});
  });

  it("returns 409 HAS_SUB_EVENTS when event has active sub-events", async () => {
    mockEventFindFirst.mockResolvedValue(makeBaseEvent());
    // Sub-event count > 0
    mockEventCount.mockResolvedValue(3);

    const req = makeRequest("http://localhost/api/events/evt-1", { method: "DELETE" });
    const res = await DELETE(req, makeContext("evt-1"));

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string; count: number };
    expect(body.error).toBe("HAS_SUB_EVENTS");
    expect(body.count).toBe(3);
  });

  it("soft-deletes event and invalidates cache when event has no sub-events", async () => {
    mockEventFindFirst.mockResolvedValue(makeBaseEvent());
    // No sub-events
    mockEventCount.mockResolvedValue(0);

    const req = makeRequest("http://localhost/api/events/evt-1", { method: "DELETE" });
    const res = await DELETE(req, makeContext("evt-1"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: boolean };
    expect(body.deleted).toBe(true);

    // Verify soft-delete was called
    expect(mockEventUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "evt-1" },
        data: expect.objectContaining({ deleted_at: expect.any(Date) }),
      }),
    );

    // Verify cache invalidation
    expect(mockCacheInvalidate).toHaveBeenCalledWith("event-list:proj-1:");
  });
});
