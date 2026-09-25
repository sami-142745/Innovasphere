import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import DashboardPage from './Dashboard';
import { renderWithProviders } from '../test/render';
import { makeAuth, makeUser } from '../test/fixtures';

describe('StudentDashboard', () => {
  it('renders overview stats and recommendations', async () => {
    renderWithProviders(<DashboardPage />, { route: '/dashboard', auth: makeAuth() });

    expect(await screen.findByRole('heading', { name: 'Recommended projects' })).toBeInTheDocument();
    expect(screen.getByText('Neural Interface Design')).toBeInTheDocument();
    expect(screen.getByText('Prof. Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('My projects')).toBeInTheDocument();
    expect(screen.getByText('Unread notifications')).toBeInTheDocument();
  });
});

describe('AdminDashboard', () => {
  it('renders the admin overview card', async () => {
    renderWithProviders(<DashboardPage />, {
      route: '/dashboard',
      auth: makeAuth({ user: makeUser({ role: 'ADMIN', studentProfile: null }) })
    });

    expect(await screen.findByText('Admin overview')).toBeInTheDocument();
    expect(screen.getByText('Open admin dashboard')).toBeInTheDocument();
  });
});
