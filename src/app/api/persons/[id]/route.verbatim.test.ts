import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VERBATIM_PAYLOADS, verbatimCases } from "@/test/verbatim-text";

// #150 T3 — user text reaches Prisma exactly as typed (see the POST twin).

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  userProjectFindFirst: vi.fn(),
  personFindFirst: vi.fn(),
  personUpdate: vi.fn(),
  personNameFindMany: vi.fn(),
  personNameDeleteMany: vi.fn(),
  personNameCreateMany: vi.fn(),
  transaction: vi.fn(),
  cacheInvalidate: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  db: {},
  prisma: {
    person: { findFirst: mocks.personFindFirst, update: mocks.personUpdate },
    personName: {
      findMany: mocks.personNameFindMany,
      deleteMany: mocks.personNameDeleteMany,
      createMany: mocks.personNameCreateMany,
    },
    userProject: { findFirst: mocks.userProjectFindFirst },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/cache", () => ({ cache: { invalidateByPrefix: mocks.cacheInvalidate } }));
vi.mock("@/lib/activity", () => ({ logActivity: mocks.logActivity }));

const { PUT } = await import("./route");

const STORED = {
  id: "person-1",
  project_id: "proj-1",
  first_name: "Otto",
  last_name: "Bismarck",
  birth_place: null,
  birth_place_certainty: "UNKNOWN",
  death_place: null,
  death_place_certainty: "UNKNOWN",
  notes: null,
  created_by_id: "user-1",
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
};

function put(body: Record<string, unknown>) {
  return PUT(
    new NextRequest("http://localhost/api/persons/person-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "person-1" }) },
  );
}

describe("PUT /api/persons/[id] stores text verbatim (#150)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mocks.userProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mocks.personFindFirst.mockResolvedValue(STORED);
    mocks.personUpdate.mockResolvedValue(STORED);
    mocks.personNameFindMany.mockResolvedValue([]);
    mocks.personNameDeleteMany.mockReturnValue("deleteMany");
    mocks.personNameCreateMany.mockReturnValue("createMany");
    mocks.transaction.mockResolvedValue([STORED]);
    mocks.cacheInvalidate.mockResolvedValue(undefined);
    mocks.logActivity.mockResolvedValue(undefined);
  });

  it.each(verbatimCases("persons"))("%s: %j reaches update unchanged", async (column, payload) => {
    const res = await put({ [column]: payload });

    expect(res.status).toBe(200);
    expect(mocks.personUpdate.mock.calls[0]![0].data[column]).toBe(payload);
  });

  it.each(VERBATIM_PAYLOADS)(
    "person_names.name: %j reaches createMany unchanged",
    async (payload) => {
      const res = await put({ names: [{ name: payload }] });

      expect(res.status).toBe(200);
      expect(mocks.personNameCreateMany.mock.calls[0]![0].data[0].name).toBe(payload);
    },
  );

  it("keeps a place that holds only markup, and the certainty that qualifies it", async () => {
    await put({ birth_place: "<b></b>", birth_place_certainty: "CERTAIN" });

    const data = mocks.personUpdate.mock.calls[0]![0].data;
    expect(data.birth_place).toBe("<b></b>");
    expect(data.birth_place_certainty).toBe("CERTAIN");
  });
});
