import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verbatimCases } from "@/test/verbatim-text";

// #150 T3 — user text reaches Prisma exactly as typed (see the POST twin).

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userProjectFindFirst: vi.fn(),
  eventFindFirst: vi.fn(),
  eventUpdate: vi.fn(),
  relationCount: vi.fn(),
  cacheInvalidate: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  db: {},
  prisma: {
    event: { findFirst: mocks.eventFindFirst, update: mocks.eventUpdate },
    userProject: { findFirst: mocks.userProjectFindFirst },
    relation: { count: mocks.relationCount },
  },
}));
vi.mock("@/lib/cache", () => ({ cache: { invalidateByPrefix: mocks.cacheInvalidate } }));
vi.mock("@/lib/activity", () => ({ logActivity: mocks.logActivity }));

const { PUT } = await import("./route");

const STORED = {
  id: "evt-1",
  project_id: "proj-1",
  title: "Erster Weltkrieg",
  description: null,
  location: null,
  location_certainty: "UNKNOWN",
  notes: null,
  event_type: null,
  parent: null,
  sub_events: [],
  _count: { sub_events: 0 },
  created_by_id: "user-1",
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  deleted_at: null,
};

function put(body: Record<string, unknown>) {
  return PUT(
    new NextRequest("http://localhost/api/events/evt-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "evt-1" }) },
  );
}

describe("PUT /api/events/[id] stores text verbatim (#150)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mocks.userProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mocks.eventFindFirst.mockResolvedValue(STORED);
    mocks.eventUpdate.mockResolvedValue(STORED);
    mocks.relationCount.mockResolvedValue(0);
    mocks.cacheInvalidate.mockResolvedValue(undefined);
    mocks.logActivity.mockResolvedValue(undefined);
  });

  it.each(verbatimCases("events"))("%s: %j reaches update unchanged", async (column, payload) => {
    const res = await put({ [column]: payload });

    expect(res.status).toBe(200);
    expect(mocks.eventUpdate.mock.calls[0]![0].data[column]).toBe(payload);
  });

  it("keeps a location that holds only markup, and the certainty that qualifies it", async () => {
    await put({ location: "<b></b>", location_certainty: "CERTAIN" });

    const data = mocks.eventUpdate.mock.calls[0]![0].data;
    expect(data.location).toBe("<b></b>");
    expect(data.location_certainty).toBe("CERTAIN");
  });
});
