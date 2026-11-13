import { api } from '../api/client';
import type { AdminStatsDto, AdminUserDto, Page, Role } from '../types';

export interface SystemNotificationPayload {
  title: string;
  message?: string;
  userId?: string;
}

export interface AdminUserQuery {
  keyword?: string;
  role?: Role | '';
  page?: number;
  size?: number;
  sort?: string;
}

export const adminService = {
  broadcast(payload: SystemNotificationPayload): Promise<void> {
    return api.post('/api/admin/notifications', payload).then(() => undefined);
  },

  stats(): Promise<AdminStatsDto> {
    return api.get('/api/admin/stats').then((r) => r.data);
  },

  listUsers(query: AdminUserQuery = {}): Promise<Page<AdminUserDto>> {
    return api.get('/api/admin/users', {
      params: {
        keyword: query.keyword || undefined,
        role: query.role || undefined,
        page: query.page ?? 0,
        size: query.size ?? 10,
        sort: query.sort ?? 'createdAt,desc'
      }
    }).then((r) => r.data);
  },

  updateUserStatus(id: string, active: boolean): Promise<AdminUserDto> {
    return api.patch(`/api/admin/users/${id}/status`, { active }).then((r) => r.data);
  }
};
