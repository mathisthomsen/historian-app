import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODES } from "@/lib/api";
import type * as ExportModule from "@/lib/export/project-export";
import type { BuildExportResult, EvidoxaExport } from "@/lib/export/project-export";

/**
 * T4 of `docs/specs/pre-alpha-project-export/plan.md`. Prisma, the session and
 * the rate limiter are mocked; nothing here touches Redis or a database. What
 * a mock cannot show (real membership, REPEATABLE READ over the pooled Neon
 * URL, a real session) is measured by `e2e/export.spec.ts`.
 */

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  membershipFindFirst: vi.fn(),
  projectFindFirst: vi.fn(),
  transaction: vi.fn(),
  getLatestMigration: vi.fn(),
  rateCheck: vi.fn(),
  buildExport: vi.fn(),
  accessStillHolds: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db", () => ({
  prisma: {
    userProject: { findFirst: mocks.membershipFindFirst },
    project: { findFirst: mocks.projectFindFirst },
    $transaction: mocks.transaction,
  },
  getLatestMigration: mocks.getLatestMigration,
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimiter: { check: mocks.rateCheck } }));
vi.mock("@/lib/export/project-export", async (importOriginal) => ({
  ...(await importOriginal<typeof ExportModule>()),
  buildExport: mocks.buildExport,
  accessStillHolds: mocks.accessStillHolds,
}));

import { GET, maxDuration } from "./route";

const USER = { id: "user_A", email: "a@example.com", projectId: "proj_A" };
const PROJECT_ID = "proj_A";
const NOW = new Date("2026-10-05T10:00:00.000Z");
const TX = Symbol.for("the-callback-tx");

const EMPTY_TABLES = {
  persons: [],
  person_names: [],
  events: [],
  event_types: [],
  sources: [],
  locations: [],
  literature: [],
  relation_types: [],
  relations: [],
  relation_evidence: [],
  property_evidence: [],
  entity_activity: [],
};
const ZERO_COUNTS = Object.fromEntries(Object.keys(EMPTY_TABLES).map((k) => [k, 0]));

function documentFor(overrides: { name?: string; persons?: unknown[] } = {}): EvidoxaExport {
  const persons = overrides.persons ?? [];
  return {
    format: "evidoxa-project-export",
    format_version: 1,
    exported_at: NOW.toISOString(),
    app_version: "0.1.0",
    schema_migration: "20261001000000_example",
    project: {
      id: PROJECT_ID,
      name: overrides.name ?? "Mein Projekt",
      description: null,
      created_at: NOW,
      updated_at: NOW,
    },
    tables: { ...EMPTY_TABLES, persons } as unknown as EvidoxaExport["tables"],
    counts: { ...ZERO_COUNTS, persons: persons.length } as EvidoxaExport["counts"],
  };
}

function ok(document: EvidoxaExport = documentFor()): BuildExportResult {
  return { kind: "ok", document };
}

function call(id: string = PROJECT_ID): Promise<Response> {
  return GET(new Request(`http://localhost:3000/api/projects/${id}/export`) as never, {
    params: Promise.resolve({ id }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  mocks.requireUser.mockResolvedValue(USER);
  mocks.rateCheck.mockResolvedValue({
    allowed: true,
    remaining: 4,
    resetAt: new Date(NOW.getTime() + 600_000),
    degraded: false,
  });
  mocks.membershipFindFirst.mockResolvedValue({ id: "membership_1" });
  mocks.projectFindFirst.mockResolvedValue({ id: PROJECT_ID });
  mocks.getLatestMigration.mockResolvedValue("20261001000000_example");
  mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(TX));
  mocks.buildExport.mockResolvedValue(ok());
  mocks.accessStillHolds.mockResolvedValue(true);
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("GET /api/projects/[id]/export", () => {
  describe("authentication (P6)", () => {
    it("anonymous -> 401, and nothing else is consulted", async () => {
      mocks.requireUser.mockResolvedValue(null);
      const res = await call();
      expect(res.status).toBe(401);
      expect(((await res.json()) as { error: { code: string } }).error.code).toBe("UNAUTHORIZED");
      expect(mocks.rateCheck).not.toHaveBeenCalled();
      expect(mocks.membershipFindFirst).not.toHaveBeenCalled();
      expect(mocks.projectFindFirst).not.toHaveBeenCalled();
      expect(mocks.transaction).not.toHaveBeenCalled();
    });
  });

  describe("rate limit", () => {
    it("keys on export:{userId}, 5 per 10 minutes", async () => {
      await call();
      expect(mocks.rateCheck).toHaveBeenCalledTimes(1);
      expect(mocks.rateCheck).toHaveBeenCalledWith("export:user_A", 5, 600_000);
    });

    it("!allowed && !degraded -> 429, before any membership query or transaction", async () => {
      mocks.rateCheck.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(NOW.getTime() + 90_000),
        degraded: false,
      });
      const res = await call();
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe("90");
      expect(((await res.json()) as { error: { code: string } }).error.code).toBe("RATE_LIMITED");
      expect(mocks.membershipFindFirst).not.toHaveBeenCalled();
      expect(mocks.transaction).not.toHaveBeenCalled();
    });

    it("degraded limiter (D6) -> the export proceeds with 200 and one warning carrying ids", async () => {
      mocks.rateCheck.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(NOW.getTime() + 60_000),
        degraded: true,
      });
      const res = await call();
      expect(res.status).toBe(200);
      expect(mocks.transaction).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(expect.any(String), {
        userId: "user_A",
        projectId: PROJECT_ID,
      });
    });

    it("a healthy limiter logs no warning", async () => {
      await call();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe("uniform 404 (X3, P5)", () => {
    async function refusal(setup: () => void) {
      vi.clearAllMocks();
      mocks.requireUser.mockResolvedValue(USER);
      mocks.rateCheck.mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetAt: NOW,
        degraded: false,
      });
      setup();
      const res = await call("proj_victim");
      return { status: res.status, body: await res.text(), headers: [...res.headers] };
    }

    it("nonexistent, non-member and soft-deleted projects get byte-identical 404s", async () => {
      const nonexistent = await refusal(() => {
        mocks.membershipFindFirst.mockResolvedValue(null);
        mocks.projectFindFirst.mockResolvedValue(null);
      });
      const nonMember = await refusal(() => {
        mocks.membershipFindFirst.mockResolvedValue(null);
        mocks.projectFindFirst.mockResolvedValue({ id: "proj_victim" });
      });
      const softDeleted = await refusal(() => {
        mocks.membershipFindFirst.mockResolvedValue({ id: "m" });
        mocks.projectFindFirst.mockResolvedValue(null);
      });

      expect(nonexistent.status).toBe(404);
      expect(nonMember.status).toBe(404);
      expect(softDeleted.status).toBe(404);
      expect(nonMember.body).toBe(nonexistent.body);
      expect(softDeleted.body).toBe(nonexistent.body);
      expect(nonMember.headers).toEqual(nonexistent.headers);
      expect(softDeleted.headers).toEqual(nonexistent.headers);
      expect(JSON.parse(nonexistent.body)).toEqual({ error: { code: "NOT_FOUND" } });
      expect(nonexistent.body).not.toContain("proj_victim");
    });

    it("no transaction and no export read runs for any refusal", async () => {
      await refusal(() => {
        mocks.membershipFindFirst.mockResolvedValue(null);
        mocks.projectFindFirst.mockResolvedValue({ id: "proj_victim" });
      });
      expect(mocks.transaction).not.toHaveBeenCalled();
      expect(mocks.buildExport).not.toHaveBeenCalled();
    });

    it("a non-member's project row is never even read", async () => {
      await refusal(() => {
        mocks.membershipFindFirst.mockResolvedValue(null);
      });
      expect(mocks.projectFindFirst).not.toHaveBeenCalled();
    });

    it("checks membership for this user and this project, for any role, and excludes soft-deleted projects", async () => {
      await call("proj_X");
      expect(mocks.membershipFindFirst).toHaveBeenCalledTimes(1);
      const membershipWhere = mocks.membershipFindFirst.mock.calls[0]![0].where as Record<
        string,
        unknown
      >;
      expect(membershipWhere).toEqual({ user_id: "user_A", project_id: "proj_X" });
      expect(membershipWhere).not.toHaveProperty("role");
      expect(mocks.projectFindFirst.mock.calls[0]![0].where).toEqual({
        id: "proj_X",
        deleted_at: null,
      });
    });

    it("the project vanishing between the check and the read is the same 404", async () => {
      const first = await refusal(() => {
        mocks.membershipFindFirst.mockResolvedValue(null);
      });
      vi.clearAllMocks();
      mocks.requireUser.mockResolvedValue(USER);
      mocks.rateCheck.mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetAt: NOW,
        degraded: false,
      });
      mocks.membershipFindFirst.mockResolvedValue({ id: "m" });
      mocks.projectFindFirst.mockResolvedValue({ id: "proj_victim" });
      mocks.getLatestMigration.mockResolvedValue(null);
      mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(TX));
      mocks.buildExport.mockResolvedValue({ kind: "not_found" });
      const res = await call("proj_victim");
      expect(res.status).toBe(404);
      expect(await res.text()).toBe(first.body);
    });
  });

  describe("access rechecked inside the snapshot (#165 review)", () => {
    it("rechecks with the callback's tx, the caller and the project, before any export read", async () => {
      const ownTx = { name: "this-callbacks-tx" };
      mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
        cb(ownTx),
      );
      const order: string[] = [];
      mocks.accessStillHolds.mockImplementation(async () => {
        order.push("recheck");
        return true;
      });
      mocks.buildExport.mockImplementation(async () => {
        order.push("build");
        return ok();
      });

      await call("proj_X");

      expect(mocks.accessStillHolds).toHaveBeenCalledWith(ownTx, USER.id, "proj_X");
      expect(order).toEqual(["recheck", "build"]);
    });

    it("membership revoked or project deleted after the first check: the same 404, nothing read", async () => {
      mocks.membershipFindFirst.mockResolvedValueOnce(null);
      const refused = await call();
      const refusedBody = await refused.text();
      expect(refused.status).toBe(404);

      mocks.accessStillHolds.mockResolvedValue(false);
      const late = await call();

      expect(late.status).toBe(404);
      expect(await late.text()).toBe(refusedBody);
      expect(mocks.buildExport).not.toHaveBeenCalled();
    });
  });

  describe("the snapshot transaction (X4)", () => {
    it("is opened with REPEATABLE READ and a 20 s timeout, once", async () => {
      await call();
      expect(mocks.transaction).toHaveBeenCalledTimes(1);
      expect(mocks.transaction.mock.calls[0]![0]).toBeTypeOf("function");
      expect(mocks.transaction.mock.calls[0]![1]).toEqual({
        isolationLevel: "RepeatableRead",
        timeout: 20_000,
      });
    });

    it("calls buildExport inside the callback, with the callback's own tx", async () => {
      let open = false;
      const ownTx = { name: "this-callbacks-tx" };
      mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        open = true;
        try {
          return await cb(ownTx);
        } finally {
          open = false;
        }
      });
      const seen: { tx: unknown; open: boolean }[] = [];
      mocks.buildExport.mockImplementation(async (tx: unknown) => {
        seen.push({ tx, open });
        return ok();
      });

      await call();

      expect(seen).toHaveLength(1);
      expect(seen[0]!.tx).toBe(ownTx);
      expect(seen[0]!.open).toBe(true);
    });

    it("hands buildExport the project id from the URL and the export metadata", async () => {
      await call("proj_X");
      const [, projectId, meta] = mocks.buildExport.mock.calls[0]!;
      expect(projectId).toBe("proj_X");
      expect(meta).toEqual({
        exportedAt: NOW,
        appVersion: expect.stringMatching(/^\d+\.\d+\.\d+/),
        schemaMigration: "20261001000000_example",
      });
    });

    it("a failing migration lookup does not fail the export", async () => {
      mocks.getLatestMigration.mockRejectedValue(new Error("no _prisma_migrations"));
      const res = await call();
      expect(res.status).toBe(200);
      expect(mocks.buildExport.mock.calls[0]![2]).toMatchObject({ schemaMigration: null });
    });

    it("a transaction failure is a 5xx with no detail, never a 200", async () => {
      mocks.transaction.mockRejectedValue(new Error("secret connection string"));
      const res = await call();
      expect(res.status).toBeGreaterThanOrEqual(500);
      expect(await res.text()).not.toContain("secret");
    });
  });

  describe("size cap (D5)", () => {
    it("too_large -> 413 EXPORT_TOO_LARGE telling the researcher to contact the operator", async () => {
      mocks.buildExport.mockResolvedValue({ kind: "too_large", total: 100_001 });
      const res = await call();
      expect(res.status).toBe(413);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe("EXPORT_TOO_LARGE");
      expect(body.error.message).toMatch(/contact the operator/i);
      expect(res.headers.get("Content-Disposition")).toBeNull();
    });

    it("with the real buildExport, no findMany runs over the cap", async () => {
      const actual = await vi.importActual<typeof ExportModule>("@/lib/export/project-export");
      const findMany = vi.fn().mockResolvedValue([]);
      const delegate = { count: vi.fn().mockResolvedValue(50_000), findMany };
      const fakeTx = new Proxy(
        { project: { findUnique: vi.fn().mockResolvedValue({ id: PROJECT_ID }) } } as Record<
          string,
          unknown
        >,
        { get: (target, prop: string) => target[prop] ?? delegate },
      );
      mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
        cb(fakeTx),
      );
      mocks.buildExport.mockImplementation(actual.buildExport);

      const res = await call();

      expect(res.status).toBe(413);
      expect(findMany).not.toHaveBeenCalled();
    });
  });

  describe("response", () => {
    it("VIEWER (any role) -> 200 with the document as JSON", async () => {
      const doc = documentFor({ persons: [{ id: "p1", first_name: "Ada" }] });
      mocks.buildExport.mockResolvedValue(ok(doc));
      const res = await call();
      expect(res.status).toBe(200);
      const parsed = (await res.json()) as EvidoxaExport;
      expect(parsed.format).toBe("evidoxa-project-export");
      expect(parsed.tables.persons).toEqual([{ id: "p1", first_name: "Ada" }]);
      expect(parsed.counts.persons).toBe(1);
    });

    it("carries exactly the four headers of spec §3 step 5", async () => {
      const res = await call();
      expect(Object.fromEntries(res.headers)).toEqual({
        "content-type": "application/json; charset=utf-8",
        "content-disposition": 'attachment; filename="evidoxa-export-mein-projekt-2026-10-05.json"',
        "cache-control": "no-store",
        "content-length": expect.stringMatching(/^\d+$/),
      });
    });

    it("falls back to the slug 'projekt' for a name with no ASCII letters", async () => {
      mocks.buildExport.mockResolvedValue(ok(documentFor({ name: "日本語の研究" })));
      const res = await call();
      expect(res.headers.get("Content-Disposition")).toBe(
        'attachment; filename="evidoxa-export-projekt-2026-10-05.json"',
      );
    });

    it("cannot be header-injected through the project name", async () => {
      mocks.buildExport.mockResolvedValue(ok(documentFor({ name: 'x"\r\nSet-Cookie: a=b' })));
      const res = await call();
      expect(res.headers.get("Set-Cookie")).toBeNull();
      expect(res.headers.get("Content-Disposition")).toMatch(
        /^attachment; filename="evidoxa-export-[a-z0-9-]+-2026-10-05\.json"$/,
      );
    });

    it("Content-Length equals the body's byte length, for multi-byte text too", async () => {
      mocks.buildExport.mockResolvedValue(
        ok(documentFor({ persons: [{ id: "p1", first_name: "Müller ß 日本語 😀" }] })),
      );
      const res = await call();
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect(Number(res.headers.get("Content-Length"))).toBe(bytes.byteLength);
      expect(bytes.byteLength).toBeGreaterThan(JSON.stringify(documentFor()).length);
      expect((JSON.parse(new TextDecoder().decode(bytes)) as EvidoxaExport).tables.persons).toEqual(
        [{ id: "p1", first_name: "Müller ß 日本語 😀" }],
      );
    });

    it("streams a body larger than one chunk intact", async () => {
      const persons = Array.from({ length: 3000 }, (_, i) => ({
        id: `p${i}`,
        notes: "x".repeat(100),
      }));
      mocks.buildExport.mockResolvedValue(ok(documentFor({ persons })));
      const res = await call();
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect(bytes.byteLength).toBeGreaterThan(300_000);
      expect(Number(res.headers.get("Content-Length"))).toBe(bytes.byteLength);
      expect(
        (JSON.parse(new TextDecoder().decode(bytes)) as EvidoxaExport).tables.persons,
      ).toHaveLength(3000);
    });

    it("keeps `& < > \" '` exactly as stored in the body (#150)", async () => {
      const stored = `Müller & Söhne <b>"x"</b> 'y' 1848 < 1850`;
      mocks.buildExport.mockResolvedValue(
        ok(documentFor({ persons: [{ id: "p1", first_name: stored }] })),
      );
      const text = await (await call()).text();
      expect(text).toContain(JSON.stringify(stored));
      expect(text).not.toMatch(/&amp;|&lt;|&gt;|&quot;|&#/);
    });

    it("a serialisation failure is a 5xx, never a 200 (D7)", async () => {
      // BigInt is the one scalar JSON.stringify throws on.
      mocks.buildExport.mockResolvedValue(
        ok(documentFor({ persons: [{ id: "p1", broken: BigInt(1) }] })),
      );
      const res = await call();
      expect(res.status).toBeGreaterThanOrEqual(500);
      expect(res.status).not.toBe(200);
      expect(res.headers.get("Content-Disposition")).toBeNull();
      expect(await res.text()).not.toContain("tables");
    });

    it("a toJSON that throws mid-document is also a 5xx", async () => {
      const poisoned = {
        id: "p1",
        toJSON() {
          throw new Error("boom");
        },
      };
      mocks.buildExport.mockResolvedValue(ok(documentFor({ persons: [poisoned] })));
      const res = await call();
      expect(res.status).toBeGreaterThanOrEqual(500);
    });
  });

  describe("logging (spec §3 step 6)", () => {
    it("logs ids and counts only, never content", async () => {
      const doc = documentFor({
        name: "Geheimprojekt",
        persons: [{ id: "p1", first_name: "Ada", notes: "private note" }],
      });
      mocks.buildExport.mockResolvedValue(ok(doc));
      await call();

      expect(console.info).toHaveBeenCalledTimes(1);
      const args = vi.mocked(console.info).mock.calls[0]!;
      expect(args[0]).toBe("[export]");
      expect(args[1]).toEqual({
        userId: "user_A",
        projectId: PROJECT_ID,
        rows: doc.counts,
      });
      const logged = JSON.stringify(vi.mocked(console.info).mock.calls);
      for (const secret of ["Geheimprojekt", "Ada", "private note", "a@example.com"]) {
        expect(logged).not.toContain(secret);
      }
    });

    it("failure logs carry no content either", async () => {
      mocks.transaction.mockRejectedValue(new Error("Geheimprojekt private note"));
      await call();
      const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
      expect(logged).not.toContain("Geheimprojekt");
      expect(logged).not.toContain("private note");
    });
  });

  describe("route config and error code", () => {
    it("allows 60 s", () => {
      expect(maxDuration).toBe(60);
    });

    it("EXPORT_TOO_LARGE is a registered error code", () => {
      expect(ERROR_CODES).toContain("EXPORT_TOO_LARGE");
    });
  });
});
