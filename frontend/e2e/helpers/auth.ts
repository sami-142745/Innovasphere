import { Page } from '@playwright/test';

const AUTH_STORAGE_KEY = 'innovasphere.auth';
const TOKEN_KEY = 'innovasphere.token';
const TOKEN_PREFIX = 'test-token';

export type TestRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

/**
 * The mock `/api/auth/me` derives the session role from the bearer token, so
 * every seeded/issued token must encode the role (e.g. `test-token:ADMIN`).
 */
export function tokenForRole(role: TestRole): string {
  return `${TOKEN_PREFIX}:${role}`;
}

export interface TestUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: TestRole;
  studentProfile?: Record<string, unknown> | null;
  facultyProfile?: Record<string, unknown> | null;
}

export const STUDENT_USER: TestUser = {
  id: 'u-1',
  username: 'ada.lovelace',
  email: 'ada@university.edu',
  fullName: 'Ada Lovelace',
  role: 'STUDENT',
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

export const FACULTY_USER: TestUser = {
  id: 'u-2',
  username: 'grace.hopper',
  email: 'grace@university.edu',
  fullName: 'Grace Hopper',
  role: 'FACULTY',
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

/**
 * Writes a stored auth record into localStorage on a committed document.
 * Calling page.evaluate against an uncommitted (about:blank) document throws
 * a SecurityError, so callers must ensure the page has navigated first.
 */
async function setAuth(page: Page, user: TestUser) {
  const authToken = tokenForRole(user.role);
  await page.evaluate(
    ({ authStorageKey, tokenKey, authToken, user }) => {
      const auth = { token: authToken, user, expiresIn: 3600 };
      localStorage.setItem(authStorageKey, JSON.stringify(auth));
      localStorage.setItem(tokenKey, authToken);
    },
    { authStorageKey: AUTH_STORAGE_KEY, tokenKey: TOKEN_KEY, authToken, user }
  );
}

export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  });
}

/**
 * Authenticates a page for a protected route.
 *
 * 1. Navigate to the target path to commit a document (unauthenticated access
 *    may redirect to /login, which is still a committed document).
 * 2. Seed localStorage with the stored auth record.
 * 3. Re-navigate to the target path so AuthContext reads the stored auth and
 *    renders the correct role-gated page.
 */
export async function authenticate(page: Page, user: TestUser, path: string) {
  await page.goto(path);
  await setAuth(page, user);
  await page.goto(path);
}

export async function loginAsStudent(page: Page) {
  await page.goto('/');
  await setAuth(page, STUDENT_USER);
}

export async function loginAsFacultyUI(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('faculty@university.edu');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/);
}
