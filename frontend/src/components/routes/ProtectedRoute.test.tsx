import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';
import { renderWithProviders } from '../../test/render';
import { makeAuth } from '../../test/fixtures';

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>Secret content</div>
      </ProtectedRoute>,
      { route: '/dashboard' }
    );

    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });

  it('renders children for an authenticated user', async () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>Secret content</div>
      </ProtectedRoute>,
      { route: '/dashboard', auth: makeAuth() }
    );

    expect(await screen.findByText('Secret content')).toBeInTheDocument();
  });
});
