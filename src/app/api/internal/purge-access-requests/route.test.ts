import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ purgeExpired: vi.fn() }));

vi.mock("@/lib/access-retention", () => ({ purgeExpired: mocks.purgeExpired }));

const { GET, POST } = await import("./route");

const SECRET = "s".repeat(32);
const URL = "http://localhost:3000/api/internal/purge-access-requests";

function request(authorization?: string): Request {
  return new Request(URL, {
    method: "POST",
    ...(authorization === undefined ? {} : { headers: { authorization } }),
  });
}

describe("POST /api/internal/purge-access-requests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("PURGE_SECRET", SECRET);
    mocks.purgeExpired.mockResolvedValue({ pending: 0, declined: 0, invited: 0, invites: 0 });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("authentication (I10)", () => {
    it("rejects a missing Authorization header with 401 and does not purge", async () => {
      const res = await POST(request());
      expect(res.status).toBe(401);
      expect(mocks.purgeExpired).not.toHaveBeenCalled();
    });

    it("rejects a wrong secret of the same length", async () => {
      const res = await POST(request(`Bearer ${"x".repeat(SECRET.length)}`));
      expect(res.status).toBe(401);
      expect(mocks.purgeExpired).not.toHaveBeenCalled();
    });

    it("rejects a wrong secret of a different length with 401, not 500", async () => {
      for (const wrong of ["short", `${SECRET}extra`, "x".repeat(500)]) {
        const res = await POST(request(`Bearer ${wrong}`));
        expect(res.status).toBe(401);
      }
      expect(mocks.purgeExpired).not.toHaveBeenCalled();
    });

    it("rejects a header that is not a Bearer credential", async () => {
      for (const header of [SECRET, `Basic ${SECRET}`, "bearer", ""]) {
        const res = await POST(request(header));
        expect(res.status).toBe(401);
      }
      expect(mocks.purgeExpired).not.toHaveBeenCalled();
    });

    it("never matches when the configured secret is unset", async () => {
      delete process.env["PURGE_SECRET"];
      for (const header of [undefined, "Bearer ", "Bearer", "Bearer undefined", ""]) {
        const res = await POST(request(header));
        expect(res.status).toBe(401);
      }
      expect(mocks.purgeExpired).not.toHaveBeenCalled();
    });

    it("never matches when the configured secret is empty", async () => {
      vi.stubEnv("PURGE_SECRET", "");
      for (const header of [undefined, "Bearer ", "Bearer"]) {
        const res = await POST(request(header));
        expect(res.status).toBe(401);
      }
      expect(mocks.purgeExpired).not.toHaveBeenCalled();
    });

    it("gives no detail in the 401 body", async () => {
      const res = await POST(request("Bearer nope"));
      expect(await res.text()).toBe("");
    });
  });

  describe("purge", () => {
    it("purges and responds with counts only", async () => {
      mocks.purgeExpired.mockResolvedValueOnce({
        pending: 3,
        declined: 2,
        invited: 1,
        invites: 4,
      });
      const res = await POST(request(`Bearer ${SECRET}`));
      expect(res.status).toBe(200);
      expect(mocks.purgeExpired).toHaveBeenCalledTimes(1);
      expect(await res.json()).toEqual({
        deleted: { pending: 3, declined: 2, invited: 1, invites: 4 },
      });
    });

    it("is idempotent: a second call deletes nothing and still returns 200", async () => {
      mocks.purgeExpired
        .mockResolvedValueOnce({ pending: 3, declined: 0, invited: 0, invites: 0 })
        .mockResolvedValueOnce({ pending: 0, declined: 0, invited: 0, invites: 0 });
      await POST(request(`Bearer ${SECRET}`));
      const res = await POST(request(`Bearer ${SECRET}`));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        deleted: { pending: 0, declined: 0, invited: 0, invites: 0 },
      });
    });

    it("answers 500 with no detail when the purge throws, so the workflow fails loudly", async () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      mocks.purgeExpired.mockRejectedValueOnce(new Error("secret@example.com leaked in message"));
      const res = await POST(request(`Bearer ${SECRET}`));
      expect(res.status).toBe(500);
      expect(await res.text()).toBe("");
      expect(JSON.stringify(spy.mock.calls)).not.toContain("secret@example.com");
      spy.mockRestore();
    });
  });

  describe("methods", () => {
    it("answers GET with 405 and an Allow header, without purging", async () => {
      const res = await GET();
      expect(res.status).toBe(405);
      expect(res.headers.get("allow")).toBe("POST");
      expect(mocks.purgeExpired).not.toHaveBeenCalled();
    });
  });
});
