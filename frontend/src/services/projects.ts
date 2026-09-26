import { api } from '../api/client';
import type { JoinRequestDto, Page, ProjectCreateRequest, ProjectDto, ProjectStatus, ProjectSummaryDto, ProjectUpdateRequest, RequestStatus } from '../types';

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

export const projectService = {
  list(query: ProjectQuery = {}): Promise<Page<ProjectSummaryDto>> {
    return api.get('/api/projects', {
      params: cleanParams({
        page: query.page ?? 0,
        size: query.size ?? 9,
        sort: query.sort ?? 'createdAt,desc',
        status: query.status || undefined
      })
    }).then((r) => r.data);
  },

  search(query: ProjectSearchQuery): Promise<Page<ProjectSummaryDto>> {
    return api.get('/api/projects/search', {
      params: cleanParams({
        page: query.page ?? 0,
        size: query.size ?? 9,
        sort: query.sort ?? 'createdAt,desc',
        keyword: query.keyword,
        status: query.status,
        domain: query.domain,
        skill: query.skill
      })
    }).then((r) => r.data);
  },

  get(id: string): Promise<ProjectDto> {
    return api.get(`/api/projects/${id}`).then((r) => r.data);
  },

  my(query: ProjectQuery = {}): Promise<Page<ProjectSummaryDto>> {
    return api.get('/api/projects/my', {
      params: cleanParams({
        page: query.page ?? 0,
        size: query.size ?? 9,
        sort: query.sort ?? 'createdAt,desc'
      })
    }).then((r) => r.data);
  },

  create(payload: ProjectCreateRequest): Promise<ProjectDto> {
    return api.post('/api/projects', payload).then((r) => r.data);
  },

  update(id: string, payload: ProjectUpdateRequest): Promise<ProjectDto> {
    return api.put(`/api/projects/${id}`, payload).then((r) => r.data);
  },

  remove(id: string): Promise<void> {
    return api.delete(`/api/projects/${id}`).then(() => undefined);
  },

  createJoinRequest(projectId: string, message?: string): Promise<JoinRequestDto> {
    return api.post(`/api/projects/${projectId}/join-requests`, { message }).then((r) => r.data);
  },

  listJoinRequestsForProject(projectId: string): Promise<JoinRequestDto[]> {
    return api.get(`/api/projects/${projectId}/join-requests`).then((r) => r.data);
  },

  decideJoinRequest(projectId: string, requestId: string, status: Exclude<RequestStatus, 'PENDING'>): Promise<JoinRequestDto> {
    return api.patch(`/api/projects/${projectId}/join-requests/${requestId}`, { status }).then((r) => r.data);
  },

  myJoinRequests(): Promise<JoinRequestDto[]> {
    return api.get('/api/join-requests/my').then((r) => r.data);
  }
};