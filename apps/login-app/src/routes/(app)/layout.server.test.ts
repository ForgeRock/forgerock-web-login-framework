/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { load } from './+layout.server';

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

// The layout probes AM serverinfo (through fetchAm → global fetch) to decide
// whether realm-qualified discovery is valid on the configured origin.
const fetchMock = vi.hoisted(() => vi.fn());
vi.stubGlobal('fetch', fetchMock);

const serverInfoBody = (realm: string) => new Response(JSON.stringify({ realm }), { status: 200 });

type LayoutLoad = typeof load;

const loadEvent = (requestUrl: string): Parameters<LayoutLoad>[0] =>
  ({ url: new URL(requestUrl) }) as Parameters<LayoutLoad>[0];

type LoadResult = Exclude<Awaited<ReturnType<LayoutLoad>>, void>;

// The served-realm cache is module state, so each test imports a fresh module
// instance via vi.resetModules() instead of resetting the cache through an
// exported test hook.
async function loadFrom(requestUrl: string): Promise<LoadResult> {
  vi.resetModules();
  const { load } = await import('./+layout.server');
  return (await load(loadEvent(requestUrl))) as LoadResult;
}

describe('(app)/+layout.server.ts wellknown resolution', () => {
  beforeEach(() => {
    mockEnv.FR_AM_URL = 'https://openam.example.com/am';
    mockEnv.FR_AM_COOKIE_NAME = 'iPlanetDirectoryPro';
    mockEnv.FR_REALM_PATH = 'root';
    mockEnv.FR_AM_WELLKNOWN_URL = '/am/oauth2/realms/root/.well-known/openid-configuration';
    // Default: AM answers serverinfo as the default domain serving root.
    fetchMock.mockResolvedValue(serverInfoBody('/'));
  });

  it('resolves a relative FR_AM_WELLKNOWN_URL against the request origin', async () => {
    const result = await loadFrom('https://tenant.example.com/login/');

    expect(result.wellknown).toBe(
      'https://tenant.example.com/am/oauth2/realms/root/.well-known/openid-configuration',
    );
  });

  it('keeps an absolute FR_AM_WELLKNOWN_URL as-is', async () => {
    mockEnv.FR_AM_WELLKNOWN_URL =
      'https://openam.example.com/am/oauth2/realms/root/.well-known/openid-configuration';

    const result = await loadFrom('https://tenant.example.com/login/');

    expect(result.wellknown).toBe(
      'https://openam.example.com/am/oauth2/realms/root/.well-known/openid-configuration',
    );
  });

  it('derives a sibling-realm discovery URL on the AM origin', async () => {
    const result = await loadFrom('https://tenant.example.com/login/?realm=/alpha');

    expect(result.wellknown).toBe(
      'https://openam.example.com/am/oauth2/realms/root/realms/alpha/.well-known/openid-configuration',
    );
  });

  it('keeps the realm-qualified form for a sibling named realm', async () => {
    mockEnv.FR_REALM_PATH = 'alpha';
    const result = await loadFrom('https://tenant.example.com/login/');

    expect(result.wellknown).toBe(
      'https://tenant.example.com/am/oauth2/realms/root/.well-known/openid-configuration',
    );
  });

  it('rejects a malformed FR_AM_URL with the configuration error', async () => {
    mockEnv.FR_AM_URL = 'not-a-url';

    await expect(loadFrom('https://tenant.example.com/login/')).rejects.toMatchObject({
      status: 500,
      body: { message: expect.stringContaining('FR_AM_URL must be an absolute URL') },
    });
  });

  // FR_AM_URL may itself be a custom domain (tenant CDN alias or customer
  // on-prem host) — the wellknown URLs then live on that origin too.
  describe('custom-domain FR_AM_URL', () => {
    beforeEach(() => {
      mockEnv.FR_AM_URL = 'https://id.petrov.ca/am';
      mockEnv.FR_REALM_PATH = 'alpha';
      mockEnv.FR_AM_WELLKNOWN_URL =
        'https://id.petrov.ca/am/oauth2/alpha/.well-known/openid-configuration';
      // id.petrov.ca is registered as an alpha alias — serverinfo answers alpha.
      fetchMock.mockResolvedValue(serverInfoBody('/alpha'));
    });

    it('uses the configured wellknown verbatim for the configured realm', async () => {
      const result = await loadFrom('https://id.petrov.ca/login/');

      expect(result.wellknown).toBe(
        'https://id.petrov.ca/am/oauth2/alpha/.well-known/openid-configuration',
      );
    });

    it('rejects a cross-realm request with a 404 — the domain serves its alias realm only', async () => {
      await expect(loadFrom('https://id.petrov.ca/login/?realm=bravo')).rejects.toMatchObject({
        status: 404,
        body: {
          message: expect.stringContaining(
            "Realm 'bravo' is not available on this domain. This domain serves the 'alpha' realm only.",
          ),
        },
      });
    });

    it('rejects a requested root realm on a custom domain with a 404', async () => {
      await expect(loadFrom('https://id.petrov.ca/login/?realm=/')).rejects.toMatchObject({
        status: 404,
        body: {
          message: expect.stringContaining("Realm 'root' is not available on this domain"),
        },
      });
    });

    it('falls back to the configured wellknown when serverinfo is unreachable', async () => {
      fetchMock.mockResolvedValue(new Response('', { status: 503 }));

      const result = await loadFrom('https://id.petrov.ca/login/?realm=bravo');

      expect(result.wellknown).toBe(
        'https://id.petrov.ca/am/oauth2/alpha/.well-known/openid-configuration',
      );
    });
  });
});
