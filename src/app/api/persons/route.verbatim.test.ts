import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VERBATIM_PAYLOADS, verbatimCases } from "@/test/verbatim-text";

// #150 T3 — user text reaches Prisma exactly as typed. Prisma, the cache and
// auth are mocked; nothing mocks a sanitiser (there is none), and the
// arguments of `prisma.person.create` are what is asserted.

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userProjectFindFirst: vi.fn(),
  personCreate: vi.fn(),
  cacheInvalidate: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  db: {},
  prisma: {
    person: { create: mocks.personCreate },
    userProject: { findFirst: mocks.userProjectFindFirst },
  },
}));
vi.mock("@/lib/cache", () => ({ cache: { invalidateByPrefix: mocks.cacheInvalidate } }));

const { POST } = await import("./route");

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: "proj-1", last_name: "Basis", ...body }),
    }),
  );
}

describe("POST /api/persons stores text verbatim (#150)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mocks.cacheInvalidate.mockResolvedValue(undefined);
    mocks.userProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mocks.personCreate.mockResolvedValue({
      id: "person-new",
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
      names: [],
    });
  });

  it.each(verbatimCases("persons"))("%s: %j reaches create unchanged", async (column, payload) => {
    const res = await post({ [column]: payload });

    expect(res.status).toBe(201);
    expect(mocks.personCreate.mock.calls[0]![0].data[column]).toBe(payload);
  });

  it.each(VERBATIM_PAYLOADS)("person_names.name: %j reaches create unchanged", async (payload) => {
    await post({ names: [{ name: payload }] });

    expect(mocks.personCreate.mock.calls[0]![0].data.names.create[0].name).toBe(payload);
  });

  it("keeps a place that holds only markup, and the certainty that qualifies it", async () => {
    // The old path stripped `<b></b>` to "" and forced the certainty to UNKNOWN.
    // Stored verbatim the place is a real value, so its certainty is kept.
    await post({ birth_place: "<b></b>", birth_place_certainty: "CERTAIN" });

    const data = mocks.personCreate.mock.calls[0]![0].data;
    expect(data.birth_place).toBe("<b></b>");
    expect(data.birth_place_certainty).toBe("CERTAIN");
  });
});
