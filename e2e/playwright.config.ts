import { defineConfig, devices } from '@playwright/test';

export const AM_URL = 'https://openam-sdks.forgeblocks.com/am';
export const AM_COOKIE_NAME = '5421aeddf91aa20';
export const AM_REALM = 'alpha';

const url = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const configErrorUrl = 'http://localhost:3100';
const idmThemeUrl = 'http://localhost:3300';
// This forgeblocks tenant serves IDM at the tenant root, not under /am — FR_IDM_URL defaults
// to FR_AM_URL, which 404s against /openidm/config/ui/themerealm, so it must be overridden.
const IDM_URL = 'https://openam-sdks.forgeblocks.com';

// When PLAYWRIGHT_TEST_BASE_URL is set, the server is managed externally (e.g. Docker)
const webServer = process.env.PLAYWRIGHT_TEST_BASE_URL
  ? undefined
  : [
      {
        command: 'pnpm --filter @forgerock/login-app run preview -- --host=localhost',
        cwd: '..',
        url,
        ignoreHTTPSErrors: true,
        reuseExistingServer: true,
        env: {
          FR_AM_URL: AM_URL,
          FR_AM_COOKIE_NAME: AM_COOKIE_NAME,
          FR_OAUTH_PUBLIC_CLIENT: 'WebOAuthClient',
          // Required: AM returns `invalid_scope` when no scope is requested and no default is configured.
          FR_OAUTH_SCOPE: 'openid profile email',
          FR_REALM_PATH: AM_REALM,
          FR_AM_WELLKNOWN_URL: `${AM_URL}/oauth2/${AM_REALM}/.well-known/openid-configuration`,
        },
      },
      // Dedicated server with FR_AM_WELLKNOWN_URL missing, so the config-error test can hit
      // the +layout.server.ts env guard without destabilizing the shared webServer's env
      // used by every other test in the suite. FR_AM_URL/FR_AM_COOKIE_NAME/FR_REALM_PATH must
      // stay set: core/constants.ts throws at module-import time if any of those three are
      // missing, which crashes before +layout.server.ts's guard can render +error.svelte.
      {
        command: 'pnpm --filter @forgerock/login-app run preview --host=localhost --port=3100',
        cwd: '..',
        // `port` (not `url`) for readiness — this server intentionally serves a 500 on every
        // route, and Playwright's `url` readiness check requires a 2xx response to proceed.
        port: 3100,
        ignoreHTTPSErrors: true,
        reuseExistingServer: true,
        env: {
          FR_AM_URL: AM_URL,
          FR_AM_COOKIE_NAME: AM_COOKIE_NAME,
          FR_REALM_PATH: AM_REALM,
          FR_OAUTH_PUBLIC_CLIENT: 'WebOAuthClient',
          FR_OAUTH_SCOPE: 'openid profile email',
          // Explicitly blank out rather than omit — SvelteKit's vite plugin backfills unset
          // vars from the root .env file during preview, which would mask this guard.
          FR_AM_WELLKNOWN_URL: '',
        },
      },
      // Dedicated preview server with FR_IDM_URL pointed at the tenant root, so the
      // idm-theme test hits the real themerealm endpoint without touching the shared
      // webServer's env (FR_IDM_URL isn't set there, so it defaults to FR_AM_URL/am, which
      // 404s on this tenant). FR_AM_JOURNEY_LOGIN pins theme resolution to TEST_ThemeE2E — a
      // tree dedicated to this test (cloned from Login, same linked theme) so the assertion
      // isn't coupled to whatever theme the production Login journey has at any given time.
      {
        command: 'pnpm --filter @forgerock/login-app run preview --host=localhost --port=3300',
        cwd: '..',
        url: idmThemeUrl,
        ignoreHTTPSErrors: true,
        reuseExistingServer: true,
        env: {
          FR_AM_URL: AM_URL,
          FR_AM_COOKIE_NAME: AM_COOKIE_NAME,
          FR_REALM_PATH: AM_REALM,
          FR_OAUTH_PUBLIC_CLIENT: 'WebOAuthClient',
          FR_OAUTH_SCOPE: 'openid profile email',
          FR_AM_WELLKNOWN_URL: `${AM_URL}/oauth2/${AM_REALM}/.well-known/openid-configuration`,
          FR_IDM_URL: IDM_URL,
          FR_AM_JOURNEY_LOGIN: 'TEST_ThemeE2E',
        },
      },
    ];

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
      testIgnore: /config-error|idm-theme/,
      use: {
        ...devices['Desktop Chrome'],
        // ...devices['Desktop Edge'],
      },
    },
    {
      name: 'config-error',
      testMatch: /config-error/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `${configErrorUrl}/e2e/`,
      },
    },
    {
      name: 'idm-theme',
      testMatch: /idm-theme/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `${idmThemeUrl}/e2e/`,
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
