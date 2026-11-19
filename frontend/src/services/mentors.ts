import { api } from '../api/client';
import { createApiCache } from '../utils/apiCache';
import { getCurrentUserId } from '../utils/currentUser';
import type { MentorDto, MentorshipRequestDto, Page, RequestStatus } from '../types';

export interface MentorshipRequestCreatePayload {
  facultyId: string;
  projectId?: string;
  message?: string;
}

const myRequestsCache = createApiCache<MentorshipRequestDto[]>({ ttlMs: 30_000 });
const receivedRequestsCache = createApiCache<MentorshipRequestDto[]>({ ttlMs: 30_000 });

export const mentorService = {
  list(page = 0, size = 9, sort = 'createdAt,desc'): Promise<Page<MentorDto>> {
    return api.get('/api/mentors', { params: { page, size, sort } }).then((r) => r.data);
  },

  search(keyword?: string, domain?: string, page = 0, size = 9): Promise<Page<MentorDto>> {
    return api
      .get('/api/mentors/search', {
        params: { page, size, keyword: keyword || undefined, domain: domain || undefined }
      })
      .then((r) => r.data);
  },

  get(id: string): Promise<MentorDto> {
    return api.get(`/api/mentors/${id}`).then((r) => r.data);
  },

  requestMentorship(payload: MentorshipRequestCreatePayload): Promise<MentorshipRequestDto> {
    return api.post('/api/mentorships/requests', payload).then((r) => r.data);
  },

  myRequests(): Promise<MentorshipRequestDto[]> {
    const userId = getCurrentUserId();
    const cacheKey = `mentor:myRequests:${userId}`;

    const cached = myRequestsCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);

    return api.get('/api/mentorships/requests/my').then((r) => {
      const data = r.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.content)) return data.content;
      return [];
    }).then((data) => {
      myRequestsCache.set(cacheKey, data);
      return data;
    });
  },

  receivedRequests(): Promise<MentorshipRequestDto[]> {
    const userId = getCurrentUserId();
    const cacheKey = `mentor:receivedRequests:${userId}`;

    const cached = receivedRequestsCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);

    return api.get('/api/mentorships/requests/received').then((r) => {
      const data = r.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.content)) return data.content;
      return [];
    }).then((data) => {
      receivedRequestsCache.set(cacheKey, data);
      return data;
    });
  },

  decideRequest(id: string, status: Exclude<RequestStatus, 'PENDING'>): Promise<MentorshipRequestDto> {
    return api.patch(`/api/mentorships/requests/${id}`, { status }).then((r) => r.data);
  }
};
