/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$env/dynamic/private', () => ({
  env: {
    FR_AM_URL: 'https://am.example.com/am',
    FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
    FR_REALM_PATH: 'alpha',
  },
}));

import { GET } from './+server';

// The handler reads cookies and url off the event; tests stub `fetch` and pass
// a minimal event shape instead (pattern from end-session/server.test.ts — the
// tokens pattern lacks the cookies field this handler dereferences).
function mockEvent(search = '', cookieValue?: string) {
  const cookies = {
    get: () => (cookieValue === undefined ? undefined : cookieValue),
    set: vi.fn(),
    delete: vi.fn(),
  };
  return {
    url: new URL(`https://app.example.com/api/authorize${search}`),
    request: { headers: new Headers() },
    cookies,
  } as unknown as Parameters<typeof GET>[0] & { cookies: typeof cookies };
}

describe('api/authorize upstream responses', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('forwards the AM cookie and relayed OAuth params, dropping realm, to the authorize URL', async () => {
    const event = mockEvent(
      '?client_id=widget&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcb&response_type=code&scope=openid&state=xyz&realm=alpha',
      'session-token',
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 302, headers: { location: '/login' } }));
    vi.stubGlobal('fetch', fetchMock);

    await GET(event);

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://am.example.com/am/oauth2/realms/root/realms/alpha/authorize?client_id=widget&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcb&response_type=code&scope=openid&state=xyz',
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('GET');
    // redirect:'manual' is the load-bearing flag: without it fetch follows the
    // 302 and the browser gets the login page body instead of the redirect.
    expect(init.redirect).toBe('manual');
    expect(new Headers(init.headers as HeadersInit).get('cookie')).toBe(
      'iPlanetDirectoryPro=session-token',
    );
  });

  it('relays the upstream status and location header only', async () => {
    const upstream = new Response(null, {
      status: 302,
      headers: {
        location: '/am/login',
        'set-cookie': 'iPlanetDirectoryPro=leak',
        'content-type': 'text/html',
      },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream));

    const response = await GET(mockEvent('', 'session-token'));

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/am/login');
    // The allowlist is deliberate: set-cookie must never reach the browser
    // through the proxy (AM's session cookie is app-issued); the upstream
    // text/html content-type is not relayed either (the proxied Response
    // carries only the constructor default for its empty body).
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('content-type')).not.toContain('text/html');
  });

  it('relays a non-OK upstream status without a location header', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ error: 'invalid_client' }, { status: 401 })),
    );

    const response = await GET(mockEvent('', 'session-token'));

    expect(response.status).toBe(401);
    expect(response.headers.get('location')).toBeNull();
  });

  it('sends an empty cookie header when the browser holds no AM cookie', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await GET(mockEvent());

    expect(
      new Headers((fetchMock.mock.calls[0][1] as RequestInit).headers as HeadersInit).get('cookie'),
    ).toBe('');
  });

  it('returns 504 when AM does not answer before the timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      ),
    );

    // Attach the assertion before the timer fires so the rejection is never
    // unhandled while fake timers advance.
    const pending = GET(mockEvent('', 'session-token'));
    await vi.advanceTimersByTimeAsync(2000);
    const response = await pending;

    expect(response.status).toBe(504);
    expect(JSON.parse(await response.text())).toEqual({ error: 'upstream_timeout' });
  });
});
