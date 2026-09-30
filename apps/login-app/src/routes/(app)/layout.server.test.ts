/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { describe, expect, it, vi } from 'vitest';

const mockEnv = vi.hoisted(() => ({}) as Record<string, string | undefined>);

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('$server/idm-theme.effects', () => ({
  fetchIdmTheme: vi.fn(async () => ({
    theme: undefined,
    themeCatalog: {},
    backgroundImageUrl: undefined,
  })),
}));

import { load } from './+layout.server';

function loadFrom(requestUrl: string) {
  return load({ url: new URL(requestUrl) } as unknown as Parameters<typeof load>[0]);
}

describe('(app)/+layout.server.ts wellknown resolution', () => {
  it('resolves a relative FR_AM_WELLKNOWN_URL against the request origin', async () => {
    mockEnv.FR_AM_URL = 'https://openam.example.com/am';
    mockEnv.FR_AM_COOKIE_NAME = 'iPlanetDirectoryPro';
    mockEnv.FR_REALM_PATH = 'root';
    mockEnv.FR_AM_WELLKNOWN_URL = '/am/oauth2/realms/root/.well-known/openid-configuration';

    const result = await loadFrom('https://tenant.example.com/login/');

    // The discovery URL carries the host the user came in on, so custom domains
    // and root-realm tenants never bounce to the AM FQDN.
    expect(result.wellknown).toBe(
      'https://tenant.example.com/am/oauth2/realms/root/.well-known/openid-configuration',
    );
  });

  it('keeps an absolute FR_AM_WELLKNOWN_URL as-is', async () => {
    mockEnv.FR_AM_URL = 'https://openam.example.com/am';
    mockEnv.FR_AM_COOKIE_NAME = 'iPlanetDirectoryPro';
    mockEnv.FR_REALM_PATH = 'root';
    mockEnv.FR_AM_WELLKNOWN_URL =
      'https://openam.example.com/am/oauth2/realms/root/.well-known/openid-configuration';

    const result = await loadFrom('https://tenant.example.com/login/');

    expect(result.wellknown).toBe(
      'https://openam.example.com/am/oauth2/realms/root/.well-known/openid-configuration',
    );
  });

  it('derives a sibling-realm discovery URL on the request origin', async () => {
    mockEnv.FR_AM_URL = 'https://openam.example.com/am';
    mockEnv.FR_AM_COOKIE_NAME = 'iPlanetDirectoryPro';
    mockEnv.FR_REALM_PATH = 'root';
    mockEnv.FR_AM_WELLKNOWN_URL = '/am/oauth2/realms/root/.well-known/openid-configuration';

    const result = await loadFrom('https://tenant.example.com/login/?realm=/alpha');

    expect(result.wellknown).toBe(
      'https://tenant.example.com/am/oauth2/realms/root/realms/alpha/.well-known/openid-configuration',
    );
  });
});
