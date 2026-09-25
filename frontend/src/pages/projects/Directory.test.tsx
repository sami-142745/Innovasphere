import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Directory from './Directory';
import { renderWithProviders } from '../../test/render';

describe('Project Directory', () => {
  it('renders projects from the API', async () => {
    renderWithProviders(<Directory />, { route: '/projects' });

    expect(await screen.findByText('Neural Interface Design')).toBeInTheDocument();
    expect(screen.getByText('Quantum Error Correction')).toBeInTheDocument();
    expect(screen.getByText('Green Energy Grids')).toBeInTheDocument();
    expect(screen.getByText('Autonomous Drones')).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Directory />, { route: '/projects' });

    await screen.findByText('Neural Interface Design');
    await user.type(screen.getByRole('searchbox', { name: 'Search projects' }), 'zzz-no-match');

    expect(await screen.findByText('No projects match your filters')).toBeInTheDocument();
  });

  it('does not render pagination for a single page of results', async () => {
    renderWithProviders(<Directory />, { route: '/projects' });

    await screen.findByText('Neural Interface Design');
    await waitFor(() => {
      expect(screen.queryByLabelText('Pagination')).not.toBeInTheDocument();
    });
  });
});
