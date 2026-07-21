/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { get, readable, writable } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OauthTokens, OidcClient } from '@forgerock/oidc-client/types';

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

function mockClientReturning(getResult: unknown): OidcClient {
  return {
    authorize: { url: vi.fn(), background: vi.fn() },
    token: { exchange: vi.fn(), get: vi.fn().mockResolvedValue(getResult), revoke: vi.fn() },
    user: { info: vi.fn(), logout: vi.fn() },
  } as unknown as OidcClient;
}

function readStore<T>(store: { subscribe: (run: (value: T) => void) => () => void }): T {
  let captured!: T;
  store.subscribe((value) => {
    captured = value;
  })();
  return captured;
}

describe('oauth.store — createOidcClientStore', () => {
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

  it('transitions to the ready client when oidc() resolves successfully', async () => {
    const client = mockClientReturning(tokens);
    oidcMock.mockResolvedValueOnce(client);

    const { createOidcClientStore } = await importSubject();
    const oidcClientStore = createOidcClientStore(validConfig);

    await vi.waitFor(() => expect(get(oidcClientStore)).toBe(client));
  });

  it('transitions to an error-shaped OidcClient when oidc() resolves with an error shape', async () => {
    oidcMock.mockResolvedValueOnce({ error: 'wellknown_error', type: 'wellknown_error' });

    const { createOidcClientStore } = await importSubject();
    const oidcClientStore = createOidcClientStore(validConfig);

    await vi.waitFor(() => expect(get(oidcClientStore)).not.toBeNull());
    expect(get(oidcClientStore)).toMatchObject({ error: 'wellknown_error' });
  });

  it('two createOidcClientStore calls are fully isolated', async () => {
    const client1 = mockClientReturning(tokens);
    const client2 = mockClientReturning(tokens);
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

describe('oauth.store — initialize() token retrieval', () => {
  beforeEach(() => {
    oidcMock.mockReset();
    vi.resetModules();
    oidcMock.mockReturnValue(new Promise(() => {}));
  });

  it('emits loading:true synchronously when get() is called', async () => {
    const client = mockClientReturning(tokens);
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    let resolveGet: (value: unknown) => void;
    const deferredGet = new Promise((resolve) => {
      resolveGet = resolve;
    });
    (
      client as ReturnType<typeof mockClientReturning> & {
        token: { get: ReturnType<typeof vi.fn> };
      }
    ).token.get.mockReturnValue(deferredGet);

    store.get();
    expect(readStore(store).loading).toBe(true);
    expect(readStore(store).completed).toBe(false);

    resolveGet!(tokens);
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));
  });

  it('emits an error state immediately when get() is called before oidcClientStore resolves', async () => {
    const controlledStore = writable<OidcClient | null>(null);

    const { initialize } = await importSubject();
    const store = initialize(controlledStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(false);
    expect(value.error?.message).toMatch(/not ready/i);
  });

  it('getOptions override initOptions, which override the backgroundRenew default', async () => {
    const client = mockClientReturning(tokens);
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore, { forceRenew: false, backgroundRenew: false });

    store.get({ forceRenew: true });
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    expect(
      (
        client as ReturnType<typeof mockClientReturning> & {
          token: { get: ReturnType<typeof vi.fn> };
        }
      ).token.get,
    ).toHaveBeenCalledWith(expect.objectContaining({ forceRenew: true, backgroundRenew: false }));
  });

  it('emits a successful state with tokens when token.get resolves', async () => {
    const client = mockClientReturning(tokens);
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get();
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
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(false);
    expect(value.error?.message).toBe('No tokens found');
    expect(value.response).toBeNull();
  });

  it('emits an error state when the oidcClientStore contains an error-shaped OidcClient (init failed)', async () => {
    const oidcClientStore = readable<OidcClient | null>({
      error: 'OIDC init failed',
      type: 'wellknown_error',
    } as unknown as OidcClient);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(false);
    expect(value.error?.message).toBe('OIDC init failed');
  });

  it('emits an error state when initialize() is called without an oidcClientStore', async () => {
    const { initialize } = await importSubject();
    const store = initialize(undefined);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(false);
    expect(value.error?.message).toMatch(/not configured/i);
  });

  it('maps the interaction-needed error to the session/consent troubleshooting message', async () => {
    const client = mockClientReturning({
      error: 'auth_error',
      message: 'The request requires some interaction that is not allowed.',
      type: 'auth_error',
    });
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    expect(readStore(store).error?.troubleshoot).toMatch(/consent/i);
  });

  it('reads error_description when the error object has no message (AuthorizationError shape)', async () => {
    const client = mockClientReturning({
      error: 'access_denied',
      error_description: 'User denied the request',
      type: 'auth_error',
    });
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    expect(readStore(store).error?.message).toBe('User denied the request');
  });

  it('falls back to tokens.error string when neither message nor error_description is present', async () => {
    const client = mockClientReturning({ error: 'server_error', type: 'generic' });
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get();
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
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get();
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
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));
    expect(readStore(store).error?.code).toBeNull();
  });

  it('maps the authorization-timed-out error to the timeout troubleshooting message', async () => {
    const client = mockClientReturning({
      error: 'timeout_error',
      message: 'Authorization timed out',
      type: 'timeout_error',
    });
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    expect(readStore(store).error?.troubleshoot).toMatch(/misconfiguration/i);
  });

  it('surfaces "Unknown OAuth error" when a non-Error value is thrown', async () => {
    const client = mockClientReturning(tokens);
    (
      client as ReturnType<typeof mockClientReturning> & {
        token: { get: ReturnType<typeof vi.fn> };
      }
    ).token.get.mockRejectedValue('a bare string, not an Error');
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    expect(readStore(store).error?.message).toBe('Unknown OAuth error');
  });

  it('reset() before any get() is a safe no-op', async () => {
    const { initialize } = await importSubject();
    const store = initialize(undefined);

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
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get();
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
