/**
 * Refuses to let the E2E suite touch the production database.
 *
 * On 2026-08-09 a machine ran this suite against a localhost server that was
 * configured with the production `DATABASE_URL`. Twenty fixture accounts were
 * created in the live database and nothing in the suite objected — the specs
 * cannot tell one Postgres connection from another, and `.env.local` is enough
 * to point them anywhere.
 *
 * Neon exposes the branch identity *inside the session*, so the check does not
 * depend on hostnames, environment variable names, or anyone remembering which
 * is which. Endpoint hostnames in this project are actively misleading and have
 * caused exactly this class of mistake before, so this is the only form of the
 * check worth trusting.
 *
 * Deliberately dependency-free so `db.ts` can use it without pulling anything
 * in, and so it is unit-testable (see src/test/e2e-db-guard.test.ts — vitest
 * excludes **\/e2e\/** from test discovery, but imports across it are fine).
 */

/** Neon branch backing Vercel production. Not a secret; it is an identifier. */
export const PRODUCTION_BRANCH_ID = "br-old-grass-a9acitgb";

/**
 * Throws unless the connected Neon branch is safe to write fixtures into.
 *
 * Fails closed on an unknown branch: if we cannot prove which database we are
 * pointed at, we must not write to it. Every environment in this project is
 * Neon (dev, ephemeral per-run CI branches, production), so a missing
 * `neon.branch_id` means the connection is not what anyone intended — not that
 * some exotic-but-fine setup is in play.
 */
export function assertNotProductionBranch(branchId: string | null | undefined): void {
  if (!branchId) {
    throw new Error(
      "E2E database guard: could not determine which database this is — " +
        "`neon.branch_id` was empty. Refusing to run: the suite creates and " +
        "deletes rows, and an unidentified connection could be production. " +
        "Check DATABASE_URL / DATABASE_URL_UNPOOLED point at a Neon branch.",
    );
  }

  if (branchId === PRODUCTION_BRANCH_ID) {
    throw new Error(
      `E2E database guard: refusing to run against the PRODUCTION branch ` +
        `(${PRODUCTION_BRANCH_ID}). The suite registers users and deletes rows; ` +
        `running it here puts fixtures in the live database. Point ` +
        `DATABASE_URL / DATABASE_URL_UNPOOLED at the dev branch or an ephemeral ` +
        `CI branch instead.`,
    );
  }
}
