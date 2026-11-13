import { api } from '../api/client';
import type { SkillDto } from '../types';

export interface SkillCreatePayload {
  name: string;
  description?: string;
}

export const skillService = {
  list(): Promise<SkillDto[]> {
    return api.get('/api/skills').then((r) => r.data);
  },

  search(keyword?: string): Promise<SkillDto[]> {
    return api.get('/api/skills/search', { params: { keyword: keyword || undefined } }).then((r) => r.data);
  },

  create(payload: SkillCreatePayload): Promise<SkillDto> {
    return api.post('/api/admin/skills', payload).then((r) => r.data);
  },

  remove(id: string): Promise<void> {
    return api.delete(`/api/admin/skills/${id}`).then(() => undefined);
  }
};
