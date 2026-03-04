/**
 * Playwright config for BFF E2E tests.
 *
 * Separate from `e2e/playwright.config.ts` (which targets a real AM and uses /e2e/ base).
 * Projects run the same test files across browsers and JS modes:
 * - *-nojs: JS disabled — verifies SSR progressive enhancement (noscript path)
 * - *-js: JS enabled — verifies use:enhance and auto-submit script
 *
 * Tests use the `-js` / `-nojs` suffix convention to adapt initialization behavior.
 *
 * No `webServer` — each test manages its own mock AM + SvelteKit subprocess lifecycle.
 *
 * Prerequisites:
 *   PREVIEW=true pnpm --filter @forgerock/login-app run build
 *   pnpm --filter @forgerock/login-app exec playwright install
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'src/lib/server/integration',
  testMatch: '**/*.e2e.test.ts',
  timeout: 30_000,
  use: {
    headless: true,
    trace: 'retain-on-failure',
  },
  projects: [
    // ─── Chromium ──────────────────────────────────────────────
    {
      name: 'chromium-nojs',
      use: { ...devices['Desktop Chrome'], javaScriptEnabled: false },
    },
    {
      name: 'chromium-js',
      use: { ...devices['Desktop Chrome'], javaScriptEnabled: true },
    },
    // ─── Firefox ──────────────────────────────────────────────
    {
      name: 'firefox-nojs',
      use: { ...devices['Desktop Firefox'], javaScriptEnabled: false },
    },
    {
      name: 'firefox-js',
      use: { ...devices['Desktop Firefox'], javaScriptEnabled: true },
    },
    // ─── WebKit (Safari) ──────────────────────────────────────
    {
      name: 'webkit-nojs',
      use: { ...devices['Desktop Safari'], javaScriptEnabled: false },
    },
    {
      name: 'webkit-js',
      use: { ...devices['Desktop Safari'], javaScriptEnabled: true },
    },
  ],
});
