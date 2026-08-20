import { defineConfig, devices } from '@playwright/test';

export const AM_URL = process.env.FR_AM_URL || 'https://openam-sdks.forgeblocks.com/am';
export const AM_COOKIE_NAME = process.env.FR_AM_COOKIE_NAME || '5421aeddf91aa20';
export const AM_REALM = process.env.FR_REALM_PATH || 'alpha';

const url = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// When PLAYWRIGHT_TEST_BASE_URL is set, the server is managed externally (e.g. Docker)
const webServer = process.env.PLAYWRIGHT_TEST_BASE_URL
  ? undefined
  : {
      command: 'pnpm --filter @forgerock/login-app run preview -- --host=localhost --port=3000',
      cwd: '..',
      url,
      ignoreHTTPSErrors: true,
      reuseExistingServer: true,
      env: {
        FR_AM_URL: AM_URL,
        FR_AM_COOKIE_NAME: AM_COOKIE_NAME,
        FR_OAUTH_PUBLIC_CLIENT: process.env.FR_OAUTH_PUBLIC_CLIENT || 'WebOAuthClient',
        // Required: AM returns `invalid_scope` when no scope is requested and no default is configured.
        FR_OAUTH_SCOPE: process.env.FR_OAUTH_SCOPE || 'openid profile email',
        FR_REALM_PATH: AM_REALM,
        FR_AM_WELLKNOWN_URL:
          process.env.FR_AM_WELLKNOWN_URL ||
          `${AM_URL}/oauth2/${AM_REALM}/.well-known/openid-configuration`,
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
      name: 'chromium-webauthn',
      grep: /webauthn/,
      use: {
        ...devices['Desktop Chrome'],
        // ...devices['Desktop Edge'],
      },
    },
    {
      name: 'chromium-standard',
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
