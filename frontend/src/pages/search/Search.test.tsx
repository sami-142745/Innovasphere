import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchPage from './Search';
import { renderWithProviders } from '../../test/render';

describe('SearchPage', () => {
  it('shows project results once a debounced keyword matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchPage />, { route: '/search' });

    expect(screen.getByRole('heading', { name: 'Search' })).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Search INNOVASPHERE' }), 'Quantum');

    await waitFor(
      () => {
        expect(screen.queryByText('Neural Interface Design')).not.toBeInTheDocument();
        expect(screen.getByText('Quantum Error Correction')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('shows empty results across projects and mentors when nothing matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchPage />, { route: '/search' });

    await user.click(screen.getByRole('button', { name: 'Projects + Mentors' }));
    expect(await screen.findByText('Prof. Grace Hopper')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Search INNOVASPHERE' }), 'zzz-no-result');

    await waitFor(
      () => {
        expect(screen.getAllByText('No results for "zzz-no-result"')).toHaveLength(2);
      },
      { timeout: 10000 }
    );
  });
});
