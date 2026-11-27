/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The memoized realm is module state, so each test imports a fresh module
// instance via vi.resetModules() instead of resetting the cache through an
// exported test hook.
async function fetchServedRealmFresh(amUrl: string): Promise<string | null> {
  vi.resetModules();
  const { fetchServedRealm } = await import('./realm.effects');
  return fetchServedRealm(amUrl);
}

const serverInfoBody = (realm: string) => new Response(JSON.stringify({ realm }), { status: 200 });

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(serverInfoBody('/alpha')));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('fetchServedRealm', () => {
  it('resolves the normalized realm from a successful probe', async () => {
    await expect(fetchServedRealmFresh('https://id.petrov.ca/am')).resolves.toBe('alpha');
    // fetchAm adds its own abort signal to the init it sends.
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://id.petrov.ca/am/json/serverinfo/*',
      expect.objectContaining({ headers: { accept: 'application/json' } }),
    );
  });

  it('normalizes a root answer to "root"', async () => {
    vi.mocked(fetch).mockResolvedValue(serverInfoBody('/'));
    await expect(fetchServedRealmFresh('https://openam.example.com/am')).resolves.toBe('root');
  });

  it('memoizes a successful probe per amUrl', async () => {
    vi.resetModules();
    const { fetchServedRealm } = await import('./realm.effects');

    await fetchServedRealm('https://id.petrov.ca/am');
    await fetchServedRealm('https://id.petrov.ca/am');

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it('probes again when the amUrl changes', async () => {
    vi.resetModules();
    const { fetchServedRealm } = await import('./realm.effects');

    await fetchServedRealm('https://id.petrov.ca/am');
    await fetchServedRealm('https://openam.example.com/am');

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it('retries after a failed probe instead of caching the failure', async () => {
    vi.resetModules();
    const { fetchServedRealm } = await import('./realm.effects');
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 503 }));

    await expect(fetchServedRealm('https://id.petrov.ca/am')).resolves.toBeNull();
    await expect(fetchServedRealm('https://id.petrov.ca/am')).resolves.toBe('alpha');
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it('returns null for a non-200 response', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 400 }));
    await expect(fetchServedRealmFresh('https://id.petrov.ca/am')).resolves.toBeNull();
  });

  it('returns null for an unparseable body', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('not json', { status: 200 }));
    await expect(fetchServedRealmFresh('https://id.petrov.ca/am')).resolves.toBeNull();
  });

  it('returns null for a body without a realm string', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ nope: true }), { status: 200 }),
    );
    await expect(fetchServedRealmFresh('https://id.petrov.ca/am')).resolves.toBeNull();
  });

  it('returns null when the request fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('connection refused'));
    await expect(fetchServedRealmFresh('https://id.petrov.ca/am')).resolves.toBeNull();
  });
});

describe('resolveRealm', () => {
  // The pipeline shares the module-level cache with fetchServedRealm, so every
  // test imports a fresh module and drives the probe through the fetch stub.
  async function resolveFresh(url: string, env = arrivalEnv()): Promise<unknown> {
    vi.resetModules();
    const { resolveRealm } = await import('./realm.effects');
    return resolveRealm(new URL(url), env);
  }

  const arrivalEnv = (overrides: Record<string, string | undefined> = {}) => ({
    amUrl: 'https://openam.example.com/am',
    configuredRealmPath: 'root',
    configuredWellknownUrl: '/am/oauth2/realms/root/.well-known/openid-configuration',
    ...overrides,
  });

  it('resolves a same-realm arrival to the configured wellknown', async () => {
    vi.mocked(fetch).mockResolvedValue(serverInfoBody('/'));

    await expect(resolveFresh('https://tenant.example.com/login/')).resolves.toEqual({
      kind: 'ok',
      requestedRealm: 'root',
      wellknown:
        'https://tenant.example.com/am/oauth2/realms/root/.well-known/openid-configuration',
    });
  });

  it('derives a realm-qualified discovery URL for a sibling realm on the default domain', async () => {
    vi.mocked(fetch).mockResolvedValue(serverInfoBody('/'));

    await expect(resolveFresh('https://tenant.example.com/login/?realm=alpha')).resolves.toEqual({
      kind: 'ok',
      requestedRealm: 'alpha',
      wellknown:
        'https://openam.example.com/am/oauth2/realms/root/realms/alpha/.well-known/openid-configuration',
    });
  });

  it('rejects a cross-realm arrival on a custom domain before resolving wellknown', async () => {
    vi.mocked(fetch).mockResolvedValue(serverInfoBody('/alpha'));

    await expect(
      resolveFresh(
        'https://id.petrov.ca/login/?realm=bravo',
        arrivalEnv({ amUrl: 'https://id.petrov.ca/am' }),
      ),
    ).resolves.toMatchObject({
      kind: 'conflict',
      conflict: {
        message:
          "Realm 'bravo' is not available on this domain. This custom domain is serving the 'alpha' realm.",
        customDomainUrl: 'https://id.petrov.ca/login/',
        customDomainRealm: 'alpha',
      },
    });
  });

  it('falls back to the configured wellknown when the probe fails', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 503 }));

    await expect(resolveFresh('https://tenant.example.com/login/?realm=bravo')).resolves.toEqual({
      kind: 'ok',
      requestedRealm: 'bravo',
      wellknown:
        'https://tenant.example.com/am/oauth2/realms/root/.well-known/openid-configuration',
    });
  });
});
