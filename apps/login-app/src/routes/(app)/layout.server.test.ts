/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('$server/idm-theme.effects', () => ({
  fetchIdmTheme: vi.fn(async () => ({
    theme: undefined,
    themeCatalog: {},
    backgroundImageUrl: undefined,
  })),
}));

import { load } from './+layout.server';

const loadEvent = (requestUrl: string) =>
  ({ url: new URL(requestUrl) }) as unknown as Parameters<typeof load>[0];

type LoadResult = Exclude<Awaited<ReturnType<typeof load>>, void>;

async function loadFrom(requestUrl: string): Promise<LoadResult> {
  return (await load(loadEvent(requestUrl))) as LoadResult;
}

// fetchAm reads the body via response.text(), so the stub carries JSON text.
const serverinfoResponse = (realm: string) =>
  ({ ok: true, text: async () => JSON.stringify({ realm }) }) as unknown as Response;

describe('(app)/+layout.server.ts wellknown resolution', () => {
  beforeEach(() => {
    mockEnv.FR_AM_URL = 'https://openam.example.com/am';
    mockEnv.FR_AM_COOKIE_NAME = 'iPlanetDirectoryPro';
    mockEnv.FR_REALM_PATH = 'root';
    mockEnv.FR_AM_WELLKNOWN_URL = '/am/oauth2/realms/root/.well-known/openid-configuration';
    // Default: no alias answer -> the realm-qualified form. Alias tests override.
    mockFetch.mockRejectedValue(new Error('no serverinfo'));
  });

  afterEach(() => {
    mockFetch.mockReset();
  });
  vi.stubGlobal('fetch', mockFetch);

  it('builds the realm-less discovery URL when the arrival host aliases to the requested realm', async () => {
    mockFetch.mockResolvedValue(serverinfoResponse('/'));

    const result = await loadFrom('https://tenant.example.com/login/');

    expect(result.wellknown).toBe(
      'https://tenant.example.com/am/oauth2/.well-known/openid-configuration',
    );
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

  it('derives a sibling-realm discovery URL on the AM FQDN origin, not the arrival origin', async () => {
    // Realm-qualified discovery is only valid on the AM FQDN (the custom
    // domain docs' "Incorrect" example) — IAM-12293.
    const result = await loadFrom('https://tenant.example.com/login/?realm=/alpha');

    expect(result.wellknown).toBe(
      'https://openam.example.com/am/oauth2/realms/root/realms/alpha/.well-known/openid-configuration',
    );
  });

  it('builds the realm-less discovery URL on a custom domain whose alias matches the configured realm', async () => {
    // Realm-qualified path double-references the alias realm (IAM-12293).
    mockEnv.FR_REALM_PATH = 'alpha';
    mockFetch.mockResolvedValue(serverinfoResponse('/alpha'));
    const result = await loadFrom('https://id.petrov.ca/login/');

    expect(result.wellknown).toBe(
      'https://id.petrov.ca/am/oauth2/.well-known/openid-configuration',
    );
  });

  it('builds the realm-less discovery URL when a realm param matches the host alias', async () => {
    mockFetch.mockResolvedValue(serverinfoResponse('/alpha'));

    const result = await loadFrom('https://id.petrov.ca/login/?realm=/alpha');

    expect(result.wellknown).toBe(
      'https://id.petrov.ca/am/oauth2/.well-known/openid-configuration',
    );
  });

  it('builds a realm-qualified discovery URL on the AM FQDN when a custom domain is asked for another realm', async () => {
    // A CD's own discovery only covers its alias; another realm's discovery
    // is still valid on the FQDN origin (the deployer may serve a CD in any
    // realm — e.g. bravo-only tenants).
    mockFetch.mockResolvedValue(serverinfoResponse('/alpha'));

    const result = await loadFrom('https://id.petrov.ca/login/?realm=/bravo');

    expect(result.wellknown).toBe(
      'https://openam.example.com/am/oauth2/realms/root/realms/bravo/.well-known/openid-configuration',
    );
  });

  it('keeps the realm-qualified form when the host alias differs from the requested realm', async () => {
    mockEnv.FR_REALM_PATH = 'alpha';
    const result = await loadFrom('https://tenant.example.com/login/');

    expect(result.wellknown).toBe(
      'https://tenant.example.com/am/oauth2/realms/root/.well-known/openid-configuration',
    );
  });

  it('falls back to the realm-qualified form when serverinfo is unreachable', async () => {
    mockFetch.mockRejectedValue(new Error('AM unreachable'));

    const result = await loadFrom('https://tenant.example.com/login/');

    expect(result.wellknown).toBe(
      'https://tenant.example.com/am/oauth2/realms/root/.well-known/openid-configuration',
    );
  });

  it('falls back to the realm-qualified form when serverinfo returns an unusable body', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) } as unknown as Response);

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
});
