// IAM-12011 — the protect stub must expose the whole client surface that
// core/protect/protect.store.ts calls on the object returned by `protect()`:
// start, getData, pauseBehavioralData, resumeBehavioralData. Missing methods
// made the ping-protect-evaluation callback demo fail with
// "protectClient.resumeBehavioralData is not a function".
import { describe, expect, it } from 'vitest';

import { protect } from './protect-stub';

describe('protect stub (IAM-12011)', () => {
  it('exposes every method the protect store calls', () => {
    const client = protect({ envId: 'preview' });

    expect(typeof client.start).toBe('function');
    expect(typeof client.getData).toBe('function');
    expect(typeof client.pauseBehavioralData).toBe('function');
    expect(typeof client.resumeBehavioralData).toBe('function');
  });

  it('start resolves without a network call', async () => {
    await expect(protect({ envId: 'preview' }).start()).resolves.toBeUndefined();
  });

  it('getData resolves device data as a string, not an error object', async () => {
    const data = await protect({ envId: 'preview' }).getData();

    expect(typeof data).toBe('string');
    expect(data).not.toBe('');
  });

  it('pause and resume return no error', () => {
    const client = protect({ envId: 'preview' });

    expect(client.pauseBehavioralData()).toBeUndefined();
    expect(client.resumeBehavioralData()).toBeUndefined();
  });
});
