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
// a minimal event shape instead.
function mockEvent() {
  const cookies = {
    get: () => undefined,
    set: vi.fn(),
    delete: vi.fn(),
  };
  const event = {
    url: new URL('https://app.example.com/api/end-session'),
    request: { headers: new Headers({ authorization: 'Bearer token' }) },
    cookies,
  } as unknown as Parameters<typeof GET>[0] & {
    cookies: typeof cookies;
  };
  return event;
}

describe('api/end-session upstream responses', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('relays the upstream status and keeps the AM cookie on an AM error', async () => {
    const event = mockEvent();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ error: 'session_invalid' }, { status: 401 })),
    );

    const response = await GET(event);

    expect(response.status).toBe(401);
    expect(event.cookies.delete).not.toHaveBeenCalled();
  });

  it('clears the AM cookie on an OK upstream response', async () => {
    const event = mockEvent();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: true })));

    const response = await GET(event);

    expect(response.status).toBe(200);
    expect(event.cookies.delete).toHaveBeenCalledWith('iPlanetDirectoryPro', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
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
    const pending = GET(mockEvent());
    await vi.advanceTimersByTimeAsync(2000);
    const response = await pending;

    expect(response.status).toBe(504);
    expect(JSON.parse(await response.text())).toEqual({ error: 'upstream_timeout' });
  });

  it('keeps the AM cookie when AM times out', async () => {
    const event = mockEvent();
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

    const pending = GET(event);
    await vi.advanceTimersByTimeAsync(2000);
    await pending;

    expect(event.cookies.delete).not.toHaveBeenCalled();
  });
});
