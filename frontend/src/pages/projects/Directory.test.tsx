import { describe, expect, it } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Directory from './Directory';
import { renderWithProviders } from '../../test/render';
import { clearProjectCache, getCacheKeys } from '../../utils/projectCache';

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
    const { server } = await import('../../test/server');
    const { http, HttpResponse } = await import('msw');
    const { makeProject, makePage } = await import('../../test/fixtures');

    const singleProject = [makeProject({ id: 'p-1', title: 'Single Project' })];

    server.use(
      http.get('*/api/projects/search', async ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') ?? '0');
        const size = Number(url.searchParams.get('size') ?? '9');
        return HttpResponse.json(makePage(singleProject, 1, page, size));
      })
    );

    renderWithProviders(<Directory />, { route: '/projects' });

    await screen.findByText('Single Project');
    await waitFor(() => {
      expect(screen.queryByLabelText('Pagination')).not.toBeInTheDocument();
    });
  });

  it('caches each page separately with page number in cache key', async () => {
    const user = userEvent.setup();
    clearProjectCache();
    renderWithProviders(<Directory />, { route: '/projects' });

    await screen.findByText('Neural Interface Design');
    await waitFor(() => expect(screen.getByLabelText('Pagination')).toBeInTheDocument());

    const page2Button = screen.getByRole('button', { name: '2' });
    await act(async () => {
      await user.click(page2Button);
    });

    // Wait for fetch to complete (cache will be populated)
    await waitFor(() => {
      const keys = getCacheKeys();
      expect(keys.length).toBeGreaterThanOrEqual(2);
      const hasPage0 = keys.some((k: string) => k.includes('"page":0'));
      const hasPage1 = keys.some((k: string) => k.includes('"page":1'));
      expect(hasPage0).toBe(true);
      expect(hasPage1).toBe(true);
    }, { timeout: 10000 });
  });
});
