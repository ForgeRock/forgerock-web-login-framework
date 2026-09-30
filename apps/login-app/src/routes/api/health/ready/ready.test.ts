/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterEach, describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => ({}) as Record<string, string | undefined>);

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

import { GET } from './+server';

function mockFetchOnce(status: number) {
  return vi.fn(async () => new Response('{}', { status }));
}

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

    const response = await GET();

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

    const response = await GET();

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openam.example.com/am/oauth2/realms/root/.well-known/openid-configuration',
      expect.anything(),
    );
  });
});
