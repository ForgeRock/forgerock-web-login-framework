/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OauthTokens } from '@forgerock/oidc-client/types';

import type { OidcClientConfig } from './oauth.store';

const oidcMock = vi.fn();

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
  const mod = await import('./oauth.store');
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

const tokens: OauthTokens = {
  accessToken: 'abc',
  idToken: 'def',
};

function mockClientReturning(getResult: unknown) {
  return {
    authorize: { url: vi.fn(), background: vi.fn() },
    token: { exchange: vi.fn(), get: vi.fn().mockResolvedValue(getResult), revoke: vi.fn() },
    user: { info: vi.fn(), logout: vi.fn() },
  };
}

function readStore<T>(store: { subscribe: (run: (value: T) => void) => () => void }): T {
  let captured!: T;
  store.subscribe((value) => {
    captured = value;
  })();
  return captured;
}

describe('oauth.store — OIDC client initialization', () => {
  beforeEach(() => {
    oidcMock.mockReset();
    vi.resetModules();
  });

  it('validates oidcClient config (wellknown and redirectUri must be URLs)', async () => {
    const { initialize } = await importSubject();

    expect(() =>
      initialize({
        ...validConfig,
        serverConfig: { wellknown: 'not-a-url' },
      }),
    ).toThrow(/wellknown/i);

    expect(() =>
      initialize({
        ...validConfig,
        redirectUri: 'not-a-url',
      }),
    ).toThrow(/redirectUri/i);

    // A valid config should not throw.
    expect(() => initialize(validConfig)).not.toThrow();
  });

  it('reports a "required" error when wellknown is missing entirely', async () => {
    const { initialize } = await importSubject();
    expect(() =>
      initialize({
        ...validConfig,
        serverConfig: {} as { wellknown: string },
      }),
    ).toThrow(/required/i);
  });

  it('getOidcClient() throws when no config was provided to initialize()', async () => {
    const { initialize } = await importSubject();
    const store = initialize();
    await expect(store.getOidcClient()).rejects.toThrow('OIDC Client is not configured.');
  });

  it('caches the OIDC client promise so concurrent calls only initialize once', async () => {
    const client = mockClientReturning(tokens);

    let resolveClient: (value: unknown) => void;
    const deferred = new Promise((resolve) => {
      resolveClient = resolve;
    });
    oidcMock.mockReturnValueOnce(deferred);

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    const aPromise = store.getOidcClient();
    const bPromise = store.getOidcClient();

    expect(oidcMock).toHaveBeenCalledTimes(1);

    resolveClient!(client);

    const [first, second] = await Promise.all([aPromise, bPromise]);
    expect(first).toBe(client);
    expect(second).toBe(client);
  });

  it('clears the cached promise on initialization failure so it can retry', async () => {
    const client = mockClientReturning(tokens);
    oidcMock.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(client);

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    await expect(store.getOidcClient()).rejects.toThrow('boom');
    await expect(store.getOidcClient()).resolves.toBe(client);
    expect(oidcMock).toHaveBeenCalledTimes(2);
  });

  it('throws (and clears the cache) when the factory resolves to an error shape', async () => {
    const client = mockClientReturning(tokens);
    oidcMock
      .mockResolvedValueOnce({ error: 'wellknown_error', type: 'wellknown_error' })
      .mockResolvedValueOnce(client);

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    await expect(store.getOidcClient()).rejects.toThrow('wellknown_error');
    await expect(store.getOidcClient()).resolves.toBe(client);
    expect(oidcMock).toHaveBeenCalledTimes(2);
  });

  it('two initialize() calls are fully isolated — each gets its own client', async () => {
    const client1 = mockClientReturning(tokens);
    const client2 = mockClientReturning(tokens);
    oidcMock.mockResolvedValueOnce(client1).mockResolvedValueOnce(client2);

    const { initialize } = await importSubject();
    const storeA = initialize(validConfig);
    const storeB = initialize({ ...validConfig, clientId: 'DifferentClient' });

    await expect(storeA.getOidcClient()).resolves.toBe(client1);
    await expect(storeB.getOidcClient()).resolves.toBe(client2);
    expect(oidcMock).toHaveBeenCalledTimes(2);
  });

  it('all concurrent callers receive the rejection when initialization fails, and the cache is cleared for retry', async () => {
    let rejectClient: (reason: Error) => void;
    const deferred = new Promise<never>((_, reject) => {
      rejectClient = reject;
    });
    const client = mockClientReturning(tokens);
    oidcMock.mockReturnValueOnce(deferred).mockResolvedValueOnce(client);

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    const firstPromise = store.getOidcClient();
    const secondPromise = store.getOidcClient();
    expect(oidcMock).toHaveBeenCalledTimes(1);

    rejectClient!(new Error('network failure'));

    await expect(firstPromise).rejects.toThrow('network failure');
    await expect(secondPromise).rejects.toThrow('network failure');

    await expect(store.getOidcClient()).resolves.toBe(client);
    expect(oidcMock).toHaveBeenCalledTimes(2);
  });
});

describe('oauth.store — token retrieval', () => {
  beforeEach(() => {
    oidcMock.mockReset();
    vi.resetModules();
  });

  it('emits loading:true synchronously before any await', async () => {
    let resolveGet: (value: unknown) => void;
    const deferredGet = new Promise((resolve) => {
      resolveGet = resolve;
    });
    const client = {
      ...mockClientReturning(tokens),
      token: {
        exchange: vi.fn(),
        get: vi.fn().mockReturnValue(deferredGet),
        revoke: vi.fn(),
      },
    };
    oidcMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    store.getTokens();
    expect(readStore(store).loading).toBe(true);
    expect(readStore(store).completed).toBe(false);

    resolveGet!(tokens);
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));
  });

  it('getOptions override initOptions, which override the backgroundRenew default', async () => {
    const client = mockClientReturning(tokens);
    oidcMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize(validConfig, { forceRenew: false, backgroundRenew: false });

    await store.getTokens({ forceRenew: true });

    expect(client.token.get).toHaveBeenCalledWith(
      expect.objectContaining({ forceRenew: true, backgroundRenew: false }),
    );
  });

  it('emits a successful state with tokens when token.get resolves', async () => {
    const client = mockClientReturning(tokens);
    oidcMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    store.getTokens();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(true);
    expect(value.error).toBeNull();
    expect(value.response).toEqual(tokens);
  });

  it('emits an error state (without throwing) when token.get returns a GenericError', async () => {
    const client = mockClientReturning({
      error: 'state_error',
      message: 'No tokens found',
      type: 'state_error',
    });
    oidcMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    store.getTokens();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(false);
    expect(value.error?.message).toBe('No tokens found');
    expect(value.response).toBeNull();
  });

  it('maps the interaction-needed error to the session/consent troubleshooting message', async () => {
    const client = mockClientReturning({
      error: 'auth_error',
      message: 'The request requires some interaction that is not allowed.',
      type: 'auth_error',
    });
    oidcMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    store.getTokens();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    expect(readStore(store).error?.troubleshoot).toMatch(/consent/i);
  });

  it('reads error_description when the error object has no message (AuthorizationError shape)', async () => {
    const client = mockClientReturning({
      error: 'access_denied',
      error_description: 'User denied the request',
      type: 'auth_error',
    });
    oidcMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    store.getTokens();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    expect(readStore(store).error?.message).toBe('User denied the request');
  });

  it('emits an error state when client initialization throws', async () => {
    oidcMock.mockRejectedValue(new Error('init failed'));

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    store.getTokens();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(false);
    expect(value.error?.message).toBe('init failed');
  });

  it('falls back to tokens.error string when neither message nor error_description is present', async () => {
    const client = mockClientReturning({ error: 'server_error', type: 'generic' });
    oidcMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    store.getTokens();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    expect(readStore(store).error?.message).toBe('server_error');
  });

  it('captures a numeric error code', async () => {
    const client = mockClientReturning({
      error: 'state_error',
      message: 'Something went wrong',
      code: 403,
      type: 'state_error',
    });
    oidcMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    store.getTokens();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));
    expect(readStore(store).error?.code).toBe(403);
  });

  it('sets error code to null when the code field is not a number', async () => {
    const client = mockClientReturning({
      error: 'state_error',
      message: 'Something went wrong',
      code: 'not-a-number',
      type: 'state_error',
    });
    oidcMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    store.getTokens();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));
    expect(readStore(store).error?.code).toBeNull();
  });

  it('maps the authorization-timed-out error to the timeout troubleshooting message', async () => {
    const client = mockClientReturning({
      error: 'timeout_error',
      message: 'Authorization timed out',
      type: 'timeout_error',
    });
    oidcMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    store.getTokens();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    expect(readStore(store).error?.troubleshoot).toMatch(/misconfiguration/i);
  });

  it('surfaces "Unknown OAuth error" when a non-Error value is thrown', async () => {
    oidcMock.mockRejectedValue('a bare string, not an Error');

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    store.getTokens();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    expect(readStore(store).error?.message).toBe('Unknown OAuth error');
  });

  it('emits an error state (without throwing) when get() is called with no config', async () => {
    const { initialize } = await importSubject();
    const store = initialize();

    store.getTokens();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(false);
    expect(value.error?.message).toMatch(/not configured/i);
  });

  it('reset() before any get() is a safe no-op', async () => {
    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    expect(() => store.reset()).not.toThrow();
    expect(readStore(store)).toMatchObject({
      completed: false,
      error: null,
      loading: false,
      successful: false,
      response: null,
    });
  });

  it('reset() returns the store to its initial state', async () => {
    const client = mockClientReturning(tokens);
    oidcMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize(validConfig);

    store.getTokens();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    store.reset();
    expect(readStore(store)).toMatchObject({
      completed: false,
      error: null,
      loading: false,
      successful: false,
      response: null,
    });
  });
});
