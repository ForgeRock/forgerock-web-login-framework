import { defineConfig, devices } from '@playwright/test';

// Live-tenant check: drive the INSTALLED Google Chrome (no browser download).
export default defineConfig({
  testDir: 'tests',
  timeout: 60 * 1000,
  reporter: 'line',
  projects: [
    {
      name: 'live-chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        headless: true,
        baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL,
      },
    },
  ],
});
