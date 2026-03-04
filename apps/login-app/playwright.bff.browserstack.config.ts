/**
 * BrowserStack Playwright config for BFF E2E tests.
 *
 * Uses `connectOptions` to route browsers to BrowserStack's cloud while
 * keeping the test runner local. Tests still spawn mock AM + SvelteKit
 * in `beforeAll` — only the browser runs remotely.
 *
 * The BrowserStack Local tunnel (started by globalSetup or CI action)
 * allows remote browsers to reach 127.0.0.1 on the test runner.
 *
 * Prerequisites:
 *   export BROWSERSTACK_USERNAME=your_user
 *   export BROWSERSTACK_ACCESS_KEY=your_key
 *   PREVIEW=true pnpm --filter @forgerock/login-app run build
 */
import { defineConfig, type Project } from '@playwright/test';

// ─── Auth ────────────────────────────────────────────────────────────────────

const BROWSERSTACK_USERNAME = process.env.BROWSERSTACK_USERNAME;
const BROWSERSTACK_ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY;

if (!BROWSERSTACK_USERNAME || !BROWSERSTACK_ACCESS_KEY) {
  throw new Error(
    'BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY must be set.\n' +
      'Get credentials from https://www.browserstack.com/accounts/settings',
  );
}

// ─── Playwright version (must match for CDP protocol compatibility) ──────────

const PLAYWRIGHT_VERSION = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@playwright/test/package.json').version as string;
  } catch {
    return '1.latest';
  }
})();

// ─── Platform matrix ─────────────────────────────────────────────────────────

interface BrowserStackPlatform {
  readonly browser: string;
  readonly browserVersion: string;
  readonly os: string;
  readonly osVersion: string;
}

/**
 * Browser/OS combinations to test on BrowserStack.
 *
 * Each platform generates two Playwright projects: one with JS enabled
 * and one with JS disabled (progressive enhancement testing).
 *
 * Local Playwright already covers: Chromium, Firefox, WebKit engine builds.
 * These add: real branded browsers on real operating systems.
 */
const platforms: readonly BrowserStackPlatform[] = [
  // ── Chrome (real Chrome vs Playwright's Chromium fork) ──────────────
  // latest + latest-1 covers ~2 months; Win 11 + macOS for cross-OS
  { browser: 'chrome', browserVersion: 'latest', os: 'Windows', osVersion: '11' },
  { browser: 'chrome', browserVersion: 'latest-1', os: 'Windows', osVersion: '11' },
  { browser: 'chrome', browserVersion: 'latest', os: 'OS X', osVersion: 'Sonoma' },

  // ── Edge (zero local coverage — highest value-add) ──────────────────
  // Enterprise desktops often lag 1 version; Win 11 + Win 10
  { browser: 'edge', browserVersion: 'latest', os: 'Windows', osVersion: '11' },
  { browser: 'edge', browserVersion: 'latest-1', os: 'Windows', osVersion: '11' },
  { browser: 'edge', browserVersion: 'latest', os: 'Windows', osVersion: '10' },

  // ── Firefox (cross-OS validation — engine already tested locally) ───
  // One Windows + one macOS to catch OS-level rendering differences
  { browser: 'playwright-firefox', browserVersion: 'latest', os: 'Windows', osVersion: '11' },
  { browser: 'playwright-firefox', browserVersion: 'latest', os: 'OS X', osVersion: 'Sonoma' },
] as const;

// ─── Project generator ───────────────────────────────────────────────────────

const buildName = process.env.BROWSERSTACK_BUILD_NAME || `bff-e2e-local-${Date.now()}`;

function buildWsEndpoint(platform: BrowserStackPlatform, projectName: string): string {
  const caps = {
    'browserstack.username': BROWSERSTACK_USERNAME,
    'browserstack.accessKey': BROWSERSTACK_ACCESS_KEY,
    'browserstack.local': 'true',
    'browserstack.debug': 'true',
    'browserstack.console': 'info',
    'browserstack.networkLogs': 'true',
    browser: platform.browser,
    browser_version: platform.browserVersion,
    os: platform.os,
    os_version: platform.osVersion,
    project: 'ForgeRock Login Widget',
    build: buildName,
    name: projectName,
    'client.playwrightVersion': PLAYWRIGHT_VERSION,
  };

  return `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`;
}

function platformLabel(p: BrowserStackPlatform): string {
  return `${p.browser}-${p.browserVersion}-${p.os}-${p.osVersion}`
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/**
 * Generate -nojs and -js project pairs for each platform.
 *
 * Project names end with `-nojs` or `-js` to match the convention
 * used by `isJsEnabled()` in the test file.
 */
const projects: Project[] = platforms.flatMap((platform): Project[] => {
  const label = platformLabel(platform);

  return [
    {
      name: `${label}-nojs`,
      use: {
        connectOptions: {
          wsEndpoint: buildWsEndpoint(platform, `${label}-nojs`),
        },
        javaScriptEnabled: false,
      },
    },
    {
      name: `${label}-js`,
      use: {
        connectOptions: {
          wsEndpoint: buildWsEndpoint(platform, `${label}-js`),
        },
        javaScriptEnabled: true,
      },
    },
  ];
});

// ─── Config ──────────────────────────────────────────────────────────────────

export default defineConfig({
  testDir: 'src/lib/server/integration',
  testMatch: '**/*.e2e.test.ts',

  // Remote browsers add network latency; give tests more room
  timeout: 60_000,

  // Each worker spawns mock AM + SvelteKit subprocesses on 127.0.0.1.
  // Cap at 3 to avoid exhausting ports/memory (6 server processes total).
  workers: 3,

  // BrowserStack connections can be flaky — retry once
  retries: 1,

  use: {
    trace: 'retain-on-failure',
  },

  globalSetup: './browserstack.global-setup.ts',

  projects,
});
