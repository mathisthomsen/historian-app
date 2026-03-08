import { redis } from "./redis";

/**
 * Application-level durable cache backed by Upstash Redis.
 * All keys use the "cache:" prefix to avoid collision with rate-limit keys.
 * All methods fail silently — cache misses/errors are non-fatal.
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      return await redis.get<T>(`cache:${key}`);
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(`cache:${key}`, value, { ex: ttlSeconds });
    } catch {}
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(`cache:${key}`);
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
          match: `cache:${prefix}*`,
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
