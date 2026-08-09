import { redis } from "./redis";

/**
 * Optional per-environment key namespace, inserted after the "cache:" prefix.
 *
 * Unset in dev and production, so keys keep their historical shape. CI sets it
 * to a per-run value because every CI run now gets a *fresh, empty Neon branch*
 * but still shares one Upstash instance with every other run. Cache keys are
 * built from the seed project id, which is fixed (`seed-project-demo`), so
 * without a namespace a list response cached by the previous run — 60s TTL —
 * could be served against a database that has never contained those rows.
 *
 * Read once at module load: the value is identical at build and at runtime in
 * every environment that sets it, so Next inlining it is harmless.
 */
const NAMESPACE = process.env.CACHE_NAMESPACE ? `${process.env.CACHE_NAMESPACE}:` : "";

/** Fully-qualified Redis key for an app-level cache entry. */
const cacheKey = (key: string) => `cache:${NAMESPACE}${key}`;

/**
 * Application-level durable cache backed by Upstash Redis.
 * All keys use the "cache:" prefix to avoid collision with rate-limit keys.
 * All methods fail silently — cache misses/errors are non-fatal.
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      return await redis.get<T>(cacheKey(key));
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(cacheKey(key), value, { ex: ttlSeconds });
    } catch {}
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(cacheKey(key));
    } catch {}
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
    } catch {}
  },
};
