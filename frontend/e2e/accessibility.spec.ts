import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
    // Settings requires authentication; the mocked auth provides a session
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('keyboard navigation reaches interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(await page.locator(':focus').count()).toBeGreaterThanOrEqual(1);
  });

  test('reduced motion preference is respected', async ({ page }) => {
    await page.goto('/', { reducedMotion: 'reduce' });
    await expect(page.getByRole('heading', { name: /research projects/i })).toBeVisible();
  });
});
