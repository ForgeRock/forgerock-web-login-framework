/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { get } from 'svelte/store';
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
  const mod = await import('./protect.store');
  return mod.protectStore;
}

describe('protect.store — Zod validation', () => {
  beforeEach(() => {
    protectMock.mockReset();
    vi.resetModules();
  });

  it('throws a ZodError when envId is present but undefined', async () => {
    const store = await importSubject();
    await expect(() => store.start({ envId: undefined } as unknown as { envId: string })).toThrow(
      /envId/i,
    );
  });

  it('throws a ZodError when an unrecognized key is passed (strict schema)', async () => {
    const store = await importSubject();
    await expect(() =>
      store.start({ envId: 'abc', unknownKey: true } as unknown as { envId: string }),
    ).toThrow();
  });

  it('passes through SignalsInitializationOptions (no envId) without Zod validation', async () => {
    const client = makeProtectClient();
    protectMock.mockReturnValue(client);

    const store = await importSubject();
    await store.start({ someKey: 'someValue' });

    expect(protectMock).toHaveBeenCalledWith({ someKey: 'someValue' });
  });

  it('validates and accepts a valid ProtectConfig', async () => {
    const client = makeProtectClient();
    protectMock.mockReturnValue(client);

    const store = await importSubject();
    await expect(store.start({ envId: 'my-env-id' })).resolves.toBeUndefined();

    expect(protectMock).toHaveBeenCalledWith(expect.objectContaining({ envId: 'my-env-id' }));
  });
});

describe('protect.store — uninitialized guards', () => {
  beforeEach(() => {
    protectMock.mockReset();
    vi.resetModules();
  });

  it('getData() returns an error object when called before start()', async () => {
    const store = await importSubject();
    const result = await store.getData();
    expect(result).toEqual({ error: 'PingOne Signals SDK is not initialized' });
  });

  it('pauseBehavioralData() returns an error object when called before start()', async () => {
    const store = await importSubject();
    const result = store.pauseBehavioralData();
    expect(result).toEqual({ error: 'PingOne Signals SDK is not initialized' });
  });

  it('resumeBehavioralData() returns an error object when called before start()', async () => {
    const store = await importSubject();
    const result = store.resumeBehavioralData();
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

    const store = await importSubject();
    await store.start({ envId: 'my-env-id' });

    expect(client.start).toHaveBeenCalledTimes(1);
  });

  it('getData() delegates to protectClient.getData() after start()', async () => {
    const client = makeProtectClient();
    protectMock.mockReturnValue(client);

    const store = await importSubject();
    await store.start({ envId: 'my-env-id' });
    const result = await store.getData();

    expect(client.getData).toHaveBeenCalledTimes(1);
    expect(result).toBe('device-data-string');
  });

  it('pauseBehavioralData() delegates to protectClient.pauseBehavioralData() after start()', async () => {
    const client = makeProtectClient();
    protectMock.mockReturnValue(client);

    const store = await importSubject();
    await store.start({ envId: 'my-env-id' });
    store.pauseBehavioralData();

    expect(client.pauseBehavioralData).toHaveBeenCalledTimes(1);
  });

  it('resumeBehavioralData() delegates to protectClient.resumeBehavioralData() after start()', async () => {
    const client = makeProtectClient();
    protectMock.mockReturnValue(client);

    const store = await importSubject();
    await store.start({ envId: 'my-env-id' });
    store.resumeBehavioralData();

    expect(client.resumeBehavioralData).toHaveBeenCalledTimes(1);
  });

  it('start() replaces the protectClient on a second call', async () => {
    const client1 = makeProtectClient();
    const client2 = makeProtectClient();
    protectMock.mockReturnValueOnce(client1).mockReturnValueOnce(client2);

    const store = await importSubject();
    await store.start({ envId: 'first-env-id' });
    await store.start({ envId: 'second-env-id' });
    await store.getData();

    expect(client1.getData).not.toHaveBeenCalled();
    expect(client2.getData).toHaveBeenCalledTimes(1);
  });
});

describe('protect.store — Svelte store contract', () => {
  beforeEach(() => {
    protectMock.mockReset();
    vi.resetModules();
  });

  it('subscribe() is null before start()', async () => {
    const { protectStore: store } = await import('./protect.store');
    expect(get(store)).toBeNull();
  });

  it('subscribe() holds the protect client after start()', async () => {
    const client = makeProtectClient();
    protectMock.mockReturnValue(client);

    const { protectStore: store } = await import('./protect.store');
    await store.start({ envId: 'my-env-id' });

    expect(get(store)).toBe(client);
  });
});
