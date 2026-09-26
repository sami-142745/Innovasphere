import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import { makeAuth, makeNotification, makePage, makeProject, makeRecommendedProject, makeUser } from './fixtures';

const PROJECTS = [
  makeProject({ id: 'p-1', title: 'Neural Interface Design', status: 'IN_PROGRESS' }),
  makeProject({ id: 'p-2', title: 'Quantum Error Correction', status: 'LOOKING_FOR_TEAM' }),
  makeProject({ id: 'p-3', title: 'Green Energy Grids', status: 'IDEA' }),
  makeProject({ id: 'p-4', title: 'Autonomous Drones', status: 'UNDER_REVIEW' }),
  makeProject({ id: 'p-5', title: 'Blockchain Voting', status: 'IN_PROGRESS' }),
  makeProject({ id: 'p-6', title: 'Climate Modeling', status: 'LOOKING_FOR_TEAM' }),
  makeProject({ id: 'p-7', title: 'Protein Folding', status: 'IDEA' }),
  makeProject({ id: 'p-8', title: 'Quantum Cryptography', status: 'UNDER_REVIEW' }),
  makeProject({ id: 'p-9', title: 'Solar Cell Efficiency', status: 'IN_PROGRESS' }),
  makeProject({ id: 'p-10', title: 'Brain-Computer Interface', status: 'LOOKING_FOR_TEAM' }),
  makeProject({ id: 'p-11', title: 'Fusion Energy', status: 'IDEA' }),
  makeProject({ id: 'p-12', title: 'CRISPR Gene Editing', status: 'UNDER_REVIEW' }),
  makeProject({ id: 'p-13', title: 'Dark Matter Detection', status: 'IN_PROGRESS' }),
  makeProject({ id: 'p-14', title: 'Exoplanet Atmosphere', status: 'LOOKING_FOR_TEAM' }),
  makeProject({ id: 'p-15', title: 'Neuromorphic Computing', status: 'IDEA' }),
  makeProject({ id: 'p-16', title: 'Carbon Capture', status: 'UNDER_REVIEW' }),
  makeProject({ id: 'p-17', title: 'Quantum Teleportation', status: 'IN_PROGRESS' }),
  makeProject({ id: 'p-18', title: 'Synthetic Biology', status: 'LOOKING_FOR_TEAM' }),
  makeProject({ id: 'p-19', title: 'Gravitational Waves', status: 'IDEA' }),
  makeProject({ id: 'p-20', title: 'Metamaterials', status: 'UNDER_REVIEW' }),
];

const NOTIFICATIONS = [
  makeNotification({ id: 'n-1', type: 'PROJECT_UPDATE', title: 'Project updated', read: false }),
  makeNotification({ id: 'n-2', type: 'JOIN_REQUEST', title: 'New join request', read: false }),
  makeNotification({ id: 'n-3', type: 'SYSTEM', title: 'Welcome', read: true })
];

export const handlers = [
  http.get('*/api/health', () => HttpResponse.json({ status: 'UP' })),

  http.post('*/api/auth/login', async ({ request }) => {
    await delay(10);
    const body = (await request.json()) as { email?: string; password?: string };
    if (body.email === 'fail@university.edu') {
      return HttpResponse.json(
        { status: 401, message: 'Invalid email or password.', timestamp: '2026-02-02T12:00:00Z' },
        { status: 401 }
      );
    }
    return HttpResponse.json(makeAuth());
  }),

  http.post('*/api/auth/register', async ({ request }) => {
    await delay(10);
    const body = (await request.json()) as { firstName?: string; lastName?: string; role?: string };
    return HttpResponse.json(
      makeAuth({
        user: makeUser({
          fullName: `${body.firstName ?? ''} ${body.lastName ?? ''}`.trim(),
          role: body.role === 'FACULTY' ? 'FACULTY' : 'STUDENT'
        })
      })
    );
  }),

  http.get('*/api/auth/me', () => {
    try {
      const raw = localStorage.getItem('innovasphere.auth');
      if (raw) {
        const parsed = JSON.parse(raw) as { user?: typeof makeUser };
        if (parsed?.user) return HttpResponse.json(parsed.user);
      }
    } catch {
      // fall through to the default profile
    }
    return HttpResponse.json(makeUser({ id: 'u-1', username: 'ada.lovelace', role: 'STUDENT' }));
  }),

  http.get('*/api/projects/search', async ({ request }) => {
    await delay(10);
    const url = new URL(request.url);
    const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase();
    const status = url.searchParams.get('status');
    const page = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '9');
    let items = PROJECTS;
    if (keyword) items = items.filter((p) => p.title.toLowerCase().includes(keyword));
    if (status) items = items.filter((p) => p.status === status);
    const total = items.length;
    const start = page * size;
    return HttpResponse.json(makePage(items.slice(start, start + size), total, page, size));
  }),

  http.get('*/api/projects/my', () => HttpResponse.json(makePage([PROJECTS[0]], 1, 0, 100))),

  http.get('*/api/projects', () => HttpResponse.json(makePage(PROJECTS, PROJECTS.length))),

  http.get('*/api/join-requests/my', () => HttpResponse.json([])),

  http.get('*/api/recommendations/projects', () =>
    HttpResponse.json(makePage([makeRecommendedProject()], 1, 0, 9))
  ),

  http.get('*/api/recommendations/mentors', () =>
    HttpResponse.json(
      makePage(
        [
          {
            mentorId: 'm-1',
            name: 'Prof. Grace Hopper',
            department: 'Computer Science',
            expertise: 'Compilers',
            matchScore: 92,
            matchedSkills: ['Python'],
            matchedDomains: ['Artificial Intelligence'],
            reason: 'Shares your research interests.'
          }
        ],
        1,
        0,
        6
      )
    )
  ),

  http.get('*/api/mentors/search', async ({ request }) => {
    await delay(10);
    const url = new URL(request.url);
    const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase();
    const mentors = [
      {
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
      }
    ];
    const items = keyword ? mentors.filter((m) => m.name.toLowerCase().includes(keyword)) : mentors;
    const page = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '9');
    return HttpResponse.json(makePage(items, items.length, page, size));
  }),

  http.get('*/api/mentors/requests/received', () => HttpResponse.json([])),

  http.get('*/api/notifications/count', () => HttpResponse.json({ count: 2 })),

  http.get('*/api/notifications', () => HttpResponse.json(makePage(NOTIFICATIONS, NOTIFICATIONS.length, 0, 30))),

  http.put('*/api/notifications/read-all', () => HttpResponse.json(null, { status: 204 })),

  http.put('*/api/notifications/:id/read', () => HttpResponse.json({ ...NOTIFICATIONS[0], read: true })),

  http.delete('*/api/notifications/:id', () => HttpResponse.json(null, { status: 204 })),

  http.get('*/api/skills', () =>
    HttpResponse.json([
      { id: 's1', name: 'Mathematics' },
      { id: 's2', name: 'Python' },
      { id: 's3', name: 'Machine Learning' }
    ])
  ),

  http.get('*/api/research-domains', () =>
    HttpResponse.json([
      { id: 'd1', name: 'Artificial Intelligence' },
      { id: 'd2', name: 'Quantum Computing' }
    ])
  )
];

export const server = setupServer(...handlers);