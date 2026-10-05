import type { Prisma } from "@prisma/client";

/**
 * Minimal project export (#139; spec `docs/specs/pre-alpha-project-export`).
 *
 * `buildExport` reads every row a project owns through the transaction client
 * it is handed. It never imports the soft-delete-filtering client from the
 * database module: that one silently adds `deleted_at: null` to person, event,
 * source and relation reads, which would drop exactly the rows X2 requires.
 * A source assertion in the test file keeps it that way.
 */

/** Rows across all tables above which the export is refused (413). */
export const EXPORT_ROW_CAP = 100_000;

type TxDelegateName = Extract<keyof Prisma.TransactionClient, string>;

interface ExportTable {
  /** Key in the output's `tables` and `counts`; the database table name. */
  readonly key: string;
  /** Prisma model name — what the §5 completeness guard compares against the DMMF. */
  readonly model: string;
  /** Property on the transaction client. */
  readonly delegate: TxDelegateName;
  /** The tenant scope. Used verbatim by `count` and by `findMany`. */
  readonly where: (projectId: string) => Record<string, unknown>;
}

const direct = (projectId: string) => ({ project_id: projectId });

/**
 * The twelve tables of spec §2, in output order. Ten carry `project_id`;
 * `person_names` and `relation_evidence` hang off a parent that does, through
 * a real foreign key (E3). Polymorphic ids are never followed.
 */
export const EXPORT_TABLES = [
  { key: "persons", model: "Person", delegate: "person", where: direct },
  {
    key: "person_names",
    model: "PersonName",
    delegate: "personName",
    where: (projectId) => ({ person: { project_id: projectId } }),
  },
  { key: "events", model: "Event", delegate: "event", where: direct },
  { key: "event_types", model: "EventType", delegate: "eventType", where: direct },
  { key: "sources", model: "Source", delegate: "source", where: direct },
  { key: "locations", model: "Location", delegate: "location", where: direct },
  { key: "literature", model: "Literature", delegate: "literature", where: direct },
  { key: "relation_types", model: "RelationType", delegate: "relationType", where: direct },
  { key: "relations", model: "Relation", delegate: "relation", where: direct },
  {
    key: "relation_evidence",
    model: "RelationEvidence",
    delegate: "relationEvidence",
    where: (projectId) => ({ relation: { project_id: projectId } }),
  },
  {
    key: "property_evidence",
    model: "PropertyEvidence",
    delegate: "propertyEvidence",
    where: direct,
  },
  { key: "entity_activity", model: "EntityActivity", delegate: "entityActivity", where: direct },
] as const satisfies readonly ExportTable[];

export type ExportTableKey = (typeof EXPORT_TABLES)[number]["key"];

/** Same order on every export, so two exports of an unchanged project match byte for byte. */
const ORDER_BY = [{ created_at: "asc" }, { id: "asc" }] as const;

export interface EvidoxaExport {
  format: "evidoxa-project-export";
  format_version: 1;
  exported_at: string;
  app_version: string;
  schema_migration: string | null;
  project: {
    id: string;
    name: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
  };
  tables: Record<ExportTableKey, Record<string, unknown>[]>;
  counts: Record<ExportTableKey, number>;
}

/** Facts the caller knows and this module may not fetch (it cannot reach the global client). */
export interface ExportMeta {
  exportedAt: Date;
  appVersion: string;
  schemaMigration: string | null;
}

export type BuildExportResult =
  | { kind: "ok"; document: EvidoxaExport }
  | { kind: "too_large"; total: number }
  | { kind: "not_found" };

interface Delegate {
  count(args: { where: Record<string, unknown> }): Promise<number>;
  findMany(args: {
    where: Record<string, unknown>;
    orderBy: typeof ORDER_BY;
  }): Promise<Record<string, unknown>[]>;
}

/**
 * Rechecks, inside the export's snapshot, what the route checked just before
 * it: the caller is still a member (any role) and the project is not
 * soft-deleted. The route's own check runs outside the transaction, so a
 * membership revoked or a project deleted in between would otherwise still be
 * exported (#165 review). Run it as the first read in the transaction, so it
 * sees the same snapshot as every row that follows.
 */
export async function accessStillHolds(
  tx: Prisma.TransactionClient,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const membership = await tx.userProject.findFirst({
    where: { user_id: userId, project_id: projectId },
    select: { id: true },
  });
  if (!membership) return false;
  const live = await tx.project.findFirst({
    where: { id: projectId, deleted_at: null },
    select: { id: true },
  });
  return live !== null;
}

/**
 * Reads the whole project through `tx`. The caller opens the transaction
 * (`REPEATABLE READ`) and has already checked membership.
 *
 * Counts every table first; above `EXPORT_ROW_CAP` it returns `too_large`
 * without a single `findMany`. Every `count` carries the same scope as its
 * `findMany`, so an unscoped count cannot sum other tenants' rows into the cap.
 */
export async function buildExport(
  tx: Prisma.TransactionClient,
  projectId: string,
  meta: ExportMeta,
): Promise<BuildExportResult> {
  const row = await tx.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });
  // Soft-deleted inside the snapshot counts as gone (#165 review): the route's
  // check ran before the snapshot began.
  if (!row || row.deleted_at) return { kind: "not_found" };
  const project = {
    id: row.id,
    name: row.name,
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  const delegates = tx as unknown as Record<string, Delegate>;

  let total = 0;
  for (const table of EXPORT_TABLES) {
    total += await delegates[table.delegate]!.count({ where: table.where(projectId) });
  }
  if (total > EXPORT_ROW_CAP) return { kind: "too_large", total };

  const tables = {} as EvidoxaExport["tables"];
  const counts = {} as EvidoxaExport["counts"];
  for (const table of EXPORT_TABLES) {
    const rows = await delegates[table.delegate]!.findMany({
      where: table.where(projectId),
      orderBy: ORDER_BY,
    });
    tables[table.key] = rows;
    counts[table.key] = rows.length;
  }

  return {
    kind: "ok",
    document: {
      format: "evidoxa-project-export",
      format_version: 1,
      exported_at: meta.exportedAt.toISOString(),
      app_version: meta.appVersion,
      schema_migration: meta.schemaMigration,
      project,
      tables,
      counts,
    },
  };
}

/**
 * The complete document as UTF-8 bytes. Done in full before any `Response` is
 * built (D7), so a failure here is a 5xx and can never follow a `200`. `Date`s
 * become ISO 8601 strings; text is JSON-escaped as JSON requires and nothing else.
 */
export function serializeExport(document: EvidoxaExport): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(document));
}

/** Lowercase ASCII `[a-z0-9-]`, at most 40 characters, `projekt` when nothing survives. */
export function slugifyProjectName(name: string): string {
  const slug = name
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  return slug === "" ? "projekt" : slug;
}

/** `evidoxa-export-{slug}-{YYYY-MM-DD}.json`, the date in UTC. */
export function exportFilename(projectName: string, at: Date): string {
  return `evidoxa-export-${slugifyProjectName(projectName)}-${at.toISOString().slice(0, 10)}.json`;
}
