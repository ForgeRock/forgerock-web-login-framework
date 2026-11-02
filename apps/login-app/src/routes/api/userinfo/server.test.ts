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

// The handler reads headers off the event; tests stub `fetch` and pass a
// minimal event shape instead.
function mockEvent() {
  return {
    url: new URL('https://app.example.com/api/userinfo'),
    request: { headers: new Headers({ authorization: 'Bearer token' }) },
  } as unknown as Parameters<typeof GET>[0];
}

describe('api/userinfo upstream responses', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('relays the upstream status on non-OK AM responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ error: 'invalid_token' }, { status: 401 })),
    );

    const response = await GET(mockEvent());

    expect(response.status).toBe(401);
    expect(JSON.parse(await response.text())).toEqual({ error: 'invalid_token' });
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
});
