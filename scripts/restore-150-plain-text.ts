/**
 * Owner-run selective restore for the #150 backfill ([R3]): puts chosen rows
 * back to the originals in `backfill_150_originals`, so recovery never means
 * replacing production. Dry run by default.
 *
 *   BACKFILL_DATABASE_URL=<unpooled url> pnpm exec tsx scripts/restore-150-plain-text.ts \
 *     --expect-branch <neon branch id> (--all | --ids <file>) [--table t [--column c]]   # dry run
 *   ... --apply [--force]                                                                  # write
 *
 * Flags
 *   --expect-branch <id> | --local   as in the backfill
 *   --table / --column               restrict to a table (and column)
 *   --ids <file>                     `table.column:id` or bare ids (bare ids need --table)
 *   --all                            every backed-up row of the selection
 *   --apply                          write (default is a READ ONLY dry run)
 *   --force                          also restore conflicts named in --ids (discards the later edit)
 *   --from-url <url>                 access_requests only: the G3 backup branch (or env BACKFILL_FROM_DATABASE_URL)
 *   --from-expect-branch <id>        identity guard for --from-url
 *
 * A row is restorable when its current value equals the recorded decoded
 * value, already restored when it equals the original, and a conflict
 * otherwise (edited since the backfill: skipped unless --force).
 * Prints counts, ids and checksums only, never a stored value.
 */
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

import {
  parseIdsFile,
  runRestore,
  validateRestoreOptions,
  type RestoreOptions,
} from "../src/lib/backfill-150/restore";

import { CONNECTION_ENV, connect, reportFailure } from "./backfill-150-cli";

const FROM_ENV = "BACKFILL_FROM_DATABASE_URL";

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      "expect-branch": { type: "string" },
      local: { type: "boolean" },
      table: { type: "string" },
      column: { type: "string" },
      ids: { type: "string" },
      all: { type: "boolean" },
      apply: { type: "boolean" },
      force: { type: "boolean" },
      "from-url": { type: "string" },
      "from-expect-branch": { type: "string" },
    },
    strict: true,
  });

  const fromUrl = values["from-url"] ?? process.env[FROM_ENV];
  const options: RestoreOptions = {
    expectBranch: values["expect-branch"],
    local: values.local === true,
    apply: values.apply === true,
    table: values.table,
    column: values.column,
    ids: values.ids === undefined ? undefined : parseIdsFile(readFileSync(values.ids, "utf8")),
    all: values.all === true,
    force: values.force === true,
    fromExpectBranch: values["from-expect-branch"],
  };

  // Validated with a placeholder for the backup connection; the real one is opened below.
  validateRestoreOptions(
    fromUrl
      ? { ...options, fromClient: { query: () => Promise.reject(new Error("unused")) } }
      : options,
  );

  const connection = await connect(
    process.env[CONNECTION_ENV],
    CONNECTION_ENV,
    options.local === true,
  );
  const fromConnection = fromUrl ? await connect(fromUrl, FROM_ENV, false) : undefined;
  try {
    if (fromConnection) options.fromClient = fromConnection.client;
    await runRestore(connection.client, options, (line) => console.log(line));
    return 0;
  } finally {
    await fromConnection?.close();
    await connection.close();
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    process.exitCode = reportFailure(error);
  },
);
