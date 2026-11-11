import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { render } from '@testing-library/react';
import Profile from './Profile';
import type { UserProfileDto } from '../../types';

describe('StudentProfile', () => {
  it('renders without crashing when studentProfile.skills/researchDomains are undefined', async () => {
    const user = {
      id: 'u-1',
      username: 'ada.lovelace',
      email: 'ada@university.edu',
      fullName: 'Ada Lovelace',
      role: 'STUDENT',
      active: true,
      createdAt: '2026-01-10T09:00:00Z',
      studentProfile: { id: 'sp-1', enrollmentNumber: 'ENR-001' },
      facultyProfile: null
    } as UserProfileDto;
    render(
      <AuthContext.Provider
        value={{
          user,
          isAuthenticated: true,
          isInitializing: false,
          hasRole: () => false,
          login: vi.fn(),
          register: vi.fn(),
          logout: vi.fn()
        }}
      >
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    // studentProfile.skills/researchDomains are undefined at runtime despite the
    // type declaring them required, so the page must degrade gracefully instead of
    // throwing when accessing .length / .map.
    expect(await screen.findByText('Profile')).toBeInTheDocument();
  });

  it('renders research interests when skills and researchDomains are present', async () => {
    const user = {
      id: 'u-1',
      username: 'ada.lovelace',
      email: 'ada@university.edu',
      fullName: 'Ada Lovelace',
      role: 'STUDENT',
      active: true,
      createdAt: '2026-01-10T09:00:00Z',
      studentProfile: {
        id: 'sp-1',
        enrollmentNumber: 'ENR-001',
        skills: [{ id: 's1', name: 'Mathematics' }],
        researchDomains: [{ id: 'd1', name: 'Artificial Intelligence' }]
      },
      facultyProfile: null
    } as UserProfileDto;
    render(
      <AuthContext.Provider
        value={{
          user,
          isAuthenticated: true,
          isInitializing: false,
          hasRole: () => false,
          login: vi.fn(),
          register: vi.fn(),
          logout: vi.fn()
        }}
      >
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(await screen.findByText('Mathematics')).toBeInTheDocument();
    expect(await screen.findByText('Artificial Intelligence')).toBeInTheDocument();
  });

  it('renders no-interests state when skills is null', async () => {
    const user = {
      id: 'u-1',
      username: 'ada.lovelace',
      email: 'ada@university.edu',
      fullName: 'Ada Lovelace',
      role: 'STUDENT',
      active: true,
      createdAt: '2026-01-10T09:00:00Z',
      studentProfile: {
        id: 'sp-1',
        enrollmentNumber: 'ENR-001',
        skills: null,
        researchDomains: null
      },
      facultyProfile: null
    } as UserProfileDto;
    render(
      <AuthContext.Provider
        value={{
          user,
          isAuthenticated: true,
          isInitializing: false,
          hasRole: () => false,
          login: vi.fn(),
          register: vi.fn(),
          logout: vi.fn()
        }}
      >
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(await screen.findByText(/No research interests added yet\./)).toBeInTheDocument();
  });
});
