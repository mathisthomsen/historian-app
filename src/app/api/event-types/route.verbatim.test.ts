import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verbatimCases } from "@/test/verbatim-text";

// #150 T3 — user text reaches Prisma exactly as typed. The arguments of
// `prisma.eventType.create` are asserted; nothing mocks a sanitiser.

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userProjectFindFirst: vi.fn(),
  eventTypeCreate: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  prisma: {
    eventType: { create: mocks.eventTypeCreate },
    userProject: { findFirst: mocks.userProjectFindFirst },
  },
}));

const { POST } = await import("./route");

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/event-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: "proj-1", name: "Basis", ...body }),
    }),
  );
}

describe("POST /api/event-types stores text verbatim (#150)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mocks.userProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mocks.eventTypeCreate.mockResolvedValue({ id: "et-new", name: "x", color: null, icon: null });
  });

  it.each(verbatimCases("event_types"))(
    "%s: %j reaches create unchanged",
    async (column, payload) => {
      const res = await post({ [column]: payload });

      expect(res.status).toBe(201);
      expect(mocks.eventTypeCreate.mock.calls[0]![0].data[column]).toBe(payload);
    },
  );
});
