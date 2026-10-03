import { BACKFILL_MARKER } from "./columns";
import {
  assertIdentity,
  countOf,
  inTransaction,
  ident,
  parseCutoff,
  Refusal,
  type SqlClient,
} from "./db";
import { decodeSql, ENTITY_PATTERN_SQL } from "./decode";
import { findTarget, TARGETS, type Target } from "./targets";

/**
 * The guarded, owner-run backfill of #150: decode the entities `sanitize()`
 * stored, once, in one transaction. See "Backfill design" in
 * `docs/specs/150-plain-text-storage/plan.md`; this file implements "Script
 * behaviour" step by step. Nothing here prints a stored value: counts, ids and
 * checksums only (terminal output gets pasted into issues).
 */

export interface BackfillOptions {
  /** `--cutoff`: required in every mode. Rows at or after it are excluded. */
  cutoff?: string | undefined;
  expectBranch?: string | undefined;
  local?: boolean | undefined;
  /** Without it the run is a dry run inside a READ ONLY transaction. */
  apply?: boolean | undefined;
  /** `--expect-rows`: required with `apply`; the dry run's `rows_to_decode` total. */
  expectRows?: number | undefined;
  /** Parsed `--keep-encoded` file: `table.column:id` entries to leave as stored. */
  keepEncoded?: KeepEntry[] | undefined;
  /**
   * Test hook: the SQL decoder used for the writes. Defaults to the real one.
   * The review list and the length check never use it, so a wrong decoder is
   * caught by the in-transaction verification.
   */
  decodeSql?: ((expr: string) => string) | undefined;
}

export interface KeepEntry {
  key: string;
  id: string;
}

export interface TargetReport {
  key: string;
  nonNull: number;
  rowsToDecode: number;
  keptEncoded: number;
  excludedAfterCutoff: number;
  rowsChangedBySecondDecode: number;
  rowsNotSanitizeShaped: number;
  nAmp: number;
  nLt: number;
  nGt: number;
  checksumBefore: string;
  checksumAfter?: string;
  decodeIds: string[];
  keptIds: string[];
  excludedIds: string[];
  review: { id: string; signals: string[]; kept: boolean }[];
}

export interface ActivityGroupReport {
  entityType: string;
  fieldPath: string;
  rowsToDecode: number;
  excludedAfterCutoff: number;
}

export interface BackfillReport {
  mode: "dry-run" | "apply";
  branchId: string | null;
  cutoff: string;
  targets: TargetReport[];
  activity: ActivityGroupReport[];
  /** Σ rows_to_decode over the 36 columns + activity rows needing a decode. `--expect-rows` must equal this. */
  totalRowsToDecode: number;
  excludedAfterCutoff: number;
  keptEncoded: number;
  collisions: { projectId: string; colliding: number; ids: string[] }[];
  blockers: string[];
  applied: boolean;
}

type Out = (line: string) => void;

interface Candidate {
  id: string;
  before_cutoff: boolean;
  s1: boolean;
  s2: boolean;
  unshaped: boolean;
  second: boolean;
  len: number;
  n_amp: number;
  n_lt: number;
  n_gt: number;
  etype?: string;
  fpath?: string;
}

interface ColumnState {
  rows: number;
  nonNull: number;
  checksumAll: string;
  checksumOutside: string;
  decodeLength: number;
  decodeWithEntity: number;
}

interface TargetPlan {
  target: Target;
  candidates: Candidate[];
  decodeSet: Candidate[];
  report: TargetReport;
  stateBefore: ColumnState;
}

const P = ENTITY_PATTERN_SQL;

/** Parses a `--keep-encoded` file: one `table.column:id` per line, `#` comments allowed. */
export function parseKeepEncoded(text: string): KeepEntry[] {
  const entries: KeepEntry[] = [];
  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (line === "") continue;
    const match = /^([a-z_]+\.[a-z_]+):(\S+)$/.exec(line);
    if (!match) {
      throw new Refusal(`--keep-encoded line ${index + 1} is not "table.column:id".`);
    }
    entries.push({ key: match[1]!, id: match[2]! });
  }
  return entries;
}

/** Argument checks that need no database. Run before connecting. */
export function validateBackfillOptions(options: BackfillOptions): {
  cutoff: string;
} {
  const cutoff = parseCutoff(options.cutoff);
  if (options.apply) {
    const n = options.expectRows;
    if (n === undefined || !Number.isInteger(n) || n < 0) {
      throw new Refusal(
        "--apply requires --expect-rows <n>: the rows_to_decode total of a dry run with the same cutoff and --keep-encoded.",
      );
    }
  }
  for (const entry of options.keepEncoded ?? []) {
    if (!TARGETS.some((t) => t.key === entry.key)) {
      throw new Refusal(`--keep-encoded names ${entry.key}, which is not a backfill column.`);
    }
  }
  return { cutoff };
}

async function columnState(
  client: SqlClient,
  target: Target,
  decodeIds: string[],
): Promise<ColumnState> {
  const raw = `coalesce(${target.rawExpr}, chr(1) || 'NULL')`;
  const inD = "t.id = ANY($1::text[])";
  const { rows } = await client.query<{
    rows: number;
    non_null: number;
    checksum_all: string;
    checksum_outside: string;
    d_length: number | string;
    d_with_entity: number;
  }>(
    `SELECT count(*)::int AS rows,
            count(${target.rawExpr})::int AS non_null,
            md5(coalesce(string_agg(t.id || ':' || ${raw}, '|' ORDER BY t.id), '')) AS checksum_all,
            md5(coalesce(string_agg(t.id || ':' || ${raw}, '|' ORDER BY t.id) FILTER (WHERE NOT (${inD})), '')) AS checksum_outside,
            coalesce(sum(length(${target.valExpr})) FILTER (WHERE ${inD}), 0)::bigint AS d_length,
            count(*) FILTER (WHERE ${inD} AND (${target.valExpr}) ~ '${P}')::int AS d_with_entity
       FROM ${ident(target.table)} t`,
    [decodeIds],
  );
  const r = rows[0]!;
  return {
    rows: Number(r.rows),
    nonNull: Number(r.non_null),
    checksumAll: r.checksum_all,
    checksumOutside: r.checksum_outside,
    decodeLength: Number(r.d_length),
    decodeWithEntity: Number(r.d_with_entity),
  };
}

async function candidatesOf(
  client: SqlClient,
  target: Target,
  cutoff: string,
): Promise<Candidate[]> {
  const extra =
    target.kind === "json" ? `, t."entity_type"::text AS etype, t."field_path" AS fpath` : "";
  const extraOut = target.kind === "json" ? ", etype, fpath" : "";
  const { rows } = await client.query<Candidate>(
    `WITH s AS (
       SELECT t.id AS id, (${target.valExpr}) AS val, t.${ident(target.cutoffColumn)} AS ts${extra}
         FROM ${ident(target.table)} t
        WHERE ${target.scopeSql}
     )
     SELECT id,
            (ts < $1::timestamptz) AS before_cutoff,
            (${decodeSql("val")} ~ '&[A-Za-z#0-9]+;') AS s1,
            (val ~ '&lt;[A-Za-z!/?]') AS s2,
            (val ~ '[<>]' OR val ~ '&(?!(amp|lt|gt);)') AS unshaped,
            (val ~ '&amp;(amp|lt|gt);') AS second,
            length(val)::int AS len,
            ((length(val) - length(replace(val, '&amp;', ''))) / 5)::int AS n_amp,
            ((length(val) - length(replace(val, '&lt;', ''))) / 4)::int AS n_lt,
            ((length(val) - length(replace(val, '&gt;', ''))) / 4)::int AS n_gt${extraOut}
       FROM s
      WHERE val ~ '${P}'
      ORDER BY id`,
    [cutoff],
  );
  return rows;
}

async function planTarget(
  client: SqlClient,
  target: Target,
  cutoff: string,
  keptIds: Set<string>,
): Promise<TargetPlan> {
  const candidates = await candidatesOf(client, target, cutoff);
  const before = candidates.filter((c) => c.before_cutoff);
  for (const id of keptIds) {
    if (!before.some((c) => c.id === id)) {
      throw new Refusal(
        `--keep-encoded ${target.key}:${id} does not name a row that would be decoded (wrong id, a row at or after the cutoff, or a value without an entity). Fix the entry: a typo here would leave the intended row decoded.`,
      );
    }
  }
  const decodeSet = before.filter((c) => !keptIds.has(c.id));
  const decodeIds = decodeSet.map((c) => c.id);
  const stateBefore = await columnState(client, target, decodeIds);
  const sum = (f: (c: Candidate) => number) => decodeSet.reduce((acc, c) => acc + f(c), 0);
  const report: TargetReport = {
    key: target.key,
    nonNull: stateBefore.nonNull,
    rowsToDecode: decodeSet.length,
    keptEncoded: keptIds.size,
    excludedAfterCutoff: candidates.filter((c) => !c.before_cutoff).length,
    rowsChangedBySecondDecode: decodeSet.filter((c) => c.second).length,
    rowsNotSanitizeShaped: before.filter((c) => c.unshaped).length,
    nAmp: sum((c) => c.n_amp),
    nLt: sum((c) => c.n_lt),
    nGt: sum((c) => c.n_gt),
    checksumBefore: stateBefore.checksumAll,
    decodeIds,
    keptIds: [...keptIds].sort(),
    excludedIds: candidates.filter((c) => !c.before_cutoff).map((c) => c.id),
    review: before
      .filter((c) => c.s1 || c.s2)
      .map((c) => ({
        id: c.id,
        signals: [
          ...(c.s1 ? ["decoded-still-has-entity"] : []),
          ...(c.s2 ? ["lt-before-tag-char"] : []),
        ],
        kept: keptIds.has(c.id),
      })),
  };
  return { target, candidates, decodeSet, report, stateBefore };
}

/** [R4] Activity rows (not cells) needing a decode, filtered before grouping. */
function activityGroups(plans: TargetPlan[]): {
  groups: ActivityGroupReport[];
  rowsToDecode: number;
} {
  const toDecode = new Map<string, { etype: string; fpath: string }>();
  const excluded = new Map<string, { etype: string; fpath: string }>();
  for (const plan of plans) {
    if (plan.target.kind !== "json") continue;
    for (const c of plan.candidates) {
      const info = { etype: c.etype ?? "", fpath: c.fpath ?? "" };
      if (!c.before_cutoff) excluded.set(c.id, info);
    }
    for (const c of plan.decodeSet) {
      toDecode.set(c.id, { etype: c.etype ?? "", fpath: c.fpath ?? "" });
    }
  }
  const groups = new Map<string, ActivityGroupReport>();
  const bump = (
    info: { etype: string; fpath: string },
    field: "rowsToDecode" | "excludedAfterCutoff",
  ) => {
    const k = `${info.etype}/${info.fpath}`;
    const g = groups.get(k) ?? {
      entityType: info.etype,
      fieldPath: info.fpath,
      rowsToDecode: 0,
      excludedAfterCutoff: 0,
    };
    g[field] += 1;
    groups.set(k, g);
  };
  for (const info of toDecode.values()) bump(info, "rowsToDecode");
  for (const info of excluded.values()) bump(info, "excludedAfterCutoff");
  return {
    groups: [...groups.values()].sort((a, b) =>
      `${a.entityType}/${a.fieldPath}`.localeCompare(`${b.entityType}/${b.fieldPath}`),
    ),
    rowsToDecode: toDecode.size,
  };
}

/** G1 query 4 inside the transaction: unique keys after the decode (expected: none). */
async function findCollisions(
  client: SqlClient,
  cutoff: string,
  keptIds: string[],
  decode: (expr: string) => string,
): Promise<BackfillReport["collisions"]> {
  const { rows } = await client.query<{
    project_id: string;
    colliding: number;
    ids: string;
  }>(
    `SELECT project_id, count(*)::int AS colliding, string_agg(id, ',' ORDER BY id) AS ids
       FROM (SELECT id, project_id,
                    CASE WHEN id = ANY($2::text[]) THEN name
                         WHEN name ~ '${P}' AND updated_at < $1::timestamptz THEN ${decode("name")}
                         ELSE name END AS after_backfill
               FROM event_types) d
      GROUP BY project_id, after_backfill
     HAVING count(*) > 1
      ORDER BY project_id`,
    [cutoff, keptIds],
  );
  return rows.map((r) => ({
    projectId: r.project_id,
    colliding: Number(r.colliding),
    ids: r.ids.split(","),
  }));
}

async function tableExists(client: SqlClient, name: string): Promise<boolean> {
  const { rows } = await client.query<{ r: string | null }>("SELECT to_regclass($1)::text AS r", [
    `public.${name}`,
  ]);
  return rows[0]?.r != null;
}

async function assertNotYetRun(client: SqlClient): Promise<void> {
  if (
    !(await tableExists(client, "data_backfills")) ||
    !(await tableExists(client, "backfill_150_originals"))
  ) {
    throw new Refusal(
      "data_backfills / backfill_150_originals do not exist: the schema-only migration of T4 has not been applied here.",
    );
  }
  const marker = await countOf(
    client,
    "SELECT count(*)::int AS n FROM data_backfills WHERE name = $1",
    [BACKFILL_MARKER],
  );
  if (marker > 0) {
    throw new Refusal(
      `Run-once refused: data_backfills already holds "${BACKFILL_MARKER}". The decode is not idempotent (stored &amp;lt; would become <), so a second run is never allowed.`,
    );
  }
  const originals = await countOf(client, "SELECT count(*)::int AS n FROM backfill_150_originals");
  if (originals > 0) {
    throw new Refusal(
      `Refused: backfill_150_originals already holds ${originals} rows but there is no run marker. Something touched this database before; find out what, do not run over it.`,
    );
  }
}

function resolveKeep(entries: KeepEntry[] | undefined): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const { key, id } of entries ?? []) {
    const set = map.get(key) ?? new Set<string>();
    set.add(id);
    map.set(key, set);
  }
  return map;
}

function pad(value: string | number, width: number): string {
  return String(value).padStart(width);
}

function printReport(report: BackfillReport, out: Out): void {
  out(
    `Backfill #150 (${report.mode}) on neon.branch_id=${report.branchId ?? "NULL (--local)"}, cutoff ${report.cutoff}`,
  );
  out("");
  out(
    "column                                  non_null to_decode kept excluded second unshaped n_amp  n_lt  n_gt checksum_before",
  );
  for (const t of report.targets) {
    out(
      `${t.key.padEnd(38)} ${pad(t.nonNull, 9)} ${pad(t.rowsToDecode, 9)} ${pad(t.keptEncoded, 4)} ${pad(t.excludedAfterCutoff, 8)} ${pad(t.rowsChangedBySecondDecode, 6)} ${pad(t.rowsNotSanitizeShaped, 8)} ${pad(t.nAmp, 5)} ${pad(t.nLt, 5)} ${pad(t.nGt, 5)} ${t.checksumBefore}${t.checksumAfter ? ` -> ${t.checksumAfter}` : ""}`,
    );
  }
  out("");
  out("entity_activity rows (distinct snapshots needing a decode, per group):");
  if (report.activity.length === 0) out("  (none)");
  for (const g of report.activity) {
    out(
      `  ${g.entityType}/${g.fieldPath}: rows_to_decode=${g.rowsToDecode} excluded_after_cutoff=${g.excludedAfterCutoff}`,
    );
  }
  out("");
  out(
    `G1b review list (ids only; probable typed entity text; default is decode, add to --keep-encoded to leave as stored):`,
  );
  let reviewCount = 0;
  for (const t of report.targets) {
    for (const r of t.review) {
      reviewCount += 1;
      out(`  ${t.key}:${r.id}  # ${r.signals.join(",")}${r.kept ? " [kept encoded]" : ""}`);
    }
  }
  if (reviewCount === 0) out("  (none)");
  out("");
  out("Excluded: written at or after the cutoff, left untouched (ids only):");
  let excludedCount = 0;
  for (const t of report.targets) {
    for (const id of t.excludedIds) {
      excludedCount += 1;
      out(`  ${t.key}:${id}`);
    }
  }
  if (excludedCount === 0) out("  (none)");
  if (report.collisions.length > 0) {
    out("");
    out("event_types name collisions after decoding (project_id, ids):");
    for (const c of report.collisions) {
      out(`  ${c.projectId}: ${c.ids.join(",")}`);
    }
  }
  out("");
  out(`rows_to_decode TOTAL: ${report.totalRowsToDecode}`);
  out(`excluded_after_cutoff TOTAL: ${report.excludedAfterCutoff}`);
  out(`kept_encoded TOTAL: ${report.keptEncoded}`);
  if (report.blockers.length > 0) {
    out("");
    for (const b of report.blockers) out(`BLOCKER: ${b}`);
  }
}

async function buildReport(
  client: SqlClient,
  options: BackfillOptions,
  cutoff: string,
  branchId: string | null,
  decode: (expr: string) => string,
): Promise<{ report: BackfillReport; plans: TargetPlan[] }> {
  const keep = resolveKeep(options.keepEncoded);
  const plans: TargetPlan[] = [];
  for (const target of TARGETS) {
    plans.push(await planTarget(client, target, cutoff, keep.get(target.key) ?? new Set()));
  }
  const activity = activityGroups(plans);
  const textTotal = plans
    .filter((p) => p.target.kind === "text")
    .reduce((acc, p) => acc + p.report.rowsToDecode, 0);
  const keptEventTypeNames =
    plans.find((p) => p.target.key === "event_types.name")?.report.keptIds ?? [];
  const collisions = await findCollisions(client, cutoff, keptEventTypeNames, decode);

  const excludedIds = new Set<string>();
  let excludedTotal = 0;
  for (const p of plans) {
    if (p.target.kind === "text") excludedTotal += p.report.excludedAfterCutoff;
    else for (const id of p.report.excludedIds) excludedIds.add(id);
  }
  excludedTotal += excludedIds.size;

  const blockers: string[] = [];
  const unshaped = plans.flatMap((p) =>
    p.decodeSet.filter((c) => c.unshaped).map((c) => `${p.target.key}:${c.id}`),
  );
  if (unshaped.length > 0) {
    blockers.push(
      `${unshaped.length} row(s) to decode are not sanitize()-shaped (raw < > or an & outside amp/lt/gt) and so were not written by sanitize(): ${unshaped.join(", ")}. Decide each one, then list it in --keep-encoded.`,
    );
  }
  if (collisions.length > 0) {
    blockers.push(
      "event_types (project_id, name) would collide after decoding; resolve by hand before any run.",
    );
  }

  const report: BackfillReport = {
    mode: options.apply ? "apply" : "dry-run",
    branchId,
    cutoff,
    targets: plans.map((p) => p.report),
    activity: activity.groups,
    totalRowsToDecode: textTotal + activity.rowsToDecode,
    excludedAfterCutoff: excludedTotal,
    keptEncoded: plans.reduce((acc, p) => acc + p.report.keptEncoded, 0),
    collisions,
    blockers,
    applied: false,
  };
  return { report, plans };
}

async function applyTarget(
  client: SqlClient,
  plan: TargetPlan,
  decode: (expr: string) => string,
): Promise<void> {
  const { target } = plan;
  const ids = plan.report.decodeIds;
  if (ids.length === 0) return;
  const col = ident(target.column);
  const tbl = ident(target.table);

  if (!target.backup) {
    // access_requests: no long-lived copy (#29). Restore path is the G3 branch.
    const changed = await countOf(
      client,
      `WITH u AS (UPDATE ${tbl} AS t SET ${col} = ${decode(`t.${col}`)}
                   WHERE t.id = ANY($1::text[]) AND t.${col} ~ '${P}' RETURNING 1)
       SELECT count(*)::int AS n FROM u`,
      [ids],
    );
    if (changed !== ids.length) {
      throw new Error(
        `${target.key}: updated ${changed} rows, expected ${ids.length}. Rolled back.`,
      );
    }
    return;
  }

  // [R5] Back up first: original and decoded values, keyed by (table, column, row id).
  if (target.kind === "text") {
    await client.query(
      `INSERT INTO backfill_150_originals (table_name, column_name, row_id, original_text, decoded_text)
       SELECT $1::text, $2::text, t.id, t.${col}, ${decode(`t.${col}`)}
         FROM ${tbl} t WHERE t.id = ANY($3::text[])`,
      [target.table, target.column, ids],
    );
  } else {
    await client.query(
      `INSERT INTO backfill_150_originals (table_name, column_name, row_id, original_json, decoded_json)
       SELECT $1::text, $2::text, t.id, t.${col}, to_jsonb(${decode(`(t.${col} #>> '{}')`)})
         FROM ${tbl} t WHERE t.id = ANY($3::text[])`,
      [target.table, target.column, ids],
    );
  }

  // Then update by joining on the backup rows, guarded by the value that was backed up.
  const set = target.kind === "text" ? "decoded_text" : "decoded_json";
  const orig = target.kind === "text" ? "original_text" : "original_json";
  const changed = await countOf(
    client,
    `WITH u AS (UPDATE ${tbl} AS t SET ${col} = b.${set}
                  FROM backfill_150_originals b
                 WHERE b.table_name = $1 AND b.column_name = $2 AND b.row_id = t.id
                   AND t.${col} IS NOT DISTINCT FROM b.${orig}
             RETURNING 1)
     SELECT count(*)::int AS n FROM u`,
    [target.table, target.column],
  );
  if (changed !== ids.length) {
    throw new Error(`${target.key}: updated ${changed} rows, expected ${ids.length}. Rolled back.`);
  }
}

/**
 * In-transaction (and again after commit) verification, per column, from the
 * figures taken in the same transaction before the update:
 *  - sum(length) after = before - 4*n_amp - 3*n_lt - 3*n_gt over the decoded rows;
 *  - rows still holding an entity = rows_changed_by_second_decode before;
 *  - row and non-null counts unchanged, and every row outside the decode set
 *    byte-for-byte unchanged (checksum);
 *  - backup rows = rows changed.
 */
async function verifyTarget(client: SqlClient, plan: TargetPlan): Promise<ColumnState> {
  const { target, report, stateBefore } = plan;
  const after = await columnState(client, target, report.decodeIds);
  const fail = (what: string): never => {
    throw new Error(`Verification failed for ${target.key}: ${what}.`);
  };
  if (after.rows !== stateBefore.rows) fail("row count changed");
  if (after.nonNull !== stateBefore.nonNull) fail("non-null count changed");
  if (after.checksumOutside !== stateBefore.checksumOutside) {
    fail("a row outside the decode set changed");
  }
  const expectedLength =
    stateBefore.decodeLength - 4 * report.nAmp - 3 * report.nLt - 3 * report.nGt;
  if (after.decodeLength !== expectedLength) {
    fail(
      `length identity broken (expected ${expectedLength}, got ${after.decodeLength}); the decoder is wrong`,
    );
  }
  if (after.decodeWithEntity !== report.rowsChangedBySecondDecode) {
    fail(
      `${after.decodeWithEntity} rows still hold an entity, expected ${report.rowsChangedBySecondDecode}`,
    );
  }
  if (target.backup) {
    const backups = await countOf(
      client,
      "SELECT count(*)::int AS n FROM backfill_150_originals WHERE table_name = $1 AND column_name = $2",
      [target.table, target.column],
    );
    if (backups !== report.rowsToDecode) {
      fail(`${backups} backup rows, expected ${report.rowsToDecode}`);
    }
  }
  return after;
}

const TX_BEGIN_APPLY = "BEGIN ISOLATION LEVEL REPEATABLE READ";
const TX_BEGIN_DRY = "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY";

export async function runBackfill(
  client: SqlClient,
  options: BackfillOptions,
  out: Out = () => {},
): Promise<BackfillReport> {
  // 1. Arguments that need no database, then identity — before any other statement.
  const { cutoff } = validateBackfillOptions(options);
  const { branchId } = await assertIdentity(client, options);
  const decode = options.decodeSql ?? decodeSql;
  const apply = options.apply === true;

  const report = await inTransaction(
    client,
    apply ? TX_BEGIN_APPLY : TX_BEGIN_DRY,
    async () => {
      await client.query("SET LOCAL lock_timeout = '5s'");
      await client.query("SET LOCAL statement_timeout = '60s'");

      // 4. Run-once.
      await assertNotYetRun(client);

      const { report, plans } = await buildReport(client, options, cutoff, branchId, decode);

      if (!apply) {
        printReport(report, out);
        return report;
      }

      // 3. The owner applies what they reviewed.
      if (options.expectRows !== report.totalRowsToDecode) {
        throw new Refusal(
          `--expect-rows ${options.expectRows} does not match the live count ${report.totalRowsToDecode} (same cutoff, same --keep-encoded). Nothing was written; re-run the dry run and review what changed.`,
        );
      }
      const { rows: clock } = await client.query<{ ahead: boolean }>(
        "SELECT $1::timestamptz > now() AS ahead",
        [cutoff],
      );
      if (clock[0]?.ahead) {
        throw new Refusal(
          "--cutoff is later than the database clock: it would decode rows written after T3 went live.",
        );
      }
      if (report.blockers.length > 0) {
        printReport(report, out);
        throw new Refusal(report.blockers.join(" "));
      }

      // 5. Write: backups first, then the update, per column.
      for (const plan of plans) await applyTarget(client, plan, decode);

      // In-transaction verification: any mismatch raises and rolls back.
      for (const plan of plans) {
        plan.report.checksumAfter = (await verifyTarget(client, plan)).checksumAll;
      }
      const activityBackups = await countOf(
        client,
        "SELECT count(*)::int AS n FROM backfill_150_originals WHERE table_name = 'entity_activity'",
      );
      const activityCells = plans
        .filter((p) => p.target.kind === "json")
        .reduce((acc, p) => acc + p.report.rowsToDecode, 0);
      if (activityBackups !== activityCells) {
        throw new Error("Verification failed for entity_activity backups.");
      }

      // Run-once marker, with counts and checksums only.
      report.applied = true;
      await client.query("INSERT INTO data_backfills (name, report) VALUES ($1, $2::jsonb)", [
        BACKFILL_MARKER,
        JSON.stringify(markerReport(report)),
      ]);
      return report;
    },
    apply,
  );

  if (!apply) return report;
  printReport(report, out);

  // Verification again, after commit.
  await verifyAfterCommit(client, report, out);
  return report;
}

function markerReport(report: BackfillReport) {
  return {
    cutoff: report.cutoff,
    branch_id: report.branchId,
    total_rows_changed: report.totalRowsToDecode,
    excluded_after_cutoff: report.excludedAfterCutoff,
    kept_encoded: report.keptEncoded,
    columns: Object.fromEntries(
      report.targets.map((t) => [
        t.key,
        {
          rows_changed: t.rowsToDecode,
          kept_encoded: t.keptEncoded,
          checksum_before: t.checksumBefore,
          checksum_after: t.checksumAfter ?? null,
          // Columns without a backup row (access_requests) are restored from
          // the G3 branch. Only these ids were changed here, so only these may
          // be restored from it: a request re-submitted after G3 also decodes
          // cleanly but holds newer data (#158 review). Ids only, no values.
          ...(findTarget(t.key)?.backup === false ? { changed_ids: t.decodeIds } : {}),
        },
      ]),
    ),
    activity: report.activity.map((g) => ({
      entity_type: g.entityType,
      field_path: g.fieldPath,
      rows_changed: g.rowsToDecode,
    })),
  };
}

/** The same checks as in the transaction, from a fresh read-only one. */
async function verifyAfterCommit(
  client: SqlClient,
  report: BackfillReport,
  out: Out,
): Promise<void> {
  await inTransaction(
    client,
    TX_BEGIN_DRY,
    async () => {
      const marker = await countOf(
        client,
        "SELECT count(*)::int AS n FROM data_backfills WHERE name = $1",
        [BACKFILL_MARKER],
      );
      if (marker !== 1) {
        throw new Error("Post-commit verification: run marker is missing.");
      }
      for (const t of report.targets) {
        const target = TARGETS.find((x) => x.key === t.key)!;
        const state = await columnState(client, target, t.decodeIds);
        if (state.checksumAll !== t.checksumAfter) {
          throw new Error(
            `Post-commit verification failed for ${t.key}: the column changed after commit.`,
          );
        }
        if (state.decodeWithEntity !== t.rowsChangedBySecondDecode) {
          throw new Error(`Post-commit verification failed for ${t.key}: unexpected entity count.`);
        }
      }
    },
    false,
  );
  out("");
  out("Post-commit verification: OK. Open one affected record in the UI (expected: & shown once).");
}
