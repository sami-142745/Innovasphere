import { api } from '../api/client';
import type { AuthResponse, UserProfileDto } from '../types';
import { persistAuth } from '../utils/authStorage';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'FACULTY';
}

export const authService = {
  login(email: string, password: string): Promise<AuthResponse> {
    return api.post('/api/auth/login', { email, password }).then((r) => {
      persistAuth(r.data);
      return r.data;
    });
  },

  register(payload: RegisterPayload): Promise<AuthResponse> {
    return api.post('/api/auth/register', payload).then((r) => {
      persistAuth(r.data);
      return r.data;
    });
  },

  me(): Promise<UserProfileDto> {
    return api.get('/api/auth/me').then((r) => r.data);
  }
};