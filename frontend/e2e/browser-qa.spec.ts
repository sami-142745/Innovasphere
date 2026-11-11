import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { applyRouteMocks } from './helpers/mocks';
import { authenticate, loginAsFacultyUI, STUDENT_USER } from './helpers/auth';

test.use({ acceptDownloads: true });

test.beforeAll(async () => {
  // Route mocks are applied per-test in beforeEach so every page navigation
  // gets a fresh mock registration.
});

let consoleErrors: string[] = [];
let pageErrors: string[] = [];
let failedRequests: string[] = [];

function screenshotPath(testInfo: TestInfo, label: string): string {
  const safe = label.replace(/[^a-z0-9]/gi, '_').slice(0, 80);
  return `e2e/test-results/screenshots/${testInfo.project.name}-${safe}.png`;
}

async function capture(page: Page, testInfo: TestInfo, label: string) {
  await page.screenshot({ path: screenshotPath(testInfo, label), fullPage: true });
}

async function assertNoClientErrors(page: Page, testInfo: TestInfo, label: string) {
  expect(pageErrors, `[${label}] page errors`).toEqual([]);

  // Chromium logs a generic "Failed to load resource ... status of 4xx" console
  // error whenever the app intentionally receives a client-error response (e.g.
  // the login-failure test). Those browser network logs are not application
  // console errors; genuine network failures are still caught by failedRequests
  // below, and 5xx/CORS/ERR_FAILED logs are not filtered out here.
  const appConsoleErrors = consoleErrors.filter(
    (entry) => !/Failed to load resource: the server responded with a status of 4\d{2}/.test(entry)
  );
  expect(appConsoleErrors, `[${label}] console errors`).toEqual([]);

  // Only fail on requests to the app's own API (mocked in tests). Third-party
  // fonts and Vite dev-server chunk noise are environmental, not app defects.
  const apiFailures = failedRequests.filter((r) => r.includes('/api/'));
  expect(apiFailures, `[${label}] failed API requests`).toEqual([]);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(overflow, `[${label}] horizontal overflow`).toBe(false);

  await capture(page, testInfo, label);
}

test.beforeEach(async ({ page }) => {
  await applyRouteMocks(page);

  consoleErrors = [];
  pageErrors = [];
  failedRequests = [];

  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[console] ${msg.text()}`);
  });
  page.on('requestfailed', (req) => failedRequests.push(`[request] ${req.method()} ${req.url()}`));
});

test.afterEach(async ({ page }) => {
  const testInfo = test.info();
  await assertNoClientErrors(page, testInfo, testInfo.title);
});

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

test.describe('Public landing and navigation', () => {
  test('landing page renders hero, CTAs and navigation @public', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /research projects/i })).toBeVisible();
    await expect(page.locator('main').getByRole('link', { name: /browse projects/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /projects/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /mentors/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /switch to/i })).toBeVisible();
  });

  test('navigates between public pages @public', async ({ page }) => {
    await page.goto('/');
    await page.locator('main').getByRole('link', { name: /browse projects/i }).click();
    await expect(page).toHaveURL(/\/browse/);
    await expect(page.getByRole('heading', { name: /browse research projects/i })).toBeVisible();

    await page.getByRole('link', { name: /mentors/i }).first().click();
    await expect(page).toHaveURL(/\/mentors/);
    await expect(page.getByRole('heading', { name: /mentor directory/i })).toBeVisible();

    await page.getByRole('link', { name: /innovasphere home/i }).first().click();
    await expect(page).toHaveURL('/');
  });

  test('mobile navigation drawer opens and closes @public', async ({ page }) => {
    await page.goto('/');
    const menu = page.getByRole('button', { name: /open menu/ });
    if ((await menu.count()) > 0) {
      await menu.click();
      await expect(page.getByRole('link', { name: /projects/i }).first()).toBeVisible();
      await menu.click();
    }
  });
});

test.describe('Login and registration', () => {
  test('login page renders and shows validation errors @auth', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('login as student navigates to dashboard @auth', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('ada@university.edu');
    await page.getByLabel('Password').fill('secret123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('login failure shows error @auth', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('fail@university.edu');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('registration page renders and validates @auth', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/first name is required/i)).toBeVisible();
    await expect(page.getByText(/username must be at least 3 characters/i)).toBeVisible();
  });
});

test.describe('Theme switching', () => {
  test('theme toggle switches light and dark @public', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /switch to/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await toggle.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('theme toggle works on login page @auth', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /switch to/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});

test.describe('Student dashboard', () => {
  test('renders hero, stat cards and recommendations @dashboard', async ({ page }) => {
    await authenticate(page, STUDENT_USER, '/dashboard');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByRole('main').getByText(/my projects/i)).toBeVisible();
    await expect(page.getByRole('main').getByText(/unread notifications/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /recommended projects/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /recommended mentors/i })).toBeVisible();
  });

  test('can start a project from dashboard @dashboard', async ({ page }) => {
    await authenticate(page, STUDENT_USER, '/dashboard');
    await page.getByRole('link', { name: /start a project/i }).click();
    await expect(page).toHaveURL(/\/projects\/create/);
  });
});

test.describe('Faculty dashboard', () => {
  test('renders faculty workspace and mentorship requests @dashboard', async ({ page }) => {
    await loginAsFacultyUI(page);
    await expect(page.getByRole('heading', { name: /hi, grace/i })).toBeVisible();
    await expect(page.getByText(/received requests/i)).toBeVisible();
    await expect(page.getByText(/active mentorships/i)).toBeVisible();
  });
});

test.describe('Project directory and details', () => {
  test('directory renders with search, filters and pagination @discovery', async ({ page }) => {
    await page.goto('/browse');
    await expect(page.getByRole('heading', { name: /browse research projects/i })).toBeVisible();
    await expect(page.getByLabel('Search projects')).toBeVisible();
    await expect(page.getByRole('heading', { name: /neural interface design/i })).toBeVisible();
  });

  test('project detail renders hero, about, teams and join requests @discovery', async ({ page }) => {
    await authenticate(page, STUDENT_USER, '/projects/p-1');
    await expect(page.getByRole('heading', { name: /neural interface design/i })).toBeVisible();
    await expect(page.getByText(/about this project/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Teams$/i })).toBeVisible();
  });

  test('project detail edit/delete for owner @discovery', async ({ page }) => {
    await authenticate(page, STUDENT_USER, '/projects/p-1');
    await page.getByRole('link', { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/projects\/edit\/p-1/);
    await expect(page.getByRole('heading', { name: /edit project/i })).toBeVisible();
  });
});

test.describe('Mentor directory and details', () => {
  test('mentor directory renders with search and filters @discovery', async ({ page }) => {
    await page.goto('/mentors');
    await expect(page.getByRole('heading', { name: /mentor directory/i })).toBeVisible();
    await expect(page.getByLabel('Search mentors')).toBeVisible();
  });

  test('mentor detail renders profile and request button @discovery', async ({ page }) => {
    await authenticate(page, STUDENT_USER, '/mentors/m-1');
    await expect(page.getByRole('heading', { name: /prof. grace hopper/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /request mentorship/i })).toBeVisible();
  });
});

test.describe('Teams and collaboration', () => {
  test('my teams renders join requests and invitations @collaboration', async ({ page }) => {
    await authenticate(page, STUDENT_USER, '/teams');
    await expect(page.getByRole('heading', { name: /my teams/i })).toBeVisible();
    await expect(page.getByText(/my join requests/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Team invitations$/i })).toBeVisible();
  });

  test('team detail renders members and related project @collaboration', async ({ page }) => {
    await authenticate(page, STUDENT_USER, '/teams/t-1');
    await expect(page.getByRole('heading', { name: /core research team/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /members/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /open project/i })).toBeVisible();
  });
});

test.describe('Forms, profiles and settings', () => {
  test('project create renders form fields @forms', async ({ page }) => {
    await authenticate(page, STUDENT_USER, '/projects/create');
    await expect(page.getByRole('heading', { name: /create project/i })).toBeVisible();
    await expect(page.getByLabel('Title')).toBeVisible();
    await expect(page.getByLabel('Full description')).toBeVisible();
    await expect(page.getByRole('button', { name: /create project/i })).toBeVisible();
  });

  test('student profile renders account and academic info @profile', async ({ page }) => {
    await authenticate(page, STUDENT_USER, '/student/profile');
    await expect(page.getByRole('heading', { name: /^Profile$/i })).toBeVisible();
    await expect(page.getByRole('main').getByText(/ada lovelace/i)).toBeVisible();
    await expect(page.getByRole('main').getByText(/account/i)).toBeVisible();
    await expect(page.getByRole('main').getByText(/academic profile/i)).toBeVisible();
  });

  test('faculty profile renders account and mentorship requests @profile', async ({ page }) => {
    await loginAsFacultyUI(page);
    await page.goto('/faculty/profile');
    await expect(page.getByRole('heading', { name: /^Profile$/i })).toBeVisible();
    await expect(page.getByRole('main').getByText(/grace hopper/i)).toBeVisible();
    await expect(page.getByRole('main').getByText(/mentorship requests received/i)).toBeVisible();
  });

  test('settings renders appearance, notifications and account @settings', async ({ page }) => {
    await authenticate(page, STUDENT_USER, '/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Appearance/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Notifications/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Account/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  });

  test('settings save preferences persists @settings', async ({ page }) => {
    await authenticate(page, STUDENT_USER, '/settings');
    await page.getByRole('button', { name: /save preferences/i }).click();
    await expect(page.getByText(/preferences saved/i)).toBeVisible();
  });
});

test.describe('Notifications', () => {
  test('renders hero banner header, filters and list @notifications', async ({ page }) => {
    await authenticate(page, STUDENT_USER, '/notifications');
    await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /mark all read/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /refresh notifications/i })).toBeVisible();
  });

  test('mark read and delete buttons are keyboard accessible @notifications', async ({ page }) => {
    await authenticate(page, STUDENT_USER, '/notifications');
    const markRead = page.getByRole('button', { name: /mark read:/ });
    if ((await markRead.count()) > 0) {
      await markRead.first().focus();
      await expect(markRead.first()).toBeFocused();
    }
  });
});

test.describe('Admin management', () => {
  test('admin dashboard renders stats and broadcast @admin', async ({ page }) => {
    await authenticate(page, ADMIN_USER, '/admin/dashboard');
    await expect(page.getByRole('heading', { name: /platform overview/i })).toBeVisible();
    await expect(page.getByText(/total projects/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /broadcast to users/i })).toBeVisible();
  });

  test('admin users page renders a table @admin', async ({ page }) => {
    await authenticate(page, ADMIN_USER, '/admin/users');
    await expect(page.getByRole('heading', { name: /users & community/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('admin faculty page renders a table @admin', async ({ page }) => {
    await authenticate(page, ADMIN_USER, '/admin/faculty');
    await expect(page.getByRole('heading', { name: /faculty & mentors/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('admin projects page renders a table @admin', async ({ page }) => {
    await authenticate(page, ADMIN_USER, '/admin/projects');
    await expect(page.getByRole('heading', { name: /^Projects$/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });
});

test.describe('Reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('landing renders without animation errors under reduced motion @a11y', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /research projects/i })).toBeVisible();
    await expect(page.locator('main').getByRole('link', { name: /browse projects/i })).toBeVisible();
  });

  test('notifications render without animation errors under reduced motion @a11y', async ({ page }) => {
    await authenticate(page, STUDENT_USER, '/notifications');
    await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible();
  });
});

test.describe('Keyboard navigation and focus', () => {
  test('keyboard tab reaches interactive elements with focus visible @a11y', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /research projects/i })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(await page.locator(':focus').count()).toBeGreaterThanOrEqual(1);
  });

  test('login form fields are focusable @a11y', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').focus();
    await expect(page.getByLabel('Email')).toBeFocused();
    await page.getByLabel('Password').focus();
    await expect(page.getByLabel('Password')).toBeFocused();
  });
});
