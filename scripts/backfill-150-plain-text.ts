/**
 * Owner-run backfill for #150: decode the `&amp;` `&lt;` `&gt;` that
 * `sanitize()` stored, in the 36 columns of the plan and the matching
 * `entity_activity` snapshots. Once, in one transaction, behind guards.
 *
 * Agents prepare this script; they never run it against a real database.
 * Plan: docs/specs/150-plain-text-storage/plan.md ("Backfill design").
 *
 *   BACKFILL_DATABASE_URL=<unpooled url> pnpm exec tsx scripts/backfill-150-plain-text.ts \
 *     --expect-branch <neon branch id> --cutoff 2026-10-10T12:00:00Z            # dry run
 *   ... --apply --expect-rows <n> [--keep-encoded <file>]                         # write
 *
 * Flags
 *   --expect-branch <id>   required; refuses unless current_setting('neon.branch_id') equals it
 *   --local                instead of --expect-branch: a throwaway Postgres on localhost only
 *   --cutoff <timestamp>   required, ISO-8601 with a zone. Rows at or after it are left alone and listed
 *   --apply                write (default is a READ ONLY dry run)
 *   --expect-rows <n>      required with --apply: the dry run's rows_to_decode total
 *   --keep-encoded <file>  `table.column:id` lines (G1b) to leave as stored
 *
 * Prints counts, ids and checksums only, never a stored value.
 */
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

import {
  parseKeepEncoded,
  runBackfill,
  validateBackfillOptions,
  type BackfillOptions,
} from "../src/lib/backfill-150/backfill";
import { Refusal } from "../src/lib/backfill-150/db";

import { CONNECTION_ENV, connect, reportFailure } from "./backfill-150-cli";

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      "expect-branch": { type: "string" },
      local: { type: "boolean" },
      cutoff: { type: "string" },
      apply: { type: "boolean" },
      "expect-rows": { type: "string" },
      "keep-encoded": { type: "string" },
    },
    strict: true,
  });

  let expectRows: number | undefined;
  if (values["expect-rows"] !== undefined) {
    if (!/^\d+$/.test(values["expect-rows"])) {
      throw new Refusal("--expect-rows must be a non-negative integer.");
    }
    expectRows = Number(values["expect-rows"]);
  }
  const options: BackfillOptions = {
    expectBranch: values["expect-branch"],
    local: values.local === true,
    cutoff: values.cutoff,
    apply: values.apply === true,
    expectRows,
    keepEncoded:
      values["keep-encoded"] === undefined
        ? undefined
        : parseKeepEncoded(readFileSync(values["keep-encoded"], "utf8")),
  };

  // Everything that needs no database is checked before connecting.
  validateBackfillOptions(options);

  const connection = await connect(
    process.env[CONNECTION_ENV],
    CONNECTION_ENV,
    options.local === true,
  );
  try {
    const report = await runBackfill(connection.client, options, (line) => console.log(line));
    return report.blockers.length > 0 ? 1 : 0;
  } finally {
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
