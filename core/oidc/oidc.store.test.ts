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

  it('calls oidc() with the parsed config, no middleware, and empty storage by default', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const { createOidcClientStore } = await importSubject();
    createOidcClientStore(validConfig);

    expect(oidcMock).toHaveBeenCalledWith({
      config: validConfig,
      requestMiddleware: undefined,
      storage: {},
    });
  });

  it('forwards oauthThreshold and log on the config', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const { createOidcClientStore } = await importSubject();
    createOidcClientStore({ ...validConfig, oauthThreshold: 5000, log: 'debug' });

    expect(oidcMock).toHaveBeenCalledWith({
      config: { ...validConfig, oauthThreshold: 5000, log: 'debug' },
      requestMiddleware: undefined,
      storage: {},
    });
  });

  it('forwards the OIDC passthrough options (par, signOutRedirectUri, loginHint, acrValues, query) on the config', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const passthrough = {
      par: true,
      signOutRedirectUri: 'https://example.com/signed-out',
      loginHint: 'jane.doe',
      acrValues: 'urn:acr:2fa',
      query: { customParam: 'value' },
    };

    const { createOidcClientStore } = await importSubject();
    createOidcClientStore({ ...validConfig, ...passthrough });

    expect(oidcMock).toHaveBeenCalledWith({
      config: { ...validConfig, ...passthrough },
      requestMiddleware: undefined,
      storage: {},
    });
  });

  it('maps tokenStore and prefix onto the storage argument, not the config', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const { createOidcClientStore } = await importSubject();
    createOidcClientStore({ ...validConfig, tokenStore: 'sessionStorage', prefix: 'myApp' });

    expect(oidcMock).toHaveBeenCalledWith({
      config: validConfig,
      requestMiddleware: undefined,
      storage: { type: 'sessionStorage', prefix: 'myApp' },
    });
  });

  it('rejects a custom tokenStore value', async () => {
    const { createOidcClientStore } = await importSubject();

    expect(() =>
      createOidcClientStore({
        ...validConfig,
        // @ts-expect-error — custom is intentionally unsupported
        tokenStore: 'custom',
      }),
    ).toThrow();
  });

  it('forwards requestMiddleware to oidc()', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const middleware = [vi.fn()];
    const { createOidcClientStore } = await importSubject();
    createOidcClientStore(validConfig, middleware);

    expect(oidcMock).toHaveBeenCalledWith({
      config: validConfig,
      requestMiddleware: middleware,
      storage: {},
    });
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

  it('getClient() resolves with the constructed client', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const { createOidcClientStore } = await importSubject();
    const oidcClientStore = createOidcClientStore(validConfig);

    await expect(oidcClientStore.getClient()).resolves.toBe(client);
  });

  it('getClient() resolves with the error shape when oidc() rejects', async () => {
    oidcMock.mockRejectedValueOnce(new Error('wellknown fetch failed'));

    const { createOidcClientStore } = await importSubject();
    const oidcClientStore = createOidcClientStore(validConfig);

    await expect(oidcClientStore.getClient()).resolves.toMatchObject({
      error: 'wellknown fetch failed',
    });
  });

  it('getClient() returns the same promise on repeat calls — one construction', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const { createOidcClientStore } = await importSubject();
    const oidcClientStore = createOidcClientStore(validConfig);

    expect(oidcClientStore.getClient()).toBe(oidcClientStore.getClient());
    expect(oidcMock).toHaveBeenCalledTimes(1);
  });

  it('the store is already populated by the time getClient() resolves', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const { createOidcClientStore } = await importSubject();
    const oidcClientStore = createOidcClientStore(validConfig);

    const resolved = await oidcClientStore.getClient();
    expect(get(oidcClientStore)).toBe(resolved);
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

describe('oidc.store — oidcClientConfigSchema', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('parses a minimal config and defaults scope to "openid"', async () => {
    const { oidcClientConfigSchema } = await importSubject();

    const parsed = oidcClientConfigSchema.parse({
      clientId: 'WebOAuthClient',
      redirectUri: 'https://example.com/callback',
      serverConfig: { wellknown: 'https://example.com/.well-known/openid-configuration' },
    });

    expect(parsed.scope).toBe('openid');
  });

  it('accepts every restored/passthrough option with the correct type', async () => {
    const { oidcClientConfigSchema } = await importSubject();

    const parsed = oidcClientConfigSchema.parse({
      ...validConfig,
      log: 'debug',
      oauthThreshold: 5000,
      tokenStore: 'sessionStorage',
      prefix: 'myApp',
      par: true,
      signOutRedirectUri: 'https://example.com/signed-out',
      loginHint: 'jane.doe',
      acrValues: 'urn:acr:2fa',
      query: { customParam: 'value' },
    });

    expect(parsed).toMatchObject({
      log: 'debug',
      oauthThreshold: 5000,
      tokenStore: 'sessionStorage',
      prefix: 'myApp',
      par: true,
      signOutRedirectUri: 'https://example.com/signed-out',
      loginHint: 'jane.doe',
      acrValues: 'urn:acr:2fa',
      query: { customParam: 'value' },
    });
  });

  // Guards against silent config drift: a new SDK option that we forget to add
  // here would be an unknown key, and `.strict()` makes that a hard parse error.
  it('rejects an unknown top-level key (strict)', async () => {
    const { oidcClientConfigSchema } = await importSubject();

    expect(() => oidcClientConfigSchema.parse({ ...validConfig, notARealOption: true })).toThrow();
  });

  it('rejects an unknown serverConfig key', async () => {
    const { oidcClientConfigSchema } = await importSubject();

    expect(() =>
      oidcClientConfigSchema.parse({
        ...validConfig,
        serverConfig: { wellknown: validConfig.serverConfig.wellknown, timeout: 3000 },
      }),
    ).toThrow();
  });

  it('rejects wrong types for par, oauthThreshold, and query', async () => {
    const { oidcClientConfigSchema } = await importSubject();

    expect(() => oidcClientConfigSchema.parse({ ...validConfig, par: 'yes' })).toThrow();
    expect(() =>
      oidcClientConfigSchema.parse({ ...validConfig, oauthThreshold: '5000' }),
    ).toThrow();
    expect(() => oidcClientConfigSchema.parse({ ...validConfig, query: { count: 1 } })).toThrow();
  });
});
