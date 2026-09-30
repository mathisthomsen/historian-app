import { isProductionDeployment } from "./deployment-env";

/**
 * Redis key namespacing for the rate limiter.
 *
 * Deliberately dependency-free of `./redis`: the E2E fixture helpers import
 * this too, and pulling in `./redis` there would construct an Upstash client
 * just to learn a string. `./deployment-env` is a pure function with no such
 * cost, so it is safe to import here. Keeping the prefix in one place is what
 * stops the app and the test helpers from drifting onto different key spaces.
 */

/** The prefix `@upstash/ratelimit` uses by default, and what production writes under. */
export const RATE_LIMIT_BASE_PREFIX = "@upstash/ratelimit";

/**
 * Prefix the limiter writes under.
 *
 * Outside production, an unset namespace is an error, not a silent default:
 * local development and production share **one** Upstash instance (measured —
 * `.env.local` and `vercel env pull --environment=production` resolve to the
 * same host), and rate-limit buckets are keyed by action and anonymised IP —
 * values that collide across environments. Without a namespace, a developer
 * hammering a form locally consumes a real production user's rate-limit
 * budget (#124). CI sets it per run for the same reason, plus its own: every
 * run now gets a fresh Neon branch but still shares this Upstash instance
 * with production and every other run. Production keeps working
 * un-namespaced — that is its own key space, and always has been.
 *
 * `createRedisRateLimiter()` in `rate-limit.ts` already wraps this call in a
 * try/catch that fails CLOSED — by design, since every caller is an auth
 * route and failing open would silently remove brute-force protection — so a
 * throw here degrades to a 503 with a logged reason. It does not crash the
 * request.
 *
 * "Production" here means `isProductionDeployment()` (`VERCEL_ENV ===
 * "production"`), not `NODE_ENV`: a `next start` production build on a
 * laptop, and a Vercel preview, both have `NODE_ENV === "production"` but are
 * not production — see `deployment-env.ts`. Preview is deliberately not
 * exempted; it shares this Upstash instance too.
 */
export function rateLimitPrefix(
  namespace: string | undefined = process.env["RATELIMIT_NAMESPACE"],
): string {
  if (!namespace && !isProductionDeployment()) {
    throw new Error(
      "rateLimitPrefix: RATELIMIT_NAMESPACE is not set. Refusing to build a prefix " +
        "that would land on production's rate-limit buckets — local development " +
        "and production share one Upstash instance. Set RATELIMIT_NAMESPACE to a " +
        "per-environment value (see README).",
    );
  }
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
