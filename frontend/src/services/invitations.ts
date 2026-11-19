import { api } from '../api/client';
import { createApiCache } from '../utils/apiCache';
import { getCurrentUserId } from '../utils/currentUser';
import type { TeamInvitationDto } from '../types';

const invitationCache = createApiCache<TeamInvitationDto[]>({ ttlMs: 30_000 });

export const invitationService = {
  my(): Promise<TeamInvitationDto[]> {
    const userId = getCurrentUserId();
    const cacheKey = `invitation:my:${userId}`;

    const cached = invitationCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);

    return api.get('/api/invitations/my').then((r) => {
      invitationCache.set(cacheKey, r.data);
      return r.data;
    });
  },

  accept(id: string): Promise<TeamInvitationDto> {
    return api.post(`/api/invitations/${id}/accept`).then((r) => {
      const userId = getCurrentUserId();
      invitationCache.invalidatePattern(`invitation:my:${userId}`);
      return r.data;
    });
  },

  reject(id: string): Promise<TeamInvitationDto> {
    return api.post(`/api/invitations/${id}/reject`).then((r) => {
      const userId = getCurrentUserId();
      invitationCache.invalidatePattern(`invitation:my:${userId}`);
      return r.data;
    });
  }
};
