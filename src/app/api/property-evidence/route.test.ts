import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockPropertyEvidenceFindMany = vi.fn();
const mockPropertyEvidenceCreate = vi.fn();
const mockSourceFindFirst = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockValidateEntityExists = vi.fn();
const mockLogActivity = vi.fn();
const mockSanitize = vi.fn((s: string) => s);

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    propertyEvidence: {
      findMany: mockPropertyEvidenceFindMany,
      create: mockPropertyEvidenceCreate,
    },
    source: { findFirst: mockSourceFindFirst },
    userProject: { findFirst: mockUserProjectFindFirst },
  },
}));

vi.mock("@/lib/entity-validation", () => ({
  validateEntityExists: mockValidateEntityExists,
}));

vi.mock("@/lib/activity", () => ({
  logActivity: mockLogActivity,
}));

vi.mock("@/lib/sanitize", () => ({
  sanitize: mockSanitize,
}));

const { GET, POST } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGetRequest(qs: string): NextRequest {
  return new NextRequest(`http://localhost/api/property-evidence${qs}`);
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/property-evidence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/property-evidence", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
    mockPropertyEvidenceFindMany.mockResolvedValue([]);
  });

  it("returns list of evidence", async () => {
    mockPropertyEvidenceFindMany.mockResolvedValue([
      {
        id: "pe-1",
        project_id: "proj-1",
        entity_type: "PERSON",
        entity_id: "person-1",
        property: "birth_year",
        source_id: "src-1",
        source: { id: "src-1", title: "KB", type: "archival_document" },
        notes: null,
        page_reference: null,
        quote: null,
        raw_transcription: null,
        confidence: "CERTAIN",
        created_at: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    const res = await GET(makeGetRequest("?projectId=proj-1"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string }[] };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.id).toBe("pe-1");
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUser.mockResolvedValue(null);
    const res = await GET(makeGetRequest("?projectId=proj-1"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when not a project member", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    const res = await GET(makeGetRequest("?projectId=proj-1"));
    expect(res.status).toBe(403);
  });
});

describe("POST /api/property-evidence", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "OWNER" });
    mockValidateEntityExists.mockResolvedValue(true);
    mockSourceFindFirst.mockResolvedValue({ id: "src-1" });
    mockLogActivity.mockResolvedValue(undefined);
    mockPropertyEvidenceCreate.mockResolvedValue({
      id: "pe-new",
      project_id: "proj-1",
      entity_type: "PERSON",
      entity_id: "person-1",
      property: "birth_year",
      source_id: "src-1",
      source: { id: "src-1", title: "KB", type: "archival_document" },
      notes: null,
      page_reference: null,
      quote: null,
      raw_transcription: null,
      confidence: "UNKNOWN",
      created_at: new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it("creates property evidence and returns 201", async () => {
    const res = await POST(
      makePostRequest({
        project_id: "proj-1",
        entity_type: "PERSON",
        entity_id: "person-1",
        property: "birth_year",
        source_id: "src-1",
      }),
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string };
    expect(body.id).toBe("pe-new");
    expect(mockLogActivity).toHaveBeenCalled();
  });

  it("returns 422 INVALID_PROPERTY for unknown property on PERSON", async () => {
    const res = await POST(
      makePostRequest({
        project_id: "proj-1",
        entity_type: "PERSON",
        entity_id: "person-1",
        property: "favorite_color",
        source_id: "src-1",
      }),
    );

    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: string; allowed: string[] };
    expect(body.error).toBe("INVALID_PROPERTY");
    expect(Array.isArray(body.allowed)).toBe(true);
  });

  it("returns 404 when entity does not exist", async () => {
    mockValidateEntityExists.mockResolvedValue(false);

    const res = await POST(
      makePostRequest({
        project_id: "proj-1",
        entity_type: "PERSON",
        entity_id: "bad-id",
        property: "birth_year",
        source_id: "src-1",
      }),
    );

    expect(res.status).toBe(404);
  });

  it("returns 403 when source does not belong to project", async () => {
    mockSourceFindFirst.mockResolvedValue(null);

    const res = await POST(
      makePostRequest({
        project_id: "proj-1",
        entity_type: "PERSON",
        entity_id: "person-1",
        property: "birth_year",
        source_id: "src-other",
      }),
    );

    expect(res.status).toBe(403);
  });

  it("returns 400 when required fields missing", async () => {
    const res = await POST(makePostRequest({ project_id: "proj-1" }));
    expect(res.status).toBe(400);
  });
});
