import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  BRANCH,
  CUTOFF,
  NEW,
  OLD,
  cell,
  createMigratedDb,
  dumpTables,
  insertActivity,
  insertRow,
  jsonCell,
  loadPairs,
  pgliteClient,
  reencode,
  resetData,
  seedEveryColumn,
  seedWorld,
  setBranch,
} from "./__fixtures__/pglite-db";
import {
  parseKeepEncoded,
  runBackfill,
  type BackfillOptions,
  type BackfillReport,
} from "./backfill";
import { BACKFILL_MARKER, ACTIVITY_SCOPE, BACKFILL_COLUMNS, columnKey } from "./columns";
import { assertLocalUrl, parseCutoff, Refusal } from "./db";
import { decodeEntities, decodeSql } from "./decode";

const ENC = "Müller &amp; Söhne";
const DEC = "Müller & Söhne";

// The plan's list, spelled out so that dropping or adding a column in
// columns.ts is noticed here (T6: "remove one column from the backfill list").
const EXPECTED_KEYS = [
  "users.name",
  "persons.first_name",
  "persons.last_name",
  "persons.birth_place",
  "persons.death_place",
  "persons.notes",
  "person_names.name",
  "event_types.name",
  "event_types.icon",
  "events.title",
  "events.description",
  "events.location",
  "events.notes",
  "sources.title",
  "sources.type",
  "sources.author",
  "sources.date",
  "sources.repository",
  "sources.call_number",
  "sources.notes",
  "relation_types.name",
  "relation_types.inverse_name",
  "relation_types.description",
  "relation_types.icon",
  "relations.notes",
  "relation_evidence.notes",
  "relation_evidence.page_reference",
  "relation_evidence.quote",
  "property_evidence.notes",
  "property_evidence.page_reference",
  "property_evidence.quote",
  "property_evidence.raw_transcription",
  "access_requests.name",
  "access_requests.institution",
  "access_requests.research_area",
  "access_requests.tool_gap",
];

let db: PGlite;
let log: string[];
let lines: string[];

const client = () => pgliteClient(db, log);

function run(options: Partial<BackfillOptions> = {}): Promise<BackfillReport> {
  return runBackfill(client(), { expectBranch: BRANCH, cutoff: CUTOFF, ...options }, (line) =>
    lines.push(line),
  );
}

async function dry(options: Partial<BackfillOptions> = {}): Promise<BackfillReport> {
  return run({ ...options, apply: false });
}

/** Dry run, then apply with the count the dry run reported. */
async function apply(options: Partial<BackfillOptions> = {}): Promise<BackfillReport> {
  const preview = await dry(options);
  return run({
    ...options,
    apply: true,
    expectRows: preview.totalRowsToDecode,
  });
}

async function count(sql: string, params: unknown[] = []): Promise<number> {
  const { rows } = await db.query<{ n: number }>(sql, params);
  return Number(rows[0]!.n);
}

beforeAll(async () => {
  db = await createMigratedDb();
}, 120_000);

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await resetData(db);
  await setBranch(db, BRANCH);
  await seedWorld(db);
  log = [];
  lines = [];
});

describe("column list", () => {
  it("is the plan's 36 columns, spelled out", () => {
    expect(BACKFILL_COLUMNS.map((c) => columnKey(c.table, c.column))).toEqual(EXPECTED_KEYS);
    expect(BACKFILL_COLUMNS).toHaveLength(36);
  });

  it("dates append-only tables and users.name by created_at, the rest by updated_at", () => {
    const createdAt = new Set(["users", "person_names", "relation_evidence", "property_evidence"]);
    for (const c of BACKFILL_COLUMNS) {
      expect(c.cutoffColumn, columnKey(c.table, c.column)).toBe(
        createdAt.has(c.table) ? "created_at" : "updated_at",
      );
    }
  });

  it("keeps no long-lived copy of access_requests only", () => {
    expect(BACKFILL_COLUMNS.filter((c) => !c.backup).map((c) => c.table)).toEqual([
      "access_requests",
      "access_requests",
      "access_requests",
      "access_requests",
    ]);
  });

  it("names real text columns and cutoff columns in the migrated schema", async () => {
    for (const c of BACKFILL_COLUMNS) {
      const { rows } = await db.query<{ column_name: string; data_type: string }>(
        `SELECT column_name, data_type FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1 AND column_name = ANY($2::text[])`,
        [c.table, [c.column, c.cutoffColumn]],
      );
      const types = Object.fromEntries(rows.map((r) => [r.column_name, r.data_type]));
      expect(types[c.column], columnKey(c.table, c.column)).toBe("text");
      expect(types[c.cutoffColumn]).toBe("timestamp with time zone");
    }
  });

  it("scopes activity to the plan's field paths", () => {
    expect(ACTIVITY_SCOPE.map((s) => s.entityType)).toEqual(["PERSON", "EVENT", "SOURCE"]);
    expect(ACTIVITY_SCOPE[2]!.fieldPaths).not.toContain("url");
  });
});

describe("decoder", () => {
  const pairs = loadPairs();

  it("has a few hundred real sanitize() pairs, including entity and tag-like text", () => {
    expect(pairs.length).toBeGreaterThanOrEqual(300);
    expect(pairs.some((p) => p.stored.includes("&amp;lt;"))).toBe(true);
    expect(pairs.some((p) => p.stored.includes("&lt;script&gt;"))).toBe(true);
    expect(pairs.some((p) => p.input.includes("<script>"))).toBe(true);
  });

  it("re-encoding the decoded value reproduces the stored value, for every pair", () => {
    for (const { stored } of pairs) {
      expect(reencode(decodeEntities(stored)), stored).toBe(stored);
    }
  });

  it("returns the typed text when nothing was lost on write", () => {
    // No '<' (tags are stripped) and no entity-like text (decoded on write).
    const clean = pairs.filter((p) => !p.input.includes("<") && !/&[A-Za-z#0-9]+;/.test(p.input));
    expect(clean.length).toBeGreaterThan(20);
    for (const { input, stored } of clean) {
      expect(decodeEntities(stored), input).toBe(input);
    }
  });

  it("decodes &amp; last: &amp;lt; becomes &lt;, not <", () => {
    expect(decodeEntities("&amp;lt;")).toBe("&lt;");
    expect(decodeEntities("&amp;amp;")).toBe("&amp;");
    expect(decodeEntities("&amp;gt; &lt;&amp;&gt;")).toBe("&gt; <&>");
  });

  it("agrees with the SQL decoder on every pair", async () => {
    const { rows } = await db.query<{ s: string; d: string }>(
      `SELECT s, ${decodeSql("s")} AS d FROM unnest($1::text[]) AS s`,
      [pairs.map((p) => p.stored)],
    );
    expect(rows).toHaveLength(pairs.length);
    for (const r of rows) expect(r.d, r.s).toBe(decodeEntities(r.s));
  });
});

describe("--keep-encoded file", () => {
  it("parses table.column:id lines, comments and blanks", () => {
    expect(parseKeepEncoded("# review\n\npersons.notes:abc # S1\r\nevents.title:x1\n")).toEqual([
      { key: "persons.notes", id: "abc" },
      { key: "events.title", id: "x1" },
    ]);
  });
  it("refuses a malformed line", () => {
    expect(() => parseKeepEncoded("persons.notes abc")).toThrow(Refusal);
  });
});

describe("identity guard (--expect-branch / --local)", () => {
  it("refuses a mismatched branch id before any other statement", async () => {
    await setBranch(db, "br-someone-else");
    await expect(dry()).rejects.toThrow(/br-someone-else, expected br-test-123/);
    expect(log).toHaveLength(1);
    expect(log[0]).toContain("neon.branch_id");
  });

  it("refuses a NULL branch id (a non-Neon Postgres) without --local", async () => {
    await db.exec("RESET neon.branch_id");
    await expect(dry()).rejects.toThrow(/NULL/);
    expect(log).toHaveLength(1);
  });

  it("refuses an empty branch id and a missing --expect-branch", async () => {
    await setBranch(db, "");
    await expect(dry()).rejects.toThrow(Refusal);
    await setBranch(db, BRANCH);
    await expect(run({ expectBranch: undefined })).rejects.toThrow(/--expect-branch/);
    await expect(run({ expectBranch: "  " })).rejects.toThrow(/--expect-branch/);
    expect(log).toHaveLength(1); // the empty-id attempt queried; the other two never reached the database
  });

  it("applies nothing when the identity is wrong", async () => {
    await seedEveryColumn(db, "a", OLD, () => ENC);
    const before = await dumpTables(db);
    const preview = await dry(); // the right count, so only the identity can stop the run
    await setBranch(db, "br-other");
    await expect(run({ apply: true, expectRows: preview.totalRowsToDecode })).rejects.toThrow(
      /Identity refused/,
    );
    await setBranch(db, BRANCH);
    expect(await dumpTables(db)).toBe(before);
  });

  it("accepts --local only on a database that reports no Neon branch", async () => {
    await db.exec("RESET neon.branch_id");
    const report = await run({ expectBranch: undefined, local: true });
    expect(report.branchId).toBeNull();
    await setBranch(db, BRANCH);
    await expect(run({ expectBranch: undefined, local: true })).rejects.toThrow(
      /--local refused.*Neon/,
    );
  });

  it("refuses --local together with --expect-branch", async () => {
    await expect(run({ local: true })).rejects.toThrow(/mutually exclusive/);
  });

  it("--local accepts only localhost and 127.0.0.1 URLs", () => {
    expect(() => assertLocalUrl("postgres://u:p@localhost:5435/e2e")).not.toThrow();
    expect(() => assertLocalUrl("postgres://u:p@127.0.0.1:5435/e2e")).not.toThrow();
    expect(() =>
      assertLocalUrl("postgres://u:p@ep-cool-123.eu-central-1.aws.neon.tech/db"),
    ).toThrow(/only localhost/);
    expect(() => assertLocalUrl("postgres://localhost.evil.example/db")).toThrow(Refusal);
    expect(() => assertLocalUrl("postgres://localhost/db?host=ep-prod.neon.tech")).toThrow(
      /override/,
    );
    expect(() => assertLocalUrl("not a url")).toThrow(Refusal);
  });
});

describe("--cutoff", () => {
  it("is required in every mode and refused before touching the database", async () => {
    await expect(run({ cutoff: undefined })).rejects.toThrow(/--cutoff/);
    await expect(run({ cutoff: undefined, apply: true, expectRows: 0 })).rejects.toThrow(
      /--cutoff/,
    );
    expect(log).toHaveLength(0);
  });

  it("must carry an explicit zone and be a real timestamp", async () => {
    await expect(run({ cutoff: "2026-10-10 12:00:00" })).rejects.toThrow(/explicit zone/);
    await expect(run({ cutoff: "yesterday" })).rejects.toThrow(Refusal);
    await expect(run({ cutoff: "2026-13-45T00:00:00Z" })).rejects.toThrow(Refusal);
    expect(log).toHaveLength(0);
  });

  it("excludes rows at or after the cutoff, lists them, and leaves them untouched", async () => {
    // [R1] a post-cutoff row holding a typed &lt; (stored verbatim by T3 code).
    await insertRow(db, "persons", { id: "late", project_id: "p1", notes: "&lt;sic&gt;" }, NEW);
    await insertRow(db, "persons", { id: "exact", project_id: "p1", notes: "x &amp; y" }, CUTOFF);
    await insertRow(db, "persons", { id: "early", project_id: "p1", notes: "x &amp; y" }, OLD);
    const report = await apply();
    expect(await cell(db, "persons", "notes", "late")).toBe("&lt;sic&gt;");
    expect(await cell(db, "persons", "notes", "exact")).toBe("x &amp; y");
    expect(await cell(db, "persons", "notes", "early")).toBe("x & y");
    const notes = report.targets.find((t) => t.key === "persons.notes")!;
    expect(notes.excludedIds).toEqual(["exact", "late"]);
    expect(notes.rowsToDecode).toBe(1);
    expect(report.excludedAfterCutoff).toBe(2);
    expect(lines.join("\n")).toContain("persons.notes:late");
    // and no backup row for them
    expect(
      await count(
        "SELECT count(*)::int AS n FROM backfill_150_originals WHERE row_id IN ('late','exact')",
      ),
    ).toBe(0);
  });

  it("dates users.name and the append-only tables by created_at, not updated_at", async () => {
    // updated_at is old but created_at is after the cutoff: excluded.
    await db.query(
      `INSERT INTO users (id, email, name, created_at, updated_at) VALUES ('uu', 'uu@example.test', 'A &amp; B', $1, $2)`,
      [NEW, OLD],
    );
    await db.query(
      `INSERT INTO persons (id, project_id, notes, created_at, updated_at) VALUES ('pp', 'p1', 'A &amp; B', $1, $2)`,
      [OLD, NEW],
    );
    await insertRow(db, "person_names", { id: "pn-late", person_id: "pp", name: "A &amp; B" }, NEW);
    const report = await apply();
    expect(await cell(db, "users", "name", "uu")).toBe("A &amp; B"); // created_at after cutoff
    expect(await cell(db, "persons", "notes", "pp")).toBe("A &amp; B"); // updated_at after cutoff
    expect(await cell(db, "person_names", "name", "pn-late")).toBe("A &amp; B");
    expect(report.totalRowsToDecode).toBe(0);
  });

  it("refuses, on apply, a cutoff later than the database clock", async () => {
    const future = "2999-01-01T00:00:00Z";
    await dry({ cutoff: future }); // harmless in a dry run
    await expect(run({ cutoff: future, apply: true, expectRows: 0 })).rejects.toThrow(
      /later than the database clock/,
    );
    expect(await count("SELECT count(*)::int AS n FROM data_backfills")).toBe(0);
  });
});

describe("dry run and --apply guards", () => {
  it("is the default and changes nothing, not even a marker or a backup", async () => {
    await seedEveryColumn(db, "a", OLD, () => ENC);
    await insertActivity(db, "act1", {
      entity_type: "PERSON",
      field_path: "notes",
      old_value: ENC,
      new_value: ENC,
    });
    const before = await dumpTables(db);
    const report = await dry();
    expect(report.applied).toBe(false);
    expect(report.mode).toBe("dry-run");
    expect(report.totalRowsToDecode).toBe(36 + 1);
    expect(await dumpTables(db)).toBe(before);
    expect(log.some((q) => q.includes("READ ONLY"))).toBe(true);
    expect(log.some((q) => /^\s*COMMIT/.test(q))).toBe(false);
  });

  it("refuses --apply without --expect-rows", async () => {
    await expect(run({ apply: true })).rejects.toThrow(/--expect-rows/);
    await expect(run({ apply: true, expectRows: -1 })).rejects.toThrow(/--expect-rows/);
    expect(log).toHaveLength(0);
  });

  it("refuses a wrong --expect-rows and writes nothing", async () => {
    await seedEveryColumn(db, "a", OLD, () => ENC);
    const before = await dumpTables(db);
    const preview = await dry();
    await expect(run({ apply: true, expectRows: preview.totalRowsToDecode + 1 })).rejects.toThrow(
      /does not match the live count/,
    );
    await expect(run({ apply: true, expectRows: preview.totalRowsToDecode - 1 })).rejects.toThrow(
      /does not match/,
    );
    expect(await dumpTables(db)).toBe(before);
  });

  it("refuses a keep-encoded entry that names no row to decode (a typo would decode the wrong row)", async () => {
    await insertRow(db, "persons", { id: "p-a", project_id: "p1", notes: "a &amp; b" });
    await expect(dry({ keepEncoded: [{ key: "persons.notes", id: "p-typo" }] })).rejects.toThrow(
      /does not name a row that would be decoded/,
    );
    await expect(dry({ keepEncoded: [{ key: "persons.nope", id: "p-a" }] })).rejects.toThrow(
      /not a backfill column/,
    );
  });
});

describe("apply: every column", () => {
  it("decodes all 36 columns, one backup row per changed cell, none for access_requests", async () => {
    const ids = await seedEveryColumn(db, "a", OLD, () => ENC);
    const report = await apply();
    expect(report.applied).toBe(true);
    expect(report.totalRowsToDecode).toBe(36);

    for (const c of BACKFILL_COLUMNS) {
      expect(await cell(db, c.table, c.column, ids[c.table]!), columnKey(c.table, c.column)).toBe(
        DEC,
      );
    }
    for (const c of BACKFILL_COLUMNS) {
      const n = await count(
        "SELECT count(*)::int AS n FROM backfill_150_originals WHERE table_name = $1 AND column_name = $2",
        [c.table, c.column],
      );
      expect(n, columnKey(c.table, c.column)).toBe(c.backup ? 1 : 0);
    }
    expect(
      await count(
        "SELECT count(*)::int AS n FROM backfill_150_originals WHERE table_name = 'access_requests'",
      ),
    ).toBe(0);
    expect(await count("SELECT count(*)::int AS n FROM backfill_150_originals")).toBe(32);

    // original and decoded values side by side
    const { rows } = await db.query<{
      original_text: string;
      decoded_text: string;
      created_at: string;
    }>(
      `SELECT original_text, decoded_text, created_at FROM backfill_150_originals WHERE table_name = 'persons' AND column_name = 'notes'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.original_text).toBe(ENC);
    expect(rows[0]!.decoded_text).toBe(DEC);
    expect(rows[0]!.created_at).toBeTruthy();
  });

  it("leaves updated_at and created_at alone (raw SQL, no @updatedAt)", async () => {
    await insertRow(db, "persons", { id: "p-a", project_id: "p1", notes: ENC }, OLD);
    const read = async () =>
      (
        await db.query(
          `SELECT created_at::text AS c, updated_at::text AS u FROM persons WHERE id = 'p-a'`,
        )
      ).rows[0];
    const before = await read();
    await apply();
    expect(await read()).toEqual(before);
  });

  it("decodes real sanitize() output exactly: every changed cell re-encodes to what was stored", async () => {
    const pairs = loadPairs();
    await db.query(
      `INSERT INTO persons (id, project_id, notes, created_at, updated_at)
       SELECT 'fx-' || i, 'p1', v, $2::timestamptz, $2::timestamptz
         FROM unnest($1::text[]) WITH ORDINALITY AS u(v, i)`,
      [pairs.map((p) => p.stored), OLD],
    );
    const withEntity = pairs.filter((p) => /&(amp|lt|gt);/.test(p.stored));
    const report = await apply();
    expect(report.totalRowsToDecode).toBe(withEntity.length);
    expect(report.blockers).toEqual([]);
    for (const [i, p] of pairs.entries()) {
      const now = await cell(db, "persons", "notes", `fx-${i + 1}`);
      expect(now, p.stored).toBe(decodeEntities(p.stored));
      expect(reencode(now ?? ""), p.stored).toBe(p.stored);
    }
    expect(await count("SELECT count(*)::int AS n FROM backfill_150_originals")).toBe(
      withEntity.length,
    );
  });

  it("turns a stored &amp;lt; into &lt;, not <", async () => {
    await insertRow(db, "persons", {
      id: "p-a",
      project_id: "p1",
      notes: "&amp;lt;b&amp;gt; &lt;i&gt;",
    });
    await apply();
    expect(await cell(db, "persons", "notes", "p-a")).toBe("&lt;b&gt; <i>");
  });

  it("handles NULL and soft-deleted rows", async () => {
    await insertRow(db, "persons", { id: "p-null", project_id: "p1", notes: null });
    await insertRow(db, "persons", { id: "p-del", project_id: "p1", notes: ENC, deleted_at: OLD });
    await insertRow(db, "persons", { id: "p-live", project_id: "p1", notes: ENC });
    await apply();
    expect(await cell(db, "persons", "notes", "p-null")).toBeNull();
    expect(await cell(db, "persons", "notes", "p-del")).toBe(DEC);
    expect(await cell(db, "persons", "notes", "p-live")).toBe(DEC);
    expect(
      await count("SELECT count(*)::int AS n FROM backfill_150_originals WHERE row_id = 'p-null'"),
    ).toBe(0);
    expect(await count("SELECT count(notes)::int AS n FROM persons")).toBe(2);
  });

  it("leaves rows without an entity alone, and quotes", async () => {
    await insertRow(db, "persons", { id: "p-q", project_id: "p1", notes: `"Faust" 's é` });
    await insertRow(db, "persons", { id: "p-amp", project_id: "p1", notes: "a &amp b" }); // no semicolon
    const report = await apply();
    expect(report.totalRowsToDecode).toBe(0);
    expect(await cell(db, "persons", "notes", "p-q")).toBe(`"Faust" 's é`);
    expect(await cell(db, "persons", "notes", "p-amp")).toBe("a &amp b");
  });
});

describe("apply: entity_activity", () => {
  it("decodes string leaves of in-scope snapshots only", async () => {
    await insertActivity(db, "a-person", {
      entity_type: "PERSON",
      field_path: "first_name",
      old_value: "A &amp; B",
      new_value: "C &lt; D",
    });
    await insertActivity(db, "a-event", {
      entity_type: "EVENT",
      field_path: "title",
      old_value: "&gt;",
      new_value: "ok",
    });
    await insertActivity(db, "a-source", {
      entity_type: "SOURCE",
      field_path: "notes",
      old_value: null,
      new_value: "x &amp;lt; y",
    });
    // out of scope
    await insertActivity(db, "a-url", {
      entity_type: "SOURCE",
      field_path: "url",
      old_value: "https://a.test/?a=1&amp;b=2",
      new_value: "https://a.test/?a=1&amp;b=3",
    });
    await insertActivity(db, "a-relation", {
      entity_type: "PERSON",
      field_path: null,
      new_value: { notes: "a &amp; b", relation_type_id: "r" },
    });
    await insertActivity(db, "a-loc", {
      entity_type: "LOCATION",
      field_path: "name",
      old_value: "A &amp; B",
    });
    await insertActivity(db, "a-year", {
      entity_type: "PERSON",
      field_path: "birth_year",
      old_value: "1 &amp; 2",
    });
    await insertActivity(db, "a-wrong-entity", {
      entity_type: "EVENT",
      field_path: "first_name",
      old_value: "A &amp; B",
    });
    // in scope but not strings
    await insertActivity(db, "a-null", {
      entity_type: "PERSON",
      field_path: "notes",
      old_value: null,
      new_value: null,
    });
    await insertActivity(db, "a-num", {
      entity_type: "PERSON",
      field_path: "notes",
      old_value: 42,
      new_value: true,
    });
    await insertActivity(db, "a-obj", {
      entity_type: "PERSON",
      field_path: "notes",
      old_value: { x: "&amp;" },
      new_value: ["&amp;"],
    });
    await db.query(
      `UPDATE entity_activity SET old_value = 'null'::jsonb, new_value = NULL WHERE id = 'a-null'`,
    );

    const report = await apply();

    expect(await jsonCell(db, "old_value", "a-person")).toBe("A & B");
    expect(await jsonCell(db, "new_value", "a-person")).toBe("C < D");
    expect(await jsonCell(db, "old_value", "a-event")).toBe(">");
    expect(await jsonCell(db, "new_value", "a-source")).toBe("x &lt; y");
    for (const id of ["a-url", "a-loc", "a-year", "a-wrong-entity"]) {
      expect(await jsonCell(db, "old_value", id), id).toMatch(/&amp;/);
    }
    expect(await jsonCell(db, "new_value", "a-url")).toBe("https://a.test/?a=1&amp;b=3");
    expect(await jsonCell(db, "new_value", "a-relation")).toEqual({
      notes: "a &amp; b",
      relation_type_id: "r",
    });
    expect(await jsonCell(db, "old_value", "a-null")).toBeNull(); // JSON null stays JSON null
    expect(await jsonCell(db, "new_value", "a-null")).toBeNull();
    expect(await jsonCell(db, "old_value", "a-num")).toBe(42);
    expect(await jsonCell(db, "new_value", "a-num")).toBe(true);
    expect(await jsonCell(db, "old_value", "a-obj")).toEqual({ x: "&amp;" });
    expect(await jsonCell(db, "new_value", "a-obj")).toEqual(["&amp;"]);

    // 3 rows decoded; backups hold the original and decoded JSON, one per changed cell (4 cells)
    expect(report.totalRowsToDecode).toBe(3);
    expect(
      await count(
        "SELECT count(*)::int AS n FROM backfill_150_originals WHERE table_name = 'entity_activity'",
      ),
    ).toBe(4);
    const { rows } = await db.query<{ original_json: string; decoded_json: string }>(
      `SELECT original_json, decoded_json FROM backfill_150_originals
        WHERE table_name = 'entity_activity' AND column_name = 'old_value' AND row_id = 'a-person'`,
    );
    expect(rows[0]).toEqual({ original_json: "A &amp; B", decoded_json: "A & B" });
  });

  it("[R4] counts only the snapshots that need decoding, not the whole group", async () => {
    await insertActivity(db, "g-enc", {
      entity_type: "PERSON",
      field_path: "first_name",
      old_value: "A &amp; B",
      new_value: "A &amp; B",
    });
    for (const i of [1, 2, 3, 4]) {
      await insertActivity(db, `g-plain-${i}`, {
        entity_type: "PERSON",
        field_path: "first_name",
        old_value: `Anna ${i}`,
        new_value: `Anna ${i + 1}`,
      });
    }
    const report = await dry();
    const group = report.activity.find(
      (g) => g.entityType === "PERSON" && g.fieldPath === "first_name",
    )!;
    expect(group.rowsToDecode).toBe(1); // a group-level count(*) would say 5
    expect(report.totalRowsToDecode).toBe(1);
  });

  it("excludes activity written at or after the cutoff and lists it per group", async () => {
    await insertActivity(
      db,
      "late",
      { entity_type: "EVENT", field_path: "notes", new_value: "&lt;typed&gt;" },
      NEW,
    );
    await insertActivity(
      db,
      "early",
      { entity_type: "EVENT", field_path: "notes", new_value: "a &amp; b" },
      OLD,
    );
    const report = await apply();
    expect(await jsonCell(db, "new_value", "late")).toBe("&lt;typed&gt;");
    expect(await jsonCell(db, "new_value", "early")).toBe("a & b");
    const group = report.activity.find((g) => g.entityType === "EVENT")!;
    expect(group).toMatchObject({ rowsToDecode: 1, excludedAfterCutoff: 1 });
  });
});

describe("[R5] review list and --keep-encoded", () => {
  it("flags &amp;lt; and &lt;script&gt; rows, and not an ordinary &amp;", async () => {
    await insertRow(db, "persons", {
      id: "p-second",
      project_id: "p1",
      notes: "&amp;lt;b&amp;gt;",
    });
    await insertRow(db, "persons", {
      id: "p-script",
      project_id: "p1",
      notes: "&lt;script&gt;x&lt;/script&gt;",
    });
    await insertRow(db, "persons", { id: "p-plain", project_id: "p1", notes: ENC });
    await insertRow(db, "persons", { id: "p-lt", project_id: "p1", notes: "1848 &lt; 1850" });
    const report = await dry();
    const notes = report.targets.find((t) => t.key === "persons.notes")!;
    expect(notes.review.map((r) => r.id)).toEqual(["p-script", "p-second"]);
    expect(notes.review.find((r) => r.id === "p-second")!.signals).toContain(
      "decoded-still-has-entity",
    );
    expect(notes.review.find((r) => r.id === "p-script")!.signals).toContain("lt-before-tag-char");
    const text = lines.join("\n");
    expect(text).toContain("persons.notes:p-second");
    expect(text).toContain("persons.notes:p-script");
    expect(text).not.toContain("p-plain");
    expect(text).not.toContain("p-lt");
  });

  it("leaves --keep-encoded rows as stored, with no backup row, and reports them", async () => {
    await insertRow(db, "persons", { id: "p-keep", project_id: "p1", notes: "&amp;lt;b&amp;gt;" });
    await insertRow(db, "persons", { id: "p-go", project_id: "p1", notes: ENC });
    const keep = parseKeepEncoded("persons.notes:p-keep  # the researcher typed &lt;b&gt;");
    const preview = await dry({ keepEncoded: keep });
    expect(preview.totalRowsToDecode).toBe(1);
    expect(preview.keptEncoded).toBe(1);
    // the owner who forgets --keep-encoded on apply is refused: the count differs
    await expect(run({ apply: true, expectRows: preview.totalRowsToDecode })).rejects.toThrow(
      /does not match/,
    );
    const report = await run({ apply: true, expectRows: 1, keepEncoded: keep });
    expect(report.applied).toBe(true);
    expect(await cell(db, "persons", "notes", "p-keep")).toBe("&amp;lt;b&amp;gt;");
    expect(await cell(db, "persons", "notes", "p-go")).toBe(DEC);
    expect(
      await count("SELECT count(*)::int AS n FROM backfill_150_originals WHERE row_id = 'p-keep'"),
    ).toBe(0);
    expect(lines.join("\n")).toContain("[kept encoded]");
  });

  it("can keep one activity cell encoded", async () => {
    await insertActivity(db, "act-k", {
      entity_type: "PERSON",
      field_path: "notes",
      old_value: "&amp;lt;",
      new_value: "a &amp; b",
    });
    await apply({ keepEncoded: [{ key: "entity_activity.old_value", id: "act-k" }] });
    expect(await jsonCell(db, "old_value", "act-k")).toBe("&amp;lt;");
    expect(await jsonCell(db, "new_value", "act-k")).toBe("a & b");
  });
});

describe("blockers", () => {
  it("aborts on an event_types collision with zero rows changed", async () => {
    await insertRow(db, "event_types", {
      id: "et-enc",
      project_id: "p1",
      name: "Treaty &amp; Peace",
    });
    await insertRow(db, "event_types", { id: "et-raw", project_id: "p1", name: "Treaty & Peace" }); // verbatim, written after T3
    await insertRow(db, "persons", { id: "p-a", project_id: "p1", notes: ENC });
    const before = await dumpTables(db);
    const preview = await dry();
    expect(preview.collisions).toEqual([
      { projectId: "p1", colliding: 2, ids: ["et-enc", "et-raw"] },
    ]);
    expect(preview.blockers.join(" ")).toMatch(/collide/);
    await expect(run({ apply: true, expectRows: preview.totalRowsToDecode })).rejects.toThrow(
      /collide/,
    );
    expect(await dumpTables(db)).toBe(before); // not even the unrelated person row
  });

  it("sees a collision with a row written after the cutoff too", async () => {
    await insertRow(
      db,
      "event_types",
      { id: "et-enc", project_id: "p1", name: "Treaty &amp; Peace" },
      OLD,
    );
    await insertRow(
      db,
      "event_types",
      { id: "et-raw", project_id: "p1", name: "Treaty & Peace" },
      NEW,
    );
    const before = await dumpTables(db);
    const preview = await dry();
    expect(preview.collisions).toHaveLength(1);
    await expect(run({ apply: true, expectRows: preview.totalRowsToDecode })).rejects.toThrow(
      /collide/,
    );
    expect(await dumpTables(db)).toBe(before);
  });

  it("refuses to decode a row that sanitize() cannot have written, unless the owner keeps it", async () => {
    await insertRow(db, "persons", { id: "p-odd", project_id: "p1", notes: "a < b &amp; c" });
    const preview = await dry();
    expect(preview.blockers.join(" ")).toMatch(/not sanitize\(\)-shaped.*persons\.notes:p-odd/);
    expect(preview.targets.find((t) => t.key === "persons.notes")!.rowsNotSanitizeShaped).toBe(1);
    await expect(run({ apply: true, expectRows: preview.totalRowsToDecode })).rejects.toThrow(
      /not sanitize\(\)-shaped/,
    );
    expect(await cell(db, "persons", "notes", "p-odd")).toBe("a < b &amp; c");
    const kept = [{ key: "persons.notes", id: "p-odd" }];
    const report = await run({ apply: true, expectRows: 0, keepEncoded: kept });
    expect(report.applied).toBe(true);
    expect(await cell(db, "persons", "notes", "p-odd")).toBe("a < b &amp; c");
  });

  it("does not call identical names in different projects a collision", async () => {
    await insertRow(db, "projects", { id: "p2", name: "Second" });
    await insertRow(db, "event_types", { id: "et-1", project_id: "p1", name: "A &amp; B" });
    await insertRow(db, "event_types", { id: "et-2", project_id: "p2", name: "A & B" });
    const report = await apply();
    expect(report.collisions).toEqual([]);
    expect(await cell(db, "event_types", "name", "et-1")).toBe("A & B");
  });
});

describe("run-once marker", () => {
  it("records counts and checksums, no values, then refuses a second run", async () => {
    await insertRow(db, "persons", { id: "p-a", project_id: "p1", notes: "Secret &amp; Sentinel" });
    const first = await apply();
    expect(first.applied).toBe(true);
    const { rows } = await db.query<{ name: string; report: Record<string, unknown> }>(
      "SELECT name, report FROM data_backfills",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.name).toBe(BACKFILL_MARKER);
    expect(rows[0]!.report).toMatchObject({
      cutoff: CUTOFF.replace("Z", ".000Z"),
      branch_id: BRANCH,
      total_rows_changed: 1,
    });
    expect(JSON.stringify(rows[0]!.report)).not.toContain("Sentinel");

    const after = await dumpTables(db);
    await expect(dry()).rejects.toThrow(/Run-once refused/);
    await expect(apply()).rejects.toThrow(/Run-once refused/);
    await expect(run({ apply: true, expectRows: 0 })).rejects.toThrow(/Run-once refused/);
    expect(await dumpTables(db)).toBe(after);
    // the decode would have changed &lt; to < again: the data is as the first run left it
    expect(await cell(db, "persons", "notes", "p-a")).toBe("Secret & Sentinel");
  });

  it("refuses a second run even when the first changed nothing (the marker alone)", async () => {
    const first = await apply(); // nothing to decode: no backup rows either
    expect(first.totalRowsToDecode).toBe(0);
    expect(await count("SELECT count(*)::int AS n FROM backfill_150_originals")).toBe(0);
    await insertRow(db, "persons", { id: "p-b", project_id: "p1", notes: "&amp;lt;" });
    await expect(apply()).rejects.toThrow(/Run-once refused/);
    expect(await cell(db, "persons", "notes", "p-b")).toBe("&amp;lt;");
  });

  it("refuses to run where the migration has not been applied or originals exist without a marker", async () => {
    await db.query(
      `INSERT INTO backfill_150_originals (table_name, column_name, row_id, original_text, decoded_text)
       VALUES ('persons', 'notes', 'ghost', 'a &amp; b', 'a & b')`,
    );
    await expect(dry()).rejects.toThrow(/no run marker/);
  });
});

describe("in-transaction verification", () => {
  it("catches a decoder that runs &amp; first, and rolls everything back", async () => {
    await insertRow(db, "persons", { id: "p-a", project_id: "p1", notes: "&amp;lt;b&amp;gt;" });
    await insertRow(db, "persons", { id: "p-b", project_id: "p1", notes: ENC });
    const before = await dumpTables(db);
    const wrong = (e: string) =>
      `replace(replace(replace(${e}, '&amp;', '&'), '&lt;', '<'), '&gt;', '>')`;
    const preview = await dry();
    await expect(
      run({ apply: true, expectRows: preview.totalRowsToDecode, decodeSql: wrong }),
    ).rejects.toThrow(/Verification failed.*length identity/);
    expect(await dumpTables(db)).toBe(before);
  });

  it("catches a decoder that forgets &gt;", async () => {
    await insertRow(db, "persons", { id: "p-a", project_id: "p1", notes: "a &gt; b" });
    const before = await dumpTables(db);
    const wrong = (e: string) => `replace(replace(${e}, '&lt;', '<'), '&amp;', '&')`;
    await expect(run({ apply: true, expectRows: 1, decodeSql: wrong })).rejects.toThrow(
      /Verification failed/,
    );
    expect(await dumpTables(db)).toBe(before);
  });
});

describe("output", () => {
  it("prints counts, ids and checksums, never a stored value", async () => {
    await seedEveryColumn(db, "a", OLD, () => "SENTINEL-VALUE &amp; more");
    await insertRow(
      db,
      "persons",
      { id: "p-late", project_id: "p1", notes: "LATE-SENTINEL &lt;" },
      NEW,
    );
    await insertActivity(db, "act", {
      entity_type: "PERSON",
      field_path: "notes",
      old_value: "ACT-SENTINEL &amp;",
    });
    await apply();
    const text = lines.join("\n");
    expect(text).toMatch(/rows_to_decode TOTAL: 37/);
    expect(text).toMatch(/Post-commit verification: OK/);
    for (const needle of ["SENTINEL", "Müller", "&amp;"]) {
      expect(text, needle).not.toContain(needle);
    }
  });
});

describe("--cutoff parsing", () => {
  it("keeps a valid instant and converts its offset to UTC", () => {
    expect(parseCutoff("2026-10-03T19:59:14Z")).toBe("2026-10-03T19:59:14.000Z");
    expect(parseCutoff("2026-10-03T21:59:14+02:00")).toBe("2026-10-03T19:59:14.000Z");
    expect(parseCutoff("2026-10-03T19:59:14.123456Z")).toBe("2026-10-03T19:59:14.123Z");
  });

  it("refuses an impossible date instead of rolling it forward", () => {
    // `new Date()` turns these into 2026-10-01 and 2026-03-01: a later cutoff.
    expect(() => parseCutoff("2026-09-31T12:00:00Z")).toThrow(Refusal);
    expect(() => parseCutoff("2026-02-30T00:00:00+02:00")).toThrow(Refusal);
    expect(() => parseCutoff("2026-10-03T24:00:00Z")).toThrow(Refusal);
  });

  it("refuses a timestamp without an explicit zone, or not in ISO form", () => {
    expect(() => parseCutoff("2026-10-03T19:59:14")).toThrow(Refusal);
    expect(() => parseCutoff("03.10.2026 19:59 Z")).toThrow(Refusal);
    expect(() => parseCutoff("")).toThrow(Refusal);
  });
});
