import { api } from '../api/client';
import type { MentorDto, MentorshipRequestDto, Page, RequestStatus } from '../types';

export interface MentorshipRequestCreatePayload {
  facultyId: string;
  projectId?: string;
  message?: string;
}

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
    return api.get('/api/mentorships/requests/my').then((r) => r.data);
  },

  receivedRequests(): Promise<MentorshipRequestDto[]> {
    return api.get('/api/mentorships/requests/received').then((r) => r.data);
  },

  decideRequest(id: string, status: Exclude<RequestStatus, 'PENDING'>): Promise<MentorshipRequestDto> {
    return api.patch(`/api/mentorships/requests/${id}`, { status }).then((r) => r.data);
  }
};