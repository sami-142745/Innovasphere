import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsPage from './Notifications';
import { renderWithProviders } from '../../test/render';
import { makeAuth } from '../../test/fixtures';

describe('NotificationsPage', () => {
  it('lists notifications with unread markers', async () => {
    renderWithProviders(<NotificationsPage />, { route: '/notifications', auth: makeAuth() });

    expect(await screen.findByText('Project updated')).toBeInTheDocument();
    expect(screen.getByText('New join request')).toBeInTheDocument();
    expect(screen.getByText('2 unread notifications')).toBeInTheDocument();
  });

  it('filters by type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsPage />, { route: '/notifications', auth: makeAuth() });

    await screen.findByText('Project updated');
    await user.click(screen.getByRole('button', { name: /system/i }));

    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.queryByText('Project updated')).not.toBeInTheDocument();
  });

  it('marks all notifications as read', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsPage />, { route: '/notifications', auth: makeAuth() });

    await screen.findByText('Project updated');
    await user.click(screen.getByRole('button', { name: /mark all read/i }));

    expect(await screen.findByText('All notifications marked as read')).toBeInTheDocument();
  });

  it('deletes a single notification', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsPage />, { route: '/notifications', auth: makeAuth() });

    await screen.findByText('Project updated');
    await user.click(screen.getByRole('button', { name: 'Delete notification: Project updated' }));

    expect(await screen.findByText('Notification deleted')).toBeInTheDocument();
  });
});
