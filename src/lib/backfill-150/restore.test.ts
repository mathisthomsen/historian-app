import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  BRANCH,
  CUTOFF,
  cell,
  createMigratedDb,
  dumpTables,
  insertActivity,
  insertRow,
  jsonCell,
  pgliteClient,
  resetData,
  seedEveryColumn,
  seedWorld,
  setBranch,
  OLD,
} from "./__fixtures__/pglite-db";
import { runBackfill } from "./backfill";
import { BACKFILL_COLUMNS, columnKey, RESTORE_MARKER_PREFIX } from "./columns";
import { Refusal } from "./db";
import {
  parseIdsFile,
  runRestore,
  type IdEntry,
  type RestoreOptions,
  type RestoreReport,
} from "./restore";

const ENC = "Müller &amp; Söhne";
const DEC = "Müller & Söhne";
const BACKUP_BRANCH = "br-backup-456";

let db: PGlite;
let branchDb: PGlite;
let log: string[];
let lines: string[];
let ids: Record<string, string>;
/** Everything but access_requests (no restore source without --from-url) before the backfill ran. */
let beforeBackfill: string;
const SKIP_ACCESS = ["access_requests"];
let backfillChecksums: Record<string, string>;

function restore(options: Partial<RestoreOptions> = {}): Promise<RestoreReport> {
  return runRestore(
    pgliteClient(db, log),
    { expectBranch: BRANCH, all: true, ...options },
    (line) => lines.push(line),
  );
}

async function count(sql: string, params: unknown[] = []): Promise<number> {
  const { rows } = await db.query<{ n: number }>(sql, params);
  return Number(rows[0]!.n);
}

function classOf(report: RestoreReport, key: string) {
  return report.targets.find((t) => t.key === key)!.ids;
}

beforeAll(async () => {
  db = await createMigratedDb();
  branchDb = await createMigratedDb();
}, 120_000);

afterAll(async () => {
  await db.close();
  await branchDb.close();
});

beforeEach(async () => {
  await resetData(db);
  await resetData(branchDb);
  await setBranch(db, BRANCH);
  await setBranch(branchDb, BACKUP_BRANCH);
  await seedWorld(db);
  await seedWorld(branchDb);
  log = [];
  lines = [];

  ids = await seedEveryColumn(db, "a", OLD, () => ENC);
  await insertRow(db, "persons", { id: "p-r1", project_id: "p1", notes: "x &amp; y" });
  await insertRow(db, "persons", { id: "p-r2", project_id: "p1", notes: "q &amp;lt; r" });
  await insertRow(db, "persons", { id: "p-edit", project_id: "p1", notes: "e &amp; f" });
  await insertRow(db, "persons", { id: "p-plain", project_id: "p1", notes: "no entity" });
  await insertActivity(db, "act1", {
    entity_type: "PERSON",
    field_path: "notes",
    old_value: "a &amp; b",
    new_value: "c &lt; d",
  });

  beforeBackfill = await dumpTables(db, false, SKIP_ACCESS);

  // The access_requests as they stood on the G3 backup branch, before the backfill.
  await insertRow(branchDb, "access_requests", {
    id: ids["access_requests"],
    email: "a-req@example.test",
    name: ENC,
    institution: ENC,
    research_area: ENC,
    tool_gap: ENC,
  });
  await insertRow(branchDb, "access_requests", {
    id: "ar-untouched",
    email: "plain@example.test",
    name: "Plain Name",
  });
  await insertRow(db, "access_requests", {
    id: "ar-untouched",
    email: "plain@example.test",
    name: "Plain Name",
  });
  // Encoded on the G3 branch, then re-submitted verbatim before the backfill:
  // it decodes cleanly, but the backfill did not change it and production
  // holds newer data, so a restore must leave it alone (#158 review).
  await insertRow(branchDb, "access_requests", {
    id: "ar-resubmitted",
    email: "resubmit@example.test",
    name: ENC,
  });
  await insertRow(db, "access_requests", {
    id: "ar-resubmitted",
    email: "resubmit@example.test",
    name: DEC,
  });

  const preview = await runBackfill(pgliteClient(db), {
    expectBranch: BRANCH,
    cutoff: CUTOFF,
  });
  const done = await runBackfill(pgliteClient(db), {
    expectBranch: BRANCH,
    cutoff: CUTOFF,
    apply: true,
    expectRows: preview.totalRowsToDecode,
  });
  backfillChecksums = Object.fromEntries(done.targets.map((t) => [t.key, t.checksumBefore]));
}, 60_000);

describe("dry run (the default)", () => {
  it("classifies every backed-up row as restorable and changes nothing", async () => {
    const before = await dumpTables(db);
    const report = await restore();
    expect(report.mode).toBe("dry-run");
    expect(report.applied).toBe(false);
    expect(classOf(report, "persons.notes").restorable.sort()).toEqual(
      [ids["persons"], "p-edit", "p-r1", "p-r2"].sort(),
    );
    expect(classOf(report, "persons.notes").already_restored).toEqual([]);
    expect(classOf(report, "entity_activity.old_value").restorable).toEqual(["act1"]);
    // access_requests have no backup rows and are not selected
    expect(report.targets.some((t) => t.key.startsWith("access_requests."))).toBe(false);
    expect(await dumpTables(db)).toBe(before);
    expect(await count("SELECT count(*)::int AS n FROM data_backfills")).toBe(1);
    expect(log.some((q) => q.includes("READ ONLY"))).toBe(true);
  });

  it("prints ids and checksums, never a value", async () => {
    await restore();
    const text = lines.join("\n");
    expect(text).toContain("persons.notes:p-r1");
    expect(text).not.toMatch(/Müller|&amp;| & /);
  });
});

describe("--apply --all", () => {
  it("returns restorable rows to their originals; checksums equal those before the backfill", async () => {
    const report = await restore({ apply: true });
    expect(report.applied).toBe(true);
    expect(await cell(db, "persons", "notes", "p-r1")).toBe("x &amp; y");
    expect(await cell(db, "persons", "notes", "p-r2")).toBe("q &amp;lt; r");
    expect(await cell(db, "persons", "notes", "p-plain")).toBe("no entity");
    expect(await jsonCell(db, "old_value", "act1")).toBe("a &amp; b");
    for (const c of BACKFILL_COLUMNS.filter((x) => x.backup)) {
      expect(await cell(db, c.table, c.column, ids[c.table]!), columnKey(c.table, c.column)).toBe(
        ENC,
      );
    }
    for (const t of report.targets) {
      expect(t.checksumAfter, t.key).toBe(backfillChecksums[t.key]);
    }
    // the whole data set, updated_at included, is what it was before the backfill
    expect(await dumpTables(db, false, SKIP_ACCESS)).toBe(beforeBackfill);
    // the backup rows stay as the record
    expect(await count("SELECT count(*)::int AS n FROM backfill_150_originals")).toBeGreaterThan(
      30,
    );
  });

  it("skips an already-restored row on a second run", async () => {
    await restore({ apply: true });
    const after = await dumpTables(db, false);
    const second = await restore({ apply: true });
    const notes = classOf(second, "persons.notes");
    expect(notes.restorable).toEqual([]);
    expect(notes.already_restored).toHaveLength(4);
    expect(second.targets.every((t) => t.restored === 0)).toBe(true);
    expect(await dumpTables(db, false)).toBe(after);
  });

  it("records a marker row per apply run, and none for a dry run", async () => {
    await restore();
    expect(
      await count("SELECT count(*)::int AS n FROM data_backfills WHERE name LIKE $1", [
        `${RESTORE_MARKER_PREFIX}%`,
      ]),
    ).toBe(0);
    await restore({ apply: true });
    const { rows } = await db.query<{
      name: string;
      report: { columns: Record<string, { restored: number }> };
    }>("SELECT name, report FROM data_backfills WHERE name LIKE $1", [`${RESTORE_MARKER_PREFIX}%`]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.name).toMatch(/^150-plain-text-restore-\d{8}T\d{6}\d{3}$/);
    expect(rows[0]!.report.columns["persons.notes"]!.restored).toBe(4);
  });

  it("restricts to --table / --column", async () => {
    await restore({ apply: true, table: "persons", column: "notes" });
    expect(await cell(db, "persons", "notes", "p-r1")).toBe("x &amp; y");
    expect(await cell(db, "persons", "first_name", ids["persons"]!)).toBe(DEC);
    expect(await cell(db, "events", "title", ids["events"]!)).toBe(DEC);
  });
});

describe("conflicts", () => {
  beforeEach(async () => {
    // A stale-form save, or a later edit by the researcher.
    await db.query(`UPDATE persons SET notes = 'edited since the backfill' WHERE id = 'p-edit'`);
  });

  it("reports an edited row as a conflict and leaves it alone without --force", async () => {
    const dryReport = await restore();
    expect(classOf(dryReport, "persons.notes").conflict).toEqual(["p-edit"]);
    expect(classOf(dryReport, "persons.notes").restorable).not.toContain("p-edit");
    expect(lines.join("\n")).toContain("conflict: persons.notes:p-edit");

    const report = await restore({ apply: true });
    expect(classOf(report, "persons.notes").conflict).toEqual(["p-edit"]);
    expect(await cell(db, "persons", "notes", "p-edit")).toBe("edited since the backfill");
    expect(await cell(db, "persons", "notes", "p-r1")).toBe("x &amp; y"); // the rest were restored
  });

  it("after restoring the rest and reverting the edited row by hand, checksums match the pre-backfill ones", async () => {
    await restore({ apply: true });
    await db.query(`UPDATE persons SET notes = 'e &amp; f' WHERE id = 'p-edit'`);
    const report = await restore();
    expect(report.targets.find((t) => t.key === "persons.notes")!.checksumAfter).toBe(
      backfillChecksums["persons.notes"],
    );
  });

  it("restores a conflict only with --force, only for the id named", async () => {
    await db.query(`UPDATE persons SET notes = 'second edit' WHERE id = 'p-r2'`);
    const named: IdEntry[] = [{ key: "persons.notes", id: "p-edit" }];
    const report = await restore({ apply: true, all: false, ids: named, force: true });
    expect(await cell(db, "persons", "notes", "p-edit")).toBe("e &amp; f");
    expect(report.targets.find((t) => t.key === "persons.notes")!.forced).toBe(1);
    // p-r2 is a conflict too but was not named: untouched, and not even selected
    expect(await cell(db, "persons", "notes", "p-r2")).toBe("second edit");
  });

  it("refuses --force without --ids, and with --all", async () => {
    await expect(restore({ apply: true, force: true })).rejects.toThrow(/--force.*--ids/);
    await expect(
      restore({
        apply: true,
        force: true,
        all: true,
        ids: [{ key: "persons.notes", id: "p-edit" }],
      }),
    ).rejects.toThrow(/exactly one of/);
    expect(await cell(db, "persons", "notes", "p-edit")).toBe("edited since the backfill");
  });
});

describe("selection", () => {
  it("restores only the ids in the file, accepting keyed and bare ids", async () => {
    const entries = parseIdsFile("persons.notes:p-r1  # keyed\n");
    await restore({ apply: true, all: false, ids: entries });
    expect(await cell(db, "persons", "notes", "p-r1")).toBe("x &amp; y");
    expect(await cell(db, "persons", "notes", "p-r2")).toBe("q &lt; r"); // untouched, as decoded
  });

  it("needs --table for a bare id", async () => {
    await expect(restore({ all: false, ids: parseIdsFile("p-r1") })).rejects.toThrow(
      /needs --table/,
    );
    const report = await restore({
      apply: true,
      all: false,
      table: "persons",
      column: "notes",
      ids: parseIdsFile("p-r1"),
    });
    expect(report.applied).toBe(true);
    expect(await cell(db, "persons", "notes", "p-r1")).toBe("x &amp; y");
  });

  it("refuses an apply that names an id the backup does not hold, and writes nothing", async () => {
    const before = await dumpTables(db);
    await expect(
      restore({
        apply: true,
        all: false,
        ids: parseIdsFile("persons.notes:p-r1\npersons.notes:p-typo"),
      }),
    ).rejects.toThrow(/not in the backup/);
    expect(await dumpTables(db)).toBe(before);
    expect(lines.join("\n")).toContain("persons.notes:p-typo");
  });

  it("refuses unclear selections", async () => {
    await expect(restore({ all: false })).rejects.toThrow(/exactly one of/);
    // An empty or comment-only --ids file must not "succeed" with nothing restored.
    await expect(restore({ ids: [] })).rejects.toThrow(/exactly one of/); // with the helper's --all
    await expect(restore({ ids: [], all: false })).rejects.toThrow(/names no rows/);
    expect(parseIdsFile("# only a comment\n\n")).toEqual([]);
    await expect(restore({ column: "notes" })).rejects.toThrow(/--column requires --table/);
    await expect(restore({ table: "locations" })).rejects.toThrow(/not a backfill table/);
    expect(() => parseIdsFile("persons.notes p-r1")).toThrow(Refusal);
  });

  it("reports a row deleted since the backfill as missing", async () => {
    await db.query(`DELETE FROM persons WHERE id = 'p-r1'`);
    const report = await restore({ apply: true });
    expect(classOf(report, "persons.notes").missing).toEqual(["p-r1"]);
  });
});

describe("guards", () => {
  it("refuses a mismatched branch id and a NULL one before any other statement", async () => {
    await setBranch(db, "br-other");
    await expect(restore({ apply: true })).rejects.toThrow(/br-other, expected br-test-123/);
    await db.exec("RESET neon.branch_id");
    await expect(restore({ apply: true })).rejects.toThrow(/NULL/);
    expect(log).toHaveLength(2);
    await setBranch(db, BRANCH);
    expect(await cell(db, "persons", "notes", "p-r1")).toBe("x & y");
  });

  it("accepts --local on a database that reports no Neon branch", async () => {
    await db.exec("RESET neon.branch_id");
    const report = await restore({ expectBranch: undefined, local: true });
    expect(report.branchId).toBeNull();
  });

  it("refuses where the backfill never ran", async () => {
    await db.query("DELETE FROM data_backfills");
    await expect(restore({ apply: true })).rejects.toThrow(/no "150-plain-text" marker/);
  });
});

describe("access_requests (restore source: the G3 backup branch)", () => {
  const fromClient = () => pgliteClient(branchDb);

  it("is refused without --from-url, because backfill_150_originals never holds it", async () => {
    await expect(restore({ table: "access_requests" })).rejects.toThrow(/--from-url/);
    expect(
      await count(
        "SELECT count(*)::int AS n FROM backfill_150_originals WHERE table_name = 'access_requests'",
      ),
    ).toBe(0);
  });

  it("needs the backup branch's own identity, and checks it", async () => {
    await expect(restore({ table: "access_requests", fromClient: fromClient() })).rejects.toThrow(
      /--from-expect-branch/,
    );
    await expect(
      restore({
        table: "access_requests",
        fromClient: fromClient(),
        fromExpectBranch: "br-wrong",
        apply: true,
      }),
    ).rejects.toThrow(/backup branch.*br-backup-456, expected br-wrong/);
    expect(await cell(db, "access_requests", "name", ids["access_requests"]!)).toBe(DEC);
  });

  it("restores the original from the branch, skipping rows the backfill did not change", async () => {
    const dryReport = await restore({
      table: "access_requests",
      fromClient: fromClient(),
      fromExpectBranch: BACKUP_BRANCH,
    });
    const name = classOf(dryReport, "access_requests.name");
    expect(name.restorable).toEqual([ids["access_requests"]]);
    expect(name.already_restored).toEqual([]);
    expect(await cell(db, "access_requests", "name", ids["access_requests"]!)).toBe(DEC);

    const branchBefore = await dumpTables(branchDb);
    const report = await restore({
      table: "access_requests",
      fromClient: fromClient(),
      fromExpectBranch: BACKUP_BRANCH,
      apply: true,
    });
    expect(await dumpTables(branchDb)).toBe(branchBefore); // the backup branch is only read
    await expect(branchDb.exec("CREATE TEMP TABLE t_free (x int)")).resolves.toBeDefined(); // and no read-only transaction is left open
    for (const column of ["name", "institution", "research_area", "tool_gap"]) {
      expect(await cell(db, "access_requests", column, ids["access_requests"]!), column).toBe(ENC);
    }
    expect(await cell(db, "access_requests", "name", "ar-untouched")).toBe("Plain Name");
    expect(await cell(db, "access_requests", "name", "ar-resubmitted")).toBe(DEC);
    expect(classOf(report, "access_requests.name").restorable).toEqual([ids["access_requests"]]);
    expect(lines.join("\n")).not.toContain("Müller");
  });

  it("reports an access_request edited since the backfill as a conflict", async () => {
    await db.query(`UPDATE access_requests SET name = 'renamed by the operator' WHERE id = $1`, [
      ids["access_requests"],
    ]);
    const report = await restore({
      table: "access_requests",
      fromClient: fromClient(),
      fromExpectBranch: BACKUP_BRANCH,
      apply: true,
    });
    expect(classOf(report, "access_requests.name").conflict).toEqual([ids["access_requests"]]);
    expect(await cell(db, "access_requests", "name", ids["access_requests"]!)).toBe(
      "renamed by the operator",
    );
    expect(await cell(db, "access_requests", "institution", ids["access_requests"]!)).toBe(ENC);
  });
});
