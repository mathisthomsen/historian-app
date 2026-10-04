import {
  ACTIVITY_COLUMNS,
  ACTIVITY_CUTOFF_COLUMN,
  ACTIVITY_SCOPE,
  ACTIVITY_TABLE,
  BACKFILL_COLUMNS,
  columnKey,
  type CutoffColumn,
} from "./columns";
import { ident } from "./db";

/**
 * One decodable cell kind: a text column, or one JSONB snapshot column of
 * `entity_activity`. Built from the constants in `columns.ts` and nothing else,
 * so the SQL below never sees a name that is not in the list.
 */
export interface Target {
  /** `table.column`, as used by `--keep-encoded`, id files and reports. */
  readonly key: string;
  readonly table: string;
  readonly column: string;
  readonly kind: "text" | "json";
  readonly cutoffColumn: CutoffColumn;
  readonly backup: boolean;
  /** Text value of the cell as seen from alias `t` (`NULL` when out of scope or not a string). */
  readonly valExpr: string;
  /** Predicate over alias `t` restricting the rows in scope (`true` for text columns). */
  readonly scopeSql: string;
  /** Text expression over alias `t` that changes whenever the cell changes, for checksums. */
  readonly rawExpr: string;
}

function activityScopeSql(): string {
  const parts = ACTIVITY_SCOPE.map(
    ({ entityType, fieldPaths }) =>
      `(t."entity_type" = '${entityType}' AND t."field_path" IN (${fieldPaths
        .map((p) => `'${p}'`)
        .join(", ")}))`,
  );
  return `(${parts.join(" OR ")})`;
}

export function buildTargets(): Target[] {
  const text: Target[] = BACKFILL_COLUMNS.map((c) => ({
    key: columnKey(c.table, c.column),
    table: c.table,
    column: c.column,
    kind: "text" as const,
    cutoffColumn: c.cutoffColumn,
    backup: c.backup,
    valExpr: `t.${ident(c.column)}`,
    scopeSql: "true",
    rawExpr: `t.${ident(c.column)}`,
  }));
  const json: Target[] = ACTIVITY_COLUMNS.map((column) => ({
    key: columnKey(ACTIVITY_TABLE, column),
    table: ACTIVITY_TABLE,
    column,
    kind: "json" as const,
    cutoffColumn: ACTIVITY_CUTOFF_COLUMN,
    backup: true,
    valExpr: `CASE WHEN jsonb_typeof(t.${ident(column)}) = 'string' THEN t.${ident(column)} #>> '{}' END`,
    scopeSql: activityScopeSql(),
    rawExpr: `t.${ident(column)}::text`,
  }));
  return [...text, ...json];
}

export const TARGETS: readonly Target[] = buildTargets();

export function findTarget(key: string): Target | undefined {
  return TARGETS.find((t) => t.key === key);
}
