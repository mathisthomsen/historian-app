import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verbatimCases } from "@/test/verbatim-text";

// #150 T3 — user text reaches Prisma exactly as typed. The arguments of
// `prisma.source.create` are asserted; nothing mocks a sanitiser.

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userProjectFindFirst: vi.fn(),
  sourceCreate: vi.fn(),
  cacheInvalidate: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  db: {},
  prisma: {
    source: { create: mocks.sourceCreate },
    userProject: { findFirst: mocks.userProjectFindFirst },
  },
}));
vi.mock("@/lib/cache", () => ({ cache: { invalidateByPrefix: mocks.cacheInvalidate } }));

const { POST } = await import("./route");

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: "proj-1", title: "Basis", type: "letter", ...body }),
    }),
  );
}

describe("POST /api/sources stores text verbatim (#150)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mocks.userProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mocks.cacheInvalidate.mockResolvedValue(undefined);
    mocks.sourceCreate.mockResolvedValue({
      id: "src-new",
      reliability: "UNKNOWN",
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
      _count: { relation_evidence: 0, property_evidence: 0 },
    });
  });

  it.each(verbatimCases("sources"))("%s: %j reaches create unchanged", async (column, payload) => {
    const res = await post({ [column]: payload });

    expect(res.status).toBe(201);
    expect(mocks.sourceCreate.mock.calls[0]![0].data[column]).toBe(payload);
  });
});
