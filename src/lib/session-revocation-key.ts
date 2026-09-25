/**
 * Redis key namespacing for session revocation.
 *
 * Deliberately dependency-free, for the same reason as `rate-limit-key.ts`: the
 * Edge session callback imports this, and pulling in `./redis` there would
 * construct an Upstash client just to learn a string.
 *
 * The namespace is not optional hygiene. CI shares one Upstash instance with
 * production, so an un-namespaced key written by an E2E sign-out would land on
 * production's key space and revoke a real user's sessions.
 */
export const SESSION_REVOCATION_PREFIX = "session:revoked-before";

export function sessionRevocationKey(
  userId: string,
  namespace: string | undefined = process.env["CACHE_NAMESPACE"],
): string {
  return namespace
    ? `${SESSION_REVOCATION_PREFIX}:${namespace}:${userId}`
    : `${SESSION_REVOCATION_PREFIX}:${userId}`;
}
