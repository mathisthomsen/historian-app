import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verbatimCases } from "@/test/verbatim-text";

// #150 T3 — user text reaches Prisma exactly as typed. The arguments of
// `prisma.event.create` are asserted; nothing mocks a sanitiser.

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userProjectFindFirst: vi.fn(),
  eventCreate: vi.fn(),
  cacheInvalidate: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  db: {},
  prisma: {
    event: { create: mocks.eventCreate },
    userProject: { findFirst: mocks.userProjectFindFirst },
  },
}));
vi.mock("@/lib/cache", () => ({ cache: { invalidateByPrefix: mocks.cacheInvalidate } }));

const { POST } = await import("./route");

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: "proj-1", title: "Basis", ...body }),
    }),
  );
}

describe("POST /api/events stores text verbatim (#150)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mocks.userProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mocks.cacheInvalidate.mockResolvedValue(undefined);
    mocks.eventCreate.mockResolvedValue({
      id: "evt-new",
      event_type: null,
      parent: null,
      sub_events: [],
      _count: { sub_events: 0 },
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it.each(verbatimCases("events"))("%s: %j reaches create unchanged", async (column, payload) => {
    const res = await post({ [column]: payload });

    expect(res.status).toBe(201);
    expect(mocks.eventCreate.mock.calls[0]![0].data[column]).toBe(payload);
  });

  it("keeps a location that holds only markup, and the certainty that qualifies it", async () => {
    await post({ location: "<b></b>", location_certainty: "CERTAIN" });

    const data = mocks.eventCreate.mock.calls[0]![0].data;
    expect(data.location).toBe("<b></b>");
    expect(data.location_certainty).toBe("CERTAIN");
  });
});
