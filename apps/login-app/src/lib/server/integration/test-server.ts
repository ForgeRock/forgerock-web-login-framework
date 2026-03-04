/**
 * Integration test server — boots the built SvelteKit handler with MSW
 * intercepting all outbound AM requests.
 *
 * Lifecycle:
 * 1. MSW setupServer() patches global fetch with AM response handlers
 * 2. Env vars are set (VITE_FR_AM_URL → MOCK_AM_BASE, COOKIE_SECRET, etc.)
 * 3. Dynamic import of build/handler.js triggers hooks.server.ts → initializeAppRuntime
 * 4. handler is mounted on a bare http.createServer (port 0 for OS-assigned port)
 * 5. Polls GET /api/health until 200 (OIDC discovery completes via MSW)
 */
import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { setupServer, type SetupServerApi } from 'msw/node';
import { passthrough, http } from 'msw';

import { amHandlers, MOCK_AM_BASE } from './msw-handlers';

interface TestServer {
  /** Base URL of the running test server, e.g. "http://127.0.0.1:4567" */
  readonly baseUrl: string;
  /** MSW server — use server.use(...) to add per-test overrides */
  readonly msw: SetupServerApi;
  /** Shut down the HTTP server and MSW */
  readonly close: () => Promise<void>;
}

/** Cookie encryption key — must be ≥32 chars */
const TEST_COOKIE_SECRET = 'integration-test-secret-key-that-is-at-least-32-characters-long';

/**
 * Start the integration test server.
 *
 * IMPORTANT: The build output must exist before calling this.
 * Run `PREVIEW=true pnpm --filter @forgerock/login-app run build` first.
 */
export const startTestServer = async (): Promise<TestServer> => {
  // integration/ → server/ → lib/ → src/ → (login-app root) → build/
  const handlerPath = resolve(import.meta.dirname, '../../../../build/handler.js');

  if (!existsSync(handlerPath)) {
    throw new Error(
      `Build output not found at ${handlerPath}.\n` +
        'Run: PREVIEW=true pnpm --filter @forgerock/login-app run build',
    );
  }

  // 1. Reserve a port first — we need it to configure both ORIGIN and MSW passthrough
  const port = await findFreePort();
  const origin = `http://127.0.0.1:${port}`;

  // 2. Start MSW — must be active before handler.js import triggers OIDC discovery.
  //    Requests to the test server itself must pass through (MSW intercepts all fetch).
  const msw = setupServer(
    http.all(`${origin}/*`, () => passthrough()),
    ...amHandlers,
  );
  msw.listen({ onUnhandledRequest: 'warn' });

  // 3. Set env vars before importing handler.js (which triggers hooks.server.ts)
  Object.assign(process.env, {
    VITE_FR_AM_URL: MOCK_AM_BASE,
    VITE_FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
    VITE_FR_REALM_PATH: 'alpha',
    VITE_FR_OAUTH_PUBLIC_CLIENT: 'TestClient',
    COOKIE_SECRET: TEST_COOKIE_SECRET,
    ORIGIN: origin,
    APP_DOMAIN: '127.0.0.1',
    LOG_LEVEL: 'Error',
  });

  // 4. Dynamic import — triggers hooks.server.ts → initializeAppRuntime → OIDC discovery via MSW
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { handler } = (await import(handlerPath)) as {
    handler: (
      req: import('node:http').IncomingMessage,
      res: import('node:http').ServerResponse,
      next: () => void,
    ) => void;
  };

  // 5. Create HTTP server with the SvelteKit handler
  const httpServer: Server = createServer((req, res) => {
    handler(req, res, () => {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not found');
    });
  });

  await listen(httpServer, port);

  // 6. Wait for OIDC discovery to complete (health endpoint returns 200)
  await pollHealth(origin);

  return {
    baseUrl: origin,
    msw,
    close: async () => {
      msw.close();
      await new Promise<void>((res, rej) => httpServer.close((err) => (err ? rej(err) : res())));
    },
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const findFreePort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => {
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

const listen = (server: Server, port: number): Promise<void> =>
  new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });

const pollHealth = async (origin: string, timeoutMs = 15_000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  const url = `${origin}/api/health`;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  throw new Error(`Test server health check timed out after ${timeoutMs}ms`);
};

// ─── Cookie Encryption (mirrors cookie-crypto.ts) ────────────────────────────

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a value using the same AES-256-GCM scheme as the BFF's cookie-crypto.
 * Format: base64url(IV ‖ ciphertext ‖ authTag)
 *
 * This lets integration tests forge valid encrypted cookies to test
 * session-dependent routes (POST /api/sessions, GET /api/authorize).
 */
const encryptValue = (plaintext: string): string => {
  const key = createHash('sha256').update(TEST_COOKIE_SECRET).digest();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, encrypted, authTag]);
  // base64url encoding (matches Effect's Encoding.encodeBase64Url)
  return combined.toString('base64url');
};

/**
 * Create a valid `__session` cookie value containing the given AM cookie string.
 * The returned string can be sent as `Cookie: __session=<value>` in test requests.
 */
export const sealSessionCookie = (amCookie: string, codeVerifier?: string): string => {
  const data = JSON.stringify(codeVerifier ? { amCookie, codeVerifier } : { amCookie });
  return encryptValue(data);
};
