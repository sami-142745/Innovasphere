import type { Page, ProjectSummaryDto } from '../types';
import { PROJECT_DIRECTORY_PAGE_SIZE } from './constants';

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

/**
 * Upper bound on cached pages. The directory prefetches neighbours, so without a
 * cap a long browsing session would grow this map without limit.
 */
const MAX_MEMORY_ENTRIES = 60;

const cache = new Map<string, ProjectCacheEntry>();
const SESSION_STORAGE_PREFIX = 'innovasphere_cache_';

function normalize(query: ProjectSearchQuery) {
  return {
    page: query.page ?? 0,
    size: query.size ?? PROJECT_DIRECTORY_PAGE_SIZE,
    sort: query.sort ?? 'createdAt,desc',
    keyword: query.keyword ?? '',
    domain: query.domain ?? '',
    skill: query.skill ?? '',
    status: query.status ?? '',
  };
}

/**
 * Stable, page-aware in-memory key. Kept as JSON so a cached page can only ever
 * be served for an identical page + size + status + domain + skill + sort tuple.
 */
export function getCacheKey(query: ProjectSearchQuery): string {
  return JSON.stringify(normalize(query));
}

/**
 * Compact sessionStorage key. The long JSON key is fine as a Map key in memory
 * but wastes the ~5MB sessionStorage quota, so the persisted form encodes the
 * same tuple as a single delimited string.
 */
function getSessionStorageKey(query: ProjectSearchQuery): string {
  const n = normalize(query);
  return [
    SESSION_STORAGE_PREFIX,
    n.page,
    n.size,
    n.status,
    n.domain,
    n.skill,
    n.sort,
    n.keyword,
  ]
    .map((part) => encodeURIComponent(String(part)))
    .join('|');
}

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
}

function pruneSessionStorage(): void {
  try {
    const now = Date.now();
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = sessionStorage.key(i);
      if (!key || !key.startsWith(SESSION_STORAGE_PREFIX)) continue;
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;
      try {
        const entry = JSON.parse(raw) as ProjectCacheEntry;
        if (now - entry.timestamp > CACHE_DURATION) {
          sessionStorage.removeItem(key);
        }
      } catch {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage errors
  }
}

function evictOverflow(): void {
  while (cache.size > MAX_MEMORY_ENTRIES) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
}

function loadFromSessionStorage(query: ProjectSearchQuery): ProjectCacheEntry | null {
  try {
    const storageKey = getSessionStorageKey(query);
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const entry = JSON.parse(raw) as ProjectCacheEntry;
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(storageKey);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function saveToSessionStorage(query: ProjectSearchQuery, data: Page<ProjectSummaryDto>): void {
  try {
    sessionStorage.setItem(
      getSessionStorageKey(query),
      JSON.stringify({ timestamp: Date.now(), data })
    );
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }
}

export function getProjectCache(query: ProjectSearchQuery): Page<ProjectSummaryDto> | null {
  const key = getCacheKey(query);

  const cached = cache.get(key);
  if (cached) {
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      cache.delete(key);
    } else {
      return cached.data;
    }
  }

  // Fallback to sessionStorage for instant loading on reload.
  const fromSession = loadFromSessionStorage(query);
  if (fromSession) {
    // Promote into the memory cache so the next read skips sessionStorage. The
    // original timestamp is preserved on purpose: re-stamping it with Date.now()
    // would hand the entry a brand new 5 minute window every time it is promoted
    // and let a page live far past its intended freshness.
    cache.set(key, fromSession);
    return fromSession.data;
  }
  return null;
}

export function setProjectCache(query: ProjectSearchQuery, data: Page<ProjectSummaryDto>): void {
  pruneExpired();
  pruneSessionStorage();
  cache.set(getCacheKey(query), { timestamp: Date.now(), data });
  evictOverflow();
  saveToSessionStorage(query, data);
}

export function clearProjectCache(): void {
  cache.clear();
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(SESSION_STORAGE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore
  }
}

export function getCacheKeys(): string[] {
  return Array.from(cache.keys());
}

export { pruneSessionStorage };
