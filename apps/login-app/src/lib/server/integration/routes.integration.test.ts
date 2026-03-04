/**
 * BFF Integration Tests — Tier 2
 *
 * These tests boot the real built SvelteKit server with MSW intercepting
 * outbound AM requests. They verify HTTP-level behavior that unit tests
 * (which call route handler functions directly) cannot catch:
 *
 * - Correct Content-Type headers on responses
 * - Security headers from hooks.server.ts
 * - JSON error responses (not HTML) for error cases
 * - SvelteKit body parsing and CSRF enforcement
 * - Authorization header forwarding through the full HTTP stack
 *
 * Prerequisites: PREVIEW=true pnpm --filter @forgerock/login-app run build
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { request as httpRequest } from 'node:http';

import { sealSessionCookie, startTestServer } from './test-server';

let baseUrl: string;
let close: () => Promise<void>;

beforeAll(async () => {
  const server = await startTestServer();
  baseUrl = server.baseUrl;
  close = server.close;
});

afterAll(async () => {
  await close?.();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const get = (path: string, headers?: HeadersInit): Promise<Response> =>
  fetch(`${baseUrl}${path}`, { headers });

/** Raw HTTP GET using node:http — bypasses MSW and does NOT follow redirects */
const rawGet = (
  url: string,
  headers?: Record<string, string>,
): Promise<{ status: number; headers: Record<string, string> }> =>
  new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = httpRequest(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        headers,
      },
      (res) => {
        // Drain the body so the socket is freed
        res.resume();
        resolve({
          status: res.statusCode ?? 0,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          headers: res.headers as Record<string, string>,
        });
      },
    );
    req.on('error', reject);
    req.end();
  });

const post = (path: string, body: string, headers?: HeadersInit): Promise<Response> =>
  fetch(`${baseUrl}${path}`, {
    method: 'POST',
    body,
    headers: {
      origin: baseUrl,
      ...headers,
    },
  });

// ─── Health ──────────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns 200 JSON when OIDC discovery is complete', async () => {
    const res = await get('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');

    const body = await res.json();
    expect(body).toEqual({ status: 'ready' });
  });
});

// ─── Locale ──────────────────────────────────────────────────────────────────

describe('GET /api/locale', () => {
  it('returns 200 JSON with locale content', async () => {
    const res = await get('/api/locale', { 'accept-language': 'en-US' });

    expect(res.status).toBe(200);
    // The locale route uses `new Response(JSON.stringify(content))` — no explicit content-type
    // SvelteKit should still return the body as valid JSON
    const body = await res.json();
    expect(body).toBeDefined();
    expect(typeof body).toBe('object');
  });
});

// ─── Tokens ──────────────────────────────────────────────────────────────────

describe('POST /api/tokens', () => {
  it('proxies token exchange and returns JSON', async () => {
    const res = await post(
      '/api/tokens',
      'grant_type=authorization_code&code=mock-code&redirect_uri=http://localhost',
      { 'content-type': 'application/x-www-form-urlencoded' },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');

    const body = await res.json();
    expect(body.access_token).toBe('mock-access-token');
  });
});

// ─── Userinfo ────────────────────────────────────────────────────────────────

describe('GET /api/userinfo', () => {
  it('forwards Authorization header and returns user claims', async () => {
    const res = await get('/api/userinfo', {
      authorization: 'Bearer mock-access-token',
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');

    const body = await res.json();
    expect(body.sub).toBe('user-123');
  });

  it('returns 401 JSON (not HTML) when Authorization header is missing', async () => {
    const res = await get('/api/userinfo');

    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toContain('application/json');

    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});

// ─── Revoke ──────────────────────────────────────────────────────────────────

describe('POST /api/revoke', () => {
  it('proxies token revocation', async () => {
    const res = await post('/api/revoke', 'token=mock-token', {
      'content-type': 'application/x-www-form-urlencoded',
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
  });
});

// ─── End Session ─────────────────────────────────────────────────────────────

describe('GET /api/end-session', () => {
  it('proxies end-session with Authorization header', async () => {
    const res = await get('/api/end-session?id_token_hint=mock-id-token', {
      authorization: 'Bearer mock-id-token',
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('returns 401 JSON when Authorization header is missing', async () => {
    const res = await get('/api/end-session');

    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toContain('application/json');
  });
});

// ─── Authorize (requires encrypted cookie with PKCE) ─────────────────────────

describe('GET /api/authorize', () => {
  it('redirects with auth code when __session cookie has amCookie and codeVerifier', async () => {
    const sessionValue = sealSessionCookie(
      'iPlanetDirectoryPro=mock-sso-token',
      'a]43-character-base64url-pkce-code-verifier',
    );

    // Use node:http directly to bypass MSW and avoid fetch's redirect following
    const { status, headers } = await rawGet(
      `${baseUrl}/api/authorize?redirect_uri=${encodeURIComponent(
        baseUrl + '/callback',
      )}&scope=openid`,
      { cookie: `__session=${sessionValue}` },
    );

    // The BFF returns a redirect to the customer's redirect_uri with ?code=
    expect(status).toBe(302);
    expect(headers.location).toContain(`${baseUrl}/callback`);
    expect(headers.location).toContain('code=mock-auth-code');
  });

  it('redirects to login with __oauth cookie when __session is missing', async () => {
    const queryString = `redirect_uri=${encodeURIComponent(baseUrl + '/callback')}&scope=openid`;
    const { status, headers } = await rawGet(`${baseUrl}/api/authorize?${queryString}`);

    // Should redirect to login page
    expect(status).toBe(302);
    expect(headers.location).toBe('/');

    // Should set an encrypted __oauth cookie containing the query params.
    // node:http returns set-cookie as string | string[] — normalize to string for assertions.
    const setCookieRaw = headers['set-cookie'];
    expect(setCookieRaw).toBeDefined();
    const setCookieStr = Array.isArray(setCookieRaw) ? setCookieRaw.join('; ') : setCookieRaw;
    expect(setCookieStr).toContain('__oauth=');
    expect(setCookieStr).toContain('HttpOnly');
  });

  it('returns 401 JSON when __session cookie is corrupted', async () => {
    const { status } = await rawGet(
      `${baseUrl}/api/authorize?redirect_uri=${encodeURIComponent(
        baseUrl + '/callback',
      )}&scope=openid`,
      { cookie: '__session=corrupted-garbage-value' },
    );

    // Corrupted session should fail with 401 (not redirect)
    expect(status).toBe(401);
  });

  it('returns 400 JSON when codeVerifier is missing from session', async () => {
    // Session with amCookie but no codeVerifier
    const sessionValue = sealSessionCookie('iPlanetDirectoryPro=mock-sso-token');

    const res = await fetch(
      `${baseUrl}/api/authorize?redirect_uri=${encodeURIComponent(baseUrl + '/callback')}`,
      {
        headers: { cookie: `__session=${sessionValue}` },
        redirect: 'manual',
      },
    );

    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('application/json');
  });
});

// ─── Sessions (requires encrypted cookie) ────────────────────────────────────

describe('POST /api/sessions', () => {
  it('proxies AM session logout when __session cookie is present', async () => {
    const sessionValue = sealSessionCookie('iPlanetDirectoryPro=mock-sso-token');

    const res = await fetch(`${baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        origin: baseUrl,
        cookie: `__session=${sessionValue}`,
      },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('returns 401 JSON when __session cookie is missing', async () => {
    const res = await fetch(`${baseUrl}/api/sessions`, {
      method: 'POST',
      headers: { origin: baseUrl },
    });

    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toContain('application/json');

    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});

// ─── Security Headers ────────────────────────────────────────────────────────

describe('Security headers', () => {
  it('includes all security headers on API responses', async () => {
    const res = await get('/api/health');

    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('permissions-policy')).toBe('camera=(), microphone=(), geolocation=()');
    expect(res.headers.get('x-dns-prefetch-control')).toBe('off');
    expect(res.headers.get('strict-transport-security')).toBe(
      'max-age=31536000; includeSubDomains',
    );
    // CSP is not asserted here — SvelteKit injects CSP only on SSR-rendered HTML
    // pages (with per-request nonces for script-src/style-src), not on API routes.
  });

  it('includes CSP on HTML page responses', async () => {
    // SvelteKit injects Content-Security-Policy with per-request nonces only on
    // SSR-rendered pages, not on API routes (which bypass the renderer entirely).
    const res = await get('/');

    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
  });
});

// ─── CSRF ────────────────────────────────────────────────────────────────────

describe('CSRF protection', () => {
  it('rejects POST with form content-type when Origin header is missing', async () => {
    // SvelteKit's csrf.checkOrigin rejects form POSTs without a matching Origin
    const res = await fetch(`${baseUrl}/api/tokens`, {
      method: 'POST',
      body: 'grant_type=authorization_code&code=test',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      // Intentionally no Origin header
    });

    expect(res.status).toBe(403);
  });
});

// ─── 404 Routing ─────────────────────────────────────────────────────────────

describe('Unknown routes', () => {
  it('returns 404 for nonexistent API paths', async () => {
    const res = await get('/api/nonexistent');

    expect(res.status).toBe(404);
  });
});
