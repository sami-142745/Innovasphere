import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler } from '../api/client';
import { authService, type RegisterPayload } from '../services/auth';
import type { Role, UserProfileDto } from '../types';
import { AUTH_STORAGE_KEY, TOKEN_KEY } from '../utils/constants';

export interface StoredAuth {
  token: string;
  user: UserProfileDto;
  expiresIn: number;
}

interface AuthContextValue {
  user: UserProfileDto | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  hasRole: (roles: Role[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistAuth(auth: StoredAuth): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

function clearAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(() => readStoredAuth());
  const [user, setUser] = useState<UserProfileDto | null>(() => readStoredAuth()?.user ?? null);
  const [isInitializing, setIsInitializing] = useState(true);

  const logout = useCallback(() => {
    clearAuth();
    setAuth(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    async function restoreUser() {
      const stored = readStoredAuth();
      if (!stored) {
        setIsInitializing(false);
        return;
      }
      try {
        const fresh = await authService.me();
        if (!cancelled) {
          setUser(fresh);
          persistAuth({ ...stored, user: fresh });
        }
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }
    void restoreUser();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login(email, password);
    const next = { token: response.token, user: response.user, expiresIn: response.expiresIn };
    persistAuth(next);
    setAuth(next);
    setUser(response.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    const next = { token: response.token, user: response.user, expiresIn: response.expiresIn };
    persistAuth(next);
    setAuth(next);
    setUser(response.user);
  }, []);

  const hasRole = useCallback(
    (roles: Role[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(auth && user),
      isInitializing,
      hasRole,
      login,
      register,
      logout
    }),
    [user, auth, isInitializing, hasRole, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}