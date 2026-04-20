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

vi.mock('@forgerock/journey-client', () => {
  return {
    journey: journeyMock,
  };
});

async function importSubject() {
  const mod = await import('./journey-client.config');
  return mod;
}

describe('journey-client.config', () => {
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

    expect(config.serverConfig.wellknown).toBe(
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
});
