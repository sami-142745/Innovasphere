import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('returns null when there is only one page', () => {
    const { container } = render(
      <Pagination page={0} totalPages={1} totalElements={5} pageSize={9} onChange={() => undefined} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('disables previous on the first page and next on the last page', () => {
    render(
      <Pagination page={2} totalPages={3} totalElements={25} pageSize={9} onChange={() => undefined} />
    );

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByText('19–25')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-current', 'page');
  });

  it('calls onChange with the requested page', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Pagination page={1} totalPages={3} totalElements={20} pageSize={9} onChange={onChange} />
    );

    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onChange).toHaveBeenCalledWith(0);

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('renders an ellipsis for large page windows', () => {
    render(
      <Pagination page={20} totalPages={40} totalElements={360} pageSize={9} onChange={() => undefined} />
    );
    expect(screen.getAllByText('…').length).toBeGreaterThan(0);
  });
});