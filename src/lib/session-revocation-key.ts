/**
 * Redis key namespacing for session revocation.
 *
 * Deliberately dependency-free, for the same reason as `rate-limit-key.ts`: the
 * Edge session callback imports this, and pulling in `./redis` there would
 * construct an Upstash client just to learn a string.
 *
 * The namespace is not optional hygiene. CI shares one Upstash instance with
 * production, so an un-namespaced key written by an E2E sign-out would land on
 * production's key space and revoke a real user's sessions. The same is true
 * of a developer's machine: with `CACHE_NAMESPACE` unset, a local dev server
 * pointed at production Upstash credentials produces the exact same bare key
 * as production itself, and the seed uses a fixed id (`seed-user-admin`) in
 * both — so signing out locally revokes the live admin's sessions (#124).
 *
 * The guard below checks `VERCEL_ENV`, not `NODE_ENV`. `NODE_ENV` is a build
 * mode, not a deployment: `next start` — a production build run on a laptop —
 * also has `NODE_ENV === "production"`, so a `NODE_ENV` check would wave
 * through exactly the local-machine case the paragraph above describes, as
 * long as that laptop inherits the shared Upstash credentials from
 * `.env.local`. `VERCEL_ENV` is injected only by Vercel's own build/runtime
 * environment (confirmed by its absence from both a local shell and
 * `.github/workflows/ci.yml`, which runs E2E against a production build on
 * localhost) — it is a positive signal of "this is a real Vercel deployment"
 * rather than an inference from build mode. Same reasoning `dev/showcase/page.tsx`
 * already applies with `E2E_ALLOW_DEV_ROUTES`.
 */
export const SESSION_REVOCATION_PREFIX = "session:revoked-before";

/**
 * Throws when no namespace is configured outside a production deployment,
 * mirroring `purgeablePrefix()` in `rate-limit-key.ts`. Production itself
 * must keep working un-namespaced — that is its own key space, and the bare
 * prefix is what it has always written under — so the guard only fires
 * elsewhere.
 *
 * Preview deployments (`VERCEL_ENV === "preview"`) are deliberately *not*
 * exempted: they point at the same shared Upstash instance as production (the
 * module comment above), can be spun up per branch/PR, and are internet-
 * reachable, so they carry at least the risk of a local machine — a bare key
 * from preview is exactly the "signs out the seed admin" failure this guard
 * exists to prevent. Only `"production"` gets the free pass.
 *
 * This throws at call time from inside the Edge `session` callback
 * (`auth.config.ts`, via `isSessionRevoked`/`revokeSessionsBefore` in
 * `session-revocation.ts`). Both of those call sites already wrap this
 * function in a try/catch that fails open and logs, so the throw is caught
 * before it can leave `session-revocation.ts` — it never reaches
 * `auth.config.ts` or middleware. Do not call this function from anywhere
 * that lacks that same fail-open handling.
 */
export function sessionRevocationKey(
  userId: string,
  namespace: string | undefined = process.env["CACHE_NAMESPACE"],
): string {
  if (!namespace && process.env["VERCEL_ENV"] !== "production") {
    throw new Error(
      "sessionRevocationKey: CACHE_NAMESPACE is not set. Refusing to build a key " +
        "that would land on production's key space — dev, CI, and preview " +
        "deployments all share one Upstash instance with production, and an " +
        "un-namespaced revocation here can revoke a real user's sessions (the seed " +
        "admin included, since its id is fixed in every one of them). Set " +
        "CACHE_NAMESPACE to a per-environment value. Gated on VERCEL_ENV, not " +
        "NODE_ENV: a `next start` production build on localhost also has " +
        "NODE_ENV==='production' and must not get a free pass (#128 round 2).",
    );
  }
  return namespace
    ? `${SESSION_REVOCATION_PREFIX}:${namespace}:${userId}`
    : `${SESSION_REVOCATION_PREFIX}:${userId}`;
}
