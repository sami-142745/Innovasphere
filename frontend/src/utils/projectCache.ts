import type { Page, ProjectSummaryDto } from '../types';

export interface ProjectSearchQuery {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  domain?: string;
  skill?: string;
  status?: string;
}

type ProjectCacheEntry = {
  timestamp: number;
  data: Page<ProjectSummaryDto>;
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, ProjectCacheEntry>();

export function getCacheKey(query: ProjectSearchQuery): string {
  return JSON.stringify({
    page: query.page ?? 0,
    size: query.size ?? 9,
    sort: query.sort ?? 'createdAt,desc',
    keyword: query.keyword ?? '',
    domain: query.domain ?? '',
    skill: query.skill ?? '',
    status: query.status ?? '',
  });
}

export function getProjectCache(query: ProjectSearchQuery): Page<ProjectSummaryDto> | null {
  const key = getCacheKey(query);
  const cached = cache.get(key);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

export function setProjectCache(query: ProjectSearchQuery, data: Page<ProjectSummaryDto>): void {
  const key = getCacheKey(query);
  cache.set(key, {
    timestamp: Date.now(),
    data,
  });
}

export function clearProjectCache(): void {
  cache.clear();
}

export function getCacheKeys(): string[] {
  return Array.from(cache.keys());
}