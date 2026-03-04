import { defineConfig, devices } from '@playwright/test';

const url = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  webServer: {
    command: 'pnpm --filter @forgerock/login-app run preview -- --host=localhost',
    cwd: '..',
    url,
    ignoreHTTPSErrors: true,
    reuseExistingServer: true,
    env: {
      VITE_FR_AM_URL: 'https://openam-sdks.forgeblocks.com/am',
      VITE_FR_AM_COOKIE_NAME: '5421aeddf91aa20',
      VITE_FR_AM_JOURNEY_NAME: 'Login',
      VITE_FR_REALM_PATH: 'alpha',
      VITE_FR_OAUTH_PUBLIC_CLIENT: 'WebOAuthClient',
      COOKIE_SECRET: 'e2e-test-placeholder-key-that-is-at-least-32-chars',
      ORIGIN: 'http://localhost:3000',
    },
  },
  use: {
    headless: true,
    baseURL: `${url}/e2e/`,
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  testDir: 'tests',
  timeout: 30_000,
  reporter: process.env.CI ? 'blob' : 'dot',
  projects: [
    {
      name: 'chromium',
      grep: /webauthn/,
      use: {
        ...devices['Desktop Chrome'],
        // ...devices['Desktop Edge'],
      },
    },
    {
      name: 'chromium',
      grepInvert: /webauthn/,
      use: {
        ...devices['Desktop Chrome'],
        // ...devices['Desktop Edge'],
      },
    },
    // {
    // name: 'firefox',
    // grepInvert: /webauthn/,
    // use: { ...devices['Desktop Firefox'] }, },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'], ...devices['iPad (gen 7)'] },
    // },
  ],
});
