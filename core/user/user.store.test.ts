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

import type { OidcClient } from '@forgerock/oidc-client/types';

function readStore<T>(store: { subscribe: (run: (value: T) => void) => () => void }): T {
  let captured!: T;
  store.subscribe((value) => {
    captured = value;
  })();
  return captured;
}

function mockClientWithUserInfo(infoResult: unknown): OidcClient {
  return {
    authorize: { url: vi.fn(), background: vi.fn() },
    token: { exchange: vi.fn(), get: vi.fn(), revoke: vi.fn() },
    user: { info: vi.fn().mockResolvedValue(infoResult), logout: vi.fn() },
  } as unknown as OidcClient;
}

const userInfo = { sub: 'user-123', email: 'user@example.com' };

describe('user.store', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('emits a successful state with the user info when user.info resolves', async () => {
    const { initialize } = await import('./user.store');
    const oidcClientStore = readable<OidcClient | null>(mockClientWithUserInfo(userInfo));
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(true);
    expect(value.error).toBeNull();
    expect(value.response).toEqual(userInfo);
  });

  it('emits an error state (without throwing) when user.info returns a GenericError', async () => {
    const { initialize } = await import('./user.store');
    const oidcClientStore = readable<OidcClient | null>(
      mockClientWithUserInfo({
        error: 'state_error',
        message: 'No access token',
        type: 'state_error',
      }),
    );
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(false);
    expect(value.error?.message).toBe('No access token');
    expect(value.response).toBeNull();
  });

  it('emits an error state when user.info throws', async () => {
    const { initialize } = await import('./user.store');
    const client = mockClientWithUserInfo(null);
    (client.user as { info: ReturnType<typeof vi.fn> }).info.mockRejectedValue(
      new Error('info failed'),
    );
    const oidcClientStore = readable<OidcClient | null>(client);
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(false);
    expect(value.error?.message).toBe('info failed');
    expect(value.response).toBeNull();
  });

  it('emits an error state when the oidcClientStore contains an error-shaped OidcClient (init failed)', async () => {
    const { initialize } = await import('./user.store');
    const oidcClientStore = readable<OidcClient | null>({
      error: 'OIDC init failed',
      type: 'wellknown_error',
    } as unknown as OidcClient);
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(false);
    expect(value.error?.message).toBe('OIDC init failed');
    expect(value.response).toBeNull();
  });

  it('emits an error state when initialize() is called without an oidcClientStore', async () => {
    const { initialize } = await import('./user.store');
    const store = initialize(undefined);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(false);
    expect(value.error?.message).toMatch(/not configured/i);
    expect(value.response).toBeNull();
  });

  it('emits an error state immediately when get() is called before oidcClientStore resolves', async () => {
    const { initialize } = await import('./user.store');

    const controlledStore = writable<OidcClient | null>(null);
    const store = initialize(controlledStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(false);
    expect(value.error?.message).toMatch(/not ready/i);
  });

  it('does not call user.info again while loading', async () => {
    const { initialize } = await import('./user.store');
    const client = mockClientWithUserInfo(userInfo);
    const oidcClientStore = readable<OidcClient | null>(client);
    const store = initialize(oidcClientStore);

    let resolveInfo: (value: unknown) => void;
    const deferredInfo = new Promise((resolve) => {
      resolveInfo = resolve;
    });
    (client.user as { info: ReturnType<typeof vi.fn> }).info.mockReturnValue(deferredInfo);

    store.get();
    store.get();

    expect((client.user as { info: ReturnType<typeof vi.fn> }).info).toHaveBeenCalledTimes(1);

    resolveInfo!(userInfo);
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));
  });

  it('does not call user.info again after completion until reset() is called', async () => {
    const { initialize } = await import('./user.store');
    const client = mockClientWithUserInfo(userInfo);
    const oidcClientStore = readable<OidcClient | null>(client);
    const store = initialize(oidcClientStore);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    store.get();

    expect((client.user as { info: ReturnType<typeof vi.fn> }).info).toHaveBeenCalledTimes(1);

    store.reset();
    store.get();

    await vi.waitFor(() =>
      expect((client.user as { info: ReturnType<typeof vi.fn> }).info).toHaveBeenCalledTimes(2),
    );
  });

  it('reset() before any get() is a safe no-op', async () => {
    const { initialize } = await import('./user.store');
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
    const { initialize } = await import('./user.store');
    const oidcClientStore = readable<OidcClient | null>(mockClientWithUserInfo(userInfo));
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
