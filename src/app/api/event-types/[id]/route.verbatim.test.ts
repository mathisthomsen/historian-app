import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verbatimCases } from "@/test/verbatim-text";

// #150 T3 — user text reaches Prisma exactly as typed (see the POST twin).

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userProjectFindFirst: vi.fn(),
  eventTypeFindFirst: vi.fn(),
  eventTypeUpdate: vi.fn(),
  eventCount: vi.fn(),
  cacheInvalidate: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  prisma: {
    eventType: { findFirst: mocks.eventTypeFindFirst, update: mocks.eventTypeUpdate },
    event: { count: mocks.eventCount },
    userProject: { findFirst: mocks.userProjectFindFirst },
  },
}));
vi.mock("@/lib/cache", () => ({ cache: { invalidateByPrefix: mocks.cacheInvalidate } }));

const { PUT } = await import("./route");

const STORED = { id: "et-1", project_id: "proj-1", name: "Schlacht", color: null, icon: null };

function put(body: Record<string, unknown>) {
  return PUT(
    new NextRequest("http://localhost/api/event-types/et-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "et-1" }) },
  );
}

describe("PUT /api/event-types/[id] stores text verbatim (#150)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mocks.userProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mocks.eventTypeFindFirst.mockResolvedValue(STORED);
    mocks.eventTypeUpdate.mockResolvedValue(STORED);
    mocks.eventCount.mockResolvedValue(0);
    mocks.cacheInvalidate.mockResolvedValue(undefined);
  });

  it.each(verbatimCases("event_types"))(
    "%s: %j reaches update unchanged",
    async (column, payload) => {
      const res = await put({ [column]: payload });

      expect(res.status).toBe(200);
      expect(mocks.eventTypeUpdate.mock.calls[0]![0].data[column]).toBe(payload);
    },
  );
});
