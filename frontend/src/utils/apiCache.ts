/**
 * In-memory cache with TTL expiration for API responses.
 *
 * Each cache instance is isolated and stores entries keyed by string.
 * Entries expire after the configured TTL. The cache is intended for
 * short-lived API response caching within a single browser session.
 *
 * Example:
 *   const cache = createApiCache<Page<ProjectSummaryDto>>({ ttlMs: 30_000 });
 *   const cached = cache.get(key);
 *   if (!cached) {
 *     const data = await fetchApi();
 *     cache.set(key, data);
 *     return data;
 *   }
 *   return cached;
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function createApiCache<T>(options: { ttlMs?: number } = {}) {
  const ttlMs = options.ttlMs ?? 30_000;
  const cache = new Map<string, CacheEntry<T>>();

  /**
   * Retrieve a cached value. Returns null if missing or expired.
   */
  function get(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > ttlMs) {
      cache.delete(key);
      return null;
    }
    return entry.data;
  }

  /**
   * Store a value in the cache with the current timestamp.
   */
  function set(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Remove a single key from the cache.
   */
  function invalidate(key: string): void {
    cache.delete(key);
  }

  /**
   * Remove all keys that start with the given prefix.
   */
  function invalidatePattern(prefix: string): void {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  }

  /**
   * Remove all entries from the cache.
   */
  function clear(): void {
    cache.clear();
  }

  return { get, set, invalidate, invalidatePattern, clear };
}
