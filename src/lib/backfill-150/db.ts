/**
 * Database plumbing shared by the #150 backfill and restore scripts: the
 * minimal client interface (so tests can drive the same code through PGlite),
 * the identity guard, the refusal error and a few SQL helpers.
 */

/** The only thing the scripts need from a driver: `pg.Client` and an adapter around PGlite both fit. */
export interface SqlClient {
  query<R = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: R[] }>;
}

/** A deliberate refusal: bad arguments, wrong database, a failed guard. Never a bug. */
export class Refusal extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Refusal";
  }
}

export interface IdentityOptions {
  /** Neon branch id the owner expects (`--expect-branch`). */
  expectBranch?: string | undefined;
  /** `--local`: a throwaway non-Neon Postgres on this machine. */
  local?: boolean | undefined;
}

const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1"]);

/**
 * Identity first (plan, "Script behaviour" 1). Asks the database, never the
 * hostname or an env var name:
 *
 *   SELECT current_setting('neon.branch_id', true)
 *
 * and refuses unless it equals `--expect-branch`. `NULL` (any non-Neon
 * Postgres) is refused unless `--local` is given, and `--local` in turn
 * refuses a database that reports a Neon branch or a non-loopback server
 * address. Must be the first statement a script runs.
 */
export async function assertIdentity(
  client: SqlClient,
  options: IdentityOptions,
  label = "database",
): Promise<{ branchId: string | null }> {
  const { expectBranch, local } = options;
  if (local && expectBranch) {
    throw new Refusal(
      "--local and --expect-branch are mutually exclusive: a Neon branch is never local.",
    );
  }
  if (!local && (expectBranch === undefined || expectBranch.trim() === "")) {
    throw new Refusal(
      `--expect-branch <neon branch id> is required (or --local for a throwaway database on this machine) for the ${label}.`,
    );
  }

  const { rows } = await client.query<{
    branch_id: string | null;
    addr: string | null;
  }>(
    "SELECT current_setting('neon.branch_id', true) AS branch_id, host(inet_server_addr()) AS addr",
  );
  const raw = rows[0]?.branch_id ?? null;
  const branchId = raw === null || raw === "" ? null : raw;

  if (local) {
    if (branchId !== null) {
      throw new Refusal(
        `--local refused: the ${label} reports neon.branch_id = ${branchId}. That is a Neon database, not a local one.`,
      );
    }
    const addr = rows[0]?.addr ?? null;
    if (addr !== null && !LOOPBACK_ADDRESSES.has(addr)) {
      throw new Refusal(
        `--local refused: the ${label} reports server address ${addr}, which is not loopback.`,
      );
    }
    return { branchId };
  }

  if (branchId === null) {
    throw new Refusal(
      `Identity refused: the ${label} reports no neon.branch_id (NULL). It is not a Neon database; pass --local only for a throwaway one on this machine.`,
    );
  }
  if (branchId !== expectBranch) {
    throw new Refusal(
      `Identity refused: the ${label} is neon.branch_id = ${branchId}, expected ${expectBranch}.`,
    );
  }
  return { branchId };
}

/** `--local` accepts only these hosts; checked on the URL before connecting. */
export function assertLocalUrl(connectionString: string): void {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Refusal("--local refused: the connection string is not a URL.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Refusal(
      `--local refused: host is ${host}; only localhost and 127.0.0.1 are accepted.`,
    );
  }
  // pg lets query parameters override the host.
  for (const key of ["host", "hostaddr"]) {
    if (url.searchParams.has(key)) {
      throw new Refusal(`--local refused: the URL carries a ${key}= override.`);
    }
  }
}

/** Double-quoted SQL identifier. Only ever fed constants from `columns.ts`. */
export function ident(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
    throw new Error(`Unsafe identifier: ${name}`);
  }
  return `"${name}"`;
}

/** `--cutoff` must carry an explicit offset: a bare timestamp would depend on the session time zone. */
export function parseCutoff(value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    throw new Refusal(
      "--cutoff <timestamptz> is required in every mode (the T3 deploy-step start time, runbook C3).",
    );
  }
  const trimmed = value.trim();
  const m =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?(Z|([+-])(\d{2}):?(\d{2}))$/i.exec(
      trimmed,
    );
  if (!m) {
    throw new Refusal(
      `--cutoff must be an ISO-8601 timestamp with an explicit zone, e.g. 2026-10-10T12:00:00Z (got: ${trimmed}).`,
    );
  }
  // `new Date()` silently rolls an impossible date forward (2026-09-31 becomes
  // 2026-10-01), which would move the cutoff later and decode rows written
  // verbatim in between. So every calendar component must survive a round trip.
  const [y, mo, d, h, mi, s] = [m[1], m[2], m[3], m[4], m[5], m[6] ?? "0"].map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const ms = Number((m[7] ?? "0").padEnd(3, "0").slice(0, 3));
  const local = new Date(Date.UTC(y, mo - 1, d, h, mi, s, ms));
  const valid =
    local.getUTCFullYear() === y &&
    local.getUTCMonth() === mo - 1 &&
    local.getUTCDate() === d &&
    local.getUTCHours() === h &&
    local.getUTCMinutes() === mi &&
    local.getUTCSeconds() === s;
  const offsetMinutes =
    m[8]!.toUpperCase() === "Z"
      ? 0
      : (m[9] === "-" ? -1 : 1) * (Number(m[10]) * 60 + Number(m[11]));
  if (!valid || Math.abs(offsetMinutes) > 14 * 60) {
    throw new Refusal(`--cutoff is not a valid timestamp (got: ${trimmed}).`);
  }
  // Normalised so every query binds the same instant in UTC.
  return new Date(local.getTime() - offsetMinutes * 60_000).toISOString();
}

/** Runs `fn` inside a transaction; always rolls back on error. */
export async function inTransaction<T>(
  client: SqlClient,
  begin: string,
  fn: () => Promise<T>,
  commit: boolean,
): Promise<T> {
  await client.query(begin);
  try {
    const result = await fn();
    await client.query(commit ? "COMMIT" : "ROLLBACK");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // The original error is the one that matters.
    }
    throw error;
  }
}

export async function countOf(
  client: SqlClient,
  sql: string,
  params: unknown[] = [],
): Promise<number> {
  const { rows } = await client.query<{ n: number | string }>(sql, params);
  return Number(rows[0]?.n ?? 0);
}
