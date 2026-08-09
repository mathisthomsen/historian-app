/**
 * Redis key namespacing for the rate limiter.
 *
 * Deliberately dependency-free: the E2E fixture helpers import this too, and
 * pulling in `./redis` there would construct an Upstash client just to learn a
 * string. Keeping the prefix in one place is what stops the app and the test
 * helpers from drifting onto different key spaces.
 */

/** The prefix `@upstash/ratelimit` uses by default, and what production writes under. */
export const RATE_LIMIT_BASE_PREFIX = "@upstash/ratelimit";

/**
 * Prefix the limiter writes under.
 *
 * Unset in dev and production, so keys keep their historical shape. CI sets it
 * per run: every run now gets a fresh Neon branch but still shares one Upstash
 * instance with production, and rate-limit buckets are keyed by action and
 * anonymised IP — values that collide across environments.
 */
export function rateLimitPrefix(
  namespace: string | undefined = process.env["RATELIMIT_NAMESPACE"],
): string {
  return namespace ? `${RATE_LIMIT_BASE_PREFIX}:${namespace}` : RATE_LIMIT_BASE_PREFIX;
}

/**
 * Prefix a test run is allowed to delete under, and the reason this module exists.
 *
 * Throws when there is no namespace. The E2E suite resets rate-limit buckets
 * between tests, and without a namespace the only prefix it could match is the
 * bare one — i.e. production's own buckets, on the shared Upstash instance.
 * Failing loudly here makes that impossible by construction rather than relying
 * on the caller to remember.
 */
export function purgeablePrefix(
  namespace: string | undefined = process.env["RATELIMIT_NAMESPACE"],
): string {
  if (!namespace) {
    throw new Error(
      "purgeablePrefix: RATELIMIT_NAMESPACE is not set. Refusing to build a purge " +
        "target that would match unnamespaced rate-limit keys — those belong to " +
        "production, which shares this Upstash instance. Set RATELIMIT_NAMESPACE " +
        "to a per-run value before resetting rate limits.",
    );
  }
  return `${RATE_LIMIT_BASE_PREFIX}:${namespace}`;
}
