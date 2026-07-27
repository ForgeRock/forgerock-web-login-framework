/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OidcClientReady } from '$core/oauth/oauth.store';

function readStore<T>(store: { subscribe: (run: (value: T) => void) => () => void }): T {
  let captured!: T;
  store.subscribe((value) => {
    captured = value;
  })();
  return captured;
}

function mockClientWithUserInfo(infoResult: unknown): OidcClientReady {
  return {
    authorize: { url: vi.fn(), background: vi.fn() },
    token: { exchange: vi.fn(), get: vi.fn(), revoke: vi.fn() },
    user: { info: vi.fn().mockResolvedValue(infoResult), logout: vi.fn() },
  } as unknown as OidcClientReady;
}

const userInfo = { sub: 'user-123', email: 'user@example.com' };

describe('user.store', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('emits a successful state with the user info when user.info resolves', async () => {
    const { initialize } = await import('./user.store');
    const getOidcClient = vi.fn().mockResolvedValue(mockClientWithUserInfo(userInfo));
    const store = initialize(getOidcClient);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(true);
    expect(value.error).toBeNull();
    expect(value.response).toEqual(userInfo);
  });

  it('emits an error state (without throwing) when user.info returns a GenericError', async () => {
    const { initialize } = await import('./user.store');
    const getOidcClient = vi.fn().mockResolvedValue(
      mockClientWithUserInfo({
        error: 'state_error',
        message: 'No access token',
        type: 'state_error',
      }),
    );
    const store = initialize(getOidcClient);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(false);
    expect(value.error?.message).toBe('No access token');
    expect(value.response).toBeNull();
  });

  it('emits an error state when getOidcClient throws', async () => {
    const { initialize } = await import('./user.store');
    const getOidcClient = vi.fn().mockRejectedValue(new Error('init failed'));
    const store = initialize(getOidcClient);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    expect(readStore(store).error?.message).toBe('init failed');
  });

  it('emits an error state when get() is called with a getOidcClient that rejects with "not configured"', async () => {
    const { initialize } = await import('./user.store');
    const getOidcClient = vi.fn().mockRejectedValue(new Error('OIDC Client is not configured.'));
    const store = initialize(getOidcClient);

    store.get();
    await vi.waitFor(() => expect(readStore(store).completed).toBe(true));

    const value = readStore(store);
    expect(value.successful).toBe(false);
    expect(value.error?.message).toMatch(/not configured/i);
    expect(value.response).toBeNull();
  });

  it('reset() returns the store to its initial state', async () => {
    const { initialize } = await import('./user.store');
    const getOidcClient = vi.fn().mockResolvedValue(mockClientWithUserInfo(userInfo));
    const store = initialize(getOidcClient);

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
