import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verbatimCases } from "@/test/verbatim-text";

// #150 T3 — user text reaches Prisma exactly as typed. The arguments of
// `prisma.relation.create` are asserted; nothing mocks a sanitiser.

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userProjectFindFirst: vi.fn(),
  relationTypeFindFirst: vi.fn(),
  relationCreate: vi.fn(),
  validateEntityExists: vi.fn(),
  cacheInvalidate: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  db: {},
  prisma: {
    relation: { create: mocks.relationCreate },
    relationType: { findFirst: mocks.relationTypeFindFirst },
    userProject: { findFirst: mocks.userProjectFindFirst },
  },
}));
vi.mock("@/lib/cache", () => ({ cache: { invalidateByPrefix: mocks.cacheInvalidate } }));
vi.mock("@/lib/activity", () => ({ logActivity: mocks.logActivity }));
vi.mock("@/lib/entity-validation", () => ({ validateEntityExists: mocks.validateEntityExists }));

const { POST } = await import("./route");

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/relations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: "proj-1",
        from_type: "PERSON",
        from_id: "person-1",
        to_type: "PERSON",
        to_id: "person-2",
        relation_type_id: "rt-1",
        ...body,
      }),
    }),
  );
}

describe("POST /api/relations stores text verbatim (#150)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mocks.userProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mocks.validateEntityExists.mockResolvedValue(true);
    mocks.relationTypeFindFirst.mockResolvedValue({
      id: "rt-1",
      valid_from_types: ["PERSON"],
      valid_to_types: ["PERSON"],
    });
    mocks.relationCreate.mockResolvedValue({
      id: "rel-new",
      relation_type: null,
      _count: { evidence: 0 },
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
    });
    mocks.cacheInvalidate.mockResolvedValue(undefined);
    mocks.logActivity.mockResolvedValue(undefined);
  });

  it.each(verbatimCases("relations"))(
    "%s: %j reaches create unchanged",
    async (column, payload) => {
      const res = await post({ [column]: payload });

      expect(res.status).toBe(201);
      expect(mocks.relationCreate.mock.calls[0]![0].data[column]).toBe(payload);
    },
  );
});
