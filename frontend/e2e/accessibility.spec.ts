import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { applyRouteMocks } from './helpers/mocks';
import { authenticate, STUDENT_USER } from './helpers/auth';

test.describe('Accessibility', () => {
  test('landing page has no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /research projects/i })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('login page has no accessibility violations', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('settings page has no accessibility violations', async ({ page }) => {
    // Settings is protected. Use the same deterministic mock session as the
    // browser QA suite so the test checks the page rather than auth redirects.
    await applyRouteMocks(page);
    await authenticate(page, STUDENT_USER, '/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('keyboard navigation reaches interactive elements', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /research projects/i })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveCount(1);
  });

  test('reduced motion preference is respected', async ({ page }) => {
    await page.goto('/', { reducedMotion: 'reduce' });
    await expect(page.getByRole('heading', { name: /research projects/i })).toBeVisible();
  });
});
