import { defineConfig, devices } from '@playwright/test';

/**
 * Real-API browser suite. Unlike the route-mocked browser QA config, these
 * tests exercise the React app against a running Spring Boot backend and a
 * disposable MySQL database. Start everything with:
 *
 *   npm run test:integration
 */
const backendPort = process.env.E2E_BACKEND_PORT ?? '8099';
const frontendPort = process.env.E2E_FRONTEND_PORT ?? '5174';

export default defineConfig({
  testDir: './e2e-real',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  webServer: {
    command: `npm run dev -- --port ${frontendPort} --strictPort`,
    url: `http://localhost:${frontendPort}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_API_URL: `http://127.0.0.1:${backendPort}`
    }
  },
  use: {
    baseURL: `http://localhost:${frontendPort}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium-real-api',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
