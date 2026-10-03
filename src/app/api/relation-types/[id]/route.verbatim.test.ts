import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verbatimCases } from "@/test/verbatim-text";

// #150 T3 — user text reaches Prisma exactly as typed (see the POST twin).

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userProjectFindFirst: vi.fn(),
  relationTypeFindFirst: vi.fn(),
  relationTypeUpdate: vi.fn(),
  cacheInvalidate: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  prisma: {
    relationType: { findFirst: mocks.relationTypeFindFirst, update: mocks.relationTypeUpdate },
    userProject: { findFirst: mocks.userProjectFindFirst },
  },
}));
vi.mock("@/lib/cache", () => ({ cache: { invalidateByPrefix: mocks.cacheInvalidate } }));

const { PUT } = await import("./route");

const STORED = {
  id: "rt-1",
  project_id: "proj-1",
  name: "verheiratet mit",
  valid_from_types: ["PERSON"],
  valid_to_types: ["PERSON"],
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  _count: { relations: 0 },
};

function put(body: Record<string, unknown>) {
  return PUT(
    new NextRequest("http://localhost/api/relation-types/rt-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "rt-1" }) },
  );
}

describe("PUT /api/relation-types/[id] stores text verbatim (#150)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mocks.userProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mocks.relationTypeFindFirst.mockResolvedValue(STORED);
    mocks.relationTypeUpdate.mockResolvedValue(STORED);
    mocks.cacheInvalidate.mockResolvedValue(undefined);
  });

  it.each(verbatimCases("relation_types"))(
    "%s: %j reaches update unchanged",
    async (column, payload) => {
      const res = await put({ [column]: payload });

      expect(res.status).toBe(200);
      expect(mocks.relationTypeUpdate.mock.calls[0]![0].data[column]).toBe(payload);
    },
  );
});
