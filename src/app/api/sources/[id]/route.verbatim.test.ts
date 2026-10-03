import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verbatimCases } from "@/test/verbatim-text";

// #150 T3 — user text reaches Prisma exactly as typed (see the POST twin).

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userProjectFindFirst: vi.fn(),
  sourceFindFirst: vi.fn(),
  sourceUpdate: vi.fn(),
  cacheInvalidate: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  db: {},
  prisma: {
    source: { findFirst: mocks.sourceFindFirst, update: mocks.sourceUpdate },
    userProject: { findFirst: mocks.userProjectFindFirst },
  },
}));
vi.mock("@/lib/cache", () => ({ cache: { invalidateByPrefix: mocks.cacheInvalidate } }));
vi.mock("@/lib/activity", () => ({ logActivity: mocks.logActivity }));

const { PUT } = await import("./route");

const STORED = {
  id: "src-1",
  project_id: "proj-1",
  title: "Brief",
  type: "letter",
  reliability: "UNKNOWN",
  created_by_id: "user-1",
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  _count: { relation_evidence: 0, property_evidence: 0 },
};

function put(body: Record<string, unknown>) {
  return PUT(
    new NextRequest("http://localhost/api/sources/src-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "src-1" }) },
  );
}

describe("PUT /api/sources/[id] stores text verbatim (#150)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mocks.userProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mocks.sourceFindFirst.mockResolvedValue(STORED);
    mocks.sourceUpdate.mockResolvedValue(STORED);
    mocks.cacheInvalidate.mockResolvedValue(undefined);
    mocks.logActivity.mockResolvedValue(undefined);
  });

  it.each(verbatimCases("sources"))("%s: %j reaches update unchanged", async (column, payload) => {
    const res = await put({ [column]: payload });

    expect(res.status).toBe(200);
    expect(mocks.sourceUpdate.mock.calls[0]![0].data[column]).toBe(payload);
  });
});
