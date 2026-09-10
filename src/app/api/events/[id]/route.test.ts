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
const mockLogActivity = vi.fn();

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
  logActivity: mockLogActivity,
}));

// Import AFTER mocks are registered
const { PUT, DELETE } = await import("./route");

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

function makeFullEvent(overrides?: object) {
  return {
    id: "evt-1",
    project_id: "proj-1",
    title: "Erster Weltkrieg",
    description: null,
    event_type: null,
    event_type_id: null,
    start_year: 1914,
    start_month: null,
    start_day: null,
    start_date_certainty: "CERTAIN",
    end_year: 1918,
    end_month: null,
    end_day: null,
    end_date_certainty: "CERTAIN",
    location: null,
    location_certainty: "UNKNOWN",
    parent: null,
    parent_id: null,
    notes: null,
    created_by_id: "user-1",
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
    deleted_at: null,
    sub_events: [],
    _count: { sub_events: 0 },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PUT /api/events/[id] — location certainty round-trip (issue #78)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mockCacheInvalidate.mockResolvedValue(undefined);
    mockRelationCount.mockResolvedValue(0);
    mockLogActivity.mockResolvedValue(undefined);
  });

  it("writes location_certainty to the DB and returns it", async () => {
    mockEventFindFirst.mockResolvedValue(makeFullEvent());
    mockEventUpdate.mockResolvedValue(
      makeFullEvent({ location: "Somme", location_certainty: "CERTAIN" }),
    );

    const req = makeRequest("http://localhost/api/events/evt-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: "Somme", location_certainty: "CERTAIN" }),
    });

    const res = await PUT(req, makeContext("evt-1"));

    expect(res.status).toBe(200);
    expect(mockEventUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ location_certainty: "CERTAIN" }),
      }),
    );
    const body = (await res.json()) as { location_certainty: string };
    expect(body.location_certainty).toBe("CERTAIN");
  });

  it("logs an activity entry when location_certainty changes", async () => {
    mockEventFindFirst.mockResolvedValue(
      // A location must be present: with none, the real PUT path normalises a
      // certainty-only CERTAIN back to UNKNOWN, and a mock returning CERTAIN
      // would let this pass while asserting behaviour the route never produces.
      makeFullEvent({ location: "Wien", location_certainty: "UNKNOWN" }),
    );
    mockEventUpdate.mockResolvedValue(
      makeFullEvent({ location: "Wien", location_certainty: "CERTAIN" }),
    );

    const req = makeRequest("http://localhost/api/events/evt-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location_certainty: "CERTAIN" }),
    });

    await PUT(req, makeContext("evt-1"));

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        field_path: "location_certainty",
        old_value: "UNKNOWN",
        new_value: "CERTAIN",
      }),
    );
  });
});

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
    const body = (await res.json()) as { error: { code: string; details: { count: number } } };
    expect(body.error.code).toBe("HAS_SUB_EVENTS");
    expect(body.error.details.count).toBe(3);
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
