import type { ProjectSummaryDto } from '../types';

interface CachedProjects {
  projects: ProjectSummaryDto[];
  totalElements: number;
  totalPages: number;
  timestamp: number;
}

interface CacheEntry {
  key: string;
  data: CachedProjects;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CachedProjects>();

export function getCacheKey(
  page: number,
  size: number,
  sort: string,
  keyword?: string,
  domain?: string,
  skill?: string,
  status?: string
): string {
  return JSON.stringify({ page, size, sort, keyword, domain, skill, status });
}

export function getCachedProjects(key: string): CachedProjects | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  
  return cached;
}

export function setCachedProjects(key: string, data: Omit<CachedProjects, 'timestamp'>): void {
  cache.set(key, {
    ...data,
    timestamp: Date.now(),
  });
}

export function clearCache(): void {
  cache.clear();
}