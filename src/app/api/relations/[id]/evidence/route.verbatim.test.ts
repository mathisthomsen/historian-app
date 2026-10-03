import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verbatimCases } from "@/test/verbatim-text";

// #150 T3 — user text reaches Prisma exactly as typed. The arguments of
// `prisma.relationEvidence.create` are asserted; nothing mocks a sanitiser.

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userProjectFindFirst: vi.fn(),
  relationFindFirst: vi.fn(),
  sourceFindFirst: vi.fn(),
  evidenceCreate: vi.fn(),
  cacheInvalidate: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  db: { relation: { findFirst: mocks.relationFindFirst } },
  prisma: {
    relationEvidence: { create: mocks.evidenceCreate },
    source: { findFirst: mocks.sourceFindFirst },
    userProject: { findFirst: mocks.userProjectFindFirst },
  },
}));
vi.mock("@/lib/cache", () => ({ cache: { invalidateByPrefix: mocks.cacheInvalidate } }));
vi.mock("@/lib/activity", () => ({ logActivity: mocks.logActivity }));

const { POST } = await import("./route");

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/relations/rel-1/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_id: "src-1", ...body }),
    }),
    { params: Promise.resolve({ id: "rel-1" }) },
  );
}

describe("POST /api/relations/[id]/evidence stores text verbatim (#150)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mocks.userProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mocks.relationFindFirst.mockResolvedValue({
      id: "rel-1",
      project_id: "proj-1",
      from_type: "PERSON",
      from_id: "person-1",
    });
    mocks.sourceFindFirst.mockResolvedValue({ id: "src-1" });
    mocks.evidenceCreate.mockResolvedValue({
      id: "ev-new",
      created_at: new Date("2026-01-01T00:00:00.000Z"),
    });
    mocks.cacheInvalidate.mockResolvedValue(undefined);
    mocks.logActivity.mockResolvedValue(undefined);
  });

  it.each(verbatimCases("relation_evidence"))(
    "%s: %j reaches create unchanged",
    async (column, payload) => {
      const res = await post({ [column]: payload });

      expect(res.status).toBe(201);
      expect(mocks.evidenceCreate.mock.calls[0]![0].data[column]).toBe(payload);
    },
  );
});
