import { defineConfig, devices } from '@playwright/test';

const EXAMPLE_SERVER_URL = 'http://127.0.0.1:4173';

/**
 * Playwright E2E configuration for validating primary user journeys in the
 * basic QA bot example app.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: EXAMPLE_SERVER_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command:
      'npm run dev --prefix examples/basic-qa-bot -- --host 127.0.0.1 --port 4173',
    url: EXAMPLE_SERVER_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
