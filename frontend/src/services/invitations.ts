import { api } from '../api/client';
import type { TeamInvitationDto } from '../types';

export const invitationService = {
  my(): Promise<TeamInvitationDto[]> {
    return api.get('/api/invitations/my').then((r) => r.data);
  },

  accept(id: string): Promise<TeamInvitationDto> {
    return api.post(`/api/invitations/${id}/accept`).then((r) => r.data);
  },

  reject(id: string): Promise<TeamInvitationDto> {
    return api.post(`/api/invitations/${id}/reject`).then((r) => r.data);
  }
};