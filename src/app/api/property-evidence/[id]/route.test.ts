import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRequireUser = vi.fn();
const mockPropertyEvidenceFindFirst = vi.fn();
const mockPropertyEvidenceDelete = vi.fn();
const mockUserProjectFindFirst = vi.fn();
const mockLogActivity = vi.fn();

vi.mock("@/lib/auth-guard", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    propertyEvidence: {
      findFirst: mockPropertyEvidenceFindFirst,
      delete: mockPropertyEvidenceDelete,
    },
    userProject: { findFirst: mockUserProjectFindFirst },
  },
}));

vi.mock("@/lib/activity", () => ({
  logActivity: mockLogActivity,
}));

const { DELETE } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ id: string }> };

function makeCtx(id: string): RouteContext {
  return { params: Promise.resolve({ id }) };
}

const baseRecord = {
  id: "pe-1",
  project_id: "proj-1",
  entity_type: "PERSON",
  entity_id: "person-1",
  property: "birth_year",
  source_id: "src-1",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DELETE /api/property-evidence/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1", projectId: "proj-1" });
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1", role: "OWNER" });
    mockPropertyEvidenceFindFirst.mockResolvedValue(baseRecord);
    mockPropertyEvidenceDelete.mockResolvedValue(baseRecord);
    mockLogActivity.mockResolvedValue(undefined);
  });

  it("hard-deletes the evidence and returns { deleted: true }", async () => {
    const res = await DELETE(
      new NextRequest("http://localhost/api/property-evidence/pe-1", { method: "DELETE" }),
      makeCtx("pe-1"),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: boolean };
    expect(body.deleted).toBe(true);
    expect(mockPropertyEvidenceDelete).toHaveBeenCalledWith({ where: { id: "pe-1" } });
    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "DELETE", field_path: "birth_year" }),
    );
  });

  it("returns 404 when not found", async () => {
    mockPropertyEvidenceFindFirst.mockResolvedValue(null);
    const res = await DELETE(
      new NextRequest("http://localhost/api/property-evidence/bad", { method: "DELETE" }),
      makeCtx("bad"),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when not OWNER/EDITOR", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    const res = await DELETE(
      new NextRequest("http://localhost/api/property-evidence/pe-1", { method: "DELETE" }),
      makeCtx("pe-1"),
    );
    expect(res.status).toBe(403);
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUser.mockResolvedValue(null);
    const res = await DELETE(
      new NextRequest("http://localhost/api/property-evidence/pe-1", { method: "DELETE" }),
      makeCtx("pe-1"),
    );
    expect(res.status).toBe(401);
  });
});
