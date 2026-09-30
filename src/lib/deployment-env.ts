/**
 * Whether this process is a real Vercel deployment tagged "production" — as
 * opposed to a Vercel preview, CI, or a developer's machine (including a
 * `next start` production build run locally).
 *
 * `NODE_ENV` is a build mode, not a deployment identity: `next start` also
 * sets `NODE_ENV === "production"` on a laptop, so a `NODE_ENV` check waves
 * through exactly the local-machine case the namespace guards in `cache.ts`
 * and `rate-limit-key.ts` exist to catch. `VERCEL_ENV` is injected only by
 * Vercel's own build/runtime environment (confirmed absent from both a local
 * shell and `.github/workflows/ci.yml`, which runs E2E against a production
 * build on localhost) — a positive signal of "this is a real Vercel
 * deployment" rather than an inference from build mode.
 *
 * Preview deployments (`VERCEL_ENV === "preview"`) deliberately do not count
 * as production: they share production's Upstash instance and are
 * internet-reachable, so they carry at least the risk of a local machine.
 * `CACHE_NAMESPACE`/`RATELIMIT_NAMESPACE` are not currently set in any Vercel
 * environment (see #131) — until they are, this means preview fails open
 * (cache) or closed (rate limiting) rather than silently sharing production's
 * key space (#124, round 2).
 *
 * Mirrors the identical predicate already applied to session revocation keys
 * in `session-revocation-key.ts` (`feat/epic-2-7-session-hardening`,
 * `8e3ca95`). That file lives on a different branch and is not touched here;
 * a future merge should have it import this instead of a third inline copy.
 */
export function isProductionDeployment(): boolean {
  return process.env["VERCEL_ENV"] === "production";
}
