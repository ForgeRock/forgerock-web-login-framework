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
