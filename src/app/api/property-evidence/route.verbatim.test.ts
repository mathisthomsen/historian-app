import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verbatimCases } from "@/test/verbatim-text";

// #150 T3 — user text reaches Prisma exactly as typed. The arguments of
// `prisma.propertyEvidence.create` are asserted; nothing mocks a sanitiser.

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userProjectFindFirst: vi.fn(),
  sourceFindFirst: vi.fn(),
  evidenceCreate: vi.fn(),
  validateEntityExists: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  prisma: {
    propertyEvidence: { create: mocks.evidenceCreate },
    source: { findFirst: mocks.sourceFindFirst },
    userProject: { findFirst: mocks.userProjectFindFirst },
  },
}));
vi.mock("@/lib/entity-validation", () => ({ validateEntityExists: mocks.validateEntityExists }));
vi.mock("@/lib/activity", () => ({ logActivity: mocks.logActivity }));

const { POST } = await import("./route");

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/property-evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: "proj-1",
        entity_type: "PERSON",
        entity_id: "person-1",
        property: "birth_place",
        source_id: "src-1",
        ...body,
      }),
    }),
  );
}

describe("POST /api/property-evidence stores text verbatim (#150)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mocks.userProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mocks.validateEntityExists.mockResolvedValue(true);
    mocks.sourceFindFirst.mockResolvedValue({ id: "src-1" });
    mocks.evidenceCreate.mockResolvedValue({
      id: "pe-new",
      confidence: "UNKNOWN",
      created_at: new Date("2026-01-01T00:00:00.000Z"),
    });
    mocks.logActivity.mockResolvedValue(undefined);
  });

  it.each(verbatimCases("property_evidence"))(
    "%s: %j reaches create unchanged",
    async (column, payload) => {
      const res = await post({ [column]: payload });

      expect(res.status).toBe(201);
      expect(mocks.evidenceCreate.mock.calls[0]![0].data[column]).toBe(payload);
    },
  );
});
