import { Client } from "pg";

import { assertLocalUrl, Refusal, type SqlClient } from "../src/lib/backfill-150/db";

/**
 * Shared CLI plumbing for the two #150 scripts. Never imported by the app.
 *
 * The connection string comes from the environment variable named by the
 * caller, never from `DATABASE_URL`: a stray `.env` must not decide which
 * database a destructive script talks to. The identity guard then checks the
 * database itself.
 */

export const CONNECTION_ENV = "BACKFILL_DATABASE_URL";

export interface Connection {
  client: SqlClient;
  close(): Promise<void>;
}

export async function connect(
  connectionString: string | undefined,
  envName: string,
  local: boolean,
): Promise<Connection> {
  if (!connectionString) {
    throw new Refusal(
      `${envName} is not set. Pass the (unpooled) connection string of the database you mean, in that variable.`,
    );
  }
  if (local) assertLocalUrl(connectionString);
  const pg = new Client({ connectionString });
  await pg.connect();
  return {
    client: {
      async query<R>(sql: string, params?: unknown[]) {
        const result = await pg.query(sql, params as unknown[] | undefined);
        return { rows: result.rows as R[] };
      },
    },
    close: () => pg.end(),
  };
}

/** Prints a failure without leaking row values (a PG `detail` can quote them) and returns the exit code. */
export function reportFailure(error: unknown): number {
  if (error instanceof Refusal) {
    console.error(`REFUSED: ${error.message}`);
    return 1;
  }
  const e = error as { name?: string; message?: string; code?: string };
  console.error(
    `FAILED: ${e.name ?? "Error"}${e.code ? ` (${e.code})` : ""}: ${e.message ?? String(error)}`,
  );
  console.error(
    "The transaction was rolled back; nothing was committed by this run unless the output above says otherwise.",
  );
  return 2;
}
