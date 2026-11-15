import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import DashboardPage, { FacultyDashboard } from './Dashboard';
import { renderWithProviders } from '../test/render';
import { makeAuth, makePage, makeRecommendedProject, makeUser } from '../test/fixtures';
import { recommendationService } from '../services/recommendations';
import { mentorService } from '../services/mentors';

vi.mock('../services/mentors', () => ({
  mentorService: {
    receivedRequests: vi.fn()
  }
}));

vi.mock('../services/recommendations', () => ({
  recommendationService: {
    projects: vi.fn(),
    mentors: vi.fn()
  }
}));

describe('StudentDashboard', () => {
  it('renders overview stats and recommendations', async () => {
    vi.mocked(recommendationService.projects).mockResolvedValue(
      makePage([makeRecommendedProject()], 1, 0, 9)
    );
    vi.mocked(recommendationService.mentors).mockResolvedValue(
      makePage(
        [{
          mentorId: 'm-1',
          name: 'Prof. Grace Hopper',
          department: 'Computer Science',
          expertise: 'Compilers',
          matchScore: 92,
          matchedSkills: ['Python'],
          matchedDomains: ['Artificial Intelligence'],
          reason: 'Shares your research interests.'
        }],
        1,
        0,
        6
      )
    );

    renderWithProviders(<DashboardPage />, { route: '/dashboard', auth: makeAuth() });

    expect(await screen.findByRole('heading', { name: 'Recommended projects' })).toBeInTheDocument();
    expect(await screen.findByText('Neural Interface Design')).toBeInTheDocument();
    expect(await screen.findByText('Prof. Grace Hopper')).toBeInTheDocument();
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

describe('FacultyDashboard', () => {
  it('renders without crashing when receivedRequests returns an array', async () => {
    vi.mocked(mentorService.receivedRequests).mockResolvedValue([]);

    renderWithProviders(<FacultyDashboard />, {
      route: '/dashboard',
      auth: makeAuth({ user: makeUser({ role: 'FACULTY' }) })
    });
    expect(await screen.findByText('No pending requests')).toBeInTheDocument();
  });

  it('renders pending requests returned by receivedRequests', async () => {
    vi.mocked(mentorService.receivedRequests).mockResolvedValue([
      {
        id: 'mr-1',
        studentId: 'u-1',
        studentName: 'Ada Lovelace',
        facultyId: 'u-2',
        facultyName: 'Grace Hopper',
        projectId: 'p-1',
        projectTitle: 'Neural Interface Design',
        status: 'PENDING',
        message: 'I would love to join your research group.',
        createdAt: '2026-02-01T10:30:00Z'
      }
    ]);

    renderWithProviders(<FacultyDashboard />, {
      route: '/dashboard',
      auth: makeAuth({ user: makeUser({ role: 'FACULTY' }) })
    });
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Pending mentorship requests')).toBeInTheDocument();
  });
});
