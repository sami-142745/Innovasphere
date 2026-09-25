import { api } from '../api/client';

export interface HealthResponse {
  status: string;
  service?: string;
  [key: string]: unknown;
}

export const healthService = {
  check(): Promise<HealthResponse> {
    return api.get('/api/health').then((r) => r.data);
  }
};