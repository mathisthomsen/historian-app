import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockEventTypeFindMany = vi.fn();
const mockEventTypeCreate = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockSanitize = vi.fn((s: string) => s);

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    eventType: {
      findMany: mockEventTypeFindMany,
      create: mockEventTypeCreate,
    },
    userProject: {
      findFirst: mockUserProjectFindFirst,
    },
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

function makeGetRequest(queryString = ""): NextRequest {
  return new NextRequest(`http://localhost/api/event-types${queryString}`);
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/event-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/event-types", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
  });

  it("returns list with event_count from _count.events", async () => {
    mockEventTypeFindMany.mockResolvedValue([
      {
        id: "et-1",
        name: "Krieg",
        color: "#dc2626",
        icon: null,
        _count: { events: 3 },
      },
    ]);

    const req = makeGetRequest();
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { id: string; name: string; event_count: number }[];
    };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.event_count).toBe(3);
    expect(body.data[0]?.name).toBe("Krieg");
  });

  it("returns 401 when user is not authenticated", async () => {
    mockRequireUser.mockResolvedValue(null);

    const req = makeGetRequest();
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});

describe("POST /api/event-types", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
  });

  it("creates event type with valid name and color, returns 201", async () => {
    mockEventTypeCreate.mockResolvedValue({
      id: "et-new",
      name: "Revolution",
      color: "#dc2626",
      icon: null,
    });

    const req = makePostRequest({
      name: "Revolution",
      color: "#dc2626",
      project_id: "proj-1",
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      id: string;
      name: string;
      event_count: number;
    };
    expect(body.id).toBe("et-new");
    expect(body.name).toBe("Revolution");
    expect(body.event_count).toBe(0);
  });

  it("returns 400 when color is not in the allowed palette", async () => {
    const req = makePostRequest({
      name: "Test",
      color: "#123456",
      project_id: "proj-1",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });

  it("returns 409 DUPLICATE_NAME when Prisma throws P2002", async () => {
    const p2002Error = new Error("Unique constraint failed") as Error & { code: string };
    p2002Error.code = "P2002";
    mockEventTypeCreate.mockRejectedValue(p2002Error);

    const req = makePostRequest({
      name: "Krieg",
      project_id: "proj-1",
    });

    const res = await POST(req);

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("DUPLICATE_NAME");
  });

  it("returns 400 when name is missing", async () => {
    const req = makePostRequest({
      project_id: "proj-1",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });
});
