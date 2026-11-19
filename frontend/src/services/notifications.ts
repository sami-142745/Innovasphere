import { api } from '../api/client';
import { createApiCache } from '../utils/apiCache';
import { getCurrentUserId } from '../utils/currentUser';
import type { CountResponse, NotificationDto, Page, NotificationPreferenceDto, NotificationPreferenceUpdateRequest } from '../types';

const notificationCache = createApiCache<Page<NotificationDto>>({ ttlMs: 30_000 });
const notificationCountCache = createApiCache<CountResponse>({ ttlMs: 30_000 });

export const notificationService = {
  list(page = 0, size = 15): Promise<Page<NotificationDto>> {
    const userId = getCurrentUserId();
    const cacheKey = `notifications:list:${userId}:${page}:${size}`;

    const cached = notificationCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);

    return api.get('/api/notifications', { params: { page, size } }).then((r) => {
      notificationCache.set(cacheKey, r.data);
      return r.data;
    });
  },

  unread(page = 0, size = 15): Promise<Page<NotificationDto>> {
    return api.get('/api/notifications/unread', { params: { page, size } }).then((r) => r.data);
  },

  unreadCount(): Promise<CountResponse> {
    const userId = getCurrentUserId();
    const cacheKey = `notifications:count:${userId}`;

    const cached = notificationCountCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);

    return api.get('/api/notifications/count').then((r) => {
      notificationCountCache.set(cacheKey, r.data);
      return r.data;
    });
  },

  markRead(id: string): Promise<NotificationDto> {
    return api.put(`/api/notifications/${id}/read`).then((r) => {
      const userId = getCurrentUserId();
      notificationCache.invalidatePattern(`notifications:list:${userId}:`);
      notificationCountCache.invalidatePattern(`notifications:count:${userId}`);
      return r.data;
    });
  },

  markAllRead(): Promise<void> {
    return api.put('/api/notifications/read-all').then(() => {
      const userId = getCurrentUserId();
      notificationCache.invalidatePattern(`notifications:list:${userId}:`);
      notificationCountCache.invalidatePattern(`notifications:count:${userId}`);
    });
  },

  remove(id: string): Promise<void> {
    return api.delete(`/api/notifications/${id}`).then(() => {
      const userId = getCurrentUserId();
      notificationCache.invalidatePattern(`notifications:list:${userId}:`);
      notificationCountCache.invalidatePattern(`notifications:count:${userId}`);
    });
  },

  getPreferences(): Promise<NotificationPreferenceDto> {
    return api.get('/api/notifications/preferences').then((r) => r.data);
  },

  updatePreferences(payload: NotificationPreferenceUpdateRequest): Promise<NotificationPreferenceDto> {
    return api.put('/api/notifications/preferences', payload).then((r) => r.data);
  }
};
