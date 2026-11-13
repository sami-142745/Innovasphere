import { expect, test } from '@playwright/test';

test('student registers, creates a project and sees it in the directory', async ({ page }) => {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const username = `e2e_${suffix}`;
  const email = `${username}@example.com`;
  const password = 'E2ePass@123';
  const title = `E2E Project ${suffix}`;

  await page.goto('/register');
  await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
  await page.getByLabel('First name').fill('E2E');
  await page.getByLabel('Last name').fill('Student');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  await page.waitForURL(/\/dashboard/);

  await page.goto('/projects/create');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Short description').fill('Created by the real-API browser suite.');
  await page.getByLabel('Full description').fill(
    'This project verifies that the React app can register a user and persist a project through the real Spring Boot API.'
  );
  await page.getByLabel('Maximum team size').fill('25');
  await page.getByRole('button', { name: /create project/i }).click();

  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
  await expect(page.getByText('0/25 members')).toBeVisible();
  await expect(page.getByText('Team capacity').locator('..')).toContainText('25');

  await page.reload();
  await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
  await expect(page.getByText('0/25 members')).toBeVisible();

  await page.goto('/browse');
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
});
