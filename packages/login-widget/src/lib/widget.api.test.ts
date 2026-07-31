/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const journeyTerminateMock = vi.fn().mockResolvedValue(undefined);
const oidcMock = vi.fn();
const journeyMock = vi.fn();

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
      journey: journeyMock,
    };
  },
);

async function importSubject() {
  const { widgetApiFactory } = await import('./widget.api');
  const { componentApi } = await import('./_utilities/component.utilities');
  return widgetApiFactory(componentApi());
}

const validWellknown = 'https://example.com/.well-known/openid-configuration';

const validOidcClient = {
  clientId: 'WebOAuthClient',
  redirectUri: 'https://example.com/callback',
  scope: 'openid profile',
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
    journeyMock.mockReset();
    journeyMock.mockResolvedValue({
      start: vi.fn(),
      next: vi.fn(),
      resume: vi.fn(),
      redirect: vi.fn(),
      terminate: journeyTerminateMock,
    });
  });

  describe('public API surface (2.0.0)', () => {
    it('does not expose the removed `request` API', async () => {
      const api = await importSubject();
      expect('request' in api).toBe(false);
    });

    it('exposes the expected top-level API members', async () => {
      const api = await importSubject();
      expect(Object.keys(api).sort()).toEqual(
        ['component', 'configure', 'getStores', 'journey', 'protect', 'user'].sort(),
      );
    });
  });

  describe('configure() with oidcClient', () => {
    it('accepts an oidcClient config and enables journey() when wellknown is also set', async () => {
      oidcMock.mockResolvedValueOnce(makeOidcClient());
      const api = await importSubject();
      await api.configure({ wellknown: validWellknown, oidcClient: validOidcClient });
      expect(() => api.journey()).not.toThrow();
    });

    it('resolves only after the OIDC client is constructed', async () => {
      oidcMock.mockResolvedValueOnce(makeOidcClient());
      const api = await importSubject();
      await api.configure({ wellknown: validWellknown, oidcClient: validOidcClient });

      // configure() awaited getClient(), so the client store is already populated
      // and a token fetch resolves rather than reporting "not ready".
      const value = await api.user.tokens().get();
      expect(value.successful).toBe(true);
    });

    it('rejects when the OIDC client fails to construct', async () => {
      oidcMock.mockRejectedValueOnce(new Error('wellknown fetch failed'));
      const api = await importSubject();

      await expect(
        api.configure({ wellknown: validWellknown, oidcClient: validOidcClient }),
      ).rejects.toThrow(/wellknown fetch failed/);
    });
  });

  describe('configure() — logLevel and middleware fan out to both clients', () => {
    it('maps top-level logLevel to each client config `log` field', async () => {
      oidcMock.mockResolvedValueOnce(makeOidcClient());
      const api = await importSubject();
      await api.configure({
        wellknown: validWellknown,
        oidcClient: validOidcClient,
        logLevel: 'debug',
      });

      expect(journeyMock).toHaveBeenCalledWith(
        expect.objectContaining({ config: expect.objectContaining({ log: 'debug' }) }),
      );
      expect(oidcMock).toHaveBeenCalledWith(
        expect.objectContaining({ config: expect.objectContaining({ log: 'debug' }) }),
      );
    });

    it('forwards top-level middleware to both clients as requestMiddleware', async () => {
      oidcMock.mockResolvedValueOnce(makeOidcClient());
      const middleware = [vi.fn()];
      const api = await importSubject();
      await api.configure({
        wellknown: validWellknown,
        oidcClient: validOidcClient,
        middleware,
      });

      expect(journeyMock).toHaveBeenCalledWith(
        expect.objectContaining({ requestMiddleware: middleware }),
      );
      expect(oidcMock).toHaveBeenCalledWith(
        expect.objectContaining({ requestMiddleware: middleware }),
      );
    });

    it('omits `log` from the client config when logLevel is not set', async () => {
      oidcMock.mockResolvedValueOnce(makeOidcClient());
      const api = await importSubject();
      await api.configure({ wellknown: validWellknown, oidcClient: validOidcClient });

      const journeyConfig = journeyMock.mock.calls[0][0].config;
      const oidcConfig = oidcMock.mock.calls[0][0].config;
      expect('log' in journeyConfig).toBe(false);
      expect('log' in oidcConfig).toBe(false);
    });
  });

  describe('configure() — OIDC authorize passthrough options', () => {
    it('bridges loginHint/acrValues/query onto the silent token.get authorizeOptions', async () => {
      const tokenGet = vi.fn().mockResolvedValue({ accessToken: 'fake-token' });
      oidcMock.mockResolvedValueOnce(makeOidcClient({ tokenGet }));
      const api = await importSubject();
      await api.configure({
        wellknown: validWellknown,
        oidcClient: {
          ...validOidcClient,
          loginHint: 'jane.doe',
          acrValues: 'urn:acr:2fa',
          query: { customParam: 'value' },
        },
      });

      await api.user.tokens().get();

      expect(tokenGet).toHaveBeenCalledWith(
        expect.objectContaining({
          authorizeOptions: expect.objectContaining({
            loginHint: 'jane.doe',
            acrValues: 'urn:acr:2fa',
            query: { customParam: 'value' },
          }),
        }),
      );
    });

    it('does not set authorizeOptions when no authorize passthrough options are given', async () => {
      const tokenGet = vi.fn().mockResolvedValue({ accessToken: 'fake-token' });
      oidcMock.mockResolvedValueOnce(makeOidcClient({ tokenGet }));
      const api = await importSubject();
      await api.configure({ wellknown: validWellknown, oidcClient: validOidcClient });

      await api.user.tokens().get();

      expect(tokenGet.mock.calls[0][0]).not.toHaveProperty('authorizeOptions');
    });
  });

  describe('configure() — wellknown is required', () => {
    it('rejects when wellknown is missing', async () => {
      const api = await importSubject();

      await expect(
        // Untyped (IIFE) callers can omit wellknown; the guard must still fire.
        api.configure({ oidcClient: validOidcClient } as unknown as { wellknown: string }),
      ).rejects.toThrow(/wellknown url is required/);
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
      // await configure() guarantees the OIDC client is constructed before logout.
      await api.configure({ wellknown: validWellknown, oidcClient: validOidcClient });
      const { oauthStore, userStore, journeyStore } = api.getStores();

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
      await api.configure({ wellknown: validWellknown, oidcClient: validOidcClient });
      const { oauthStore, userStore, journeyStore } = api.getStores();

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
      await api.configure({ wellknown: validWellknown, oidcClient: validOidcClient });

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
      await api.configure({ wellknown: validWellknown, oidcClient: validOidcClient });

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
      await api.configure({ wellknown: validWellknown, oidcClient: validOidcClient });

      // First get() drives the store to `completed`. Second get() hits the
      // already-completed latch, which returns the current (cached) store value.
      await api.user
        .tokens()
        .get()
        .catch((value) => value);
      const settled = await api.user
        .tokens()
        .get()
        .catch((value) => value);

      expect(settled).not.toBeInstanceOf(ReferenceError);
      // The latch returns the cached store value; a valid token means success.
      expect(settled).toMatchObject({ completed: true, successful: true });
    });

    it('get() rejects with the store value when the fetch errors', async () => {
      oidcMock.mockResolvedValueOnce(
        makeOidcClient({
          tokenGet: async () => ({ error: 'state_error', message: 'No tokens found' }),
        }),
      );
      const api = await importSubject();
      await api.configure({ wellknown: validWellknown, oidcClient: validOidcClient });

      // Matches main: a failed fetch rejects, and the rejection payload is the
      // store value (carrying `error`), not a bare Error.
      const rejected = await api.user
        .tokens()
        .get()
        .then(() => null)
        .catch((value) => value);

      expect(rejected).toMatchObject({
        completed: true,
        successful: false,
        error: { message: 'No tokens found' },
      });
    });
  });

  describe('pre-configuration guards', () => {
    it('journey() throws when called before configure()', async () => {
      const api = await importSubject();
      expect(() => api.journey()).toThrow('Error: missing configuration.');
    });

    it('user.info() throws when called before configure()', async () => {
      const api = await importSubject();
      expect(() => api.user.info()).toThrow('Error: missing configuration.');
    });
  });

  describe('configure() without oidcClient', () => {
    it('exposes a usable journeyStore — its initial value is observable via subscribe', async () => {
      const api = await importSubject();
      await api.configure({ wellknown: validWellknown });
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
      await api.configure({ wellknown: validWellknown });
      const { journeyStore } = api.getStores();
      expect(() => journeyStore.reset()).not.toThrow();
    });
  });

  /**
   * Unlike the mocked suites above, this block runs the REAL SDK (journey-client's
   * logger) to prove the boundary the mocks stop at: the widget's top-level
   * `logLevel` is wired into the SDK's logger and its level gate governs the SDK's
   * `console.*` output. `vi.doUnmock` + `resetModules` drops the file-level journey
   * mock for these tests, then the outer `beforeEach` re-mocks for anything after.
   *
   * The SDK emits an *error* log at client construction when the wellknown URL is
   * malformed — through the same level gate as debug — so we drive that path. It
   * fires synchronously, before any network access, making the test deterministic.
   */
  describe('configure() — logLevel gates the real SDK logger', () => {
    // Valid `.url()` (passes the widget's zod check) but wrong path suffix, so the
    // real journey client's stricter `isValidWellknownUrl` rejects it and logs.
    const invalidSuffixWellknown = 'https://example.com/not-the-wellknown-path';
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.doUnmock('@forgerock/journey-client');
      vi.resetModules();
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
      vi.doMock(
        '@forgerock/journey-client',
        async (importOriginal: () => Promise<Record<string, unknown>>) => {
          const actual = await importOriginal();
          return { ...actual, journey: journeyMock };
        },
      );
    });

    it('emits the SDK error log to console.error when logLevel permits it', async () => {
      const api = await importSubject();

      await expect(
        api.configure({ wellknown: invalidSuffixWellknown, logLevel: 'error' }),
      ).rejects.toThrow(/wellknown/i);

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid wellknown URL'));
    });

    it('suppresses the SDK error log when logLevel is "none" (still throws)', async () => {
      const api = await importSubject();

      await expect(
        api.configure({ wellknown: invalidSuffixWellknown, logLevel: 'none' }),
      ).rejects.toThrow(/wellknown/i);

      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
