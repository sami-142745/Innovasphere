import { type Page, type Route } from '@playwright/test';

// Mirrors the data shapes used by the existing Vitest MSW fixtures so browser
// tests exercise the same responses without importing the jsdom-bound test
// helpers. Routes are matched on the URL pathname so the same mocks work
// regardless of the API host (VITE_API_URL).
const STUDENT_USER = {
  id: 'u-1',
  username: 'ada.lovelace',
  email: 'ada@university.edu',
  fullName: 'Ada Lovelace',
  role: 'STUDENT' as const,
  active: true,
  createdAt: '2026-01-10T09:00:00Z',
  studentProfile: {
    id: 'sp-1',
    enrollmentNumber: 'ENR-001',
    university: 'INNOVASPHERE University',
    department: 'Computer Science',
    yearOfStudy: 3,
    bio: 'Analytical engine enthusiast.',
    skills: [{ id: 's1', name: 'Mathematics' }],
    researchDomains: [{ id: 'd1', name: 'Artificial Intelligence' }]
  },
  facultyProfile: null
};

const FACULTY_USER = {
  id: 'u-2',
  username: 'grace.hopper',
  email: 'grace@university.edu',
  fullName: 'Grace Hopper',
  role: 'FACULTY' as const,
  active: true,
  createdAt: '2026-01-10T09:00:00Z',
  studentProfile: null,
  facultyProfile: {
    id: 'fp-1',
    department: 'Computer Science',
    designation: 'Professor',
    expertise: 'Compilers',
    bio: 'Pioneer of compiler theory.',
    researchDomains: [{ id: 'd1', name: 'Artificial Intelligence' }],
    skills: [{ id: 's2', name: 'Python' }]
  }
};

const ADMIN_USER = {
  id: 'u-admin',
  username: 'admin',
  email: 'admin@university.edu',
  fullName: 'Admin User',
  role: 'ADMIN' as const,
  active: true,
  createdAt: '2026-01-10T09:00:00Z',
  studentProfile: null,
  facultyProfile: null
};

const TOKEN_PREFIX = 'test-token';

type MockRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

function tokenForRole(role: MockRole): string {
  return `${TOKEN_PREFIX}:${role}`;
}

/**
 * `/api/auth/me` must echo the role of the session that was seeded into
 * localStorage (or issued by `/api/auth/login`). Test tokens encode the role as
 * `test-token:<ROLE>`; anything unrecognised falls back to STUDENT so the
 * existing student flows keep working.
 */
function roleFromAuthorization(header: string | undefined): MockRole {
  const token = header?.replace(/^Bearer\s+/i, '').trim();
  const role = token?.split(':')[1]?.toUpperCase();
  if (role === 'STUDENT' || role === 'FACULTY' || role === 'ADMIN') return role;
  return 'STUDENT';
}

function userForRole(role: MockRole) {
  if (role === 'FACULTY') return FACULTY_USER;
  if (role === 'ADMIN') return ADMIN_USER;
  return STUDENT_USER;
}

function authResponse(user = STUDENT_USER) {
  return { token: tokenForRole(user.role), user, expiresIn: 3600 };
}

const PROJECTS = [
  {
    id: 'p-1',
    title: 'Neural Interface Design',
    shortDescription: 'A novel brain-computer interface for accessibility.',
    description: 'Research into neural interface design with open hardware.',
    status: 'IN_PROGRESS' as const,
    owner: STUDENT_USER,
    domain: 'Artificial Intelligence',
    domains: [{ id: 'd1', name: 'Artificial Intelligence' }],
    skills: [{ id: 's1', name: 'Mathematics' }, { id: 's2', name: 'Python' }],
    mentorName: 'Ada Lovelace',
    teamSize: 4,
    maxTeamSize: 4,
    memberCount: 2,
    createdAt: '2026-02-01T10:30:00Z'
  },
  {
    id: 'p-2',
    title: 'Quantum Error Correction',
    shortDescription: 'Quantum error correction research.',
    description: 'Fault-tolerant quantum computing.',
    status: 'LOOKING_FOR_TEAM' as const,
    owner: STUDENT_USER,
    domain: 'Quantum Computing',
    domains: [{ id: 'd2', name: 'Quantum Computing' }],
    skills: [{ id: 's3', name: 'Physics' }],
    mentorName: 'Grace Hopper',
    teamSize: 3,
    maxTeamSize: 3,
    memberCount: 1,
    createdAt: '2026-02-02T11:00:00Z'
  }
];

const MENTOR = {
  id: 'm-1',
  name: 'Prof. Grace Hopper',
  designation: 'Professor',
  department: 'Computer Science',
  expertise: 'Compilers',
  bio: 'Pioneer of compiler theory.',
  researchDomains: [{ id: 'd1', name: 'Artificial Intelligence' }],
  skills: [{ id: 's2', name: 'Python' }],
  activeMentorships: 3,
  createdAt: '2026-01-10T09:00:00Z'
};

const TEAM = {
  id: 't-1',
  name: 'Core research team',
  description: 'Team description',
  projectId: 'p-1',
  members: [STUDENT_USER],
  createdAt: '2026-02-01T10:00:00Z'
};

const NOTIFICATIONS = [
  {
    id: 'n-1',
    type: 'PROJECT_UPDATE' as const,
    title: 'Project updated',
    message: 'Your project moved to In Progress.',
    read: false,
    createdAt: '2026-02-02T12:00:00Z'
  },
  {
    id: 'n-2',
    type: 'JOIN_REQUEST' as const,
    title: 'New join request',
    message: 'A student wants to join your project.',
    read: false,
    createdAt: '2026-02-02T11:00:00Z'
  },
  {
    id: 'n-3',
    type: 'SYSTEM' as const,
    title: 'Welcome',
    message: 'Welcome to INNOVASPHERE.',
    read: true,
    createdAt: '2026-02-01T09:00:00Z'
  }
];

function pageResponse<T>(content: T[], page = 0, size = 9) {
  const totalElements = content.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  return {
    content,
    totalElements,
    totalPages,
    number: page,
    size,
    numberOfElements: content.length,
    first: page === 0,
    last: page >= totalPages - 1,
    empty: content.length === 0
  };
}

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

const is = (pathname: string) => (url: URL) => url.pathname === pathname;
const startsWith = (prefix: string) => (url: URL) => url.pathname.startsWith(prefix);

/**
 * Prefix-based handlers. Playwright evaluates route handlers in reverse
 * registration order (the most recently registered handler runs first), so
 * these generic handlers are registered before the specific routes in
 * applyRouteMocks to guarantee the specific routes win. Registering them first
 * also avoids the generic `/api/projects/` and `/api/mentors/` handlers
 * shadowing `/api/projects/my`, `/api/projects/search` and `/api/mentors/search`.
 */
function registerGenericRoutes(page: Page) {
  // /api/projects/:id, /api/projects/:id/join-requests, /api/projects/:id/teams
  page.route(startsWith('/api/projects/'), async (route, request) => {
    const url = new URL(request.url());
    const segments = url.pathname.split('/').filter(Boolean);
    // /api/projects/:id
    if (segments.length === 3 && segments[1] === 'projects') {
      const id = segments[2];
      const found = PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];
      if (route.request().method() === 'PUT') {
        await json(route, found);
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 });
      } else {
        await json(route, found);
      }
      return;
    }
    // /api/projects/:id/join-requests
    if (segments.length === 4 && segments[1] === 'projects' && segments[3] === 'join-requests') {
      if (route.request().method() === 'POST') {
        await json(route, { id: 'jr-1', status: 'PENDING' }, 201);
      } else {
        await json(route, []);
      }
      return;
    }
    // /api/projects/:id/join-requests/:requestId
    if (segments.length === 5 && segments[1] === 'projects' && segments[3] === 'join-requests') {
      await json(route, { id: 'jr-1', status: 'ACCEPTED' });
      return;
    }
    // /api/projects/:id/teams
    if (segments.length === 4 && segments[1] === 'projects' && segments[3] === 'teams') {
      if (route.request().method() === 'POST') {
        await json(route, TEAM, 201);
      } else {
        await json(route, [TEAM]);
      }
      return;
    }
    await route.fallback();
  });

  // /api/mentors/:id
  page.route(startsWith('/api/mentors/'), async (route) => {
    const segments = new URL(route.request().url()).pathname.split('/').filter(Boolean);
    if (segments.length === 3 && segments[1] === 'mentors') {
      await json(route, MENTOR);
      return;
    }
    await route.fallback();
  });

  // /api/teams/:id and /api/teams/:id/invitations
  page.route(startsWith('/api/teams/'), async (route, request) => {
    const segments = new URL(request.url()).pathname.split('/').filter(Boolean);
    // /api/teams/:id
    if (segments.length === 3 && segments[1] === 'teams') {
      if (request.method() === 'DELETE') {
        await route.fulfill({ status: 204 });
      } else {
        await json(route, TEAM);
      }
      return;
    }
    // /api/teams/:id/invitations
    if (segments.length === 4 && segments[1] === 'teams' && segments[3] === 'invitations') {
      if (request.method() === 'POST') {
        await json(route, { id: 'inv-1', status: 'PENDING' }, 201);
      } else {
        await json(route, []);
      }
      return;
    }
    await route.fallback();
  });

  // /api/mentorships/requests/:id and /received
  page.route(startsWith('/api/mentorships/requests/'), async (route, request) => {
    const url = new URL(request.url());
    if (url.pathname.endsWith('/received')) {
      await json(route, []);
      return;
    }
    await json(route, { id: 'mr-1', status: 'ACCEPTED' });
  });

  // /api/recommendations/{projects,mentors}/:id/score
  page.route(startsWith('/api/recommendations/projects/'), async (route) => {
    if (new URL(route.request().url()).pathname.endsWith('/score')) {
      await json(route, { score: 85 });
      return;
    }
    await route.fallback();
  });
  page.route(startsWith('/api/recommendations/mentors/'), async (route) => {
    if (new URL(route.request().url()).pathname.endsWith('/score')) {
      await json(route, { score: 92 });
      return;
    }
    await route.fallback();
  });

  // /api/notifications/:id/read and /api/notifications/:id (delete)
  page.route(startsWith('/api/notifications/'), async (route, request) => {
    const url = new URL(request.url());
    const segments = url.pathname.split('/').filter(Boolean);
    // /api/notifications/:id/read
    if (segments.length === 4 && segments[1] === 'notifications' && segments[2] !== 'read-all' && url.pathname.endsWith('/read')) {
      const id = segments[2];
      const found = NOTIFICATIONS.find((n) => n.id === id) ?? NOTIFICATIONS[0];
      await json(route, { ...found, read: true });
      return;
    }
    // /api/notifications/:id (delete)
    if (segments.length === 3 && segments[1] === 'notifications') {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 });
        return;
      }
    }
    await route.fallback();
  });

  // /api/invitations/:id/accept|reject
  page.route(startsWith('/api/invitations/'), async (route) => {
    const segments = new URL(route.request().url()).pathname.split('/').filter(Boolean);
    if (segments.length === 4 && segments[1] === 'invitations') {
      if (segments[3] === 'accept' || segments[3] === 'reject') {
        await json(route, { id: 'inv-1', status: segments[3] === 'accept' ? 'ACCEPTED' : 'REJECTED' });
        return;
      }
    }
    await route.fallback();
  });
}

export function applyRouteMocks(page: Page) {
  registerGenericRoutes(page);

  // Auth
  page.route(is('/api/auth/me'), async (route, request) => {
    const role = roleFromAuthorization(request.headers()['authorization']);
    await json(route, userForRole(role));
  });
  page.route(is('/api/auth/login'), async (route, request) => {
    const body = (await request.postDataJSON()) as { email?: string; password?: string };
    if (body.email === 'fail@university.edu' || body.password === 'wrong-password') {
      await json(route, { message: 'Invalid email or password' }, 401);
      return;
    }
    await json(route, body.email === 'faculty@university.edu' ? authResponse(FACULTY_USER) : authResponse(STUDENT_USER));
  });
  page.route(is('/api/auth/register'), async (route) => {
    await json(route, authResponse(STUDENT_USER));
  });

  // Health
  page.route(is('/api/health'), async (route) => {
    await json(route, { status: 'UP' });
  });

  // Projects (exact/static routes)
  page.route(is('/api/projects/my'), async (route) => {
    await json(route, pageResponse([PROJECTS[0]], 0, 100));
  });
  page.route(is('/api/projects/search'), async (route, request) => {
    const url = new URL(request.url());
    const pageNum = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '9');
    await json(route, pageResponse(PROJECTS, pageNum, size));
  });
  page.route(is('/api/projects'), async (route, request) => {
    const url = new URL(request.url());
    const pageNum = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '9');
    await json(route, pageResponse(PROJECTS, pageNum, size));
  });
  page.route(is('/api/join-requests/my'), async (route) => {
    await json(route, pageResponse([], 0, 15));
  });
  // Mentors
  page.route(is('/api/mentors/search'), async (route, request) => {
    const url = new URL(request.url());
    const pageNum = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '9');
    await json(route, pageResponse([MENTOR], pageNum, size));
  });
  page.route(is('/api/mentors'), async (route, request) => {
    const url = new URL(request.url());
    const pageNum = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '9');
    await json(route, pageResponse([MENTOR], pageNum, size));
  });
  // Mentorships
  page.route(is('/api/mentorships/requests'), async (route) => {
    if (route.request().method() === 'POST') {
      await json(route, { id: 'mr-1', status: 'PENDING' }, 201);
    } else {
      await json(route, []);
    }
  });
  // Recommendations
  page.route(is('/api/recommendations/projects'), async (route) => {
    await json(route, pageResponse([
      {
        projectId: 'p-1',
        title: 'Neural Interface Design',
        owner: STUDENT_USER,
        status: 'LOOKING_FOR_TEAM',
        matchScore: 85,
        matchedSkills: ['Python'],
        matchedDomains: ['Artificial Intelligence'],
        matchedInterests: [],
        missingSkills: ['Machine Learning'],
        reason: 'Strong overlap with your profile.'
      }
    ], 0, 9));
  });
  page.route(is('/api/recommendations/mentors'), async (route) => {
    await json(route, pageResponse([
      {
        mentorId: 'm-1',
        name: 'Prof. Grace Hopper',
        matchScore: 92,
        matchedSkills: ['Python'],
        matchedDomains: ['Artificial Intelligence'],
        reason: 'Shares your research interests.'
      }
    ], 0, 6));
  });
  // Notifications (static routes)
  page.route(is('/api/notifications/unread'), async (route) => {
    await json(route, pageResponse(NOTIFICATIONS.filter((n) => !n.read), 0, 15));
  });
  page.route(is('/api/notifications/count'), async (route) => {
    await json(route, { count: 2 });
  });
  page.route(is('/api/notifications/read-all'), async (route) => {
    await route.fulfill({ status: 204 });
  });
  page.route(is('/api/notifications'), async (route) => {
    await json(route, pageResponse(NOTIFICATIONS, 0, 15));
  });

  // Reference
  page.route(is('/api/skills'), async (route) => {
    await json(route, [{ id: 's1', name: 'Mathematics' }, { id: 's2', name: 'Python' }]);
  });
  page.route(is('/api/research-domains'), async (route) => {
    await json(route, [{ id: 'd1', name: 'Artificial Intelligence' }, { id: 'd2', name: 'Quantum Computing' }]);
  });

  // Invitations
  page.route(is('/api/invitations/my'), async (route) => {
    await json(route, []);
  });
  // Admin
  page.route(is('/api/admin/notifications'), async (route) => {
    await route.fulfill({ status: 204 });
  });
}

export const TEST_USER = {
  student: STUDENT_USER,
  faculty: FACULTY_USER
};

export const AUTH_TOKEN_VALUE = tokenForRole('STUDENT');
