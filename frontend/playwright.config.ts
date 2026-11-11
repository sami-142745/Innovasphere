import { defineConfig, devices } from '@playwright/test';

/**
 * Browser QA configuration for Phase 3.8.1.
 *
 * Three viewport projects run the same E2E spec against the local dev server:
 *   desktop: 1280x800
 *   tablet:  768x1024
 *   mobile:  375x812
 *
 * The dev server is started via `npm run dev` (unchanged configuration) and
 * reused across projects when already running.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // The suite runs against the Vite dev server, which compiles lazy route
  // chunks on first request. Allow a little more than the 5s default so cold
  // compiles do not flake otherwise-correct assertions.
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'list' : 'html',
  webServer: {
    command: 'npm run dev',
    port: 5173,
    baseURL: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 120 * 1000
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 0,
    navigationTimeout: 0
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } }
    },
    {
      name: 'chromium-tablet',
      use: { ...devices['iPad Pro'], viewport: { width: 768, height: 1024 } }
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } }
    }
  ]
});
