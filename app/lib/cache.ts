interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class Cache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key) && !this.isExpired(key);
  }

  private isExpired(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return true;
    return Date.now() - item.timestamp > item.ttl;
  }

  // Clean up expired items
  cleanup(): void {
    for (const [key] of this.cache.entries()) {
      if (this.isExpired(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
export const globalCache = new Cache();

// Cache keys
export const CACHE_KEYS = {
  PERSONS: 'persons',
  EVENTS: 'events',
  EVENT_TYPES: 'event_types',
  PERSON_DETAIL: (id: number) => `person_${id}`,
  PERSON_LIFE_EVENTS: (id: number) => `person_life_events_${id}`,
  EVENT_DETAIL: (id: number) => `event_${id}`,
} as const;

// Cache decorator for API routes
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = 5 * 60 * 1000
): T {
  return (async (...args: Parameters<T>): Promise<any> => {
    const key = keyGenerator(...args);
    const cached = globalCache.get(key);
    
    if (cached) {
      return cached;
    }

    const result = await fn(...args);
    globalCache.set(key, result, ttl);
    return result;
  }) as T;
}

// Invalidate cache entries
export function invalidateCache(pattern: string): void {
  const stats = globalCache.getStats();
  for (const key of stats.keys) {
    if (key.includes(pattern)) {
      globalCache.delete(key);
    }
  }
} 