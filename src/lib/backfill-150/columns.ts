/**
 * The one list of columns the #150 plain-text backfill touches.
 *
 * `sanitize()` entity-encoded `&`, `<` and `>` on write. The backfill decodes
 * them once, in the 36 columns below and in the matching `entity_activity`
 * snapshots. The list is exported as a single constant so that the backfill,
 * the restore script, their tests and the write-site test of T3 are all driven
 * from the same source: a column missing here is a column nobody decodes.
 *
 * Source of truth: "Write sites — the backfill column list" in
 * `docs/specs/150-plain-text-storage/plan.md`.
 */

/**
 * Column that dates a row against `--cutoff`.
 *
 * `updated_at` for tables rewritten in place; `created_at` for the append-only
 * tables (`person_names` is rewritten whole on every person update,
 * `relation_evidence`, `property_evidence`, `entity_activity`) and for
 * `users.name`, which only registration writes.
 */
export type CutoffColumn = "updated_at" | "created_at";

export interface BackfillColumn {
  /** Postgres table name (the `@@map` name, not the Prisma model). */
  readonly table: string;
  readonly column: string;
  readonly cutoffColumn: CutoffColumn;
  /**
   * Whether every changed value is copied to `backfill_150_originals` first.
   * `false` only for `access_requests`: its retention promise (#29) forbids a
   * long-lived copy. Its restore path is the G3 backup branch (`--from-url`).
   */
  readonly backup: boolean;
}

function cols(
  table: string,
  cutoffColumn: CutoffColumn,
  columns: readonly string[],
  backup = true,
): BackfillColumn[] {
  return columns.map((column) => ({ table, column, cutoffColumn, backup }));
}

export const BACKFILL_COLUMNS: readonly BackfillColumn[] = [
  ...cols("users", "created_at", ["name"]),
  ...cols("persons", "updated_at", [
    "first_name",
    "last_name",
    "birth_place",
    "death_place",
    "notes",
  ]),
  ...cols("person_names", "created_at", ["name"]),
  ...cols("event_types", "updated_at", ["name", "icon"]),
  ...cols("events", "updated_at", ["title", "description", "location", "notes"]),
  ...cols("sources", "updated_at", [
    "title",
    "type",
    "author",
    "date",
    "repository",
    "call_number",
    "notes",
  ]),
  ...cols("relation_types", "updated_at", ["name", "inverse_name", "description", "icon"]),
  ...cols("relations", "updated_at", ["notes"]),
  ...cols("relation_evidence", "created_at", ["notes", "page_reference", "quote"]),
  ...cols("property_evidence", "created_at", [
    "notes",
    "page_reference",
    "quote",
    "raw_transcription",
  ]),
  ...cols(
    "access_requests",
    "updated_at",
    ["name", "institution", "research_area", "tool_gap"],
    false,
  ),
];

/**
 * `entity_activity` snapshots: JSON string leaves of `old_value`/`new_value`,
 * only for these `(entity_type, field_path)` pairs. Excluded on purpose:
 * `SOURCE.url` (never sanitized), every relation and evidence entry (raw or
 * ids only), and every non-string snapshot (JSON `null`, numbers, objects).
 * The table is append-only, so `created_at` dates a row.
 */
export const ACTIVITY_SCOPE: readonly {
  readonly entityType: "PERSON" | "EVENT" | "SOURCE";
  readonly fieldPaths: readonly string[];
}[] = [
  {
    entityType: "PERSON",
    fieldPaths: ["first_name", "last_name", "birth_place", "death_place", "notes"],
  },
  {
    entityType: "EVENT",
    fieldPaths: ["title", "description", "location", "notes"],
  },
  {
    entityType: "SOURCE",
    fieldPaths: ["title", "type", "author", "date", "repository", "call_number", "notes"],
  },
];

export const ACTIVITY_TABLE = "entity_activity";
export const ACTIVITY_COLUMNS = ["old_value", "new_value"] as const;
export const ACTIVITY_CUTOFF_COLUMN: CutoffColumn = "created_at";

/** Marker row that makes the (non-idempotent) decode run once. */
export const BACKFILL_MARKER = "150-plain-text";
/** Prefix of the marker row written by each restore run. */
export const RESTORE_MARKER_PREFIX = "150-plain-text-restore-";

/** `table.column` key used by `--keep-encoded`, the ids files and reports. */
export function columnKey(table: string, column: string): string {
  return `${table}.${column}`;
}
