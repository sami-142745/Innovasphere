// Performance monitoring utilities for development
let metrics = {
  apiCalls: 0,
  cacheHits: 0,
  cacheMisses: 0,
  totalApiTime: 0,
  renderCount: 0,
};

export function recordApiCall(duration: number): void {
  metrics.apiCalls++;
  metrics.totalApiTime += duration;
}

export function recordCacheHit(): void {
  metrics.cacheHits++;
}

export function recordCacheMiss(): void {
  metrics.cacheMisses++;
}

export function recordRender(): void {
  metrics.renderCount++;
}

export function getMetrics() {
  return {
    ...metrics,
    cacheHitRatio: metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) || 0,
    avgApiTime: metrics.apiCalls > 0 ? metrics.totalApiTime / metrics.apiCalls : 0,
  };
}

export function resetMetrics(): void {
  metrics = {
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalApiTime: 0,
    renderCount: 0,
  };
}

export function logMetrics(): void {
  if (import.meta.env.DEV) {
    const m = getMetrics();
    console.group('📊 Performance Metrics');
    console.log(`API Calls: ${m.apiCalls}`);
    console.log(`Cache Hits: ${m.cacheHits}`);
    console.log(`Cache Misses: ${m.cacheMisses}`);
    console.log(`Cache Hit Ratio: ${(m.cacheHitRatio * 100).toFixed(1)}%`);
    console.log(`Avg API Time: ${m.avgApiTime.toFixed(2)}ms`);
    console.log(`Render Count: ${m.renderCount}`);
    console.groupEnd();
  }
}

// Auto-log every 30 seconds in development
if (import.meta.env.DEV) {
  setInterval(logMetrics, 30000);
}

// Export a wrapper for API calls with timing
export async function timedApiCall<T>(fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    recordApiCall(performance.now() - start);
    return result;
  } catch (error) {
    recordApiCall(performance.now() - start);
    throw error;
  }
}

// Cache-aware wrapper
export function withCache<T>(
  key: string,
  getCache: () => T | null,
  setCache: (data: T) => void,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = getCache();
  if (cached) {
    recordCacheHit();
    return Promise.resolve(cached);
  }
  
  recordCacheMiss();
  return fetchFn().then(data => {
    // Cache is set by the caller
    return data;
  });
}