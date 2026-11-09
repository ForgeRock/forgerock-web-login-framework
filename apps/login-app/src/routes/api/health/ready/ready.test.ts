/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// core/constants.ts (imported transitively through sessions.ts) throws at
// module load when these are missing, so the mock factory must provide them;
// the per-test values below then drive discoveryUrl().
const mockEnv = vi.hoisted(
  () =>
    ({
      FR_AM_URL: 'https://openam.example.com/am',
      FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
      FR_REALM_PATH: 'root',
    }) as Record<string, string | undefined>,
);

vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

import { GET } from './+server';

// The handler ignores its RequestEvent; the tests stub `fetch` and env instead.
const noEvent = undefined as unknown as Parameters<typeof GET>[0];

function mockFetchOnce(status: number) {
  return vi.fn(async () => new Response('{}', { status }));
}

describe('api/health/ready upstream probe', () => {
  beforeEach(() => {
    mockEnv.FR_AM_URL = 'https://openam.example.com/am';
    mockEnv.FR_AM_COOKIE_NAME = 'iPlanetDirectoryPro';
    mockEnv.FR_REALM_PATH = 'root';
    mockEnv.FR_AM_WELLKNOWN_URL =
      'https://openam.example.com/am/oauth2/realms/root/.well-known/openid-configuration';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('reports ready when AM answers OK', async () => {
    vi.stubGlobal('fetch', mockFetchOnce(200));

    const response = await GET(noEvent);

    expect(response.status).toBe(200);
    expect(JSON.parse(await response.text())).toEqual({ status: 'ready' });
  });

  it('reports not-ready when AM answers non-OK', async () => {
    vi.stubGlobal('fetch', mockFetchOnce(500));

    const response = await GET(noEvent);

    expect(response.status).toBe(503);
    expect(JSON.parse(await response.text())).toEqual({ status: 'not-ready' });
  });

  it('reports not-ready when AM does not answer before the timeout', async () => {
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
    const pending = GET(noEvent);
    await vi.advanceTimersByTimeAsync(2000);
    const response = await pending;

    expect(response.status).toBe(503);
    expect(JSON.parse(await response.text())).toEqual({ status: 'not-ready' });
  });
});

describe('api/health/ready discovery URL resolution', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('resolves a relative FR_AM_WELLKNOWN_URL against FR_AM_URL', async () => {
    mockEnv.FR_AM_URL = 'https://openam.example.com/am';
    mockEnv.FR_AM_COOKIE_NAME = 'iPlanetDirectoryPro';
    mockEnv.FR_REALM_PATH = 'root';
    mockEnv.FR_AM_WELLKNOWN_URL = '/am/oauth2/realms/root/.well-known/openid-configuration';

    const fetchMock = mockFetchOnce(200);
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(noEvent);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openam.example.com/am/oauth2/realms/root/.well-known/openid-configuration',
      expect.anything(),
    );
  });

  it('keeps an absolute FR_AM_WELLKNOWN_URL as-is', async () => {
    mockEnv.FR_AM_URL = 'https://openam.example.com/am';
    mockEnv.FR_AM_COOKIE_NAME = 'iPlanetDirectoryPro';
    mockEnv.FR_REALM_PATH = 'root';
    mockEnv.FR_AM_WELLKNOWN_URL =
      'https://openam.example.com/am/oauth2/realms/root/.well-known/openid-configuration';

    const fetchMock = mockFetchOnce(200);
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(noEvent);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openam.example.com/am/oauth2/realms/root/.well-known/openid-configuration',
      expect.anything(),
    );
  });

  it('reports not-ready for a malformed FR_AM_URL instead of throwing', async () => {
    mockEnv.FR_AM_URL = 'not-a-url';
    mockEnv.FR_AM_COOKIE_NAME = 'iPlanetDirectoryPro';
    mockEnv.FR_REALM_PATH = 'root';
    mockEnv.FR_AM_WELLKNOWN_URL = '/am/oauth2/realms/root/.well-known/openid-configuration';

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(noEvent);

    expect(response.status).toBe(503);
    expect(JSON.parse(await response.text())).toEqual({ status: 'not-ready' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
