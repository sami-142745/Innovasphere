import { api } from '../api/client';
import type { CountResponse, NotificationDto, Page } from '../types';

export const notificationService = {
  list(page = 0, size = 15): Promise<Page<NotificationDto>> {
    return api.get('/api/notifications', { params: { page, size } }).then((r) => r.data);
  },

  unread(page = 0, size = 15): Promise<Page<NotificationDto>> {
    return api.get('/api/notifications/unread', { params: { page, size } }).then((r) => r.data);
  },

  unreadCount(): Promise<CountResponse> {
    return api.get('/api/notifications/count').then((r) => r.data);
  },

  markRead(id: string): Promise<NotificationDto> {
    return api.put(`/api/notifications/${id}/read`).then((r) => r.data);
  },

  markAllRead(): Promise<void> {
    return api.put('/api/notifications/read-all').then(() => undefined);
  },

  remove(id: string): Promise<void> {
    return api.delete(`/api/notifications/${id}`).then(() => undefined);
  }
};