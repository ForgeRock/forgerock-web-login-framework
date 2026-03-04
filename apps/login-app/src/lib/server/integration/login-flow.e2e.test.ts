/**
 * BFF E2E Tests — Tier 3: Authentication Flows
 *
 * Drives a real Chromium browser through authentication flows against the
 * built SvelteKit BFF, with a stateful mock AM HTTP server.
 *
 * Every test runs in all Playwright projects (see playwright.bff.config.ts):
 * - *-nojs (Chromium, Firefox, WebKit): <noscript> Start button, standard HTML form POSTs
 * - *-js (Chromium, Firefox, WebKit): onMount auto-submit, use:enhance fetch POSTs
 *
 * This verifies what unit and integration tests cannot:
 * - Real HTML rendering from SvelteKit SSR
 * - Cookie round-trips through the full encrypt/decrypt pipeline
 * - Progressive enhancement: same flows work with and without JavaScript
 * - use:enhance fetch interception and auto-submit script
 * - Multi-step flows with cookie re-encryption across steps
 *
 * Prerequisites: PREVIEW=true pnpm --filter @forgerock/login-app run build
 */
import { test, expect, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'node:http';

import {
  startMockAm,
  loginStep,
  otpStep,
  registrationStep,
  authComplete,
  authError,
  amServerError,
  amMalformedResponse,
} from './mock-am-server';

// ─── Constants ───────────────────────────────────────────────────────────────

const COOKIE_SECRET = 'e2e-test-secret-key-that-is-at-least-32-characters-long!!';

// ─── Server Lifecycle ────────────────────────────────────────────────────────

let mockAm: Awaited<ReturnType<typeof startMockAm>>;
let svelteKit: { baseUrl: string; process: ChildProcess; close: () => void };

/** Find a free port by binding to port 0 and releasing */
const findFreePort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, 'localhost', () => {
      const addr = s.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to get address'));
        return;
      }
      const port = addr.port;
      s.close((err) => (err ? reject(err) : resolve(port)));
    });
    s.on('error', reject);
  });

/** Poll a URL until it returns 200, with a timeout */
const pollUntilReady = async (url: string, timeoutMs = 15_000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
};

/**
 * Spawn the SvelteKit server (build/index.js) as a child process.
 *
 * adapter-node reads HOST and PORT env vars to bind the server.
 * ORIGIN must match the actual URL for CSRF checks to pass.
 */
const spawnSvelteKit = async (
  amBaseUrl: string,
): Promise<{ baseUrl: string; process: ChildProcess; close: () => void }> => {
  // integration/ → server/ → lib/ → src/ → (login-app root) → build/
  const buildPath = resolve(import.meta.dirname, '../../../../build/index.js');

  if (!existsSync(buildPath)) {
    throw new Error(
      `Build output not found at ${buildPath}.\n` +
        'Run: PREVIEW=true pnpm --filter @forgerock/login-app run build',
    );
  }

  const port = await findFreePort();
  const origin = `http://localhost:${port}`;

  const child = spawn('node', [buildPath], {
    env: {
      ...process.env,
      HOST: 'localhost',
      PORT: String(port),
      ORIGIN: origin,
      VITE_FR_AM_URL: amBaseUrl,
      VITE_FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
      VITE_FR_REALM_PATH: 'alpha',
      VITE_FR_OAUTH_PUBLIC_CLIENT: 'TestClient',
      COOKIE_SECRET,
      // APP_DOMAIN defaults to 'localhost' — cookies get no explicit domain
      // attribute, which avoids WebKit's IP-domain cookie deletion bug.
      LOG_LEVEL: 'Warning',
      NODE_ENV: 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Collect stderr for diagnostics on failure
  let stderr = '';
  child.stderr?.on('data', (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  // Wait for the health endpoint to respond
  try {
    await pollUntilReady(`${origin}/api/health`);
  } catch (err) {
    child.kill('SIGKILL');
    throw new Error(
      `SvelteKit server failed to start.\nStderr:\n${stderr}\nOriginal: ${String(err)}`,
    );
  }

  return {
    baseUrl: origin,
    process: child,
    close: () => {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    },
  };
};

// ─── Test Setup ──────────────────────────────────────────────────────────────

test.beforeAll(async () => {
  // 1. Start mock AM server
  mockAm = await startMockAm();

  // 2. Spawn SvelteKit server pointing at mock AM
  svelteKit = await spawnSvelteKit(mockAm.baseUrl);
});

test.afterAll(async () => {
  svelteKit?.close();
  await mockAm?.close();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isJsEnabled = () => test.info().project.name.endsWith('-js');

/**
 * Start the authentication flow from the login page.
 * In noJS mode, clicks the <noscript> Start button.
 * In JS mode, onMount auto-submits — this is a no-op.
 */
const startFlow = async (page: Page): Promise<void> => {
  if (!isJsEnabled()) {
    const startButton = page.locator('noscript button[type="submit"]');
    await expect(startButton).toBeVisible();
    await expect(startButton).toHaveText('Start');
    await startButton.click();
  }
};

/**
 * Initialize an authentication flow — navigates to the login page and starts:
 * - chromium-nojs: clicks the <noscript> Start button (standard HTML form POST)
 * - chromium-js: onMount auto-submits via requestSubmit() + use:enhance (fetch POST)
 */
const initFlow = async (page: Page): Promise<void> => {
  await page.goto(svelteKit.baseUrl);
  await startFlow(page);
};

/**
 * Wait for a step's first labeled input to appear.
 * Uses a generous timeout for the JS path (hydration + auto-submit + fetch).
 */
const waitForStep = async (page: Page, firstLabel: string): Promise<void> => {
  await expect(page.getByLabel(firstLabel)).toBeVisible({
    timeout: isJsEnabled() ? 10_000 : 5_000,
  });
};

/** Assert the "Authentication Successful" heading is visible */
const assertAuthSuccess = async (page: Page): Promise<void> => {
  await expect(page.getByRole('heading', { name: 'Authentication Successful' })).toBeVisible();
};

// ─── Tests ───────────────────────────────────────────────────────────────────

test('login: username + password', async ({ page }) => {
  mockAm.enqueue(loginStep(), authComplete());

  await initFlow(page);
  await waitForStep(page, 'User Name');

  // Fill and submit
  await page.getByLabel('User Name').fill('testuser');
  await page.getByLabel('Password').fill('testpassword');
  await page.getByRole('button', { name: 'Next' }).click();

  await assertAuthSuccess(page);
});

test('registration: profile fields + password + terms', async ({ page }) => {
  mockAm.enqueue(registrationStep(), authComplete());

  await initFlow(page);
  await waitForStep(page, 'Email Address');

  // Fill all fields
  await page.getByLabel('Email Address').fill('user@example.com');
  await page.getByLabel('First Name').fill('Test');
  await page.getByLabel('Last Name').fill('User');
  await page.getByLabel('Password').fill('S3cureP@ssw0rd');
  await page.getByRole('checkbox', { name: 'Accept Terms and Conditions' }).check();

  // Submit
  await page.getByRole('button', { name: 'Next' }).click();

  await assertAuthSuccess(page);
});

// ─── Multi-Step Flow ──────────────────────────────────────────────────────────

test('multi-step: login then OTP', async ({ page }) => {
  // 3 responses: init → login step, submit → OTP step, submit → auth complete
  mockAm.enqueue(loginStep(), otpStep(), authComplete());

  await initFlow(page);
  await waitForStep(page, 'User Name');

  // Step 1: fill username + password
  await page.getByLabel('User Name').fill('testuser');
  await page.getByLabel('Password').fill('testpassword');
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 2: OTP field replaces login fields
  await waitForStep(page, 'One Time Password');

  // Password field from step 1 should no longer be present
  // exact: true avoids matching "One Time Password" (which contains "Password")
  await expect(page.getByLabel('Password', { exact: true })).not.toBeVisible();

  // Fill OTP and submit
  await page.getByLabel('One Time Password').fill('123456');
  await page.getByRole('button', { name: 'Next' }).click();

  await assertAuthSuccess(page);
});

// ─── Error Flows ──────────────────────────────────────────────────────────────

test('error: invalid credentials shows error and retry', async ({ page }) => {
  mockAm.enqueue(loginStep(), authError('Invalid Password'));

  await initFlow(page);
  await waitForStep(page, 'User Name');

  // Fill and submit (triggers the 401 error response)
  await page.getByLabel('User Name').fill('testuser');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Next' }).click();

  // Assert error UI renders
  await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible();
  await expect(page.getByText('Invalid Password')).toBeVisible();

  // Assert "Try Again" button is present
  await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
});

test('error recovery: Try Again restarts flow after failure', async ({ page }) => {
  // First attempt: login step → error
  mockAm.enqueue(loginStep(), authError('Invalid Password'));
  // Second attempt (after retry): login step → success
  mockAm.enqueue(loginStep(), authComplete());

  await initFlow(page);
  await waitForStep(page, 'User Name');

  // Submit bad credentials
  await page.getByLabel('User Name').fill('testuser');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Next' }).click();

  // Verify error state
  await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible();

  // Click "Try Again" — re-enters the flow via ?/init
  await page.getByRole('button', { name: 'Try Again' }).click();

  // Should get a fresh login step
  await waitForStep(page, 'User Name');

  // Submit correct credentials
  await page.getByLabel('User Name').fill('testuser');
  await page.getByLabel('Password').fill('correct');
  await page.getByRole('button', { name: 'Next' }).click();

  await assertAuthSuccess(page);
});

// ─── Cookie Expiry Flows ──────────────────────────────────────────────────────

test('expired cookie shows session expired error', async ({ page }) => {
  // Set a garbage __step cookie that will fail decryption
  await page.context().addCookies([
    {
      name: '__step',
      value: 'corrupted-garbage-value',
      domain: 'localhost',
      path: '/',
    },
  ]);

  await page.goto(svelteKit.baseUrl);

  // The load function should catch CookieDecryptionFailed and show error
  await expect(page.getByText('Session expired, please try again')).toBeVisible({
    timeout: 5_000,
  });

  // "Try Again" button should be available
  await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
});

test('session expired recovery: Try Again after corrupted cookie', async ({ page }) => {
  // Enqueue responses for after the retry
  mockAm.enqueue(loginStep(), authComplete());

  // Set corrupted cookie
  await page.context().addCookies([
    {
      name: '__step',
      value: 'corrupted-value',
      domain: 'localhost',
      path: '/',
    },
  ]);

  await page.goto(svelteKit.baseUrl);

  // Verify session expired error
  await expect(page.getByText('Session expired, please try again')).toBeVisible();

  // Click "Try Again" — should clear bad cookies and re-init
  await page.getByRole('button', { name: 'Try Again' }).click();

  // Should get a fresh login step
  await waitForStep(page, 'User Name');

  // Complete the flow
  await page.getByLabel('User Name').fill('testuser');
  await page.getByLabel('Password').fill('testpassword');
  await page.getByRole('button', { name: 'Next' }).click();

  await assertAuthSuccess(page);
});

// ─── OAuth Flow ──────────────────────────────────────────────────────────────

test('full OAuth flow: authorize → login → redirect → callback', async ({ page }) => {
  mockAm.enqueue(loginStep(), authComplete());

  const origin = svelteKit.baseUrl;
  const redirectUri = `${origin}/callback`;
  const authorizeUrl = `${origin}/api/authorize?redirect_uri=${encodeURIComponent(
    redirectUri,
  )}&scope=openid`;

  // Start from /api/authorize — no session exists.
  // BFF stores query params in __oauth cookie, redirects to /.
  await page.goto(authorizeUrl);

  // Should be on the login page now
  await startFlow(page);
  await waitForStep(page, 'User Name');

  // Fill and submit credentials
  await page.getByLabel('User Name').fill('testuser');
  await page.getByLabel('Password').fill('testpassword');
  await page.getByRole('button', { name: 'Next' }).click();

  // Auth completes → __oauth cookie triggers redirect chain:
  // form action 303 → /api/authorize (with __session) → 302 → /callback?code=...
  // Landing at the callback URL with an auth code is the behavioral end of the BFF's job.
  // Token exchange is an API concern tested in routes.integration.test.ts.
  await expect(page).toHaveURL(/\/callback\?code=mock-auth-code/, { timeout: 10_000 });
});

// ─── AM Error Resilience ──────────────────────────────────────────────────────

test('AM 500 during step submission shows error', async ({ page }) => {
  mockAm.enqueue(loginStep(), amServerError());

  await initFlow(page);
  await waitForStep(page, 'User Name');

  // Fill and submit — AM returns 500
  await page.getByLabel('User Name').fill('testuser');
  await page.getByLabel('Password').fill('testpassword');
  await page.getByRole('button', { name: 'Next' }).click();

  // Assert error UI renders
  await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible();
  await expect(page.getByText('Something went wrong')).toBeVisible();

  // "Try Again" should be available
  await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
});

test('AM malformed response during step shows error', async ({ page }) => {
  mockAm.enqueue(loginStep(), amMalformedResponse());

  await initFlow(page);
  await waitForStep(page, 'User Name');

  // Fill and submit — AM returns HTML (non-JSON body)
  await page.getByLabel('User Name').fill('testuser');
  await page.getByLabel('Password').fill('testpassword');
  await page.getByRole('button', { name: 'Next' }).click();

  // BFF fails to parse as AmStepResponse → error UI renders
  await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible();

  // "Try Again" should be available
  await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
});

// ─── Concurrent Sessions ──────────────────────────────────────────────────────

test('concurrent sessions: two contexts complete OAuth independently', async ({ browser }) => {
  // Each context does: /api/authorize → login → redirect → /callback?code=...
  // 4 responses total: 2 sequential login flows (init + complete each).
  mockAm.enqueue(loginStep(), authComplete(), loginStep(), authComplete());

  const contextA = await browser.newContext({ javaScriptEnabled: isJsEnabled() });
  const contextB = await browser.newContext({ javaScriptEnabled: isJsEnabled() });
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  const origin = svelteKit.baseUrl;
  const redirectUri = encodeURIComponent(`${origin}/callback`);
  const authorizeUrl = `${origin}/api/authorize?redirect_uri=${redirectUri}&scope=openid`;

  try {
    // Context A: start OAuth flow
    await pageA.goto(authorizeUrl);
    await startFlow(pageA);
    await waitForStep(pageA, 'User Name');
    await pageA.getByLabel('User Name').fill('userA');
    await pageA.getByLabel('Password').fill('passwordA');
    await pageA.getByRole('button', { name: 'Next' }).click();
    await expect(pageA).toHaveURL(/\/callback\?code=mock-auth-code/, { timeout: 10_000 });

    // Context B: start OAuth flow
    await pageB.goto(authorizeUrl);
    await startFlow(pageB);
    await waitForStep(pageB, 'User Name');
    await pageB.getByLabel('User Name').fill('userB');
    await pageB.getByLabel('Password').fill('passwordB');
    await pageB.getByRole('button', { name: 'Next' }).click();
    await expect(pageB).toHaveURL(/\/callback\?code=mock-auth-code/, { timeout: 10_000 });
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
