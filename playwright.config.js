/** @type {import('@playwright/test').PlaywrightTestConfig} */
import { devices  } from '@playwright/test';

const url = 'https://localhost:3000';
const config = {
  webServer: {
    command: 'npm run preview',
    ignoreHTTPSErrors: true,
    url,
  },
  use: {
    headless: !!process.env.CI,
    baseURL: `${url}/e2e/`,
    ignoreHTTPSErrors: true,
  },
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 2 : 4,
  testDir: 'tests',
  timeout: 120 * 1000,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...devices['Desktop Chrome HiDPI'],
        ...devices['Desktop Edge'],
        ...devices['Desktop Edge HiDPI'],
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], ...devices['Desktop Firefox HiDPI'] },
    },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'], ...devices['iPad (gen 7)'] },
    // },
  ]
};

export default config;
