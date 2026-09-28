/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JourneyClient, JourneyClientConfig } from '@forgerock/journey-client/types';

const journeyMock = vi.fn();

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
  const mod = await import('./journey.store');
  return mod;
}

describe('journey.store (Journey Client configuration)', () => {
  beforeEach(() => {
    journeyMock.mockReset();
    vi.resetModules();
  });

  it('throws when getJourneyClient() is called before configuration', async () => {
    const { getJourneyClient } = await importSubject();
    await expect(getJourneyClient()).rejects.toThrow(
      'Journey Client is not configured. Call setJourneyClientConfig() first.',
    );
  });

  it('validates journeyClient config (wellknown must be a URL)', async () => {
    const { setJourneyClientConfig } = await importSubject();

    expect(() =>
      setJourneyClientConfig({
        serverConfig: {
          wellknown: 'not-a-url',
        },
      } as unknown as JourneyClientConfig),
    ).toThrow(/wellknown/i);

    expect(() =>
      setJourneyClientConfig({
        serverConfig: {},
      } as unknown as JourneyClientConfig),
    ).toThrow(/wellknown/i);

    const config = setJourneyClientConfig({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    expect(config?.serverConfig.wellknown).toBe(
      'https://example.com/.well-known/openid-configuration',
    );
  });

  it('setJourneyClientConfig() is a no-op when called without a config and no prior config exists', async () => {
    const { setJourneyClientConfig } = await importSubject();
    expect(setJourneyClientConfig()).toBeUndefined();
  });

  it('setJourneyClientConfig() returns the existing config when called without one after prior configuration', async () => {
    const { setJourneyClientConfig } = await importSubject();
    setJourneyClientConfig({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });
    const reused = setJourneyClientConfig();
    expect(reused?.serverConfig.wellknown).toBe(
      'https://example.com/.well-known/openid-configuration',
    );
  });

  it('caches the journey promise so concurrent calls only initialize once', async () => {
    const client = {} as JourneyClient;

    let resolveClient: (value: JourneyClient) => void;
    const deferred = new Promise<JourneyClient>((resolve) => {
      resolveClient = resolve;
    });

    journeyMock.mockReturnValueOnce(deferred);

    const { getJourneyClient, setJourneyClientConfig } = await importSubject();
    setJourneyClientConfig({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    const aPromise = getJourneyClient();
    const bPromise = getJourneyClient();

    expect(journeyMock).toHaveBeenCalledTimes(1);

    // Fulfill the mocked creation and assert both callers share the same client.
    resolveClient!(client);

    const [a, b] = await Promise.all([aPromise, bPromise]);
    expect(a).toBe(client);
    expect(b).toBe(client);
  });

  it('clears the cached promise on initialization failure so it can retry', async () => {
    const error = new Error('boom');
    const client = {} as JourneyClient;

    journeyMock.mockRejectedValueOnce(error).mockResolvedValueOnce(client);

    const { getJourneyClient, setJourneyClientConfig } = await importSubject();
    setJourneyClientConfig({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    await expect(getJourneyClient()).rejects.toThrow('boom');
    await expect(getJourneyClient()).resolves.toBe(client);

    expect(journeyMock).toHaveBeenCalledTimes(2);
  });

  it('resets the cached promise when configuration changes', async () => {
    const client1 = { client: 1 } as unknown as JourneyClient;
    const client2 = { client: 2 } as unknown as JourneyClient;

    journeyMock.mockResolvedValueOnce(client1).mockResolvedValueOnce(client2);

    const { getJourneyClient, setJourneyClientConfig } = await importSubject();

    setJourneyClientConfig({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    await expect(getJourneyClient()).resolves.toBe(client1);

    setJourneyClientConfig({
      serverConfig: {
        wellknown: 'https://example.com/other/.well-known/openid-configuration',
      },
    });

    await expect(getJourneyClient()).resolves.toBe(client2);
    expect(journeyMock).toHaveBeenCalledTimes(2);
  });

  it('forwards the logger (level + custom sink) to journey()', async () => {
    const client = {} as JourneyClient;
    journeyMock.mockResolvedValueOnce(client);

    const custom = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() };
    const logger = { level: 'debug', custom } as const;

    const { getJourneyClient, setJourneyClientConfig } = await importSubject();
    setJourneyClientConfig(
      {
        serverConfig: {
          wellknown: 'https://example.com/.well-known/openid-configuration',
        },
      },
      undefined,
      logger,
    );

    await getJourneyClient();

    expect(journeyMock).toHaveBeenCalledWith({
      config: {
        serverConfig: {
          wellknown: 'https://example.com/.well-known/openid-configuration',
        },
      },
      requestMiddleware: undefined,
      logger,
    });
  });

  it('forwards requestMiddleware to journey()', async () => {
    const client = {} as JourneyClient;
    journeyMock.mockResolvedValueOnce(client);

    const middleware = [vi.fn()];
    const { getJourneyClient, setJourneyClientConfig } = await importSubject();
    setJourneyClientConfig(
      {
        serverConfig: {
          wellknown: 'https://example.com/.well-known/openid-configuration',
        },
      },
      middleware,
    );

    await getJourneyClient();

    expect(journeyMock).toHaveBeenCalledWith({
      config: {
        serverConfig: {
          wellknown: 'https://example.com/.well-known/openid-configuration',
        },
      },
      requestMiddleware: middleware,
    });
  });

  it('resets the cached promise when requestMiddleware changes', async () => {
    const client1 = { client: 1 } as unknown as JourneyClient;
    const client2 = { client: 2 } as unknown as JourneyClient;

    journeyMock.mockResolvedValueOnce(client1).mockResolvedValueOnce(client2);

    const config = {
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    };

    const { getJourneyClient, setJourneyClientConfig } = await importSubject();

    setJourneyClientConfig(config, [vi.fn()]);
    await expect(getJourneyClient()).resolves.toBe(client1);

    setJourneyClientConfig(config, [vi.fn()]);
    await expect(getJourneyClient()).resolves.toBe(client2);
    expect(journeyMock).toHaveBeenCalledTimes(2);
  });

  it('resets the cached promise when the logger changes', async () => {
    const client1 = { client: 1 } as unknown as JourneyClient;
    const client2 = { client: 2 } as unknown as JourneyClient;

    journeyMock.mockResolvedValueOnce(client1).mockResolvedValueOnce(client2);

    const wellknown = 'https://example.com/.well-known/openid-configuration';
    const config = { serverConfig: { wellknown } };
    const { getJourneyClient, setJourneyClientConfig } = await importSubject();

    setJourneyClientConfig(config, undefined, { level: 'error' });
    await expect(getJourneyClient()).resolves.toBe(client1);

    setJourneyClientConfig(config, undefined, { level: 'debug' });
    await expect(getJourneyClient()).resolves.toBe(client2);
    expect(journeyMock).toHaveBeenCalledTimes(2);
  });

  /**
   * A LoginFailure result must route through the LoginFailure branch, which is the only
   * branch that threads `failureResult` into the error state — so `error.code` reflects
   * `failureResult.getCode()`. (`error.message` derives from `htmlDecode`, which returns
   * null in this non-DOM test environment; the message text is covered end-to-end by E2E.)
   */
  it('routes a LoginFailure result through the LoginFailure branch, surfacing its code', async () => {
    const loginFailure = {
      type: 'LoginFailure' as const,
      payload: { message: 'User Locked Out.', detail: null },
      getCode: () => 401,
    };
    const restartError = {
      type: 'unknown_error' as const,
      error: 'restart_failed',
      message: 'restart failed',
    };

    const client = {
      start: vi.fn().mockResolvedValueOnce(loginFailure).mockResolvedValueOnce(restartError),
      next: vi.fn(),
    } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    const { initialize, journeyStore } = await importSubject();
    const store = initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    await store.start({ journey: 'Login' });

    const { get } = await import('svelte/store');
    const state = get(journeyStore);

    // code 401 comes only from failureResult.getCode() — proves the LoginFailure branch ran.
    expect(state.error?.code).toBe(401);
  });

  /**
   * A GenericError result (genuine transport failure) should fall through to the
   * network-error message — the path the removed no_response_data hack used to shortcut.
   */
  it('routes a GenericError result through the network-error branch using its message', async () => {
    const genericError = {
      type: 'unknown_error' as const,
      error: 'no_response_data',
      message: 'No data received from server',
    };
    const restartError = {
      type: 'unknown_error' as const,
      error: 'restart_failed',
      message: 'restart failed',
    };

    const client = {
      start: vi.fn().mockResolvedValueOnce(genericError).mockResolvedValueOnce(restartError),
      next: vi.fn(),
    } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    const { initialize, journeyStore } = await importSubject();
    const store = initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    await store.start({ journey: 'Login' });

    const { get } = await import('svelte/store');
    const state = get(journeyStore);

    expect(state.error?.message).toBe('No data received from server');
  });

  /**
   * Journey Client parses the legacy resume URL params itself, so the store forwards the
   * URL untouched — except a `journey` query param, which the client does not read and the
   * store therefore threads through as a resume option.
   */
  it('forwards a journey query param from the resume URL to journeyClient.resume', async () => {
    const loginSuccess = { type: 'LoginSuccess' as const, payload: { tokenId: 'abc' } };

    const resumeSpy = vi.fn().mockResolvedValueOnce(loginSuccess);
    const client = { start: vi.fn(), next: vi.fn(), resume: resumeSpy } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    const resumeUrl = 'https://example.com/callback?suspendedId=abc123&journey=ResetPassword';
    await store.resume(resumeUrl);

    expect(resumeSpy).toHaveBeenCalledWith(resumeUrl, { journey: 'ResetPassword' });
  });

  /**
   * When both the URL and resumeOptions carry a `journey`, the URL value wins — preserving
   * the precedence the store had before it delegated legacy-param parsing to Journey Client.
   */
  it('prioritizes the URL journey query param over resumeOptions.journey', async () => {
    const loginSuccess = { type: 'LoginSuccess' as const, payload: { tokenId: 'abc' } };

    const resumeSpy = vi.fn().mockResolvedValueOnce(loginSuccess);
    const client = { start: vi.fn(), next: vi.fn(), resume: resumeSpy } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    const resumeUrl = 'https://example.com/callback?suspendedId=abc123&journey=ResetPassword';
    await store.resume(resumeUrl, { journey: 'Login' });

    expect(resumeSpy).toHaveBeenCalledWith(resumeUrl, { journey: 'ResetPassword' });
  });

  /**
   * Without a `journey` query param the store forwards the URL and options unchanged,
   * leaving all legacy-param parsing to Journey Client.
   */
  it('forwards the resume URL untouched when no journey query param is present', async () => {
    const loginSuccess = { type: 'LoginSuccess' as const, payload: { tokenId: 'abc' } };

    const resumeSpy = vi.fn().mockResolvedValueOnce(loginSuccess);
    const client = { start: vi.fn(), next: vi.fn(), resume: resumeSpy } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    const resumeUrl = 'https://example.com/callback?suspendedId=abc123&authIndexValue=Login';
    await store.resume(resumeUrl);

    expect(resumeSpy).toHaveBeenCalledWith(resumeUrl, undefined);
  });

  /**
   * IAM-12006: resume() must record the resolved journey on the stack so that a failed
   * resume (expired suspendedId -> LoginFailure) restarts into the suspended journey
   * instead of start(undefined). Mirrors what start() does with its options.
   */
  it('pushes the resolved journey from the resume URL onto the journey stack', async () => {
    // A Step result keeps handleJourneyResult from touching the stack (LoginSuccess
    // would call stack.reset() and erase the push we're asserting on).
    const step = {
      type: 'Step' as const,
      payload: { authId: 'step-auth-id' },
      callbacks: [],
      getStage: () => null,
      getCallbacksOfType: () => [],
    };

    const resumeSpy = vi.fn().mockResolvedValueOnce(step);
    const client = { start: vi.fn(), next: vi.fn(), resume: resumeSpy } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    // Read `stack` through the module namespace: it's an exported `let` that
    // initializeStack() assigns during initialize(), so a destructured copy would
    // capture the pre-initialize undefined.
    const mod = await importSubject();
    const store = mod.initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    const resumeUrl = 'https://example.com/callback?suspendedId=abc123&journey=ResetPassword';
    await store.resume(resumeUrl);

    expect(await mod.stack.latest()).toEqual({ journey: 'ResetPassword' });
  });

  /**
   * No journey in the URL means nothing to record — the stack stays empty and restart
   * falls back to whatever the restart chain resolves (default-journey fallback), rather
   * than pushing a garbage entry.
   */
  it('leaves the stack empty when the resume URL has no journey param', async () => {
    // A Step result keeps handleJourneyResult from touching the stack — otherwise
    // stack.reset() (LoginSuccess) would make this test pass for the wrong reason.
    const step = {
      type: 'Step' as const,
      payload: { authId: 'step-auth-id' },
      callbacks: [],
      getStage: () => null,
      getCallbacksOfType: () => [],
    };

    const resumeSpy = vi.fn().mockResolvedValueOnce(step);
    const client = { start: vi.fn(), next: vi.fn(), resume: resumeSpy } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    // Same namespace-read pattern as the push test above: `stack` is assigned
    // inside initialize().
    const mod = await importSubject();
    const store = mod.initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    const resumeUrl = 'https://example.com/callback?suspendedId=abc123';
    await store.resume(resumeUrl);

    expect(await mod.stack.latest()).toBeUndefined();
  });

  /**
   * Old-style suspended links (IAM-11783 QA shape) carry authIndexValue and no journey
   * param. journey-client resolves authIndexValue as the journey fallback for the resume
   * call itself, so the store's stack push must resolve identically — otherwise the
   * failed resume still restarts into the realm default.
   */
  it('pushes the URL authIndexValue onto the stack when no journey param is present', async () => {
    const step = {
      type: 'Step' as const,
      payload: { authId: 'step-auth-id' },
      callbacks: [],
      getStage: () => null,
      getCallbacksOfType: () => [],
    };

    const resumeSpy = vi.fn().mockResolvedValueOnce(step);
    const client = { start: vi.fn(), next: vi.fn(), resume: resumeSpy } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    const mod = await importSubject();
    const store = mod.initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    const resumeUrl =
      'https://example.com/callback?suspendedId=abc123&authIndexValue=ResetPassword';
    await store.resume(resumeUrl);

    expect(await mod.stack.latest()).toEqual({ journey: 'ResetPassword' });
  });

  /**
   * Precedence must mirror journey-client's resume resolution: journey option ?? authIndexValue.
   */
  it('prefers the journey param over authIndexValue when both are in the resume URL', async () => {
    const step = {
      type: 'Step' as const,
      payload: { authId: 'step-auth-id' },
      callbacks: [],
      getStage: () => null,
      getCallbacksOfType: () => [],
    };

    const resumeSpy = vi.fn().mockResolvedValueOnce(step);
    const client = { start: vi.fn(), next: vi.fn(), resume: resumeSpy } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    const mod = await importSubject();
    const store = mod.initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    const resumeUrl =
      'https://example.com/callback?suspendedId=abc123&authIndexValue=OldTree&journey=NewTree';
    await store.resume(resumeUrl);

    expect(await mod.stack.latest()).toEqual({ journey: 'NewTree' });
  });

  /**
   * IAM-12006 storage layer: start() with a journey name persists it to localStorage
   * so a later bare-suspendedId page load (suspend email link) can restart into it.
   */
  it('persists the started journey to localStorage on start', async () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });

    const step = {
      type: 'Step' as const,
      payload: { authId: 'step-auth-id' },
      callbacks: [],
      getStage: () => null,
      getCallbacksOfType: () => [],
    };
    const client = {
      start: vi.fn().mockResolvedValueOnce(step),
      next: vi.fn(),
    } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    await store.start({ journey: 'ResetPassword' });

    expect(storage.get('resume-journey')).toBe('ResetPassword');
  });

  /**
   * The stack subscription persists every mutation, including the resume push —
   * an email-link tab with empty storage remembers the suspended journey for any
   * later bare-suspendedId reload.
   */
  it('persists the resumed journey to localStorage on resume', async () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });

    const step = {
      type: 'Step' as const,
      payload: { authId: 'step-auth-id' },
      callbacks: [],
      getStage: () => null,
      getCallbacksOfType: () => [],
    };
    const client = {
      start: vi.fn().mockResolvedValue(step),
      next: vi.fn(),
      resume: vi.fn().mockResolvedValueOnce(step),
    } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    await store.resume('https://example.com/callback?suspendedId=abc123&journey=ResetPassword');

    expect(storage.get('resume-journey')).toBe('ResetPassword');
  });

  /**
   * pop() restores the previous journey as the stack top, and the subscription
   * mirrors that into localStorage — the remembered journey follows the stack,
   * not whatever start() last saw.
   */
  it('restores the previous journey in localStorage after pop', async () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });

    const step = {
      type: 'Step' as const,
      payload: { authId: 'step-auth-id' },
      callbacks: [],
      getStage: () => null,
      getCallbacksOfType: () => [],
    };
    const client = {
      start: vi.fn().mockResolvedValue(step),
      next: vi.fn(),
    } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    await store.push({ journey: 'Login' });
    await store.push({ journey: 'ResetPassword' });
    await store.pop();

    expect(storage.get('resume-journey')).toBe('Login');
    expect(await (await importSubject()).stack.latest()).toEqual({ journey: 'Login' });
  });

  /**
   * A fresh page load seeds the empty stack from localStorage, so restart paths
   * resolve the remembered journey when no start() has run in this page.
   */
  it('seeds the journey stack from localStorage on initialize', async () => {
    const storage = new Map<string, string>([['resume-journey', 'ResetPassword']]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });

    const client = { start: vi.fn(), next: vi.fn() } as unknown as JourneyClient;
    journeyMock.mockResolvedValue(client);

    const mod = await importSubject();
    mod.initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    expect(await mod.stack.latest()).toEqual({ journey: 'ResetPassword' });
  });

  /**
   * URL-derived identity (resume push) must sit on top of the seeded entry so the
   * restart uses the URL's journey, not the remembered one.
   */
  it('prefers the resume URL journey over the localStorage-seeded one', async () => {
    const storage = new Map<string, string>([['resume-journey', 'Login']]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });

    const step = {
      type: 'Step' as const,
      payload: { authId: 'step-auth-id' },
      callbacks: [],
      getStage: () => null,
      getCallbacksOfType: () => [],
    };
    const client = {
      start: vi.fn(),
      next: vi.fn(),
      resume: vi.fn().mockResolvedValueOnce(step),
    } as unknown as JourneyClient;
    journeyMock.mockResolvedValue(client);

    const mod = await importSubject();
    const store = mod.initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    await store.resume('https://example.com/callback?suspendedId=abc&journey=ResetPassword');

    expect(await mod.stack.latest()).toEqual({ journey: 'ResetPassword' });
  });

  /**
   * A completed journey must not linger as a restart target (stale state) — clear
   * the stored value on LoginSuccess, alongside stack.reset().
   */
  it('clears the stored journey on LoginSuccess', async () => {
    const storage = new Map<string, string>([['resume-journey', 'ResetPassword']]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });

    const loginSuccess = { type: 'LoginSuccess' as const, payload: { tokenId: 'abc' } };
    const client = {
      start: vi.fn().mockResolvedValueOnce(loginSuccess),
      next: vi.fn(),
    } as unknown as JourneyClient;
    journeyMock.mockResolvedValue(client);

    const mod = await importSubject();
    const store = mod.initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    await store.start({ journey: 'ResetPassword' });

    expect(storage.has('resume-journey')).toBe(false);
    expect(await mod.stack.latest()).toBeUndefined();
  });

  /**
   * The restart path can itself succeed — a failed resume whose restart lands
   * LoginSuccess. That success must clear the stack and stored journey like a
   * normal LoginSuccess, otherwise the completed journey lingers as a later
   * restart target.
   */
  it('clears the stored journey when the restarted flow succeeds', async () => {
    const storage = new Map<string, string>([['resume-journey', 'ResetPassword']]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });

    const loginSuccess = { type: 'LoginSuccess' as const, payload: { tokenId: 'abc' } };
    const loginFailure = {
      type: 'LoginFailure' as const,
      payload: { message: 'Unable to resume session. It may have expired.', detail: null },
      getCode: () => 401,
    };

    const client = {
      resume: vi.fn().mockResolvedValueOnce(loginFailure),
      start: vi.fn().mockResolvedValueOnce(loginSuccess),
      next: vi.fn(),
    } as unknown as JourneyClient;
    journeyMock.mockResolvedValue(client);

    // initializeStack() assigns the module stack during initialize(), so read it
    // off the module object after that call.
    const mod = await importSubject();
    const { journeyStore, initialize } = mod;
    const store = initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    await store.resume('https://example.com/callback?suspendedId=abc123&journey=ResetPassword');

    expect(storage.has('resume-journey')).toBe(false);
    expect(await mod.stack.latest()).toBeUndefined();
    const { get } = await import('svelte/store');
    expect(get(journeyStore).successful).toBe(true);
  });

  /**
   * A start with an empty journey name (plain visit to "/" with no ?journey= param)
   * still pushes its entry — the restart must replay the same visit, query included —
   * but the persistence layer skips falsy journeys, so the remembered journey survives.
   */
  it('keeps the stored journey when start is called with an empty journey', async () => {
    const storage = new Map<string, string>([['resume-journey', 'ResetPassword']]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });

    const step = {
      type: 'Step' as const,
      payload: { authId: 'step-auth-id' },
      callbacks: [],
      getStage: () => null,
      getCallbacksOfType: () => [],
    };
    const client = {
      start: vi.fn().mockResolvedValueOnce(step),
      next: vi.fn(),
    } as unknown as JourneyClient;
    journeyMock.mockResolvedValue(client);

    const mod = await importSubject();
    const store = mod.initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    await store.start({ journey: '', query: { noSession: 'false' } });

    // The remembered journey is not erased by the journey-less start.
    expect(storage.get('resume-journey')).toBe('ResetPassword');
    // The visit entry sits on top of the seed so a restart replays it.
    expect(await mod.stack.latest()).toEqual({ journey: '', query: { noSession: 'false' } });
  });

  /**
   * Storage failures (SSR, private mode, blocked storage) must never crash the
   * journey flow — persistence is best-effort.
   */
  it('does not throw when localStorage access fails', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    });

    const step = {
      type: 'Step' as const,
      payload: { authId: 'step-auth-id' },
      callbacks: [],
      getStage: () => null,
      getCallbacksOfType: () => [],
    };
    const client = {
      start: vi.fn().mockResolvedValueOnce(step),
      next: vi.fn(),
    } as unknown as JourneyClient;
    journeyMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    await expect(store.start({ journey: 'ResetPassword' })).resolves.not.toThrow();
  });

  /**
   * IAM-12006 default-journey fallback: with an empty stack and a configured fallback,
   * the restart after a failed resume targets the configured journey — the last-resort
   * layer for fresh-device bare-suspendedId links. start(undefined) is never called.
   */
  it('restarts into the configured fallback journey when the stack is empty', async () => {
    const loginFailure = {
      type: 'LoginFailure' as const,
      payload: { message: 'Unable to resume session. It may have expired.', detail: null },
      getCode: () => 401,
    };
    const restartedStep = {
      type: 'Step' as const,
      payload: { authId: 'fresh-auth-id' },
      callbacks: [],
      getStage: () => null,
      getCallbacksOfType: () => [],
    };

    const client = {
      resume: vi.fn().mockResolvedValueOnce(loginFailure),
      start: vi.fn().mockResolvedValueOnce(restartedStep),
      next: vi.fn(),
    } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    const { fallbackJourneyStore, initialize } = await importSubject();
    const store = initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });
    fallbackJourneyStore.set('DefaultTree');

    await store.resume('https://example.com/callback?suspendedId=abc123');

    expect(client.start).toHaveBeenCalledWith({ journey: 'DefaultTree' });
  });

  /**
   * Without a configured fallback, an empty-stack restart keeps the pre-existing
   * behavior (start(undefined)) — the fallback layer must not change unconfigured
   * hosts' behavior.
   */
  it('restarts with undefined when the stack is empty and no fallback is configured', async () => {
    const loginFailure = {
      type: 'LoginFailure' as const,
      payload: { message: 'Unable to resume session. It may have expired.', detail: null },
      getCode: () => 401,
    };
    const restartedStep = {
      type: 'Step' as const,
      payload: { authId: 'fresh-auth-id' },
      callbacks: [],
      getStage: () => null,
      getCallbacksOfType: () => [],
    };

    const client = {
      resume: vi.fn().mockResolvedValueOnce(loginFailure),
      start: vi.fn().mockResolvedValueOnce(restartedStep),
      next: vi.fn(),
    } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    const { fallbackJourneyStore, initialize } = await importSubject();
    const store = initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });
    fallbackJourneyStore.set(undefined);

    await store.resume('https://example.com/callback?suspendedId=abc123');

    expect(client.start).toHaveBeenCalledWith(undefined);
  });

  /**
   * The default is a LAST resort: a populated stack (URL push or WebStorage seed)
   * must win over the configured fallback.
   */
  it('prefers the stack entry over the configured fallback', async () => {
    const loginFailure = {
      type: 'LoginFailure' as const,
      payload: { message: 'Unable to resume session. It may have expired.', detail: null },
      getCode: () => 401,
    };
    const restartedStep = {
      type: 'Step' as const,
      payload: { authId: 'fresh-auth-id' },
      callbacks: [],
      getStage: () => null,
      getCallbacksOfType: () => [],
    };

    const client = {
      resume: vi.fn().mockResolvedValueOnce(loginFailure),
      start: vi.fn().mockResolvedValueOnce(restartedStep),
      next: vi.fn(),
    } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    const { fallbackJourneyStore, initialize } = await importSubject();
    const store = initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });
    fallbackJourneyStore.set('DefaultTree');

    await store.resume('https://example.com/callback?suspendedId=abc123&journey=UrlTree');

    expect(client.start).toHaveBeenCalledWith({ journey: 'UrlTree' });
  });

  /**
   * fallbackJourneyStore holds the host-configured last-resort restart target. The UI's
   * start-over action (journey.svelte) combines it with stack.latest() to apply the
   * fallback chain: stack -> configured fallback -> undefined.
   */
  it('fallbackJourneyStore round-trips the configured value', async () => {
    const { fallbackJourneyStore } = await importSubject();

    const { get } = await import('svelte/store');
    expect(get(fallbackJourneyStore)).toBeUndefined();
    fallbackJourneyStore.set('SomeTree');
    expect(get(fallbackJourneyStore)).toBe('SomeTree');
    fallbackJourneyStore.set(undefined);
    expect(get(fallbackJourneyStore)).toBeUndefined();
  });

  /**
   * A failed resume (LoginFailure from an expired suspendedId) must restart into the
   * journey the URL carried — not start(undefined). Proves the stack push feeds the
   * automatic restart path, which is the user-visible bug from IAM-12006.
   */
  it('restarts into the URL journey after a failed resume instead of start(undefined)', async () => {
    const loginFailure = {
      type: 'LoginFailure' as const,
      payload: { message: 'Unable to resume session. It may have expired.', detail: null },
      getCode: () => 401,
    };
    const restartedStep = {
      type: 'Step' as const,
      payload: { authId: 'fresh-auth-id' },
      callbacks: [],
      getStage: () => null,
      getCallbacksOfType: () => [],
    };

    const client = {
      resume: vi.fn().mockResolvedValueOnce(loginFailure),
      start: vi.fn().mockResolvedValueOnce(restartedStep),
      next: vi.fn(),
    } as unknown as JourneyClient;

    journeyMock.mockResolvedValue(client);

    const { initialize } = await importSubject();
    const store = initialize({
      serverConfig: {
        wellknown: 'https://example.com/.well-known/openid-configuration',
      },
    });

    const resumeUrl = 'https://example.com/callback?suspendedId=abc123&journey=ResetPassword';
    await store.resume(resumeUrl);

    expect(client.start).toHaveBeenCalledWith({ journey: 'ResetPassword' });
  });
});

describe('journey.store — journeyClientConfigSchema', () => {
  const wellknown = 'https://example.com/.well-known/openid-configuration';

  beforeEach(() => {
    vi.resetModules();
  });

  it('parses a minimal config (serverConfig.wellknown only)', async () => {
    const { journeyClientConfigSchema } = await importSubject();

    const parsed = journeyClientConfigSchema.parse({ serverConfig: { wellknown } });

    expect(parsed.serverConfig.wellknown).toBe(wellknown);
  });

  it('rejects the removed `log` option (strict)', async () => {
    const { journeyClientConfigSchema } = await importSubject();

    expect(() =>
      journeyClientConfigSchema.parse({ serverConfig: { wellknown }, log: 'warn' }),
    ).toThrow();
  });

  // Guards against silent config drift: a new option we forget to add here would
  // be an unknown key, and `.strict()` makes that a hard parse error.
  it('rejects an unknown top-level key (strict)', async () => {
    const { journeyClientConfigSchema } = await importSubject();

    expect(() =>
      journeyClientConfigSchema.parse({ serverConfig: { wellknown }, notARealOption: true }),
    ).toThrow();
  });

  it('rejects an unknown serverConfig key (e.g. timeout, which journey-client ignores)', async () => {
    const { journeyClientConfigSchema } = await importSubject();

    expect(() =>
      journeyClientConfigSchema.parse({ serverConfig: { wellknown, timeout: 3000 } }),
    ).toThrow();
  });
});
