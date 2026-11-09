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

// The handler reads cookies, url, and request body off the event; tests stub
// `fetch` and pass a minimal event shape instead.
function mockEvent(body = '') {
  return {
    url: new URL('https://app.example.com/api/authenticate'),
    request: { text: async () => body },
    cookies: {
      get: () => undefined,
      set: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as Parameters<typeof POST>[0];
}

describe('api/authenticate upstream timeout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('passes the timeout signal to the AM fetch', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ authId: 'abc' }));
    vi.stubGlobal('fetch', fetch);

    const response = await POST(mockEvent());

    expect(response.status).toBe(200);
    expect((fetch.mock.calls[0][1] as RequestInit).signal).toBeInstanceOf(AbortSignal);
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
    const pending = POST(mockEvent());
    await vi.advanceTimersByTimeAsync(2000);
    const response = await pending;

    expect(response.status).toBe(504);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(JSON.parse(await response.text())).toEqual({ error: 'upstream_timeout' });
  });
});
