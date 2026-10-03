import {
  ACTIVITY_TABLE,
  BACKFILL_COLUMNS,
  BACKFILL_MARKER,
  RESTORE_MARKER_PREFIX,
} from "./columns";
import { assertIdentity, countOf, ident, inTransaction, Refusal, type SqlClient } from "./db";
import { decodeEntities } from "./decode";
import { TARGETS, type Target } from "./targets";

/**
 * [R3] Selective restore of the #150 backfill: puts chosen rows back to the
 * values recorded in `backfill_150_originals`, so recovery never means
 * replacing production (which would lose every write since the backfill).
 * Same identity guard, dry run by default, no stored values printed.
 */

export interface IdEntry {
  /** `table.column`; absent for a bare id (then `--table` scopes it). */
  key?: string | undefined;
  id: string;
}

export interface RestoreOptions {
  expectBranch?: string | undefined;
  local?: boolean | undefined;
  apply?: boolean | undefined;
  table?: string | undefined;
  column?: string | undefined;
  /** Parsed `--ids` file. Exactly one of `ids` and `all`. */
  ids?: IdEntry[] | undefined;
  all?: boolean | undefined;
  /** Restore conflicts too (discards the later edit). Only for ids named in `ids`. */
  force?: boolean | undefined;
  /**
   * `--from-url`: a connection to the G3 backup branch, the only restore source
   * for `access_requests` (which `backfill_150_originals` never holds).
   */
  fromClient?: SqlClient | undefined;
  /** Identity guard for the `fromClient` connection: that branch's id. */
  fromExpectBranch?: string | undefined;
}

export type RowClass = "restorable" | "already_restored" | "conflict" | "missing";

export interface RestoreTargetReport {
  key: string;
  source: "backfill_150_originals" | "backup-branch";
  ids: Record<RowClass, string[]>;
  /** Rows restored by this run (apply only). */
  restored: number;
  forced: number;
  checksumAfter: string;
}

export interface RestoreReport {
  mode: "dry-run" | "apply";
  branchId: string | null;
  targets: RestoreTargetReport[];
  unmatchedIds: string[];
  applied: boolean;
}

type Out = (line: string) => void;

/** Parses an `--ids` file: `table.column:id` or a bare `id` per line, `#` comments allowed. */
export function parseIdsFile(text: string): IdEntry[] {
  const entries: IdEntry[] = [];
  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (line === "") continue;
    const keyed = /^([a-z_]+\.[a-z_]+):(\S+)$/.exec(line);
    if (keyed) {
      entries.push({ key: keyed[1]!, id: keyed[2]! });
    } else if (/^\S+$/.test(line) && !line.includes(":")) {
      entries.push({ id: line });
    } else {
      throw new Refusal(`--ids line ${index + 1} is neither "table.column:id" nor a bare id.`);
    }
  }
  return entries;
}

export function validateRestoreOptions(options: RestoreOptions): void {
  const { ids, all, force, table, column } = options;
  if ((ids === undefined) === (all !== true)) {
    // both given, or neither
    throw new Refusal("Give exactly one of --ids <file> or --all.");
  }
  if (ids !== undefined && ids.length === 0) {
    // An empty file would "restore" nothing and still write a success marker.
    throw new Refusal("--ids names no rows: the file is empty or holds only comments.");
  }
  if (column !== undefined && table === undefined) {
    throw new Refusal("--column requires --table.");
  }
  if (table !== undefined) {
    const known = new Set([...BACKFILL_COLUMNS.map((c) => c.table), ACTIVITY_TABLE]);
    if (!known.has(table)) {
      throw new Refusal(`--table ${table} is not a backfill table.`);
    }
    if (column !== undefined && !TARGETS.some((t) => t.table === table && t.column === column)) {
      throw new Refusal(`--column ${column} is not a backfill column of ${table}.`);
    }
  }
  if (force && ids === undefined) {
    throw new Refusal(
      "--force discards a later edit and is named per id: it requires --ids <file> and cannot be combined with --all.",
    );
  }
  for (const entry of ids ?? []) {
    if (entry.key === undefined && table === undefined) {
      throw new Refusal(
        `A bare id (${entry.id}) in --ids needs --table; or write it as table.column:id.`,
      );
    }
    if (entry.key !== undefined && !TARGETS.some((t) => t.key === entry.key)) {
      throw new Refusal(`--ids names ${entry.key}, which is not a backfill column.`);
    }
  }
  const wantsAccess =
    table === "access_requests" || (ids ?? []).some((e) => e.key?.startsWith("access_requests."));
  if (wantsAccess && options.fromClient === undefined) {
    throw new Refusal(
      "access_requests are not in backfill_150_originals (retention, #29). Restoring them needs --from-url, the G3 backup branch.",
    );
  }
  if (options.fromClient !== undefined && !options.fromExpectBranch) {
    throw new Refusal(
      "--from-url needs --from-expect-branch <id>: the identity guard applies to that connection too.",
    );
  }
}

function emptyIds(): Record<RowClass, string[]> {
  return { restorable: [], already_restored: [], conflict: [], missing: [] };
}

/** Targets selected by `--table` / `--column` / `--ids` keys. */
function selectTargets(options: RestoreOptions): Target[] {
  const keys = new Set((options.ids ?? []).flatMap((e) => (e.key ? [e.key] : [])));
  return TARGETS.filter((t) => {
    if (options.table !== undefined && t.table !== options.table) return false;
    if (options.column !== undefined && t.column !== options.column) return false;
    if (options.ids !== undefined && options.table === undefined) {
      // Only keyed entries select targets when no --table is given.
      return keys.has(t.key);
    }
    return true;
  }).filter((t) => t.backup || options.fromClient !== undefined);
}

function idsFor(options: RestoreOptions, target: Target): string[] | null {
  if (options.all) return null;
  return (options.ids ?? [])
    .filter((e) => (e.key === undefined ? true : e.key === target.key))
    .map((e) => e.id);
}

async function classifyBackedUp(
  client: SqlClient,
  target: Target,
  ids: string[] | null,
): Promise<Record<RowClass, string[]>> {
  const col = ident(target.column);
  const orig = target.kind === "text" ? "original_text" : "original_json";
  const dec = target.kind === "text" ? "decoded_text" : "decoded_json";
  const { rows } = await client.query<{ id: string; class: RowClass }>(
    `SELECT b.row_id AS id,
            CASE WHEN t.id IS NULL THEN 'missing'
                 WHEN t.${col} IS NOT DISTINCT FROM b.${orig} THEN 'already_restored'
                 WHEN t.${col} IS NOT DISTINCT FROM b.${dec} THEN 'restorable'
                 ELSE 'conflict' END AS class
       FROM backfill_150_originals b
       LEFT JOIN ${ident(target.table)} t ON t.id = b.row_id
      WHERE b.table_name = $1 AND b.column_name = $2
        AND ($3::text[] IS NULL OR b.row_id = ANY($3::text[]))
      ORDER BY b.row_id`,
    [target.table, target.column, ids],
  );
  const result = emptyIds();
  for (const r of rows) result[r.class].push(r.id);
  return result;
}

/** The part of the backfill's run marker the restore reads. */
interface MarkerReport {
  columns?: Record<string, { changed_ids?: unknown } | undefined>;
}

interface BranchRow {
  id: string;
  original: string;
  current: string | null | undefined;
}

/** access_requests: the original comes from the G3 backup branch, compared in memory (values never printed). */
async function loadBranchRows(
  client: SqlClient,
  fromClient: SqlClient,
  target: Target,
  ids: string[] | null,
  changedByBackfill: ReadonlySet<string>,
): Promise<BranchRow[]> {
  const col = ident(target.column);
  const { rows: originals } = await fromClient.query<{
    id: string;
    original: string | null;
  }>(
    `SELECT id, ${col} AS original FROM ${ident(target.table)}
      WHERE ${col} IS NOT NULL AND ($1::text[] IS NULL OR id = ANY($1::text[])) ORDER BY id`,
    [ids],
  );
  // Only rows the backfill actually changed, as recorded in its marker. A row
  // that merely decodes cleanly may have been re-submitted since the branch
  // was taken, and its current value is then newer data, not the backfill's.
  const changed = originals.filter(
    (r) =>
      changedByBackfill.has(r.id) &&
      r.original !== null &&
      decodeEntities(r.original) !== r.original,
  );
  const { rows: currents } = await client.query<{
    id: string;
    current: string | null;
  }>(`SELECT id, ${col} AS current FROM ${ident(target.table)} WHERE id = ANY($1::text[])`, [
    changed.map((r) => r.id),
  ]);
  const byId = new Map(currents.map((r) => [r.id, r.current]));
  return changed.map((r) => ({
    id: r.id,
    original: r.original as string,
    current: byId.has(r.id) ? byId.get(r.id) : undefined,
  }));
}

function classifyBranchRow(row: BranchRow): RowClass {
  if (row.current === undefined) return "missing";
  if (row.current === row.original) return "already_restored";
  if (row.current === decodeEntities(row.original)) return "restorable";
  return "conflict";
}

async function checksum(client: SqlClient, target: Target): Promise<string> {
  const { rows } = await client.query<{ c: string }>(
    `SELECT md5(coalesce(string_agg(t.id || ':' || coalesce(${target.rawExpr}, chr(1) || 'NULL'), '|' ORDER BY t.id), '')) AS c
       FROM ${ident(target.table)} t`,
  );
  return rows[0]!.c;
}

async function applyBackedUp(
  client: SqlClient,
  target: Target,
  ids: string[],
  guarded: boolean,
): Promise<number> {
  if (ids.length === 0) return 0;
  const col = ident(target.column);
  const orig = target.kind === "text" ? "original_text" : "original_json";
  const dec = target.kind === "text" ? "decoded_text" : "decoded_json";
  return countOf(
    client,
    `WITH u AS (UPDATE ${ident(target.table)} AS t SET ${col} = b.${orig}
                  FROM backfill_150_originals b
                 WHERE b.table_name = $1 AND b.column_name = $2 AND b.row_id = t.id
                   AND t.id = ANY($3::text[])
                   ${guarded ? `AND t.${col} IS NOT DISTINCT FROM b.${dec}` : ""}
             RETURNING 1)
     SELECT count(*)::int AS n FROM u`,
    [target.table, target.column, ids],
  );
}

async function verifyRestored(client: SqlClient, target: Target, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const col = ident(target.column);
  const orig = target.kind === "text" ? "original_text" : "original_json";
  const ok = await countOf(
    client,
    `SELECT count(*)::int AS n
       FROM ${ident(target.table)} t
       JOIN backfill_150_originals b ON b.table_name = $1 AND b.column_name = $2 AND b.row_id = t.id
      WHERE t.id = ANY($3::text[]) AND t.${col} IS NOT DISTINCT FROM b.${orig}`,
    [target.table, target.column, ids],
  );
  if (ok !== ids.length) {
    throw new Error(
      `Verification failed for ${target.key}: ${ok} of ${ids.length} restored rows equal the recorded original.`,
    );
  }
}

function printRestore(report: RestoreReport, out: Out): void {
  out(`Restore #150 (${report.mode}) on neon.branch_id=${report.branchId ?? "NULL (--local)"}`);
  out("");
  for (const t of report.targets) {
    out(
      `${t.key} [${t.source}]: restorable=${t.ids.restorable.length} already_restored=${t.ids.already_restored.length} conflict=${t.ids.conflict.length} missing=${t.ids.missing.length} restored=${t.restored} forced=${t.forced} checksum_now=${t.checksumAfter}`,
    );
    for (const cls of ["restorable", "already_restored", "conflict", "missing"] as const) {
      for (const id of t.ids[cls]) out(`  ${cls}: ${t.key}:${id}`);
    }
  }
  if (report.unmatchedIds.length > 0) {
    out("");
    out("ids named but not in the backup (typo, or never changed by the backfill):");
    for (const u of report.unmatchedIds) out(`  ${u}`);
  }
  const conflicts = report.targets.reduce((n, t) => n + t.ids.conflict.length, 0);
  if (conflicts > 0) {
    out("");
    out(
      `${conflicts} conflict(s): edited since the backfill. Skipped; --force with --ids restores a named one and discards the later edit.`,
    );
  }
}

const TX_BEGIN_APPLY = "BEGIN ISOLATION LEVEL REPEATABLE READ";
const TX_BEGIN_DRY = "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY";

export async function runRestore(
  client: SqlClient,
  options: RestoreOptions,
  out: Out = () => {},
): Promise<RestoreReport> {
  validateRestoreOptions(options);
  const { branchId } = await assertIdentity(client, options);
  if (options.fromClient !== undefined) {
    await assertIdentity(
      options.fromClient,
      { expectBranch: options.fromExpectBranch },
      "backup branch (--from-url)",
    );
    if (options.fromClient === client) {
      throw new Refusal("--from-url must be a different connection.");
    }
    // The backup branch is only ever read.
    await options.fromClient.query("BEGIN READ ONLY");
  }
  const apply = options.apply === true;

  let report: RestoreReport;
  try {
    report = await restoreInTransaction(client, options, branchId, apply, out);
  } finally {
    if (options.fromClient !== undefined) {
      await options.fromClient.query("ROLLBACK").catch(() => undefined);
    }
  }
  printRestore(report, out);
  return report;
}

async function restoreInTransaction(
  client: SqlClient,
  options: RestoreOptions,
  branchId: string | null,
  apply: boolean,
  out: Out,
): Promise<RestoreReport> {
  return inTransaction(
    client,
    apply ? TX_BEGIN_APPLY : TX_BEGIN_DRY,
    async () => {
      await client.query("SET LOCAL lock_timeout = '5s'");
      await client.query("SET LOCAL statement_timeout = '60s'");

      const { rows: markerRows } = await client.query<{ report: MarkerReport }>(
        "SELECT report FROM data_backfills WHERE name = $1",
        [BACKFILL_MARKER],
      );
      if (markerRows.length !== 1) {
        throw new Refusal(
          `Restore refused: data_backfills has no "${BACKFILL_MARKER}" marker, so there is nothing to restore here.`,
        );
      }

      const targets = selectTargets(options);
      const reports: RestoreTargetReport[] = [];
      const matched = new Set<string>();
      const branchRows = new Map<string, BranchRow[]>();
      const isNamed = (target: Target, id: string) =>
        (options.ids ?? []).some(
          (e) => e.id === id && (e.key === undefined || e.key === target.key),
        );
      const isForced = (target: Target, id: string) =>
        options.force === true && isNamed(target, id);

      for (const target of targets) {
        const ids = idsFor(options, target);
        let classes: Record<RowClass, string[]>;
        if (target.backup) {
          classes = await classifyBackedUp(client, target, ids);
        } else {
          const changedIds = markerRows[0]!.report.columns?.[target.key]?.changed_ids;
          if (!Array.isArray(changedIds)) {
            throw new Refusal(
              `Restore refused: the run marker records no changed ids for ${target.key}, so rows the backfill changed cannot be told apart from rows written later.`,
            );
          }
          const rows = await loadBranchRows(
            client,
            options.fromClient!,
            target,
            ids,
            new Set(changedIds),
          );
          branchRows.set(target.key, rows);
          classes = emptyIds();
          for (const row of rows) classes[classifyBranchRow(row)].push(row.id);
        }
        for (const list of Object.values(classes)) {
          for (const id of list) matched.add(`${target.key}:${id}`);
        }
        reports.push({
          key: target.key,
          source: target.backup ? "backfill_150_originals" : "backup-branch",
          ids: classes,
          restored: 0,
          forced: 0,
          checksumAfter: "",
        });
      }

      // Ids named in --ids that no selected target knows.
      const unmatched: string[] = [];
      for (const entry of options.ids ?? []) {
        const keys = entry.key !== undefined ? [entry.key] : targets.map((t) => t.key);
        if (!keys.some((k) => matched.has(`${k}:${entry.id}`))) {
          unmatched.push(`${entry.key ?? options.table}:${entry.id}`);
        }
      }

      if (apply) {
        if (unmatched.length > 0) {
          printRestore(
            { mode: "apply", branchId, targets: reports, unmatchedIds: unmatched, applied: false },
            out,
          );
          throw new Refusal(
            "Refused: some named ids are not in the backup. Fix the ids file; nothing was written.",
          );
        }
        for (const [index, target] of targets.entries()) {
          const r = reports[index]!;
          const forced = r.ids.conflict.filter((id) => isForced(target, id));
          if (target.backup) {
            const a = await applyBackedUp(client, target, r.ids.restorable, true);
            const b = await applyBackedUp(client, target, forced, false);
            if (a !== r.ids.restorable.length || b !== forced.length) {
              throw new Error(
                `${target.key}: restored ${a}+${b} rows, expected ${r.ids.restorable.length}+${forced.length}. Rolled back.`,
              );
            }
            await verifyRestored(client, target, [...r.ids.restorable, ...forced]);
          } else {
            const rows = branchRows.get(target.key) ?? [];
            const col = ident(target.column);
            for (const row of rows) {
              const cls = classifyBranchRow(row);
              const force = cls === "conflict" && isForced(target, row.id);
              if (cls !== "restorable" && !force) continue;
              const n = await countOf(
                client,
                `WITH u AS (UPDATE ${ident(target.table)} SET ${col} = $2
                             WHERE id = $1 ${force ? "" : `AND ${col} IS NOT DISTINCT FROM $3`}
                         RETURNING 1)
                 SELECT count(*)::int AS n FROM u`,
                force ? [row.id, row.original] : [row.id, row.original, row.current],
              );
              if (n !== 1) {
                throw new Error(`${target.key}: could not restore one row. Rolled back.`);
              }
            }
          }
          r.restored = r.ids.restorable.length + forced.length;
          r.forced = forced.length;
        }
      }

      for (const [index, target] of targets.entries()) {
        reports[index]!.checksumAfter = await checksum(client, target);
      }

      const result: RestoreReport = {
        mode: apply ? "apply" : "dry-run",
        branchId,
        targets: reports,
        unmatchedIds: unmatched,
        applied: apply,
      };

      if (apply) {
        await client.query(
          `INSERT INTO data_backfills (name, report)
           VALUES ($1::text || to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYYMMDD"T"HH24MISSMS'), $2::jsonb)`,
          [
            RESTORE_MARKER_PREFIX,
            JSON.stringify({
              branch_id: branchId,
              columns: Object.fromEntries(
                reports.map((r) => [
                  r.key,
                  {
                    restorable: r.ids.restorable.length,
                    already_restored: r.ids.already_restored.length,
                    conflict: r.ids.conflict.length,
                    missing: r.ids.missing.length,
                    restored: r.restored,
                    forced: r.forced,
                    checksum_after: r.checksumAfter,
                  },
                ]),
              ),
            }),
          ],
        );
      }
      return result;
    },
    apply,
  );
}
