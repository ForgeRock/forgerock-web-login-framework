/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { load } from './+layout.server';

import type { RealmResolution } from '$server/realm/realm.types';

// Seeded: importing the layout now pulls in $server/sessions → constants.ts,
// whose module-init env check runs before beforeEach can set values.
const mockEnv = vi.hoisted(
  () =>
    ({
      FR_AM_URL: 'https://openam.example.com/am',
      FR_AM_COOKIE_NAME: 'iPlanetDirectoryPro',
      FR_REALM_PATH: 'root',
    }) as Record<string, string | undefined>,
);

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('$server/idm-theme.effects', () => ({
  fetchIdmTheme: vi.fn(async () => ({
    theme: undefined,
    themeCatalog: {},
    backgroundImageUrl: undefined,
  })),
}));

// The layout delegates the whole realm pipeline (requested realm, serverinfo
// probe, conflict check, wellknown resolution) to resolveRealm.
const resolveRealm = vi.hoisted(() => vi.fn<() => Promise<RealmResolution>>());
vi.mock('$server/realm/realm.effects', () => ({ resolveRealm }));

type LayoutLoad = typeof load;

const loadEvent = (requestUrl: string): Parameters<LayoutLoad>[0] =>
  ({ url: new URL(requestUrl) }) as Parameters<LayoutLoad>[0];

type LoadResult = Exclude<Awaited<ReturnType<LayoutLoad>>, void>;

async function loadFrom(requestUrl: string): Promise<LoadResult> {
  return (await load(loadEvent(requestUrl))) as LoadResult;
}

describe('(app)/+layout.server.ts', () => {
  beforeEach(() => {
    mockEnv.FR_AM_URL = 'https://openam.example.com/am';
    mockEnv.FR_AM_COOKIE_NAME = 'iPlanetDirectoryPro';
    mockEnv.FR_REALM_PATH = 'root';
    mockEnv.FR_AM_WELLKNOWN_URL = '/am/oauth2/realms/root/.well-known/openid-configuration';
    resolveRealm.mockResolvedValue({
      kind: 'ok',
      requestedRealm: 'root',
      wellknown:
        'https://tenant.example.com/am/oauth2/realms/root/.well-known/openid-configuration',
    });
  });

  it('returns the resolved arrival with the theme payload', async () => {
    const result = await loadFrom('https://tenant.example.com/login/');

    expect(result.wellknown).toBe(
      'https://tenant.example.com/am/oauth2/realms/root/.well-known/openid-configuration',
    );
    expect(result.amUrl).toBe('https://openam.example.com/am');
    expect(result.fallbackJourney).toBeNull();
  });

  it('surfaces a realm conflict as a 404 with the payload intact', async () => {
    resolveRealm.mockResolvedValue({
      kind: 'conflict',
      conflict: {
        message:
          "Realm 'bravo' is not available on this domain. This custom domain is serving the 'alpha' realm.",
        customDomainUrl: 'https://id.petrov.ca/login/',
        customDomainRealm: 'alpha',
      },
    });

    await expect(loadFrom('https://id.petrov.ca/login/?realm=bravo')).rejects.toMatchObject({
      status: 404,
      body: {
        message: expect.stringContaining(
          "Realm 'bravo' is not available on this domain. This custom domain is serving the 'alpha' realm.",
        ),
        customDomainUrl: 'https://id.petrov.ca/login/',
        customDomainRealm: 'alpha',
      },
    });
  });

  it('rejects missing configuration with the setup error', async () => {
    mockEnv.FR_AM_URL = '';

    await expect(loadFrom('https://tenant.example.com/login/')).rejects.toMatchObject({
      status: 500,
      body: { message: expect.stringContaining('Login App is not configured') },
    });
  });

  it('rejects a malformed FR_AM_URL with the configuration error', async () => {
    mockEnv.FR_AM_URL = 'not-a-url';

    await expect(loadFrom('https://tenant.example.com/login/')).rejects.toMatchObject({
      status: 500,
      body: { message: expect.stringContaining('FR_AM_URL must be an absolute URL') },
    });
  });
});
