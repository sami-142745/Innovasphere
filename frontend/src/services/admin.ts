import { api } from '../api/client';

export interface SystemNotificationPayload {
  title: string;
  message?: string;
  userId?: string;
}

export const adminService = {
  broadcast(payload: SystemNotificationPayload): Promise<void> {
    return api.post('/api/admin/notifications', payload).then(() => undefined);
  }
};