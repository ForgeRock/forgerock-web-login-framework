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

import { POST } from './+server';

// The handler reads cookies and url off the event; tests stub `fetch` and pass
// a minimal event shape instead (pattern from end-session/server.test.ts).
function mockEvent(search = '', cookieValue?: string) {
  const cookies = {
    get: () => (cookieValue === undefined ? undefined : cookieValue),
    set: vi.fn(),
    delete: vi.fn(),
  };
  return {
    url: new URL(`https://app.example.com/api/sessions${search}`),
    request: { headers: new Headers() },
    cookies,
  } as unknown as Parameters<typeof POST>[0] & { cookies: typeof cookies };
}

describe('api/sessions upstream responses', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('sends the AM JSON API headers and forwards _action while dropping realm', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ valid: true }));
    vi.stubGlobal('fetch', fetchMock);

    await POST(mockEvent('?_action=validate&realm=alpha', 'session-token'));

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://am.example.com/am/json/realms/root/realms/alpha/sessions?_action=validate',
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    const headers = new Headers(init.headers as HeadersInit);
    expect(headers.get('accept')).toBe('application/json');
    expect(headers.get('accept-api-version')).toBe('protocol=1.0,resource=2.0');
    expect(headers.get('x-requested-with')).toBe('XMLHttpRequest');
    expect(headers.get('cookie')).toBe('iPlanetDirectoryPro=session-token');
  });

  it('relays the upstream status and content-type only', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ tokenId: 'abc' }), {
          status: 200,
          headers: { 'content-type': 'application/json', 'set-cookie': 'iPlanetDirectoryPro=leak' },
        }),
      ),
    );

    const response = await POST(mockEvent('', 'session-token'));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    // The allowlist is deliberate: AM's logout Set-Cookie must never reach the
    // browser through the proxy; the app issues its own cookie instead.
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('clears the AM cookie on _action=logout when upstream answers OK', async () => {
    const event = mockEvent('?_action=logout', 'session-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ result: true })));

    const response = await POST(event);

    expect(response.status).toBe(200);
    expect(event.cookies.delete).toHaveBeenCalledWith('iPlanetDirectoryPro', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
  });

  it('keeps the AM cookie on _action=logout when upstream answers non-OK', async () => {
    const event = mockEvent('?_action=logout', 'session-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ error: 'x' }, { status: 500 })),
    );

    await POST(event);

    expect(event.cookies.delete).not.toHaveBeenCalled();
  });

  it('keeps the AM cookie for non-logout actions even when upstream answers OK', async () => {
    const event = mockEvent('?_action=validate', 'session-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ valid: true })));

    await POST(event);

    expect(event.cookies.delete).not.toHaveBeenCalled();
  });

  it('relays a 204 bodyless upstream response without throwing', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 204, headers: { 'content-type': 'text/plain' } }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(mockEvent('', 'session-token'));

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
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
    const pending = POST(mockEvent('', 'session-token'));
    await vi.advanceTimersByTimeAsync(2000);
    const response = await pending;

    expect(response.status).toBe(504);
    expect(JSON.parse(await response.text())).toEqual({ error: 'upstream_timeout' });
  });
});
