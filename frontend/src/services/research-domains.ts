import { api } from '../api/client';
import type { ResearchDomainDto } from '../types';

export interface ResearchDomainCreatePayload {
  name: string;
  description?: string;
}

export const researchDomainService = {
  list(): Promise<ResearchDomainDto[]> {
    return api.get('/api/research-domains').then((r) => r.data);
  },

  search(keyword?: string): Promise<ResearchDomainDto[]> {
    return api.get('/api/research-domains/search', { params: { keyword: keyword || undefined } }).then((r) => r.data);
  },

  create(payload: ResearchDomainCreatePayload): Promise<ResearchDomainDto> {
    return api.post('/api/admin/research-domains', payload).then((r) => r.data);
  },

  remove(id: string): Promise<void> {
    return api.delete(`/api/admin/research-domains/${id}`).then(() => undefined);
  }
};
