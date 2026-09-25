import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';
import { renderWithProviders } from '../../test/render';

describe('RegisterForm', () => {
  it('reports validation errors for invalid passwords', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Password'), 'weak');
    await user.type(screen.getByLabelText('Confirm password'), 'weak2');
    expect(await screen.findByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('submits a valid registration and stores the auth token', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText('First name'), 'Ada');
    await user.type(screen.getByLabelText('Last name'), 'Lovelace');
    await user.type(screen.getByLabelText('Username'), 'ada.lovelace');
    await user.type(screen.getByLabelText('Email'), 'ada@university.edu');
    await user.type(screen.getByLabelText('Password'), 'Str0ng!pass');
    await user.type(screen.getByLabelText('Confirm password'), 'Str0ng!pass');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(localStorage.getItem('innovasphere.auth')).toContain('test-token');
    });
  });
});
