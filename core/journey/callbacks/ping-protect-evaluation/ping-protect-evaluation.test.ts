/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

// @vitest-environment happy-dom

import { mount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PingProtectEvaluation from './ping-protect-evaluation.svelte';

vi.mock('@forgerock/ping-protect', () => ({
  PIProtect: {
    getData: vi.fn(),
    pauseBehavioralData: vi.fn(),
    resumeBehavioralData: vi.fn(),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

function mountComponent(props: Record<string, unknown>) {
  const target = document.createElement('div');
  document.body.appendChild(target);
  mount(PingProtectEvaluation, { target, props });
  return { target };
}

describe('PingProtectEvaluation', () => {
  it('captures data from PIProtect.getData() and passes it to callback.setData()', async () => {
    const { PIProtect } = await import('@forgerock/ping-protect');
    const mockData = { behavioralData: 'test-signal-data' };
    vi.mocked(PIProtect.getData).mockResolvedValue(mockData);

    const callback = { setData: vi.fn(), setClientError: vi.fn() };
    mountComponent({ callback, selfSubmitFunction: null, pingProtect: { envId: '' } });

    await vi.waitFor(() => {
      expect(callback.setData).toHaveBeenCalledWith(mockData);
    });
    expect(callback.setClientError).not.toHaveBeenCalled();
  });

  it('calls callback.setClientError() when PIProtect.getData() throws an Error', async () => {
    const { PIProtect } = await import('@forgerock/ping-protect');
    vi.mocked(PIProtect.getData).mockRejectedValue(new Error('network failure'));

    const callback = { setData: vi.fn(), setClientError: vi.fn() };
    mountComponent({ callback, selfSubmitFunction: null, pingProtect: { envId: '' } });

    await vi.waitFor(() => {
      expect(callback.setClientError).toHaveBeenCalledWith('network failure');
    });
    expect(callback.setData).not.toHaveBeenCalled();
  });

  it('calls callback.setClientError() with fallback message for non-Error throws', async () => {
    const { PIProtect } = await import('@forgerock/ping-protect');
    vi.mocked(PIProtect.getData).mockRejectedValue('unexpected string');

    const callback = { setData: vi.fn(), setClientError: vi.fn() };
    mountComponent({ callback, selfSubmitFunction: null, pingProtect: { envId: '' } });

    await vi.waitFor(() => {
      expect(callback.setClientError).toHaveBeenCalledWith(
        'An error occurred while initializing PingProtect',
      );
    });
    expect(callback.setData).not.toHaveBeenCalled();
  });

  it('calls selfSubmitFunction after setData succeeds', async () => {
    const { PIProtect } = await import('@forgerock/ping-protect');
    vi.mocked(PIProtect.getData).mockResolvedValue({ behavioralData: 'data' });

    const callback = { setData: vi.fn(), setClientError: vi.fn() };
    const selfSubmitFunction = vi.fn();
    mountComponent({ callback, selfSubmitFunction, pingProtect: { envId: '' } });

    await vi.waitFor(() => {
      expect(selfSubmitFunction).toHaveBeenCalled();
    });
    expect(callback.setData).toHaveBeenCalledBefore(selfSubmitFunction);
  });
});
