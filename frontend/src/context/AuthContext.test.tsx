import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from './AuthContext';
import { renderWithProviders } from '../test/render';
import { AUTH_STORAGE_KEY } from '../utils/constants';
import { makeAuth } from '../test/fixtures';

function Probe() {
  const { user, isAuthenticated, isInitializing, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">
        {isInitializing ? 'init' : isAuthenticated ? 'authed' : 'guest'}:{user?.fullName ?? '—'}
      </span>
      <button onClick={() => void login('ada@university.edu', 'pw')}>Login</button>
      {isAuthenticated && <button onClick={logout}>Logout</button>}
    </div>
  );
}

describe('AuthContext', () => {
  it('starts unauthenticated and logs in successfully', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Probe />);

    expect(screen.getByTestId('status')).toHaveTextContent('guest:—');

    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authed:Ada Lovelace');
    });
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain('test-token');
  });

  it('restores a persisted session and refreshes the profile', async () => {
    renderWithProviders(<Probe />, { route: '/', auth: makeAuth() });

    expect(await screen.findByTestId('status')).toHaveTextContent('authed:Ada Lovelace');
  });

  it('clears the session on logout', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Probe />, { route: '/', auth: makeAuth() });

    await screen.findByTestId('status');
    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    });
    expect(screen.getByTestId('status')).toHaveTextContent('guest:—');
  });
});
