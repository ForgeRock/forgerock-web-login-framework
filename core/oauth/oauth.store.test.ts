/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { readable, writable } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OauthTokens, OidcClient } from '@forgerock/oidc-client/types';

async function importSubject() {
  const mod = await import('./oauth.store');
  return mod;
}

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

function mockClientWith({
  getResult = tokens,
  backgroundResult,
  exchangeResult,
}: {
  getResult?: unknown;
  backgroundResult?: unknown;
  exchangeResult?: unknown;
} = {}) {
  const backgroundMock = vi.fn().mockResolvedValue(backgroundResult);
  const exchangeMock = vi.fn().mockResolvedValue(exchangeResult);
  const getMock = vi.fn().mockResolvedValue(getResult);
  const client = {
    authorize: { url: vi.fn(), background: backgroundMock },
    token: { exchange: exchangeMock, get: getMock, revoke: vi.fn() },
    user: { info: vi.fn(), logout: vi.fn() },
  } as unknown as OidcClient;
  return { client, backgroundMock, exchangeMock, getMock };
}

function readStore<T>(store: { subscribe: (run: (value: T) => void) => () => void }): T {
  let captured!: T;
  store.subscribe((value) => {
    captured = value;
  })();
  return captured;
}

describe('oauth.store — initialize() token retrieval', () => {
  beforeEach(() => {
    vi.resetModules();
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

  it('getOptions passed to store.get() are forwarded to token.get()', async () => {
    const client = mockClientReturning(tokens);
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get({ forceRenew: true, backgroundRenew: false });
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

    const returned = await store.get();
    const value = readStore(store);
    expect(value.successful).toBe(true);
    expect(value.error).toBeNull();
    expect(value.response).toEqual(tokens);
    expect(returned).toEqual(value);
  });

  it('get() updates the store with the terminal value', async () => {
    const client = mockClientReturning(tokens);
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));
    expect(readStore(store)).toMatchObject({
      completed: true,
      successful: true,
      error: null,
      response: tokens,
    });
  });

  it('get() sets error state (does not throw) on a failed fetch', async () => {
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
    expect(readStore(store)).toMatchObject({
      completed: true,
      successful: false,
      error: { message: 'No tokens found' },
    });
  });

  it('the latched get() does not re-fetch when already completed', async () => {
    const client = mockClientReturning(tokens);
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));
    store.get();
    expect(
      (
        client as ReturnType<typeof mockClientReturning> & {
          token: { get: ReturnType<typeof vi.fn> };
        }
      ).token.get,
    ).toHaveBeenCalledTimes(1);
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

  it('does not call token.get again while loading', async () => {
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
    store.get();

    expect(
      (
        client as ReturnType<typeof mockClientReturning> & {
          token: { get: ReturnType<typeof vi.fn> };
        }
      ).token.get,
    ).toHaveBeenCalledTimes(1);

    resolveGet!(tokens);
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));
  });

  it('does not call token.get again after completion until reset() is called', async () => {
    const client = mockClientReturning(tokens);
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    store.get();

    expect(
      (
        client as ReturnType<typeof mockClientReturning> & {
          token: { get: ReturnType<typeof vi.fn> };
        }
      ).token.get,
    ).toHaveBeenCalledTimes(1);

    store.reset();
    store.get();
    await vi.waitFor(() =>
      expect(
        (
          client as ReturnType<typeof mockClientReturning> & {
            token: { get: ReturnType<typeof vi.fn> };
          }
        ).token.get,
      ).toHaveBeenCalledTimes(2),
    );
  });

  it('reset() before any get() is a safe no-op', async () => {
    const { initialize } = await importSubject();
    const store = initialize(undefined);

    expect(() => store.reset()).not.toThrow();
    expect(readStore(store)).toMatchObject({
      code: null,
      completed: false,
      error: null,
      loading: false,
      response: null,
      state: null,
      successful: false,
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
      code: null,
      completed: false,
      error: null,
      loading: false,
      response: null,
      state: null,
      successful: false,
    });
  });
});

describe('oauth.store — initialize() background()', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('sets loading:true while in flight', async () => {
    let resolveBackground: (value: unknown) => void;
    const deferred = new Promise((resolve) => {
      resolveBackground = resolve;
    });
    const { client, backgroundMock } = mockClientWith();
    backgroundMock.mockReturnValue(deferred);
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    store.background();
    expect(readStore(store).loading).toBe(true);

    resolveBackground!({ code: 'auth-code', state: 'state-val' });
  });

  it('sets code and state on success and does not complete', async () => {
    const { client } = mockClientWith({
      backgroundResult: { code: 'auth-code', state: 'state-val' },
    });
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    await store.background();
    const storeState = readStore(store);
    expect(storeState.code).toBe('auth-code');
    expect(storeState.state).toBe('state-val');
    expect(storeState.completed).toBe(false);
    expect(storeState.loading).toBe(false);
    expect(storeState.error).toBeNull();
  });

  it('sets error state when authorize.background fails', async () => {
    const { client } = mockClientWith({
      backgroundResult: {
        error: 'access_denied',
        error_description: 'User cancelled login',
        type: 'auth_error',
      },
    });
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    await store.background();
    const storeState = readStore(store);
    expect(storeState.completed).toBe(true);
    expect(storeState.successful).toBe(false);
    expect(storeState.code).toBeNull();
    expect(storeState.state).toBeNull();
    expect(storeState.error?.message).toBe('User cancelled login');
  });

  it('falls back to error string when error_description is missing', async () => {
    const { client } = mockClientWith({
      backgroundResult: { error: 'server_error', error_description: undefined, type: 'auth_error' },
    });
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    await store.background();
    expect(readStore(store).error?.message).toBe('server_error');
  });

  it('sets error state when oidcClientStore is null', async () => {
    const oidcClientStore = readable<OidcClient | null>(null);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    await store.background();
    expect(readStore(store).successful).toBe(false);
    expect(readStore(store).error?.message).toMatch(/not ready/i);
  });

  it('sets error state when oidcClientStore has an error-shaped client', async () => {
    const oidcClientStore = readable<OidcClient | null>({
      error: 'init failed',
      type: 'wellknown_error',
    } as unknown as OidcClient);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    await store.background();
    expect(readStore(store).successful).toBe(false);
    expect(readStore(store).error?.message).toMatch(/not ready/i);
  });

  it('passes oidcConfig authorize options to authorize.background', async () => {
    const { client, backgroundMock } = mockClientWith({
      backgroundResult: { code: 'auth-code', state: 'state-val' },
    });
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore, {
      clientId: 'my-client',
      redirectUri: 'https://app.example.com/callback',
      scope: 'openid profile',
    });

    await store.background();
    expect(backgroundMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'my-client',
        redirectUri: 'https://app.example.com/callback',
        scope: 'openid profile',
      }),
    );
  });

  it('call-time options override oidcConfig options', async () => {
    const { client, backgroundMock } = mockClientWith({
      backgroundResult: { code: 'auth-code', state: 'state-val' },
    });
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore, {
      clientId: 'my-client',
      redirectUri: 'https://app.example.com/callback',
      scope: 'openid',
    });

    await store.background({
      clientId: 'my-client',
      redirectUri: 'https://app.example.com/callback',
      responseType: 'code',
      scope: 'openid profile email',
    });
    expect(backgroundMock).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'openid profile email' }),
    );
  });
});

describe('oauth.store — initialize() exchange()', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('is a no-op when store has no code or state', async () => {
    const { client, exchangeMock } = mockClientWith();
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    await store.exchange();
    expect(exchangeMock).not.toHaveBeenCalled();
    expect(readStore(store).completed).toBe(false);
  });

  it('calls token.exchange with code, state, and options from the store', async () => {
    const { client, exchangeMock } = mockClientWith({
      backgroundResult: { code: 'my-code', state: 'my-state' },
      exchangeResult: tokens,
    });
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    await store.background();
    await store.exchange();
    expect(exchangeMock).toHaveBeenCalledWith('my-code', 'my-state', undefined);
  });

  it('passes storage options to token.exchange', async () => {
    const storageOptions = { clientId: 'my-client' };
    const { client, exchangeMock } = mockClientWith({
      backgroundResult: { code: 'auth-code', state: 'state-val' },
      exchangeResult: tokens,
    });
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    await store.background();
    await store.exchange(storageOptions);
    expect(exchangeMock).toHaveBeenCalledWith('auth-code', 'state-val', storageOptions);
  });

  it('sets successful store state and clears code and state on success', async () => {
    const { client } = mockClientWith({
      backgroundResult: { code: 'auth-code', state: 'state-val' },
      exchangeResult: tokens,
    });
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    await store.background();
    await store.exchange();
    const storeState = readStore(store);
    expect(storeState.successful).toBe(true);
    expect(storeState.completed).toBe(true);
    expect(storeState.response).toEqual(tokens);
    expect(storeState.code).toBeNull();
    expect(storeState.state).toBeNull();
  });

  it('sets error state and clears code and state when token.exchange fails', async () => {
    const { client } = mockClientWith({
      backgroundResult: { code: 'auth-code', state: 'state-val' },
      exchangeResult: { error: 'invalid_grant', message: 'Code expired', type: 'auth_error' },
    });
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    await store.background();
    await store.exchange();
    const storeState = readStore(store);
    expect(storeState.successful).toBe(false);
    expect(storeState.error?.message).toBe('Code expired');
    expect(storeState.code).toBeNull();
    expect(storeState.state).toBeNull();
  });

  it('falls back to error string when exchange error has no message', async () => {
    const { client } = mockClientWith({
      backgroundResult: { code: 'auth-code', state: 'state-val' },
      exchangeResult: { error: 'invalid_grant', type: 'auth_error' },
    });
    const oidcClientStore = readable<OidcClient | null>(client);

    const { initialize } = await importSubject();
    const store = initialize(oidcClientStore);

    await store.background();
    await store.exchange();
    expect(readStore(store).error?.message).toBe('invalid_grant');
  });
});
