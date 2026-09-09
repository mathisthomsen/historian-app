import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockPersonFindFirst = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockPersonUpdate = vi.fn();
const mockPersonNameFindMany = vi.fn();
const mockCacheInvalidate = vi.fn();
const mockSanitize = vi.fn((s: string) => s);
const mockLogActivity = vi.fn();

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  db: {},
  prisma: {
    person: {
      findFirst: mockPersonFindFirst,
      update: mockPersonUpdate,
    },
    personName: {
      findMany: mockPersonNameFindMany,
    },
    userProject: {
      findFirst: mockUserProjectFindFirst,
    },
  },
}));

vi.mock("@/lib/cache", () => ({
  cache: {
    invalidateByPrefix: mockCacheInvalidate,
  },
}));

vi.mock("@/lib/sanitize", () => ({
  sanitize: mockSanitize,
}));

vi.mock("@/lib/activity", () => ({
  logActivity: mockLogActivity,
}));

// Import AFTER mocks are registered
const { PUT } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  url: string,
  options?: ConstructorParameters<typeof NextRequest>[1],
): NextRequest {
  return new NextRequest(url, options as ConstructorParameters<typeof NextRequest>[1]);
}

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeExistingPerson(overrides?: object) {
  return {
    id: "person-1",
    project_id: "proj-1",
    first_name: "Otto",
    last_name: "Bismarck",
    birth_year: null,
    birth_month: null,
    birth_day: null,
    birth_date_certainty: "UNKNOWN",
    birth_place: null,
    birth_place_certainty: "UNKNOWN",
    death_year: null,
    death_month: null,
    death_day: null,
    death_date_certainty: "UNKNOWN",
    death_place: null,
    death_place_certainty: "UNKNOWN",
    notes: null,
    created_by_id: "user-1",
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("PUT /api/persons/[id] — place certainty round-trip (issue #78)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "EDITOR" });
    mockCacheInvalidate.mockResolvedValue(undefined);
    mockPersonNameFindMany.mockResolvedValue([]);
    mockLogActivity.mockResolvedValue(undefined);
  });

  it("writes birth_place_certainty and death_place_certainty to the DB and returns them", async () => {
    const existing = makeExistingPerson();
    mockPersonFindFirst.mockResolvedValue(existing);
    mockPersonUpdate.mockResolvedValue(
      makeExistingPerson({
        birth_place: "London",
        birth_place_certainty: "CERTAIN",
        death_place: "Paris",
        death_place_certainty: "PROBABLE",
      }),
    );

    const req = makeRequest("http://localhost/api/persons/person-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        birth_place: "London",
        birth_place_certainty: "CERTAIN",
        death_place: "Paris",
        death_place_certainty: "PROBABLE",
      }),
    });

    const res = await PUT(req, makeContext("person-1"));

    expect(res.status).toBe(200);
    expect(mockPersonUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          birth_place_certainty: "CERTAIN",
          death_place_certainty: "PROBABLE",
        }),
      }),
    );
    const body = (await res.json()) as {
      birth_place_certainty: string;
      death_place_certainty: string;
    };
    expect(body.birth_place_certainty).toBe("CERTAIN");
    expect(body.death_place_certainty).toBe("PROBABLE");
  });

  it("logs an activity entry when birth_place_certainty changes", async () => {
    const existing = makeExistingPerson({ birth_place_certainty: "UNKNOWN" });
    mockPersonFindFirst.mockResolvedValue(existing);
    mockPersonUpdate.mockResolvedValue(makeExistingPerson({ birth_place_certainty: "CERTAIN" }));

    const req = makeRequest("http://localhost/api/persons/person-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birth_place_certainty: "CERTAIN" }),
    });

    await PUT(req, makeContext("person-1"));

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        field_path: "birth_place_certainty",
        old_value: "UNKNOWN",
        new_value: "CERTAIN",
      }),
    );
  });
});
