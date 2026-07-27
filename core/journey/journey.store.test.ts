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
});
