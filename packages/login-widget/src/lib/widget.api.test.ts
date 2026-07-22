/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const journeyTerminateMock = vi.fn().mockResolvedValue(undefined);
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

vi.mock(
  '@forgerock/journey-client',
  async (importOriginal: () => Promise<Record<string, unknown>>) => {
    const actual = await importOriginal();
    return {
      ...actual,
      journey: vi.fn().mockResolvedValue({
        start: vi.fn(),
        next: vi.fn(),
        resume: vi.fn(),
        redirect: vi.fn(),
        terminate: journeyTerminateMock,
      }),
    };
  },
);

async function importSubject() {
  const { widgetApiFactory } = await import('./widget.api');
  const { componentApi } = await import('./_utilities/component.utilities');
  return widgetApiFactory(componentApi());
}

const validJourneyClient = {
  serverConfig: { wellknown: 'https://example.com/.well-known/openid-configuration' },
};

const validOidcClient = {
  clientId: 'WebOAuthClient',
  redirectUri: 'https://example.com/callback',
  scope: 'openid profile',
  serverConfig: { wellknown: 'https://example.com/.well-known/openid-configuration' },
};

function makeOidcClient({
  logout = async () => ({ sessionResponse: null }),
  tokenGet = async () => ({ accessToken: 'fake-token' }),
}: {
  logout?: () => Promise<unknown>;
  tokenGet?: () => Promise<unknown>;
} = {}) {
  return {
    authorize: { url: () => {}, background: () => {} },
    token: { exchange: () => {}, get: tokenGet, revoke: () => {} },
    user: { info: async () => ({}), logout },
  };
}

function readStore<T>(store: { subscribe: (run: (value: T) => void) => () => void }): T {
  let captured!: T;
  store.subscribe((value) => {
    captured = value;
  })();
  return captured;
}

describe('widgetApiFactory', () => {
  beforeEach(() => {
    vi.resetModules();
    journeyTerminateMock.mockClear();
    oidcMock.mockReset();
    // Default: a never-resolving promise so eager oidc() init calls don't throw.
    oidcMock.mockReturnValue(new Promise(() => {}));
  });

  describe('public API surface (2.0.0)', () => {
    it('does not expose the removed `request` API', async () => {
      const api = await importSubject();
      expect('request' in api).toBe(false);
    });

    it('exposes the expected top-level API members', async () => {
      const api = await importSubject();
      expect(Object.keys(api).sort()).toEqual(
        ['component', 'configuration', 'getStores', 'journey', 'protect', 'user'].sort(),
      );
    });
  });

  describe('configuration() with oidcClient', () => {
    it('accepts an oidcClient config and enables journey() when journeyClient is also set', async () => {
      const api = await importSubject();
      api.configuration({ journeyClient: validJourneyClient, oidcClient: validOidcClient });
      expect(() => api.journey()).not.toThrow();
    });
  });

  describe('user.logout()', () => {
    const initialStoreState = {
      completed: false,
      error: null,
      loading: false,
      successful: false,
      response: null,
    };

    it('resets all stores to initial state after a successful logout', async () => {
      oidcMock.mockResolvedValueOnce(makeOidcClient());
      const api = await importSubject();
      api.configuration({ journeyClient: validJourneyClient, oidcClient: validOidcClient });
      const { oauthStore, userStore, journeyStore } = api.getStores();
      // Wait for the OIDC client store to be populated before logging out
      await vi.waitFor(() => expect(get(oauthStore.oidcClientStore)).not.toBeNull());

      await api.user.logout();

      expect(readStore(oauthStore)).toMatchObject(initialStoreState);
      expect(readStore(userStore)).toMatchObject(initialStoreState);
      expect(readStore(journeyStore)).toMatchObject({
        ...initialStoreState,
        metadata: null,
        step: null,
      });
    });

    it('resets all stores to initial state even when both server calls fail (and re-throws)', async () => {
      journeyTerminateMock.mockRejectedValueOnce(new Error('terminate failed'));
      oidcMock.mockResolvedValueOnce(
        makeOidcClient({
          logout: async () => {
            throw new Error('oidc failed');
          },
        }),
      );
      const api = await importSubject();
      api.configuration({ journeyClient: validJourneyClient, oidcClient: validOidcClient });
      const { oauthStore, userStore, journeyStore } = api.getStores();
      await vi.waitFor(() => expect(get(oauthStore.oidcClientStore)).not.toBeNull());

      await expect(api.user.logout()).rejects.toThrow('terminate failed');

      expect(readStore(oauthStore)).toMatchObject(initialStoreState);
      expect(readStore(userStore)).toMatchObject(initialStoreState);
      expect(readStore(journeyStore)).toMatchObject({
        ...initialStoreState,
        metadata: null,
        step: null,
      });
    });
  });

  describe('user.tokens() / user.info() — { get, subscribe } contract', () => {
    // Guards the 020fdb9 regression: tokens()/info() dropped their `get()` method
    // (returning subscribe-only), which broke the sample app's `user.tokens().get()`
    // hydration/route-validation calls with "get is not a function". The readiness-
    // gate and fetch behaviours are covered at the store level (oauth.store.test.ts /
    // user.store.test.ts) and end-to-end (reload-auth-persistence.spec.js).
    it('tokens() and info() expose both get and subscribe', async () => {
      oidcMock.mockResolvedValueOnce(makeOidcClient());
      const api = await importSubject();
      api.configuration({ journeyClient: validJourneyClient, oidcClient: validOidcClient });

      const tokensApi = api.user.tokens();
      const infoApi = api.user.info();
      expect(typeof tokensApi.get).toBe('function');
      expect(typeof tokensApi.subscribe).toBe('function');
      expect(typeof infoApi.get).toBe('function');
      expect(typeof infoApi.subscribe).toBe('function');
    });

    it('tokens().get() and info().get() return a promise', async () => {
      oidcMock.mockResolvedValueOnce(makeOidcClient());
      const api = await importSubject();
      api.configuration({ journeyClient: validJourneyClient, oidcClient: validOidcClient });

      // Swallow settlement — this asserts the call shape, not the fetch result.
      const tokensGet = api.user.tokens().get();
      const infoGet = api.user.info().get();
      expect(tokensGet).toBeInstanceOf(Promise);
      expect(infoGet).toBeInstanceOf(Promise);
      await Promise.allSettled([tokensGet, infoGet]);
    });

    // Regression: a repeated get() runs against an already-completed store. Reading
    // that store's value must not crash on Svelte's synchronous subscribe emission
    // (a TDZ "Cannot access 'unsubscribe' before initialization"). Such a crash
    // rejected get(), and the sample app's route guard turned that into a logout.
    it('a repeated get() on an already-completed store settles without crashing', async () => {
      oidcMock.mockResolvedValueOnce(makeOidcClient());
      const api = await importSubject();
      api.configuration({ journeyClient: validJourneyClient, oidcClient: validOidcClient });

      // First get() drives the store to `completed`. Second get() hits the
      // already-completed path — the one that used to throw a ReferenceError.
      await api.user
        .tokens()
        .get()
        .catch((value) => value);
      const settled = await api.user
        .tokens()
        .get()
        .catch((value) => value);

      expect(settled).not.toBeInstanceOf(ReferenceError);
      // Its own store value carries a `completed` flag; a TDZ crash would not.
      expect(settled).toHaveProperty('completed', true);
    });
  });

  describe('pre-configuration guards', () => {
    it('journey() throws when called before configuration()', async () => {
      const api = await importSubject();
      expect(() => api.journey()).toThrow('Error: missing configuration.');
    });

    it('user.info() throws when called before configuration()', async () => {
      const api = await importSubject();
      expect(() => api.user.info()).toThrow('Error: missing configuration.');
    });
  });

  describe('configuration() without journeyClient', () => {
    it('exposes a usable journeyStore — its initial value is observable via subscribe', async () => {
      const api = await importSubject();
      api.configuration();
      const { journeyStore } = api.getStores();

      const value = readStore(journeyStore);
      expect(value).toMatchObject({
        completed: false,
        error: null,
        loading: false,
        step: null,
        successful: false,
      });
    });

    it('journeyStore.reset() does not throw — the regression that broke user.logout()', async () => {
      const api = await importSubject();
      api.configuration();
      const { journeyStore } = api.getStores();
      expect(() => journeyStore.reset()).not.toThrow();
    });
  });

  describe('configuration().set()', () => {
    it('set({ journeyClient }) after configuration() without journeyClient enables journey() to be called', async () => {
      const api = await importSubject();
      api.configuration().set({ journeyClient: validJourneyClient });

      expect(() => api.journey()).not.toThrow();
    });

    it('set() without journeyClient preserves a previously configured journey client', async () => {
      const api = await importSubject();
      api.configuration({ journeyClient: validJourneyClient }).set();

      expect(() => api.journey()).not.toThrow();
    });
  });
});
