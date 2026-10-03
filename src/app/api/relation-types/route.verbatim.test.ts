import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verbatimCases } from "@/test/verbatim-text";

// #150 T3 — user text reaches Prisma exactly as typed. The arguments of
// `prisma.relationType.create` are asserted; nothing mocks a sanitiser.

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userProjectFindFirst: vi.fn(),
  relationTypeCreate: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  prisma: {
    relationType: { create: mocks.relationTypeCreate },
    userProject: { findFirst: mocks.userProjectFindFirst },
  },
}));

const { POST } = await import("./route");

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/relation-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: "proj-1",
        name: "Basis",
        valid_from_types: ["PERSON"],
        valid_to_types: ["PERSON"],
        ...body,
      }),
    }),
  );
}

describe("POST /api/relation-types stores text verbatim (#150)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mocks.userProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mocks.relationTypeCreate.mockResolvedValue({
      id: "rt-new",
      valid_from_types: ["PERSON"],
      valid_to_types: ["PERSON"],
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it.each(verbatimCases("relation_types"))(
    "%s: %j reaches create unchanged",
    async (column, payload) => {
      const res = await post({ [column]: payload });

      expect(res.status).toBe(201);
      expect(mocks.relationTypeCreate.mock.calls[0]![0].data[column]).toBe(payload);
    },
  );
});
