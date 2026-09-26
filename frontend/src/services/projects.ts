import { api } from '../api/client';
import type { JoinRequestDto, Page, ProjectCreateRequest, ProjectDto, ProjectStatus, ProjectSummaryDto, ProjectUpdateRequest, RequestStatus } from '../types';
import { deduplicateRequest } from '../utils/requestManager';
import { timedApiCall } from '../utils/performance';

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
    Object.entries(params).filter(([_, value]) => value !== undefined && value !== "")
  );
}

function makeListCacheKey(query: ProjectQuery): string {
  return `list:${JSON.stringify(query)}`;
}

function makeSearchCacheKey(query: ProjectSearchQuery): string {
  return `search:${JSON.stringify(query)}`;
}

function makeListRequest(query: ProjectQuery, signal?: AbortSignal): Promise<Page<ProjectSummaryDto>> {
  return api.get('/api/projects', {
    params: cleanParams({
      page: query.page ?? 0,
      size: query.size ?? 9,
      sort: query.sort ?? 'createdAt,desc',
      status: query.status || undefined
    }),
    signal
  }).then((r) => r.data);
}

function makeSearchRequest(query: ProjectSearchQuery, signal?: AbortSignal): Promise<Page<ProjectSummaryDto>> {
  return api.get('/api/projects/search', {
    params: cleanParams({
      page: query.page ?? 0,
      size: query.size ?? 9,
      sort: query.sort ?? 'createdAt,desc',
      keyword: query.keyword,
      status: query.status,
      domain: query.domain,
      skill: query.skill
    }),
    signal
  }).then((r) => r.data);
}

function makeMyRequest(query: ProjectQuery, signal?: AbortSignal): Promise<Page<ProjectSummaryDto>> {
  return api.get('/api/projects/my', {
    params: cleanParams({
      page: query.page ?? 0,
      size: query.size ?? 9,
      sort: query.sort ?? 'createdAt,desc'
    })
  }).then((r) => r.data);
}

export const projectService = {
  list(query: ProjectQuery, signal?: AbortSignal): Promise<Page<ProjectSummaryDto>> {
    const key = `list:${JSON.stringify(query)}`;
    return deduplicateRequest(key, () => timedApiCall(() => makeListRequest(query, signal)));
  },

  search(query: ProjectSearchQuery, signal?: AbortSignal): Promise<Page<ProjectSummaryDto>> {
    const key = `search:${JSON.stringify(query)}`;
    return deduplicateRequest(key, () => timedApiCall(() => makeSearchRequest(query, signal)));
  },

  get(id: string): Promise<ProjectDto> {
    return timedApiCall(() => api.get(`/api/projects/${id}`).then((r) => r.data));
  },

  my(query: ProjectQuery = {}): Promise<Page<ProjectSummaryDto>> {
    const key = `my:${JSON.stringify(query)}`;
    return deduplicateRequest(key, () => timedApiCall(() => makeMyRequest(query)));
  },

  create(payload: ProjectCreateRequest): Promise<ProjectDto> {
    return timedApiCall(() => api.post('/api/projects', payload).then((r) => r.data));
  },

  update(id: string, payload: ProjectUpdateRequest): Promise<ProjectDto> {
    return timedApiCall(() => api.put(`/api/projects/${id}`, payload).then((r) => r.data));
  },

  remove(id: string): Promise<void> {
    return timedApiCall(() => api.delete(`/api/projects/${id}`).then(() => undefined));
  },

  createJoinRequest(projectId: string, message?: string): Promise<JoinRequestDto> {
    return timedApiCall(() => api.post(`/api/projects/${projectId}/join-requests`, { message }).then((r) => r.data));
  },

  listJoinRequestsForProject(projectId: string): Promise<JoinRequestDto[]> {
    const key = `join-requests:${projectId}`;
    return deduplicateRequest(key, () => timedApiCall(() => api.get(`/api/projects/${projectId}/join-requests`).then((r) => r.data)));
  },

  decideJoinRequest(projectId: string, requestId: string, status: Exclude<RequestStatus, 'PENDING'>): Promise<JoinRequestDto> {
    return timedApiCall(() => api.patch(`/api/projects/${projectId}/join-requests/${requestId}`, { status }).then((r) => r.data));
  },

  myJoinRequests(): Promise<JoinRequestDto[]> {
    const key = 'my-join-requests';
    return deduplicateRequest(key, () => timedApiCall(() => api.get('/api/join-requests/my').then((r) => r.data)));
  }
};