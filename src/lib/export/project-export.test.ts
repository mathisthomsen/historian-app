import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  accessStillHolds,
  EXPORT_ROW_CAP,
  EXPORT_TABLES,
  buildExport,
  exportFilename,
  serializeExport,
  slugifyProjectName,
  type ExportMeta,
} from "./project-export";

/**
 * T3 of `docs/specs/pre-alpha-project-export/plan.md`. The risk this file
 * guards is one route returning every row of a project: a missed `where`
 * leaks a tenant, a missed model silently loses data. Prisma is a recording
 * mock, so what is asserted is the arguments each query receives.
 */

const PROJECT_ID = "proj_A";
const META: ExportMeta = {
  exportedAt: new Date("2026-10-05T10:00:00.000Z"),
  appVersion: "0.1.0",
  schemaMigration: "20261001000000_example",
};

type Call = { table: string; op: "count" | "findMany"; args: Record<string, unknown> };

/** A transaction client whose every delegate records its calls. `user*` is a trap. */
function makeTx(opts: { counts?: Record<string, number>; rows?: Record<string, unknown[]> } = {}) {
  const calls: Call[] = [];
  const project = {
    id: PROJECT_ID,
    name: "Alpha",
    description: null,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-02T00:00:00.000Z"),
  };
  const delegates: Record<string, unknown> = {};
  for (const t of EXPORT_TABLES) {
    delegates[t.delegate] = {
      count: vi.fn(async (args: Record<string, unknown>) => {
        calls.push({ table: t.key, op: "count", args });
        return opts.counts?.[t.key] ?? opts.rows?.[t.key]?.length ?? 0;
      }),
      findMany: vi.fn(async (args: Record<string, unknown>) => {
        calls.push({ table: t.key, op: "findMany", args });
        return opts.rows?.[t.key] ?? [];
      }),
    };
  }
  const projectCalls: Record<string, unknown>[] = [];
  delegates.project = {
    findUnique: vi.fn(async (args: Record<string, unknown>) => {
      projectCalls.push(args);
      return project;
    }),
  };
  const tx = new Proxy(delegates, {
    get(target, prop) {
      if (typeof prop === "string" && /^user/i.test(prop)) {
        throw new Error(`export touched tx.${prop}`);
      }
      return target[prop as string];
    },
  }) as unknown as Prisma.TransactionClient;
  return { tx, calls, projectCalls };
}

type DmmfModel = (typeof Prisma.dmmf.datamodel.models)[number];

/** The spec §5 predicate, verbatim: models owned by a project directly or via one parent. */
function projectOwned(models: readonly DmmfModel[]): DmmfModel[] {
  return models.filter(
    (m) =>
      m.fields.some((f) => f.name === "project_id") ||
      m.fields.some(
        (f) =>
          f.relationFromFields?.length &&
          models.find((p) => p.name === f.type)?.fields.some((pf) => pf.name === "project_id"),
      ),
  );
}

const EXCLUDED: Record<string, string> = { UserProject: "membership, not research data" };

function missingFromExport(models: readonly DmmfModel[]): string[] {
  const exported = EXPORT_TABLES.map((t) => t.model as string);
  return projectOwned(models)
    .map((m) => m.name)
    .filter((n) => !(n in EXCLUDED) && !exported.includes(n));
}

describe("spec §5 completeness guard (generated Prisma.dmmf)", () => {
  const models = Prisma.dmmf.datamodel.models;

  it("exports every model that belongs to a project", () => {
    expect(missingFromExport(models)).toEqual([]);
  });

  it("selects exactly the twelve exported tables plus UserProject (P2)", () => {
    const owned = projectOwned(models)
      .map((m) => m.name)
      .sort();
    const expected = [...EXPORT_TABLES.map((t) => t.model as string), "UserProject"].sort();
    expect(EXPORT_TABLES).toHaveLength(12);
    expect(owned).toEqual(expected);
  });

  it("does not select the unscoped owner-run backfill tables, where they still exist (#158)", () => {
    const owned = projectOwned(models).map((m) => m.name);
    for (const name of ["DataBackfill", "Backfill150Original"]) {
      const model = models.find((m) => m.name === name);
      if (!model) continue; // dropped by #161
      expect(model.fields.some((f) => f.name === "project_id")).toBe(false);
      expect(owned).not.toContain(name);
    }
  });

  it("fails when a project-scoped model is added without exporting it", () => {
    const dummy = {
      name: "DummyProjectScoped",
      fields: [{ name: "project_id", type: "String", relationFromFields: [] }],
    } as unknown as DmmfModel;
    expect(missingFromExport([...models, dummy])).toEqual(["DummyProjectScoped"]);
  });

  it("fails when a child of a project-owned model is added without exporting it", () => {
    const child = {
      name: "DummyChild",
      fields: [{ name: "person_id", type: "Person", relationFromFields: ["person_id"] }],
    } as unknown as DmmfModel;
    expect(missingFromExport([...models, child])).toEqual(["DummyChild"]);
  });

  it("every exported table is a real model with id and created_at, and its delegate matches", () => {
    for (const t of EXPORT_TABLES) {
      const model = models.find((m) => m.name === t.model);
      expect(model, t.model).toBeDefined();
      const fields = model!.fields.map((f) => f.name);
      expect(fields, t.model).toContain("id");
      expect(fields, t.model).toContain("created_at");
      expect(t.delegate).toBe(t.model[0]!.toLowerCase() + t.model.slice(1));
    }
  });
});

describe("buildExport queries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("scopes every findMany to the project, children through their parent", async () => {
    const { tx, calls } = makeTx();
    await buildExport(tx, PROJECT_ID, META);

    const finds = calls.filter((c) => c.op === "findMany");
    expect(finds.map((c) => c.table).sort()).toEqual(EXPORT_TABLES.map((t) => t.key).sort());
    for (const c of finds) {
      if (c.table === "person_names") {
        expect(c.args.where).toEqual({ person: { project_id: PROJECT_ID } });
      } else if (c.table === "relation_evidence") {
        expect(c.args.where).toEqual({ relation: { project_id: PROJECT_ID } });
      } else {
        expect(c.args.where, c.table).toEqual({ project_id: PROJECT_ID });
      }
    }
  });

  it("orders every findMany by created_at, id", async () => {
    const { tx, calls } = makeTx();
    await buildExport(tx, PROJECT_ID, META);
    const finds = calls.filter((c) => c.op === "findMany");
    expect(finds).toHaveLength(12);
    for (const c of finds) {
      expect(c.args.orderBy, c.table).toEqual([{ created_at: "asc" }, { id: "asc" }]);
    }
  });

  it("2b: every count carries the same scope as its findMany", async () => {
    const { tx, calls } = makeTx();
    await buildExport(tx, PROJECT_ID, META);
    const counts = calls.filter((c) => c.op === "count");
    expect(counts.map((c) => c.table).sort()).toEqual(EXPORT_TABLES.map((t) => t.key).sort());
    for (const c of counts) {
      const find = calls.find((f) => f.op === "findMany" && f.table === c.table)!;
      expect(c.args.where, c.table).toEqual(find.args.where);
      expect(c.args.where, c.table).toBeDefined();
    }
  });

  it("2b: a child-table count cannot sum another tenant's rows", async () => {
    const { tx, calls } = makeTx();
    await buildExport(tx, PROJECT_ID, META);
    const count = (table: string) => calls.find((c) => c.op === "count" && c.table === table)!;
    expect(count("person_names").args.where).toEqual({ person: { project_id: PROJECT_ID } });
    expect(count("relation_evidence").args.where).toEqual({
      relation: { project_id: PROJECT_ID },
    });
  });

  it("counts every table before reading any", async () => {
    const { tx, calls } = makeTx();
    await buildExport(tx, PROJECT_ID, META);
    const firstFind = calls.findIndex((c) => c.op === "findMany");
    const lastCount = calls.map((c) => c.op).lastIndexOf("count");
    expect(lastCount).toBeLessThan(firstFind);
  });

  it("3: over the cap returns too_large and calls no findMany", async () => {
    const { tx, calls } = makeTx({ counts: { persons: EXPORT_ROW_CAP, events: 1 } });
    const result = await buildExport(tx, PROJECT_ID, META);
    expect(result.kind).toBe("too_large");
    if (result.kind === "too_large") expect(result.total).toBe(EXPORT_ROW_CAP + 1);
    expect(calls.filter((c) => c.op === "findMany")).toHaveLength(0);
  });

  it("3: exactly at the cap is exported, not refused", async () => {
    expect(EXPORT_ROW_CAP).toBe(100_000);
    const { tx } = makeTx({ counts: { persons: EXPORT_ROW_CAP } });
    const result = await buildExport(tx, PROJECT_ID, META);
    expect(result.kind).toBe("ok");
  });

  it("3: the cap sums across tables", async () => {
    const half = EXPORT_ROW_CAP / 2;
    const { tx, calls } = makeTx({ counts: { persons: half, events: half, sources: 1 } });
    const result = await buildExport(tx, PROJECT_ID, META);
    expect(result.kind).toBe("too_large");
    expect(calls.filter((c) => c.op === "findMany")).toHaveLength(0);
  });

  it("reports not_found when the project is soft-deleted in the snapshot, before reading any table", async () => {
    const { tx, calls } = makeTx();
    (tx as unknown as { project: { findUnique: ReturnType<typeof vi.fn> } }).project.findUnique =
      vi.fn(async () => ({ id: PROJECT_ID, name: "P", deleted_at: new Date() }));
    const result = await buildExport(tx, PROJECT_ID, META);
    expect(result.kind).toBe("not_found");
    expect(calls).toHaveLength(0);
  });

  it("reports not_found when the project row is gone, before reading any table", async () => {
    const { tx, calls } = makeTx();
    (tx as unknown as { project: { findUnique: ReturnType<typeof vi.fn> } }).project.findUnique =
      vi.fn(async () => null);
    const result = await buildExport(tx, PROJECT_ID, META);
    expect(result.kind).toBe("not_found");
    expect(calls).toHaveLength(0);
  });

  it("6: no query includes a User relation or touches a user delegate (X5)", async () => {
    const { tx, calls, projectCalls } = makeTx();
    // The Proxy in makeTx throws if tx.user* is read.
    await buildExport(tx, PROJECT_ID, META);
    for (const args of [...calls.map((c) => c.args), ...projectCalls]) {
      expect(args.include).toBeUndefined();
      expect(JSON.stringify(args)).not.toMatch(/user/i);
    }
  });

  it("reads only through the client it is handed", async () => {
    const a = makeTx();
    const b = makeTx();
    await buildExport(a.tx, PROJECT_ID, META);
    expect(a.calls.length).toBe(24);
    expect(b.calls.length).toBe(0);
  });
});

describe("buildExport output", () => {
  it("4: keys equal spec §2 and counts equal array lengths", async () => {
    const rows = {
      persons: [{ id: "p1" }, { id: "p2" }],
      events: [{ id: "e1" }],
      relation_evidence: [{ id: "r1" }, { id: "r2" }, { id: "r3" }],
    };
    const { tx } = makeTx({ rows });
    const result = await buildExport(tx, PROJECT_ID, META);
    if (result.kind !== "ok") throw new Error("expected ok");
    const doc = result.document;

    expect(Object.keys(doc)).toEqual([
      "format",
      "format_version",
      "exported_at",
      "app_version",
      "schema_migration",
      "project",
      "tables",
      "counts",
    ]);
    expect(doc.format).toBe("evidoxa-project-export");
    expect(doc.format_version).toBe(1);
    expect(doc.exported_at).toBe("2026-10-05T10:00:00.000Z");
    expect(doc.app_version).toBe("0.1.0");
    expect(doc.schema_migration).toBe("20261001000000_example");
    expect(Object.keys(doc.project)).toEqual([
      "id",
      "name",
      "description",
      "created_at",
      "updated_at",
    ]);

    const tableKeys = [
      "persons",
      "person_names",
      "events",
      "event_types",
      "sources",
      "locations",
      "literature",
      "relation_types",
      "relations",
      "relation_evidence",
      "property_evidence",
      "entity_activity",
    ];
    expect(Object.keys(doc.tables)).toEqual(tableKeys);
    expect(Object.keys(doc.counts)).toEqual(tableKeys);
    for (const k of tableKeys) {
      expect(doc.counts[k as keyof typeof doc.counts]).toBe(
        doc.tables[k as keyof typeof doc.tables].length,
      );
    }
    expect(doc.counts.persons).toBe(2);
    expect(doc.counts.relation_evidence).toBe(3);
    expect(doc.counts.locations).toBe(0);
  });

  it("keeps stored text exactly as stored, through the serialised body (#150)", async () => {
    const stored = `Müller & Söhne <b>"x"</b> 'y' 1848 < 1850 > 1800`;
    const { tx } = makeTx({
      rows: { persons: [{ id: "p1", first_name: stored, notes: null, birth_year: 1848 }] },
    });
    const result = await buildExport(tx, PROJECT_ID, META);
    if (result.kind !== "ok") throw new Error("expected ok");

    expect(result.document.tables.persons[0]).toMatchObject({ first_name: stored });

    const text = new TextDecoder().decode(serializeExport(result.document));
    // JSON escaping only: `"` is `\"`; nothing is turned into an HTML entity.
    expect(text).toContain(JSON.stringify(stored));
    expect(text).not.toMatch(/&amp;|&lt;|&gt;|&quot;|&#/);
    const parsed = JSON.parse(text) as typeof result.document;
    expect(parsed.tables.persons[0]).toMatchObject({ first_name: stored });
  });

  it("keeps partial dates as nullable integers and Json columns embedded", async () => {
    const { tx } = makeTx({
      rows: {
        persons: [{ id: "p1", birth_year: 1848, birth_month: null, birth_day: null }],
        entity_activity: [{ id: "a1", old_value: { first_name: "A" }, new_value: null }],
      },
    });
    const result = await buildExport(tx, PROJECT_ID, META);
    if (result.kind !== "ok") throw new Error("expected ok");
    const parsed = JSON.parse(new TextDecoder().decode(serializeExport(result.document))) as {
      tables: { persons: Record<string, unknown>[]; entity_activity: Record<string, unknown>[] };
    };
    expect(parsed.tables.persons[0]).toMatchObject({
      birth_year: 1848,
      birth_month: null,
      birth_day: null,
    });
    expect(parsed.tables.entity_activity[0]!.old_value).toEqual({ first_name: "A" });
  });
});

describe("serializeExport", () => {
  it("returns UTF-8 bytes whose length is the byte length, not the string length", async () => {
    const { tx } = makeTx({ rows: { persons: [{ id: "p1", first_name: "Müller ü ß 日本" }] } });
    const result = await buildExport(tx, PROJECT_ID, META);
    if (result.kind !== "ok") throw new Error("expected ok");
    const bytes = serializeExport(result.document);
    const str = JSON.stringify(result.document);
    expect(ArrayBuffer.isView(bytes)).toBe(true);
    expect(bytes.byteLength).toBe(Buffer.byteLength(str, "utf8"));
    expect(bytes.byteLength).toBeGreaterThan(str.length);
  });
});

describe("file name", () => {
  it("slugifies to lowercase ASCII [a-z0-9-], max 40", () => {
    expect(slugifyProjectName("Mein Projekt")).toBe("mein-projekt");
    expect(slugifyProjectName("Über Müller & Söhne")).toBe("uber-muller-sohne");
    expect(slugifyProjectName("Straße")).toBe("strasse");
    expect(slugifyProjectName("  --a__b--  ")).toBe("a-b");
    expect(slugifyProjectName("x".repeat(100))).toBe("x".repeat(40));
    expect(slugifyProjectName("a".repeat(39) + " bbbb")).toBe("a".repeat(39));
    expect(slugifyProjectName('evil"; filename="x\r\n')).toMatch(/^[a-z0-9-]+$/);
  });

  it("falls back to 'projekt' when no ASCII letter or digit survives", () => {
    expect(slugifyProjectName("日本語")).toBe("projekt");
    expect(slugifyProjectName("")).toBe("projekt");
    expect(slugifyProjectName("---")).toBe("projekt");
  });

  it("builds evidoxa-export-{slug}-{YYYY-MM-DD}.json from the UTC date", () => {
    expect(exportFilename("Mein Projekt", new Date("2026-10-05T23:59:59.000Z"))).toBe(
      "evidoxa-export-mein-projekt-2026-10-05.json",
    );
    expect(exportFilename("日本", new Date("2026-10-05T00:00:00.000Z"))).toBe(
      "evidoxa-export-projekt-2026-10-05.json",
    );
  });
});

describe("P3: the export module never reads through the soft-delete-filtering client", () => {
  const source = readFileSync(join(__dirname, "project-export.ts"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1");

  it("does not import from @/lib/db or reference `db`", () => {
    expect(source).not.toMatch(/lib\/db/);
    expect(source).not.toMatch(/\bdb\b/);
    expect(source).not.toMatch(/from\s+["'][^"']*\/db["']/);
  });

  it("does not import the raw redis client or the global prisma", () => {
    expect(source).not.toMatch(/lib\/redis/);
    expect(source).not.toMatch(/new PrismaClient/);
  });
});

describe("accessStillHolds (#165 review)", () => {
  function makeAccessTx(member: boolean, live: boolean) {
    const calls: { model: string; args: unknown }[] = [];
    const tx = {
      userProject: {
        findFirst: vi.fn(async (args: unknown) => {
          calls.push({ model: "userProject", args });
          return member ? { id: "m" } : null;
        }),
      },
      project: {
        findFirst: vi.fn(async (args: unknown) => {
          calls.push({ model: "project", args });
          return live ? { id: PROJECT_ID } : null;
        }),
      },
    } as unknown as Prisma.TransactionClient;
    return { tx, calls };
  }

  it("holds for a member of a live project, checked by user and project", async () => {
    const { tx, calls } = makeAccessTx(true, true);
    expect(await accessStillHolds(tx, "user_1", PROJECT_ID)).toBe(true);
    expect(calls[0]).toEqual({
      model: "userProject",
      args: { where: { user_id: "user_1", project_id: PROJECT_ID }, select: { id: true } },
    });
    expect(calls[1]).toEqual({
      model: "project",
      args: { where: { id: PROJECT_ID, deleted_at: null }, select: { id: true } },
    });
  });

  it("fails once the membership is gone", async () => {
    expect(await accessStillHolds(makeAccessTx(false, true).tx, "user_1", PROJECT_ID)).toBe(false);
  });

  it("fails once the project is soft-deleted", async () => {
    expect(await accessStillHolds(makeAccessTx(true, false).tx, "user_1", PROJECT_ID)).toBe(false);
  });
});
