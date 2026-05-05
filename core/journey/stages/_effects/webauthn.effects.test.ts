/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

/**
 * We need these heavily mocked tests because playwright e2e tests cannot test autofill passkey.
 * This is because passkey dropdown is a browser feature not available to DOM.
 * CDP virtual authenticators have support for normal autofill like address and forms, but not for autofill passkey.
 * So the closest we can get to e2e test is by integration tests here where we mock the journey but use real webauthn functions.
 * We have e2e tests under widget modal and inline test.
 * But the extent of those is only checking whether the autofill attribute is visible. Unable to complete the flow by clicking on that passkey dropdown.
 * So combining those e2e with this integration test is the best for autofill passkey.
 */

import { callbackType } from '@forgerock/journey-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import {
  createMixedLoginWebAuthnStep,
  liveMixedLoginWebAuthnStep,
} from '$journey/stages/mfa-stages.mock';
import { usernamePasswordStep } from '$journey/stages/step.mock';
import {
  authenticateWebAuthnAutofill,
  isConditionalMediationSupported,
  setupPasskeyAutofill,
} from './webauthn.effects';

import type { JourneyStep } from '@forgerock/journey-client/types';

import type { JourneyStore, JourneyStoreValue } from '$journey/journey.interfaces';

function toArrayBuffer(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

function createMockCredential(options?: {
  id?: string;
  authenticatorAttachment?: string | null;
}): PublicKeyCredential {
  const id = options?.id ?? 'cred-id';
  const authenticatorAttachment = options?.authenticatorAttachment ?? 'platform';

  return {
    id,
    authenticatorAttachment,
    response: {
      clientDataJSON: toArrayBuffer('clientData'),
      authenticatorData: toArrayBuffer('authData'),
      signature: toArrayBuffer('signature'),
      // Journey Client assumes userHandle exists and is an ArrayBuffer
      userHandle: toArrayBuffer(''),
    },
  } as unknown as PublicKeyCredential;
}

function getWebAuthnOutcomeValue(step: JourneyStep): string | undefined {
  const hidden = step
    .getCallbacksOfType(callbackType.HiddenValueCallback)
    .find((cb) => (cb.getOutputByName('id', '') as string) === 'webAuthnOutcome');

  const value = hidden?.getInputValue();
  return typeof value === 'string' ? value : undefined;
}

function createMockJourneyStore() {
  let subscriber: ((value: JourneyStoreValue) => void) | null = null;
  const unsubscribe = vi.fn();

  const journeyStore: JourneyStore = {
    subscribe(run) {
      subscriber = run;
      return unsubscribe;
    },
    async next(_prevStep: JourneyStep) {
      return;
    },
    async pop() {
      return;
    },
    async push(_changeOptions) {
      return;
    },
    reset() {
      return;
    },
    async resume(_url) {
      return;
    },
    async start() {
      return;
    },
    redirect: function (_step: JourneyStep): Promise<void> {
      throw new Error('Function not implemented.');
    },
  };

  const nextSpy = vi.spyOn(journeyStore, 'next');

  function emitStep(step: JourneyStoreValue['step']): void {
    subscriber?.({
      completed: false,
      error: null,
      loading: false,
      metadata: null,
      step,
      successful: false,
      response: null,
    });
  }

  return { emitStep, journeyStore, nextSpy, unsubscribe };
}

function stubWindow(value: unknown): void {
  vi.stubGlobal('window', value as unknown as Window & typeof globalThis);
}

function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function waitFor(condition: () => boolean): Promise<void> {
  for (let i = 0; i < 25; i++) {
    if (condition()) return;
    await flushPromises();
  }
  throw new Error('Timed out waiting for condition');
}

beforeEach(() => {
  vi.spyOn(console, 'debug').mockImplementation(() => {});

  if (typeof atob === 'undefined') {
    vi.stubGlobal('atob', (input: string) => Buffer.from(input, 'base64').toString('binary'));
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('isConditionalMediationSupported', () => {
  it('returns false when window is undefined', async () => {
    await expect(isConditionalMediationSupported(createMixedLoginWebAuthnStep())).resolves.toBe(
      false,
    );
  });

  it('returns false when step is not eligible', async () => {
    const isConditionalMediationAvailable = vi.fn().mockResolvedValue(true);
    stubWindow({
      PublicKeyCredential: { isConditionalMediationAvailable },
      navigator: { credentials: { get: vi.fn() } },
    });

    await expect(isConditionalMediationSupported(null)).resolves.toBe(false);
  });

  it('returns false when conditional mediation API is missing', async () => {
    stubWindow({
      PublicKeyCredential: {},
      navigator: { credentials: { get: vi.fn() } },
    });

    await expect(isConditionalMediationSupported(createMixedLoginWebAuthnStep())).resolves.toBe(
      false,
    );
  });

  it('returns false when isConditionalMediationAvailable rejects', async () => {
    const isConditionalMediationAvailable = vi.fn().mockRejectedValue(new Error('nope'));
    stubWindow({
      PublicKeyCredential: { isConditionalMediationAvailable },
      navigator: { credentials: { get: vi.fn() } },
    });

    await expect(isConditionalMediationSupported(createMixedLoginWebAuthnStep())).resolves.toBe(
      false,
    );
  });

  it('returns true when conditional mediation is available', async () => {
    const isConditionalMediationAvailable = vi.fn().mockResolvedValue(true);
    stubWindow({
      PublicKeyCredential: { isConditionalMediationAvailable },
      navigator: { credentials: { get: vi.fn() } },
    });

    await expect(isConditionalMediationSupported(createMixedLoginWebAuthnStep())).resolves.toBe(
      true,
    );
  });
});

describe('authenticateWebAuthnAutofill', () => {
  it('requests a credential using conditional mediation and writes an outcome', async () => {
    const get = vi.fn().mockResolvedValue(createMockCredential({ id: 'cred-auth' }));
    stubWindow({ navigator: { credentials: { get } } });

    const step = createMixedLoginWebAuthnStep();
    await expect(authenticateWebAuthnAutofill(step, new AbortController())).resolves.toBe(step);

    expect(get).toHaveBeenCalledWith(
      expect.objectContaining({
        mediation: 'conditional',
        publicKey: expect.any(Object),
        signal: expect.any(Object),
      }),
    );

    const outcome = getWebAuthnOutcomeValue(step);
    expect(outcome).toContain('cred-auth');
  });

  it('throws when called without an AbortController', async () => {
    await expect(authenticateWebAuthnAutofill(createMixedLoginWebAuthnStep())).rejects.toThrow(
      'AbortController is required for conditional mediation WebAuthn requests',
    );
  });

  it('throws when WebAuthn callbacks are missing', async () => {
    await expect(
      authenticateWebAuthnAutofill(createJourneyStep(usernamePasswordStep), new AbortController()),
    ).rejects.toThrow('Incorrect callbacks for WebAuthn authentication');
  });

  it('writes a JSON payload when supportsJsonResponse is true and authenticatorAttachment exists', async () => {
    const get = vi
      .fn()
      .mockResolvedValue(
        createMockCredential({ id: 'cred-json', authenticatorAttachment: 'platform' }),
      );
    stubWindow({ navigator: { credentials: { get } } });

    const step = createJourneyStep(liveMixedLoginWebAuthnStep);
    await authenticateWebAuthnAutofill(step, new AbortController());

    expect(get).toHaveBeenCalledWith(
      expect.objectContaining({
        mediation: 'conditional',
        publicKey: expect.any(Object),
        signal: expect.any(Object),
      }),
    );

    const hiddenValue = getWebAuthnOutcomeValue(step);
    expect(hiddenValue).toBeTruthy();

    const parsed = JSON.parse(hiddenValue as string) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      authenticatorAttachment: 'platform',
    });
    expect(typeof parsed.legacyData).toBe('string');
  });

  it('writes the legacy outcome when supportsJsonResponse is false', async () => {
    const get = vi.fn().mockResolvedValue(createMockCredential({ id: 'cred-legacy' }));
    stubWindow({ navigator: { credentials: { get } } });
    const step = createMixedLoginWebAuthnStep();

    await authenticateWebAuthnAutofill(step, new AbortController());

    const hiddenValue = getWebAuthnOutcomeValue(step);
    expect(hiddenValue).toContain('cred-legacy');
  });
});

describe('setupPasskeyAutofill', () => {
  it('advances the journey when a step is eligible', async () => {
    const isConditionalMediationAvailable = vi.fn().mockResolvedValue(true);
    const get = vi.fn().mockResolvedValue(createMockCredential({ id: 'cred-next' }));

    stubWindow({
      PublicKeyCredential: { isConditionalMediationAvailable },
      navigator: { credentials: { get } },
    });

    const { emitStep, journeyStore, nextSpy } = createMockJourneyStore();
    const step = createMixedLoginWebAuthnStep('auth-a');

    setupPasskeyAutofill(journeyStore);
    emitStep(step);

    await waitFor(() => nextSpy.mock.calls.length === 1);
    expect(nextSpy).toHaveBeenCalledWith(step);
    expect(getWebAuthnOutcomeValue(step)).toContain('cred-next');
  });

  it('does not re-attempt for the same authId', async () => {
    const isConditionalMediationAvailable = vi.fn().mockResolvedValue(true);
    const get = vi.fn().mockResolvedValue(createMockCredential({ id: 'cred-once' }));

    stubWindow({
      PublicKeyCredential: { isConditionalMediationAvailable },
      navigator: { credentials: { get } },
    });

    const { emitStep, journeyStore, nextSpy } = createMockJourneyStore();
    const step = createMixedLoginWebAuthnStep('auth-a');

    setupPasskeyAutofill(journeyStore);

    emitStep(step);
    await waitFor(() => nextSpy.mock.calls.length === 1);

    emitStep(step);
    await flushPromises();

    expect(get).toHaveBeenCalledTimes(1);
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  it('aborts an in-flight request when authId changes', async () => {
    const isConditionalMediationAvailable = vi.fn().mockResolvedValue(true);

    const pending: Array<{
      signal: AbortSignal;
      resolve: (value: unknown) => void;
      reject: (err: unknown) => void;
    }> = [];

    const get = vi.fn().mockImplementation(({ signal }: { signal: AbortSignal }) => {
      return new Promise((resolve, reject) => {
        pending.push({ signal, resolve, reject });
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    });

    stubWindow({
      PublicKeyCredential: { isConditionalMediationAvailable },
      navigator: { credentials: { get } },
    });

    const { emitStep, journeyStore, nextSpy } = createMockJourneyStore();
    const stepA = createMixedLoginWebAuthnStep('auth-a');
    const stepB = createMixedLoginWebAuthnStep('auth-b');

    setupPasskeyAutofill(journeyStore);

    emitStep(stepA);
    await waitFor(() => pending.length === 1);

    expect(pending[0].signal.aborted).toBe(false);

    emitStep(stepB);
    await waitFor(() => pending.length === 2);

    expect(pending[0].signal.aborted).toBe(true);

    pending[1].resolve(createMockCredential({ id: 'cred-step-b' }));
    await waitFor(() => nextSpy.mock.calls.length === 1);
    expect(nextSpy).toHaveBeenCalledWith(stepB);
  });

  it('destroy unsubscribes and aborts in-flight requests', async () => {
    const isConditionalMediationAvailable = vi.fn().mockResolvedValue(true);

    const pending: Array<{
      signal: AbortSignal;
      resolve: (value: unknown) => void;
      reject: (err: unknown) => void;
    }> = [];

    const get = vi.fn().mockImplementation(({ signal }: { signal: AbortSignal }) => {
      return new Promise((resolve, reject) => {
        pending.push({ signal, resolve, reject });
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    });

    stubWindow({
      PublicKeyCredential: { isConditionalMediationAvailable },
      navigator: { credentials: { get } },
    });

    const mockJourneyStore = createMockJourneyStore();
    const controls = setupPasskeyAutofill(mockJourneyStore.journeyStore);
    const step = createMixedLoginWebAuthnStep('auth-a');

    mockJourneyStore.emitStep(step);

    await waitFor(() => pending.length === 1);

    controls.destroy();
    await flushPromises();

    expect(mockJourneyStore.unsubscribe).toHaveBeenCalledTimes(1);
    expect(pending[0].signal.aborted).toBe(true);
  });
});
