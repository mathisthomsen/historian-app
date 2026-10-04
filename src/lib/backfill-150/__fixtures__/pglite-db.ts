/**
 * Test support for the #150 backfill and restore scripts: an in-memory
 * Postgres 16 (PGlite) with the REAL migrations applied, a `SqlClient` adapter,
 * and row helpers. Never connects to anything outside the process, and never
 * reads `DATABASE_URL`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { PGlite } from "@electric-sql/pglite";

import { BACKFILL_COLUMNS } from "../columns";
import type { SqlClient } from "../db";

export const OLD = "2025-01-01T00:00:00Z";
export const CUTOFF = "2025-06-01T12:00:00Z";
export const NEW = "2025-06-02T00:00:00Z";
export const BRANCH = "br-test-123";

const MIGRATIONS = join(process.cwd(), "prisma", "migrations");

/** Applies every real migration, in order, to a fresh PGlite. */
export async function createMigratedDb(): Promise<PGlite> {
  const db = new PGlite();
  const folders = readdirSync(MIGRATIONS)
    .filter((d) => /^\d/.test(d))
    .sort();
  for (const folder of folders) {
    await db.exec(readFileSync(join(MIGRATIONS, folder, "migration.sql"), "utf8"));
  }
  return db;
}

export async function resetData(db: PGlite): Promise<void> {
  await db.exec(
    "TRUNCATE users, projects, access_requests, data_backfills, backfill_150_originals CASCADE",
  );
  await db.exec("RESET neon.branch_id");
}

/** PGlite has no `neon.branch_id`; a custom setting stands in (measured: current_setting reads it back). */
export async function setBranch(db: PGlite, id: string): Promise<void> {
  await db.exec(`SET neon.branch_id = '${id}'`);
}

export function pgliteClient(db: PGlite, log?: string[]): SqlClient {
  return {
    async query<R>(sql: string, params?: unknown[]) {
      log?.push(sql);
      const result = await db.query(sql, params as unknown[] | undefined);
      return { rows: result.rows as R[] };
    },
  };
}

interface ColumnMeta {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: string;
  column_default: string | null;
}

const metaCache = new WeakMap<PGlite, Map<string, ColumnMeta[]>>();

async function columnsOf(db: PGlite, table: string): Promise<ColumnMeta[]> {
  let perDb = metaCache.get(db);
  if (!perDb) {
    perDb = new Map();
    metaCache.set(db, perDb);
  }
  const cached = perDb.get(table);
  if (cached) return cached;
  const { rows } = await db.query<ColumnMeta>(
    `SELECT column_name, data_type, udt_name, is_nullable, column_default
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  );
  perDb.set(table, rows);
  return rows;
}

/**
 * Inserts one row. Required columns without a default that the caller did not
 * give are filled with a dummy of the right type, so a test names only what it
 * cares about. `created_at` / `updated_at` default to `ts`.
 */
export async function insertRow(
  db: PGlite,
  table: string,
  values: Record<string, unknown>,
  ts: string = OLD,
): Promise<void> {
  const columns = await columnsOf(db, table);
  const row: Record<string, unknown> = { ...values };
  for (const col of columns) {
    if (col.column_name in row) continue;
    if (col.column_name === "created_at" || col.column_name === "updated_at") {
      row[col.column_name] = ts;
      continue;
    }
    if (col.is_nullable === "YES" || col.column_default !== null) continue;
    if (col.data_type === "USER-DEFINED") {
      const { rows } = await db.query<{ label: string }>(
        `SELECT e.enumlabel AS label FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = $1 ORDER BY e.enumsortorder LIMIT 1`,
        [col.udt_name],
      );
      row[col.column_name] = rows[0]!.label;
    } else if (col.data_type === "timestamp with time zone") {
      row[col.column_name] = ts;
    } else if (col.data_type === "integer") {
      row[col.column_name] = 0;
    } else if (col.data_type === "boolean") {
      row[col.column_name] = false;
    } else if (col.data_type === "jsonb") {
      row[col.column_name] = "{}";
    } else {
      row[col.column_name] = `x-${table}-${col.column_name}`;
    }
  }
  const names = Object.keys(row);
  const params = names.map((n) => {
    const v = row[n];
    const meta = columns.find((c) => c.column_name === n);
    if (meta?.data_type === "jsonb" && v !== null && typeof v !== "string") {
      return JSON.stringify(v);
    }
    return v;
  });
  await db.query(
    `INSERT INTO "${table}" (${names.map((n) => `"${n}"`).join(", ")})
     VALUES (${names.map((_, i) => `$${i + 1}`).join(", ")})`,
    params,
  );
}

export interface World {
  userId: string;
  projectId: string;
  sourceId: string;
}

/** A user, a project and a source: the parents most rows need. */
export async function seedWorld(db: PGlite): Promise<World> {
  await insertRow(db, "users", { id: "u1", email: "owner@example.test", name: null });
  await insertRow(db, "projects", { id: "p1", name: "Default" });
  await insertRow(db, "sources", {
    id: "s-parent",
    project_id: "p1",
    title: "parent",
    type: "other",
  });
  return { userId: "u1", projectId: "p1", sourceId: "s-parent" };
}

/**
 * One row per backfill table with every listed column set from `valueOf`.
 * Row ids are `<table>-<suffix>`. Driven from BACKFILL_COLUMNS, so a column
 * added to the list is seeded and therefore tested.
 */
export async function seedEveryColumn(
  db: PGlite,
  suffix: string,
  ts: string,
  valueOf: (table: string, column: string) => string | null,
): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  const byTable = new Map<string, Record<string, unknown>>();
  for (const c of BACKFILL_COLUMNS) {
    const values = byTable.get(c.table) ?? {};
    values[c.column] = valueOf(c.table, c.column);
    byTable.set(c.table, values);
  }
  const id = (table: string) => (ids[table] = `${table}-${suffix}`);

  // users.name: a fresh user per call (the world user stays name-less).
  await insertRow(
    db,
    "users",
    { id: id("users"), email: `${suffix}@example.test`, ...byTable.get("users") },
    ts,
  );
  await insertRow(
    db,
    "persons",
    { id: id("persons"), project_id: "p1", ...byTable.get("persons") },
    ts,
  );
  await insertRow(
    db,
    "person_names",
    { id: id("person_names"), person_id: ids["persons"], ...byTable.get("person_names") },
    ts,
  );
  await insertRow(
    db,
    "event_types",
    { id: id("event_types"), project_id: "p1", ...byTable.get("event_types") },
    ts,
  );
  await insertRow(
    db,
    "events",
    { id: id("events"), project_id: "p1", ...byTable.get("events") },
    ts,
  );
  await insertRow(
    db,
    "sources",
    { id: id("sources"), project_id: "p1", ...byTable.get("sources") },
    ts,
  );
  await insertRow(
    db,
    "relation_types",
    { id: id("relation_types"), project_id: "p1", ...byTable.get("relation_types") },
    ts,
  );
  await insertRow(
    db,
    "relations",
    {
      id: id("relations"),
      project_id: "p1",
      from_id: ids["persons"],
      to_id: ids["persons"],
      relation_type_id: ids["relation_types"],
      ...byTable.get("relations"),
    },
    ts,
  );
  await insertRow(
    db,
    "relation_evidence",
    {
      id: id("relation_evidence"),
      relation_id: ids["relations"],
      source_id: ids["sources"],
      ...byTable.get("relation_evidence"),
    },
    ts,
  );
  await insertRow(
    db,
    "property_evidence",
    {
      id: id("property_evidence"),
      project_id: "p1",
      entity_id: ids["persons"],
      property: "first_name",
      source_id: ids["sources"],
      ...byTable.get("property_evidence"),
    },
    ts,
  );
  await insertRow(
    db,
    "access_requests",
    {
      id: id("access_requests"),
      email: `${suffix}-req@example.test`,
      ...byTable.get("access_requests"),
    },
    ts,
  );
  return ids;
}

/** Serialises every table the backfill can touch, in id order: equal strings mean an untouched database. */
export async function dumpTables(
  db: PGlite,
  withBookkeeping = true,
  skip: string[] = [],
): Promise<string> {
  const tables = [
    ...new Set(BACKFILL_COLUMNS.map((c) => c.table)),
    "entity_activity",
    ...(withBookkeeping ? ["data_backfills", "backfill_150_originals"] : []),
  ].filter((t) => !skip.includes(t));
  const parts: string[] = [];
  for (const t of tables) {
    const { rows } = await db.query<{ j: string }>(
      `SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY to_jsonb(x)::text), '[]')::text AS j FROM "${t}" x`,
    );
    parts.push(`${t}:${rows[0]!.j}`);
  }
  return parts.join("\n");
}

/** Reads one cell. */
export async function cell(
  db: PGlite,
  table: string,
  column: string,
  id: string,
): Promise<string | null> {
  const { rows } = await db.query<{ v: string | null }>(
    `SELECT "${column}" AS v FROM "${table}" WHERE id = $1`,
    [id],
  );
  return rows[0]?.v ?? null;
}

export async function jsonCell(
  db: PGlite,
  column: "old_value" | "new_value",
  id: string,
): Promise<unknown> {
  const { rows } = await db.query<{ v: unknown }>(
    `SELECT "${column}" AS v FROM entity_activity WHERE id = $1`,
    [id],
  );
  return rows[0]?.v;
}

export async function insertActivity(
  db: PGlite,
  id: string,
  values: {
    entity_type: "PERSON" | "EVENT" | "SOURCE" | "LOCATION" | "LITERATURE";
    field_path?: string | null;
    old_value?: unknown;
    new_value?: unknown;
    entity_id?: string;
    action?: "CREATE" | "UPDATE" | "DELETE";
  },
  ts: string = OLD,
): Promise<void> {
  const json = (v: unknown) => (v === undefined ? null : JSON.stringify(v));
  await db.query(
    `INSERT INTO entity_activity (id, project_id, entity_type, entity_id, action, field_path, old_value, new_value, created_at)
     VALUES ($1, 'p1', $2::"EntityType", $3, $4::"ActivityAction", $5, $6::jsonb, $7::jsonb, $8::timestamptz)`,
    [
      id,
      values.entity_type,
      values.entity_id ?? "e-1",
      values.action ?? "UPDATE",
      values.field_path ?? null,
      json(values.old_value),
      json(values.new_value),
      ts,
    ],
  );
}

/** `sanitize()`'s encode step, for re-encoding assertions. */
export function reencode(decoded: string): string {
  return decoded.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface SanitizePair {
  input: string;
  stored: string;
}

/** Real `sanitize()` output, generated before T3 removed it. */
export function loadPairs(): SanitizePair[] {
  const file = join(
    process.cwd(),
    "src",
    "lib",
    "backfill-150",
    "__fixtures__",
    "sanitize-pairs.json",
  );
  return (JSON.parse(readFileSync(file, "utf8")) as { pairs: SanitizePair[] }).pairs;
}
