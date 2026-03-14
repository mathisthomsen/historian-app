import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockRelationFindFirstDb = vi.fn();
const mockRelationEvidenceFindMany = vi.fn();
const mockRelationEvidenceCreate = vi.fn();
const mockSourceFindFirst = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockSanitize = vi.fn((s: string) => s);

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  db: {
    relation: { findFirst: mockRelationFindFirstDb },
  },
  prisma: {
    relationEvidence: {
      findMany: mockRelationEvidenceFindMany,
      create: mockRelationEvidenceCreate,
    },
    source: { findFirst: mockSourceFindFirst },
    userProject: { findFirst: mockUserProjectFindFirst },
  },
}));

vi.mock("@/lib/sanitize", () => ({
  sanitize: mockSanitize,
}));

const { GET, POST } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ id: string }> };

function makeCtx(id: string): RouteContext {
  return { params: Promise.resolve({ id }) };
}

const baseRelation = { id: "rel-1", project_id: "proj-1" };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/relations/[id]/evidence", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
    mockRelationFindFirstDb.mockResolvedValue(baseRelation);
    mockRelationEvidenceFindMany.mockResolvedValue([]);
  });

  it("returns list of evidence", async () => {
    mockRelationEvidenceFindMany.mockResolvedValue([
      {
        id: "ev-1",
        relation_id: "rel-1",
        source_id: "src-1",
        source: { id: "src-1", title: "Kirchenbuch", type: "archival_document" },
        notes: null,
        page_reference: "S. 47",
        quote: null,
        confidence: "CERTAIN",
        created_at: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    const res = await GET(
      new NextRequest("http://localhost/api/relations/rel-1/evidence"),
      makeCtx("rel-1"),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string }[] };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.id).toBe("ev-1");
  });

  it("returns 404 when relation not found", async () => {
    mockRelationFindFirstDb.mockResolvedValue(null);
    const res = await GET(
      new NextRequest("http://localhost/api/relations/bad/evidence"),
      makeCtx("bad"),
    );
    expect(res.status).toBe(404);
  });
});

describe("POST /api/relations/[id]/evidence", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "OWNER" });
    mockRelationFindFirstDb.mockResolvedValue(baseRelation);
    mockSourceFindFirst.mockResolvedValue({ id: "src-1" });
    mockRelationEvidenceCreate.mockResolvedValue({
      id: "ev-new",
      relation_id: "rel-1",
      source_id: "src-1",
      source: { id: "src-1", title: "Test", type: "letter" },
      notes: null,
      page_reference: null,
      quote: null,
      confidence: "UNKNOWN",
      created_at: new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it("creates evidence and returns 201", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/relations/rel-1/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id: "src-1" }),
      }),
      makeCtx("rel-1"),
    );

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string };
    expect(body.id).toBe("ev-new");
  });

  it("returns 409 when unique constraint violated (P2002)", async () => {
    const p2002 = new Error("unique") as Error & { code: string };
    p2002.code = "P2002";
    mockRelationEvidenceCreate.mockRejectedValue(p2002);

    const res = await POST(
      new NextRequest("http://localhost/api/relations/rel-1/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id: "src-1" }),
      }),
      makeCtx("rel-1"),
    );

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("DUPLICATE_EVIDENCE");
  });

  it("returns 403 when source not in project", async () => {
    mockSourceFindFirst.mockResolvedValue(null);

    const res = await POST(
      new NextRequest("http://localhost/api/relations/rel-1/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id: "src-other" }),
      }),
      makeCtx("rel-1"),
    );

    expect(res.status).toBe(403);
  });

  it("returns 400 when source_id missing", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/relations/rel-1/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      makeCtx("rel-1"),
    );
    expect(res.status).toBe(400);
  });
});
