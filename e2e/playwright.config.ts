import { defineConfig, devices } from '@playwright/test';

const url = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// When PLAYWRIGHT_TEST_BASE_URL is set, the server is managed externally (e.g. Docker)
const webServer = process.env.PLAYWRIGHT_TEST_BASE_URL
  ? undefined
  : {
      command: 'pnpm --filter @forgerock/login-app run preview -- --host=localhost',
      cwd: '..',
      url,
      ignoreHTTPSErrors: true,
      reuseExistingServer: true,
      env: {
        FR_AM_URL: 'https://openam-sdks.forgeblocks.com/am',
        FR_AM_COOKIE_NAME: '5421aeddf91aa20',
        FR_OAUTH_PUBLIC_CLIENT: 'WebOAuthClient',
        FR_REALM_PATH: 'alpha',
      },
    };

export default defineConfig({
  webServer,
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
  timeout: 120 * 1000,
  reporter: process.env.GITHUB_ACTIONS ? 'blob' : 'dot',
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
