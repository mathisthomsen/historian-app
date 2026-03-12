import { type NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockEventTypeFindFirst = vi.fn();
const mockEventTypeDelete = vi.fn();
const mockEventTypeUpdate = vi.fn();
const mockEventCount = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockSanitize = vi.fn((s: string) => s);

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    eventType: {
      findFirst: mockEventTypeFindFirst,
      delete: mockEventTypeDelete,
      update: mockEventTypeUpdate,
    },
    event: {
      count: mockEventCount,
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

function makeBaseEventType(overrides?: object) {
  return {
    id: "et-1",
    name: "Krieg",
    color: "#dc2626",
    icon: null,
    project_id: "proj-1",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DELETE /api/event-types/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
    mockEventTypeDelete.mockResolvedValue({});
  });

  it("returns 409 TYPE_IN_USE with filter_url containing the type id when type is in use", async () => {
    mockEventTypeFindFirst.mockResolvedValue(makeBaseEventType());
    mockEventCount.mockResolvedValue(5);

    const req = makeRequest("http://localhost/api/event-types/et-1", { method: "DELETE" });
    const res = await DELETE(req, makeContext("et-1"));

    expect(res.status).toBe(409);
    const body = (await res.json()) as {
      error: string;
      count: number;
      filter_url: string;
    };
    expect(body.error).toBe("TYPE_IN_USE");
    expect(body.count).toBe(5);
    expect(body.filter_url).toContain("et-1");
  });

  it("deletes unused type and returns 200 with deleted:true", async () => {
    mockEventTypeFindFirst.mockResolvedValue(makeBaseEventType());
    mockEventCount.mockResolvedValue(0);

    const req = makeRequest("http://localhost/api/event-types/et-1", { method: "DELETE" });
    const res = await DELETE(req, makeContext("et-1"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: boolean };
    expect(body.deleted).toBe(true);
    expect(mockEventTypeDelete).toHaveBeenCalledWith({ where: { id: "et-1" } });
  });

  it("returns 404 when event type does not exist", async () => {
    mockEventTypeFindFirst.mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/event-types/nonexistent", { method: "DELETE" });
    const res = await DELETE(req, makeContext("nonexistent"));

    expect(res.status).toBe(404);
  });
});
