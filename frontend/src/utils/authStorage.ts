import { AUTH_STORAGE_KEY, TOKEN_KEY } from '../utils/constants';

/**
 * Get the JWT token from localStorage.
 * Checks innovasphere.auth first (preferred), then falls back to innovasphere.token.
 */
export function getToken(): string | null {
  try {
    const raw = localStorage.getItem('innovasphere.auth');
    if (raw) {
      const parsed = JSON.parse(raw) as { token?: string };
      if (parsed.token) return parsed.token;
    }
  } catch {
    // Ignore malformed JSON
  }
  return localStorage.getItem('innovasphere.token');
}

/**
 * Persist authentication data to localStorage.
 * Saves both the full auth object and the token separately for backwards compatibility.
 */
export function persistAuth(auth: { token: string; user: unknown; expiresIn: number }): void {
  const stored = {
    token: auth.token,
    user: auth.user,
    expiresIn: auth.expiresIn,
  };
  localStorage.setItem('innovasphere.auth', JSON.stringify(stored));
  localStorage.setItem('innovasphere.token', auth.token);
}

/**
 * Clear all authentication data from localStorage.
 */
export function clearAuth(): void {
  localStorage.removeItem('innovasphere.auth');
  localStorage.removeItem('innovasphere.token');
}