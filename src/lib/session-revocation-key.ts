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
 */
export const SESSION_REVOCATION_PREFIX = "session:revoked-before";

/**
 * Throws when no namespace is configured outside production, mirroring
 * `purgeablePrefix()` in `rate-limit-key.ts`. Production itself must keep
 * working un-namespaced — that is its own key space, and the bare prefix is
 * what it has always written under — so the guard only fires elsewhere.
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
  if (!namespace && process.env["NODE_ENV"] !== "production") {
    throw new Error(
      "sessionRevocationKey: CACHE_NAMESPACE is not set. Refusing to build a key " +
        "that would land on production's key space — dev and production share one " +
        "Upstash instance, and an un-namespaced revocation here can revoke a real " +
        "user's sessions (the seed admin included, since its id is fixed in both). " +
        "Set CACHE_NAMESPACE to a per-environment value.",
    );
  }
  return namespace
    ? `${SESSION_REVOCATION_PREFIX}:${namespace}:${userId}`
    : `${SESSION_REVOCATION_PREFIX}:${userId}`;
}
