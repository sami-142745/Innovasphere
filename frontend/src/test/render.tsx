import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import { AUTH_STORAGE_KEY } from '../utils/constants';
import type { StoredAuth } from '../context/AuthContext';
import { makeAuth } from './fixtures';

interface RenderWithProvidersOptions {
  route?: string;
  auth?: StoredAuth | null;
  routerProps?: Partial<MemoryRouterProps>;
}

function ProviderStack({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
): ReturnType<typeof render> {
  const { route = '/', auth = null, routerProps } = options;
  if (auth) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth ?? makeAuth()));
  }
  const wrapped = <MemoryRouter initialEntries={[route]} {...routerProps}>{ui}</MemoryRouter>;
  return render(wrapped, { wrapper: ProviderStack } as RenderOptions);
}

export { renderWithProviders as render };