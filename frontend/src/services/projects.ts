import { api } from '../api/client';
import { createApiCache } from '../utils/apiCache';
import { getCacheKey } from '../utils/projectCache';
import { getCurrentUserId } from '../utils/currentUser';
import type { JoinRequestDto, Page, ProjectCreateRequest, ProjectDto, ProjectStatus, ProjectSummaryDto, ProjectUpdateRequest, RequestStatus } from '../types';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';
import { deduplicateRequest } from '../utils/requestManager';
import { timedApiCall } from '../utils/performance';

const projectCache = createApiCache<Page<ProjectSummaryDto>>({ ttlMs: 30_000 });

export interface ProjectQuery {
  page?: number;
  size?: number;
  sort?: string;
  status?: ProjectStatus | '';
}

export interface ProjectSearchQuery extends ProjectQuery {
  keyword?: string;
  domain?: string;
  skill?: string;
}

function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
  );
}

/**
 * Dedup keys are built from the same normalizer the cache uses, so
 * `undefined` and `''` for the same filter collapse to one key instead of
 * producing two in-flight requests for identical URLs.
 */
function makeListCacheKey(query: ProjectQuery): string {
  return `list:${getCacheKey(query)}`;
}

function makeSearchCacheKey(query: ProjectSearchQuery): string {
  return `search:${getCacheKey(query)}`;
}

/**
 * Single source of truth for the request identity of a project query. The
 * directory uses it to cancel/background-refresh the exact request that is
 * currently in flight.
 */
export function projectRequestKey(query: ProjectSearchQuery, isSearch: boolean): string {
  return isSearch ? makeSearchCacheKey(query) : makeListCacheKey(query);
}

/**
 * Every project endpoint defaults to the app-wide page size. Only Browse
 * Projects overrides it (with PROJECT_DIRECTORY_PAGE_SIZE) so My Projects and
 * the other project screens keep their existing 9-per-page layout.
 */
function makeListRequest(query: ProjectQuery, signal: AbortSignal | undefined): Promise<Page<ProjectSummaryDto>> {
  return api.get('/api/projects', {
    params: cleanParams({
      page: query.page ?? 0,
      size: query.size ?? DEFAULT_PAGE_SIZE,
      sort: query.sort ?? 'createdAt,desc',
      status: query.status || undefined
    }),
    signal
  }).then((r) => r.data);
}

function makeSearchRequest(query: ProjectSearchQuery, signal: AbortSignal | undefined): Promise<Page<ProjectSummaryDto>> {
  return api.get('/api/projects/search', {
    params: cleanParams({
      page: query.page ?? 0,
      size: query.size ?? DEFAULT_PAGE_SIZE,
      sort: query.sort ?? 'createdAt,desc',
      keyword: query.keyword,
      status: query.status,
      domain: query.domain,
      skill: query.skill
    }),
    signal
  }).then((r) => r.data);
}

function makeMyRequest(query: ProjectQuery, signal: AbortSignal | undefined): Promise<Page<ProjectSummaryDto>> {
  return api.get('/api/projects/my', {
    params: cleanParams({
      page: query.page ?? 0,
      size: query.size ?? DEFAULT_PAGE_SIZE,
      sort: query.sort ?? 'createdAt,desc'
    }),
    signal
  }).then((r) => r.data);
}



export const projectService = {
  my(query: ProjectQuery = {}, signal?: AbortSignal): Promise<Page<ProjectSummaryDto>> {
    const userId = getCurrentUserId();
    const cacheKey = `my:${userId}:${getCacheKey(query)}`;

    const cached = projectCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);

    return deduplicateRequest(cacheKey, (_c) => timedApiCall(() => makeMyRequest(query, signal))).then((data) => {
      projectCache.set(cacheKey, data);
      return data;
    });
  },

  list(query: ProjectQuery = {}, signal?: AbortSignal): Promise<Page<ProjectSummaryDto>> {
    return makeListRequest(query, signal);
  },

  search(query: ProjectSearchQuery = {}, signal?: AbortSignal): Promise<Page<ProjectSummaryDto>> {
    return makeSearchRequest(query, signal);
  },

  get(id: string): Promise<ProjectDto> {
    return timedApiCall(() => api.get(`/api/projects/${id}`).then((r) => r.data));
  },

  create(payload: ProjectCreateRequest): Promise<ProjectDto> {
    return timedApiCall(() => api.post('/api/projects', payload).then((r) => {
      projectCache.invalidatePattern(`my:${getCurrentUserId()}:`);
      return r.data;
    }));
  },

  update(id: string, payload: ProjectUpdateRequest): Promise<ProjectDto> {
    return timedApiCall(() => api.put(`/api/projects/${id}`, payload).then((r) => {
      projectCache.invalidatePattern(`my:${getCurrentUserId()}:`);
      return r.data;
    }));
  },

  remove(id: string): Promise<void> {
    return timedApiCall(() => api.delete(`/api/projects/${id}`).then(() => {
      projectCache.invalidatePattern(`my:${getCurrentUserId()}:`);
    }));
  },

  createJoinRequest(projectId: string, message?: string): Promise<JoinRequestDto> {
    return timedApiCall(() => api.post(`/api/projects/${projectId}/join-requests`, { message }).then((r) => r.data));
  },

  listJoinRequestsForProject(projectId: string): Promise<JoinRequestDto[]> {
    const key = `join-requests:${projectId}`;
    return deduplicateRequest(key, (c) =>
      timedApiCall(() => api.get(`/api/projects/${projectId}/join-requests`, { signal: c.signal }).then((r) => r.data))
    );
  },

  decideJoinRequest(projectId: string, requestId: string, status: Exclude<RequestStatus, 'PENDING'>): Promise<JoinRequestDto> {
    return timedApiCall(() => api.patch(`/api/projects/${projectId}/join-requests/${requestId}`, { status }).then((r) => r.data));
  },

  myJoinRequests(): Promise<JoinRequestDto[]> {
    return deduplicateRequest('my-join-requests', (c) =>
      timedApiCall(() => api.get(`/api/join-requests/my`, { signal: c.signal }).then((r) => {
        const data = r.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.content)) return data.content;
        return [];
      }))
    );
  }
};
