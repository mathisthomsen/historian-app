import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockFindMany = vi.fn();
const mockEventCount = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockEventFindFirst = vi.fn();
const mockEventCreate = vi.fn();
const mockEventTypeFindFirst = vi.fn();
const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
const mockCacheInvalidate = vi.fn();
const mockSanitize = vi.fn((s: string) => s);

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  db: {
    event: {
      findMany: mockFindMany,
    },
  },
  prisma: {
    event: {
      count: mockEventCount,
      findFirst: mockEventFindFirst,
      create: mockEventCreate,
    },
    userProject: {
      findFirst: mockUserProjectFindFirst,
    },
    eventType: {
      findFirst: mockEventTypeFindFirst,
    },
  },
}));

vi.mock("@/lib/cache", () => ({
  cache: {
    get: mockCacheGet,
    set: mockCacheSet,
    invalidateByPrefix: mockCacheInvalidate,
  },
}));

vi.mock("@/lib/sanitize", () => ({
  sanitize: mockSanitize,
}));

// Import AFTER mocks are registered
const { GET, POST } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  url: string,
  options?: ConstructorParameters<typeof NextRequest>[1],
): NextRequest {
  return new NextRequest(url, options as ConstructorParameters<typeof NextRequest>[1]);
}

function makeBaseEvent(overrides?: object) {
  return {
    id: "evt-1",
    title: "Erster Weltkrieg",
    event_type: { id: "et-1", name: "Krieg", color: "#dc2626" },
    start_year: 1914,
    start_month: null,
    start_day: null,
    start_date_certainty: "CERTAIN",
    end_year: 1918,
    end_month: null,
    end_day: null,
    end_date_certainty: "CERTAIN",
    location: "Europa",
    parent: null,
    _count: { sub_events: 0 },
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/events", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
  });

  it("returns paginated list with event_type included", async () => {
    const event = makeBaseEvent();
    mockFindMany.mockResolvedValue([event]);
    mockEventCount.mockResolvedValue(1);

    const req = makeRequest("http://localhost/api/events");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { id: string; event_type: { name: string } | null }[];
      pagination: { total: number };
    };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.event_type?.name).toBe("Krieg");
    expect(body.pagination.total).toBe(1);
  });

  it("passes parent_id: null filter when topLevelOnly=true", async () => {
    mockFindMany.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(0);

    const req = makeRequest("http://localhost/api/events?topLevelOnly=true");
    await GET(req);

    const callArg = mockFindMany.mock.calls[0]?.[0] as {
      where: { parent_id?: null | string };
    };
    expect(callArg.where.parent_id).toBeNull();
  });

  it("passes overlap filter when fromYear and toYear are provided", async () => {
    mockFindMany.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(0);

    const req = makeRequest("http://localhost/api/events?fromYear=1900&toYear=1950");
    await GET(req);

    const callArg = mockFindMany.mock.calls[0]?.[0] as {
      where: { AND?: unknown[] };
    };
    expect(Array.isArray(callArg.where.AND)).toBe(true);
    expect((callArg.where.AND as unknown[]).length).toBeGreaterThan(0);
  });

  it("passes event_type_id in filter when typeIds query param is provided", async () => {
    mockFindMany.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(0);

    const req = makeRequest("http://localhost/api/events?typeIds=a,b");
    await GET(req);

    const callArg = mockFindMany.mock.calls[0]?.[0] as {
      where: { event_type_id?: { in: string[] } };
    };
    expect(callArg.where.event_type_id).toEqual({ in: ["a", "b"] });
  });
});

describe("POST /api/events", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockCacheInvalidate.mockResolvedValue(undefined);
    // Default: membership check passes
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
    // Default: no parent_id so parent lookup not called
    mockEventFindFirst.mockResolvedValue(null);
    // Default: event type check passes
    mockEventTypeFindFirst.mockResolvedValue({ id: "et-1" });
  });

  it("creates event and returns 201 with event data", async () => {
    const createdEvent = {
      id: "evt-new",
      title: "Neues Ereignis",
      event_type: null,
      start_year: 1900,
      start_month: null,
      start_day: null,
      start_date_certainty: "UNKNOWN",
      end_year: null,
      end_month: null,
      end_day: null,
      end_date_certainty: "UNKNOWN",
      location: null,
      parent: null,
      _count: { sub_events: 0 },
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
      description: null,
      notes: null,
      created_by_id: "user-1",
      sub_events: [],
    };
    mockEventCreate.mockResolvedValue(createdEvent);

    const req = makeRequest("http://localhost/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: "proj-1",
        title: "Neues Ereignis",
        start_year: 1900,
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; title: string };
    expect(body.id).toBe("evt-new");
    expect(body.title).toBe("Neues Ereignis");
  });

  it("returns 400 when title is missing", async () => {
    const req = makeRequest("http://localhost/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: "proj-1",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 when start_month provided without start_year", async () => {
    const req = makeRequest("http://localhost/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: "proj-1",
        title: "Test",
        start_month: 6,
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 DEPTH_LIMIT_EXCEEDED when parent is itself a sub-event", async () => {
    // parent_id points to an event that already has a parent_id (depth limit)
    mockEventFindFirst.mockResolvedValue({
      id: "parent-id",
      title: "Verdun",
      parent_id: "other-parent",
    });

    const req = makeRequest("http://localhost/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: "proj-1",
        title: "Kind-Ereignis",
        parent_id: "parent-id",
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: string;
      parent_title: string;
    };
    expect(body.error).toBe("DEPTH_LIMIT_EXCEEDED");
    expect(body.parent_title).toBe("Verdun");
  });
});
