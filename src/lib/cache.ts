import { isProductionDeployment } from "./deployment-env";
import { redis } from "./redis";

/**
 * Optional per-environment key namespace, inserted after the "cache:" prefix.
 *
 * Outside production, an unset namespace is an error, not a silent default:
 * local development and production share **one** Upstash instance (measured —
 * `.env.local` and `vercel env pull --environment=production` resolve to the
 * same host), and cache keys are built from the seed project id, which is
 * fixed (`seed-project-demo`) across environments. Without a namespace, a
 * locally-cached list response can be served to production users and vice
 * versa (#124). CI sets it to a per-run value for the same reason, plus its
 * own: every CI run gets a *fresh, empty Neon branch* but still shares this
 * Upstash instance with every other run. Production keeps working
 * un-namespaced — that is its own key space, and always has been.
 *
 * "Production" here means `isProductionDeployment()` (`VERCEL_ENV ===
 * "production"`), not `NODE_ENV`: a `next start` production build on a
 * laptop, and a Vercel preview, both have `NODE_ENV === "production"` but are
 * not production — see `deployment-env.ts` for the full rationale. Preview is
 * deliberately not exempted; it shares this Upstash instance too.
 *
 * Checked lazily, inside `cacheKey()`, not at module scope: a module-scope
 * throw would break the build and every import, in every environment, which
 * is a worse outcome than the bug this guards against. Every call site below
 * already wraps key construction in a try/catch that treats any failure as a
 * cache miss (fail open, log loudly) — so the throw degrades a cache
 * operation, it does not crash a page or route.
 */
export function requireNamespace(): string {
  const namespace = process.env.CACHE_NAMESPACE;
  if (!namespace && !isProductionDeployment()) {
    throw new Error(
      "cache: CACHE_NAMESPACE is not set. Refusing to build a key that would land " +
        "on production's cache — local development and production share one " +
        "Upstash instance, and cache keys are built from a fixed seed project id. " +
        "Set CACHE_NAMESPACE to a per-environment value (see README).",
    );
  }
  return namespace ? `${namespace}:` : "";
}

/** Fully-qualified Redis key for an app-level cache entry. */
const cacheKey = (key: string) => `cache:${requireNamespace()}${key}`;

/**
 * Application-level durable cache backed by Upstash Redis.
 * All keys use the "cache:" prefix to avoid collision with rate-limit keys.
 * All methods fail open — cache misses/errors (including a missing namespace
 * outside production) are non-fatal, but are logged loudly rather than
 * swallowed, so a misconfigured environment is discoverable.
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      return await redis.get<T>(cacheKey(key));
    } catch (error) {
      console.error("[cache] get failed", { key, error });
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(cacheKey(key), value, { ex: ttlSeconds });
    } catch (error) {
      console.error("[cache] set failed", { key, error });
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(cacheKey(key));
    } catch (error) {
      console.error("[cache] del failed", { key, error });
    }
  },

  /**
   * Deletes all cache keys matching the given prefix (without the "cache:" namespace).
   * Example: invalidateByPrefix("project:abc123:") deletes all keys for that project.
   * Uses SCAN to avoid blocking Redis on large keyspaces.
   */
  async invalidateByPrefix(prefix: string): Promise<void> {
    try {
      // Upstash Redis SCAN returns [string cursor, string[] keys]
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redis.scan(cursor, {
          match: `${cacheKey(prefix)}*`,
          count: 100,
        });
        cursor = String(nextCursor);
        if (keys.length > 0) {
          await redis.del(...(keys as [string, ...string[]]));
        }
      } while (cursor !== "0");
    } catch (error) {
      console.error("[cache] invalidateByPrefix failed", { prefix, error });
    }
  },
};
