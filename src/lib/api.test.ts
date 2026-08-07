import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mockUserProjectFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    userProject: { findFirst: mockUserProjectFindFirst },
  },
}));

const {
  forbidden,
  json,
  jsonError,
  notFoundError,
  parseJsonBody,
  requireProjectMembership,
  unauthorized,
  validateBody,
} = await import("@/lib/api");

function makeRequest(body: string): Request {
  return new Request("http://localhost/api/x", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("json", () => {
  it("defaults to 200 and always sets Cache-Control: no-store", async () => {
    const res = json({ ok: true });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ ok: true });
  });

  it("honours an explicit status and merges extra headers", () => {
    const res = json({ id: "1" }, { status: 201, headers: { "X-Test": "yes" } });
    expect(res.status).toBe(201);
    expect(res.headers.get("X-Test")).toBe("yes");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("jsonError", () => {
  it("emits { error } with the given status", async () => {
    const res = jsonError(418, "TEAPOT");
    expect(res.status).toBe(418);
    expect(await res.json()).toEqual({ error: "TEAPOT" });
  });

  it("merges extra fields alongside error", async () => {
    const res = jsonError(409, "IN_USE", { count: 5 });
    expect(await res.json()).toEqual({ error: "IN_USE", count: 5 });
  });
});

describe("standard error shorthands", () => {
  it("unauthorized is 401 Unauthorized", async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("forbidden is 403 Forbidden", async () => {
    const res = forbidden();
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
  });

  it("notFoundError defaults to 404 Not found and accepts an override", async () => {
    expect(notFoundError().status).toBe(404);
    expect(await notFoundError().json()).toEqual({ error: "Not found" });
    expect(await notFoundError("ENTITY_NOT_FOUND").json()).toEqual({ error: "ENTITY_NOT_FOUND" });
  });
});

describe("parseJsonBody", () => {
  it("returns the parsed body on valid JSON", async () => {
    const result = await parseJsonBody(makeRequest('{"name":"Ada"}'));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ name: "Ada" });
  });

  it("returns a 400 Invalid JSON response on malformed JSON", async () => {
    const result = await parseJsonBody(makeRequest("{not json"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      expect(await result.response.json()).toEqual({ error: "Invalid JSON" });
    }
  });
});

describe("validateBody", () => {
  const schema = z.object({ name: z.string().min(1) });

  it("returns typed data when valid", () => {
    const result = validateBody(schema, { name: "Ada" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.name).toBe("Ada");
  });

  it("returns 400 with flattened details when invalid", async () => {
    const result = validateBody(schema, { name: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = (await result.response.json()) as { error: string; details: unknown };
      expect(body.error).toBe("Validation failed");
      expect(body.details).toBeDefined();
    }
  });
});

describe("requireProjectMembership", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns true when a membership row exists", async () => {
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
    await expect(requireProjectMembership("user-1", "proj-1")).resolves.toBe(true);
  });

  it("returns false when the user is not a member", async () => {
    mockUserProjectFindFirst.mockResolvedValue(null);
    await expect(requireProjectMembership("user-1", "proj-other")).resolves.toBe(false);
  });

  it("scopes by user and project", async () => {
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });
    await requireProjectMembership("user-1", "proj-1");
    expect(mockUserProjectFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ user_id: "user-1", project_id: "proj-1" }),
      }),
    );
  });

  it("filters by role only when roles are supplied", async () => {
    mockUserProjectFindFirst.mockResolvedValue({ id: "mem-1" });

    await requireProjectMembership("user-1", "proj-1");
    expect(mockUserProjectFindFirst.mock.calls[0]?.[0].where.role).toBeUndefined();

    await requireProjectMembership("user-1", "proj-1", ["OWNER", "EDITOR"]);
    expect(mockUserProjectFindFirst.mock.calls[1]?.[0].where.role).toEqual({
      in: ["OWNER", "EDITOR"],
    });
  });
});
