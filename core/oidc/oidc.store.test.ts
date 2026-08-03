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

  it('calls oidc() with the parsed config, no middleware, and no storage by default', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const { createOidcClientStore } = await importSubject();
    createOidcClientStore(validConfig);

    expect(oidcMock).toHaveBeenCalledWith({
      config: validConfig,
      requestMiddleware: undefined,
    });
  });

  it('forwards oauthThreshold on the config', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const { createOidcClientStore } = await importSubject();
    createOidcClientStore({ ...validConfig, oauthThreshold: 5000 });

    expect(oidcMock).toHaveBeenCalledWith({
      config: { ...validConfig, oauthThreshold: 5000 },
      requestMiddleware: undefined,
    });
  });

  it('forwards the logger (level + custom sink) to oidc()', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const custom = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() };
    const logger = { level: 'debug', custom } as const;

    const { createOidcClientStore } = await importSubject();
    createOidcClientStore(validConfig, undefined, logger);

    expect(oidcMock).toHaveBeenCalledWith({
      config: validConfig,
      requestMiddleware: undefined,
      logger,
    });
  });

  it('omits logger from the oidc() call when none is provided', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const { createOidcClientStore } = await importSubject();
    createOidcClientStore(validConfig);

    expect(oidcMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ logger: expect.anything() }),
    );
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
    });
  });

  it('maps the storage config off the config and onto the storage argument (browser type + prefix)', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const storage = { type: 'sessionStorage', prefix: 'myApp' } as const;
    const { createOidcClientStore } = await importSubject();
    createOidcClientStore({ ...validConfig, storage });

    // `storage` rides on the config in, but goes to oidc()'s `storage` param — not its config.
    expect(oidcMock).toHaveBeenCalledWith({
      config: validConfig,
      requestMiddleware: undefined,
      storage,
    });
  });

  it('maps a custom storage sink off the config and onto the storage argument', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const custom = { get: vi.fn(), set: vi.fn(), remove: vi.fn() };
    const storage = { type: 'custom', name: 'tokens', custom } as const;
    const { createOidcClientStore } = await importSubject();
    createOidcClientStore({ ...validConfig, storage });

    expect(oidcMock).toHaveBeenCalledWith({
      config: validConfig,
      requestMiddleware: undefined,
      storage,
    });
  });

  it('omits storage from the oidc() call when none is provided', async () => {
    const client = mockClient();
    oidcMock.mockResolvedValueOnce(client);

    const { createOidcClientStore } = await importSubject();
    createOidcClientStore(validConfig);

    expect(oidcMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ storage: expect.anything() }),
    );
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

    const storage = { type: 'sessionStorage', prefix: 'myApp' } as const;
    const parsed = oidcClientConfigSchema.parse({
      ...validConfig,
      oauthThreshold: 5000,
      storage,
      par: true,
      signOutRedirectUri: 'https://example.com/signed-out',
      loginHint: 'jane.doe',
      acrValues: 'urn:acr:2fa',
      query: { customParam: 'value' },
    });

    expect(parsed).toMatchObject({
      oauthThreshold: 5000,
      storage,
      par: true,
      signOutRedirectUri: 'https://example.com/signed-out',
      loginHint: 'jane.doe',
      acrValues: 'urn:acr:2fa',
      query: { customParam: 'value' },
    });
  });

  it('rejects the removed `log` option (strict)', async () => {
    const { oidcClientConfigSchema } = await importSubject();

    expect(() => oidcClientConfigSchema.parse({ ...validConfig, log: 'debug' })).toThrow();
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

  it('public key surface — fails when an option is silently added or removed', async () => {
    const { oidcClientConfigSchema } = await importSubject();
    expect(Object.keys(oidcClientConfigSchema.shape).sort()).toMatchSnapshot();
  });

  it('validates the storage discriminated union', async () => {
    const { oidcClientConfigSchema } = await importSubject();

    // Browser stores parse with type/prefix/name.
    expect(
      oidcClientConfigSchema.parse({
        ...validConfig,
        storage: { type: 'sessionStorage', prefix: 'myApp', name: 'tokens' },
      }).storage,
    ).toMatchObject({ type: 'sessionStorage', prefix: 'myApp', name: 'tokens' });

    // The custom store parses with its sink intact.
    const custom = { get: () => null, set: () => undefined, remove: () => undefined };
    expect(
      oidcClientConfigSchema.parse({ ...validConfig, storage: { type: 'custom', custom } }).storage,
    ).toMatchObject({ type: 'custom', custom });

    // A bad discriminant is rejected.
    expect(() =>
      oidcClientConfigSchema.parse({ ...validConfig, storage: { type: 'localStorag' } }),
    ).toThrow();

    // `type: 'custom'` without a sink is rejected.
    expect(() =>
      oidcClientConfigSchema.parse({ ...validConfig, storage: { type: 'custom' } }),
    ).toThrow();

    // A missing discriminant is rejected.
    expect(() =>
      oidcClientConfigSchema.parse({ ...validConfig, storage: { prefix: 'myApp' } }),
    ).toThrow();
  });
});
