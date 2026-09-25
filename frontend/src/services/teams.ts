import { api } from '../api/client';
import type { TeamDto, TeamInvitationDto } from '../types';

export interface TeamCreatePayload {
  name: string;
  description?: string;
}

export interface TeamUpdatePayload {
  name: string;
  description?: string;
}

export interface TeamInvitePayload {
  inviteeId: string;
  message?: string;
}

export const teamService = {
  create(projectId: string, payload: TeamCreatePayload): Promise<TeamDto> {
    return api.post(`/api/projects/${projectId}/teams`, payload).then((r) => r.data);
  },

  listForProject(projectId: string): Promise<TeamDto[]> {
    return api.get(`/api/projects/${projectId}/teams`).then((r) => r.data);
  },

  get(teamId: string): Promise<TeamDto> {
    return api.get(`/api/teams/${teamId}`).then((r) => r.data);
  },

  update(teamId: string, payload: TeamUpdatePayload): Promise<TeamDto> {
    return api.patch(`/api/teams/${teamId}`, payload).then((r) => r.data);
  },

  remove(teamId: string): Promise<void> {
    return api.delete(`/api/teams/${teamId}`).then(() => undefined);
  },

  invite(teamId: string, payload: TeamInvitePayload): Promise<TeamInvitationDto> {
    return api.post(`/api/teams/${teamId}/invitations`, payload).then((r) => r.data);
  },

  listInvitationsForTeam(teamId: string): Promise<TeamInvitationDto[]> {
    return api.get(`/api/teams/${teamId}/invitations`).then((r) => r.data);
  }
};