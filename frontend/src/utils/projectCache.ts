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
const SESSION_STORAGE_PREFIX = 'innovasphere_cache_';

function getSessionStorageKey(query: ProjectSearchQuery): string {
  return SESSION_STORAGE_PREFIX + JSON.stringify({
    page: query.page ?? 0,
    size: query.size ?? 9,
    sort: query.sort ?? 'createdAt,desc',
    keyword: query.keyword ?? '',
    domain: query.domain ?? '',
    skill: query.skill ?? '',
    status: query.status ?? '',
  });
}

function loadFromSessionStorage(query: ProjectSearchQuery): Page<ProjectSummaryDto> | null {
  try {
    const key = getSessionStorageKey(query);
    const stored = sessionStorage.getItem(key);
    if (!stored) return null;
    const entry: ProjectCacheEntry = JSON.parse(stored);
    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    if (isExpired) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function saveToSessionStorage(query: ProjectSearchQuery, data: Page<ProjectSummaryDto>): void {
  try {
    const key = getSessionStorageKey(query);
    sessionStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data,
    }));
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }
}

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
  // First check memory cache
  const key = getCacheKey(query);
  const cached = cache.get(key);
  if (cached) {
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
      cache.delete(key);
    } else {
      return cached.data;
    }
  }

  // Fallback to sessionStorage for instant loading
  return loadFromSessionStorage(query);
}

export function setProjectCache(query: ProjectSearchQuery, data: Page<ProjectSummaryDto>): void {
  const key = getCacheKey(query);
  cache.set(key, {
    timestamp: Date.now(),
    data,
  });
  // Also persist to sessionStorage for instant reload
  saveToSessionStorage(query, data);
}

export function clearProjectCache(): void {
  cache.clear();
  // Clear sessionStorage entries
  try {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(SESSION_STORAGE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {
    // Ignore
  }
}

export function getCacheKeys(): string[] {
  return Array.from(cache.keys());
}