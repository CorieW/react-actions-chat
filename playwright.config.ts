import { defineConfig, devices } from '@playwright/test';

const BASIC_QA_BOT_SERVER_URL = 'http://127.0.0.1:4173';
const LOGIN_SERVER_URL = 'http://127.0.0.1:4174';
const SETTINGS_SERVER_URL = 'http://127.0.0.1:4175';

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
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testMatch: '**/basic-qa-bot.e2e.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: BASIC_QA_BOT_SERVER_URL,
      },
    },
    {
      name: 'firefox',
      testMatch: '**/basic-qa-bot.e2e.ts',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: BASIC_QA_BOT_SERVER_URL,
      },
    },
    {
      name: 'webkit',
      testMatch: '**/basic-qa-bot.e2e.ts',
      use: {
        ...devices['Desktop Safari'],
        baseURL: BASIC_QA_BOT_SERVER_URL,
      },
    },
    {
      name: 'mobile-chrome',
      testMatch: '**/basic-qa-bot.e2e.ts',
      use: {
        ...devices['Pixel 7'],
        baseURL: BASIC_QA_BOT_SERVER_URL,
      },
    },
    {
      name: 'mobile-safari',
      testMatch: '**/basic-qa-bot.e2e.ts',
      use: {
        ...devices['iPhone 13'],
        baseURL: BASIC_QA_BOT_SERVER_URL,
      },
    },
    {
      name: 'login-chromium',
      testMatch: '**/login.e2e.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: LOGIN_SERVER_URL,
      },
    },
    {
      name: 'settings-chromium',
      testMatch: '**/settings.e2e.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: SETTINGS_SERVER_URL,
      },
    },
  ],
  webServer: [
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4173',
      cwd: './examples/basic-qa-bot',
      url: BASIC_QA_BOT_SERVER_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4174',
      cwd: './examples/login',
      url: LOGIN_SERVER_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4175',
      cwd: './examples/settings',
      url: SETTINGS_SERVER_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
