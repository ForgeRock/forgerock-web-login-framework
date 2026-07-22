/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OidcClient } from '@forgerock/oidc-client/types';

import type { OidcClientConfig } from './oidc.store';

const oidcMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@forgerock/oidc-client',
  async (importOriginal: () => Promise<Record<string, unknown>>) => {
    const actual = await importOriginal();
    return {
      ...actual,
      oidc: oidcMock,
    };
  },
);

async function importSubject() {
  const mod = await import('./oidc.store');
  return mod;
}

const validConfig: OidcClientConfig = {
  clientId: 'WebOAuthClient',
  redirectUri: 'https://example.com/callback',
  scope: 'openid profile',
  serverConfig: {
    wellknown: 'https://example.com/.well-known/openid-configuration',
  },
};

function mockClient(): OidcClient {
  return {
    authorize: { url: vi.fn(), background: vi.fn() },
    token: { exchange: vi.fn(), get: vi.fn(), revoke: vi.fn() },
    user: { info: vi.fn(), logout: vi.fn() },
  } as unknown as OidcClient;
}

describe('oidc.store — createOidcClientStore', () => {
  beforeEach(() => {
    oidcMock.mockReset();
    vi.resetModules();
    oidcMock.mockReturnValue(new Promise(() => {}));
  });

  it('validates config — wellknown and redirectUri must be URLs', async () => {
    const { createOidcClientStore } = await importSubject();

    expect(() =>
      createOidcClientStore({
        ...validConfig,
        serverConfig: { wellknown: 'not-a-url' },
      }),
    ).toThrow(/wellknown/i);

    expect(() =>
      createOidcClientStore({
        ...validConfig,
        redirectUri: 'not-a-url',
      }),
    ).toThrow(/redirectUri/i);

    expect(() => createOidcClientStore(validConfig)).not.toThrow();
  });

  it('reports a "required" error when wellknown is missing entirely', async () => {
    const { createOidcClientStore } = await importSubject();

    expect(() =>
      createOidcClientStore({
        ...validConfig,
        serverConfig: {} as { wellknown: string },
      }),
    ).toThrow(/required/i);
  });

  it('starts as null while oidc() is still resolving', async () => {
    oidcMock.mockReturnValue(new Promise(() => {}));

    const { createOidcClientStore } = await importSubject();
    const oidcClientStore = createOidcClientStore(validConfig);

    expect(get(oidcClientStore)).toBeNull();
  });

  it('calls oidc() with the parsed config', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const { createOidcClientStore } = await importSubject();
    createOidcClientStore(validConfig);

    expect(oidcMock).toHaveBeenCalledWith({ config: validConfig });
  });

  it('transitions to the ready client when oidc() resolves successfully', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const { createOidcClientStore } = await importSubject();
    const oidcClientStore = createOidcClientStore(validConfig);

    await vi.waitFor(() => expect(get(oidcClientStore)).toBe(client));
  });

  it('transitions to an error-shaped OidcClient when oidc() resolves with an error shape', async () => {
    oidcMock.mockResolvedValueOnce({ error: 'wellknown_error', type: 'wellknown_error' });

    const { createOidcClientStore } = await importSubject();
    const oidcClientStore = createOidcClientStore(validConfig);

    await vi.waitFor(() =>
      expect(get(oidcClientStore)).toMatchObject({ error: 'wellknown_error' }),
    );
  });

  it('transitions to an error-shaped OidcClient when oidc() rejects', async () => {
    oidcMock.mockRejectedValueOnce(new Error('wellknown fetch failed'));

    const { createOidcClientStore } = await importSubject();
    const oidcClientStore = createOidcClientStore(validConfig);

    await vi.waitFor(() =>
      expect(get(oidcClientStore)).toMatchObject({ error: 'wellknown fetch failed' }),
    );
  });

  it('two createOidcClientStore calls are fully isolated', async () => {
    const client1 = mockClient();
    const client2 = mockClient();

    oidcMock.mockResolvedValueOnce(client1).mockResolvedValueOnce(client2);

    const { createOidcClientStore } = await importSubject();
    const storeA = createOidcClientStore(validConfig);
    const storeB = createOidcClientStore({ ...validConfig, clientId: 'DifferentClient' });

    await vi.waitFor(() => {
      expect(get(storeA)).toBe(client1);
      expect(get(storeB)).toBe(client2);
    });
  });
});
