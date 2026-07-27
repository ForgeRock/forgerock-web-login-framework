/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { beforeEach, describe, expect, it, vi } from 'vitest';

const protectMock = vi.fn();

vi.mock('@forgerock/protect', async (importOriginal: () => Promise<Record<string, unknown>>) => {
  const actual = await importOriginal();
  return {
    ...actual,
    protect: protectMock,
  };
});

function makeProtectClient() {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    getData: vi.fn().mockResolvedValue('device-data-string'),
    pauseBehavioralData: vi.fn().mockReturnValue(undefined),
    resumeBehavioralData: vi.fn().mockReturnValue(undefined),
  };
}

async function importSubject() {
  return import('./protect.store');
}

describe('protect.store — Zod validation', () => {
  beforeEach(() => {
    protectMock.mockReset();
    vi.resetModules();
  });

  it('throws a ZodError when envId is present but undefined', async () => {
    const { start } = await importSubject();
    // The key must be present to enter the Zod validation branch ('envId' in config).
    // Passing undefined as the value triggers the "required" error message.
    await expect(() => start({ envId: undefined } as unknown as { envId: string })).toThrow(
      /envId/i,
    );
  });

  it('throws a ZodError when an unrecognized key is passed (strict schema)', async () => {
    const { start } = await importSubject();
    await expect(() =>
      start({ envId: 'abc', unknownKey: true } as unknown as { envId: string }),
    ).toThrow();
  });

  it('passes through SignalsInitializationOptions (no envId) without Zod validation', async () => {
    const client = makeProtectClient();
    protectMock.mockReturnValue(client);

    const { start } = await importSubject();
    // SignalsInitializationOptions has no envId — a plain Record<string, string>
    await start({ someKey: 'someValue' });

    expect(protectMock).toHaveBeenCalledWith({ someKey: 'someValue' });
  });

  it('validates and accepts a valid ProtectConfig', async () => {
    const client = makeProtectClient();
    protectMock.mockReturnValue(client);

    const { start } = await importSubject();
    await expect(start({ envId: 'my-env-id' })).resolves.toBeUndefined();

    expect(protectMock).toHaveBeenCalledWith(expect.objectContaining({ envId: 'my-env-id' }));
  });
});

describe('protect.store — uninitialized guards', () => {
  beforeEach(() => {
    protectMock.mockReset();
    vi.resetModules();
  });

  it('getData() returns an error object when called before start()', async () => {
    const { getData } = await importSubject();
    const result = await getData();
    expect(result).toEqual({ error: 'PingOne Signals SDK is not initialized' });
  });

  it('pauseBehavioralData() returns an error object when called before start()', async () => {
    const { pauseBehavioralData } = await importSubject();
    const result = pauseBehavioralData();
    expect(result).toEqual({ error: 'PingOne Signals SDK is not initialized' });
  });

  it('resumeBehavioralData() returns an error object when called before start()', async () => {
    const { resumeBehavioralData } = await importSubject();
    const result = resumeBehavioralData();
    expect(result).toEqual({ error: 'PingOne Signals SDK is not initialized' });
  });
});

describe('protect.store — delegation', () => {
  beforeEach(() => {
    protectMock.mockReset();
    vi.resetModules();
  });

  it('start() delegates to protectClient.start()', async () => {
    const client = makeProtectClient();
    protectMock.mockReturnValue(client);

    const { start } = await importSubject();
    await start({ envId: 'my-env-id' });

    expect(client.start).toHaveBeenCalledTimes(1);
  });

  it('getData() delegates to protectClient.getData() after start()', async () => {
    const client = makeProtectClient();
    protectMock.mockReturnValue(client);

    const { start, getData } = await importSubject();
    await start({ envId: 'my-env-id' });
    const result = await getData();

    expect(client.getData).toHaveBeenCalledTimes(1);
    expect(result).toBe('device-data-string');
  });

  it('pauseBehavioralData() delegates to protectClient.pauseBehavioralData() after start()', async () => {
    const client = makeProtectClient();
    protectMock.mockReturnValue(client);

    const { start, pauseBehavioralData } = await importSubject();
    await start({ envId: 'my-env-id' });
    pauseBehavioralData();

    expect(client.pauseBehavioralData).toHaveBeenCalledTimes(1);
  });

  it('resumeBehavioralData() delegates to protectClient.resumeBehavioralData() after start()', async () => {
    const client = makeProtectClient();
    protectMock.mockReturnValue(client);

    const { start, resumeBehavioralData } = await importSubject();
    await start({ envId: 'my-env-id' });
    resumeBehavioralData();

    expect(client.resumeBehavioralData).toHaveBeenCalledTimes(1);
  });

  it('start() replaces the protectClient on a second call', async () => {
    const client1 = makeProtectClient();
    const client2 = makeProtectClient();
    protectMock.mockReturnValueOnce(client1).mockReturnValueOnce(client2);

    const { start, getData } = await importSubject();
    await start({ envId: 'first-env-id' });
    await start({ envId: 'second-env-id' });
    await getData();

    expect(client1.getData).not.toHaveBeenCalled();
    expect(client2.getData).toHaveBeenCalledTimes(1);
  });
});
