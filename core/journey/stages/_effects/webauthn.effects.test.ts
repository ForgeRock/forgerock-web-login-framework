/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { JourneyStep } from '@forgerock/journey-client/types';

import type { JourneyStore, JourneyStoreValue } from '$journey/journey.interfaces';
import { createMixedLoginWebAuthnStep } from '$journey/stages/mfa-stages.mock';

const webAuthnMock = vi.hoisted(() => ({
  authenticate: vi.fn(),
  getCallbacks: vi.fn(),
  getWebAuthnStepType: vi.fn(),
  createAuthenticationPublicKey: vi.fn(),
  getAuthenticationOutcome: vi.fn(),
}));

vi.mock('@forgerock/journey-client/webauthn', () => ({
  WebAuthn: webAuthnMock,
  WebAuthnStepType: {
    Authentication: 'Authentication',
  },
}));

import {
  authenticateWebAuthnStep,
  setupPasskeyAutofill,
  shouldAttemptPasskeyAutofill,
} from './webauthn.effects';

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

  webAuthnMock.authenticate.mockReset();
  webAuthnMock.getCallbacks.mockReset();
  webAuthnMock.getWebAuthnStepType.mockReset();
  webAuthnMock.createAuthenticationPublicKey.mockReset();
  webAuthnMock.getAuthenticationOutcome.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('shouldAttemptPasskeyAutofill', () => {
  it('returns false when window is undefined', async () => {
    await expect(shouldAttemptPasskeyAutofill(createMixedLoginWebAuthnStep())).resolves.toBe(false);
  });

  it('returns false when step is not eligible', async () => {
    const isConditionalMediationAvailable = vi.fn().mockResolvedValue(true);
    stubWindow({
      PublicKeyCredential: { isConditionalMediationAvailable },
      navigator: { credentials: { get: vi.fn() } },
    });

    await expect(shouldAttemptPasskeyAutofill(null)).resolves.toBe(false);
  });

  it('returns false when conditional mediation API is missing', async () => {
    stubWindow({
      PublicKeyCredential: {},
      navigator: { credentials: { get: vi.fn() } },
    });

    await expect(shouldAttemptPasskeyAutofill(createMixedLoginWebAuthnStep())).resolves.toBe(false);
  });

  it('returns false when isConditionalMediationAvailable rejects', async () => {
    const isConditionalMediationAvailable = vi.fn().mockRejectedValue(new Error('nope'));
    stubWindow({
      PublicKeyCredential: { isConditionalMediationAvailable },
      navigator: { credentials: { get: vi.fn() } },
    });

    await expect(shouldAttemptPasskeyAutofill(createMixedLoginWebAuthnStep())).resolves.toBe(false);
  });

  it('returns true when conditional mediation is available', async () => {
    const isConditionalMediationAvailable = vi.fn().mockResolvedValue(true);
    stubWindow({
      PublicKeyCredential: { isConditionalMediationAvailable },
      navigator: { credentials: { get: vi.fn() } },
    });

    await expect(shouldAttemptPasskeyAutofill(createMixedLoginWebAuthnStep())).resolves.toBe(true);
  });
});

describe('authenticateWebAuthnStep', () => {
  it('delegates to WebAuthn.authenticate when conditional mediation is not requested', async () => {
    const step = createMixedLoginWebAuthnStep();
    webAuthnMock.authenticate.mockResolvedValue(step);

    await expect(authenticateWebAuthnStep(step, false)).resolves.toBe(step);
    expect(webAuthnMock.authenticate).toHaveBeenCalledWith(step);
  });

  it('throws when conditional mediation is requested without AbortController', async () => {
    await expect(authenticateWebAuthnStep(createMixedLoginWebAuthnStep(), true)).rejects.toThrow(
      'AbortController is required for conditional mediation WebAuthn requests',
    );
  });

  it('throws when WebAuthn callbacks are missing', async () => {
    webAuthnMock.getCallbacks.mockReturnValue({ hiddenCallback: null, metadataCallback: null });

    await expect(
      authenticateWebAuthnStep(createMixedLoginWebAuthnStep(), true, new AbortController()),
    ).rejects.toThrow('Incorrect callbacks for WebAuthn authentication');
  });

  it('writes a JSON payload when supportsJsonResponse is true and authenticatorAttachment exists', async () => {
    const get = vi.fn();
    stubWindow({ navigator: { credentials: { get } } });
    const step = createMixedLoginWebAuthnStep();
    const hiddenCallback = { setInputValue: vi.fn() };
    const metadataCallback = {
      getOutputValue: vi.fn().mockReturnValue({ supportsJsonResponse: true }),
    };

    webAuthnMock.getCallbacks.mockReturnValue({ hiddenCallback, metadataCallback });
    webAuthnMock.createAuthenticationPublicKey.mockReturnValue({ challenge: 'x' });
    webAuthnMock.getAuthenticationOutcome.mockReturnValue('legacy-outcome');

    get.mockResolvedValue({ authenticatorAttachment: 'platform' });

    await authenticateWebAuthnStep(step, true, new AbortController());

    expect(get).toHaveBeenCalledWith(
      expect.objectContaining({
        mediation: 'conditional',
        publicKey: { challenge: 'x' },
      }),
    );

    expect(hiddenCallback.setInputValue).toHaveBeenCalledWith(
      JSON.stringify({
        authenticatorAttachment: 'platform',
        legacyData: 'legacy-outcome',
      }),
    );
  });

  it('writes the legacy outcome when supportsJsonResponse is false', async () => {
    const get = vi.fn();
    stubWindow({ navigator: { credentials: { get } } });
    const step = createMixedLoginWebAuthnStep();
    const hiddenCallback = { setInputValue: vi.fn() };
    const metadataCallback = {
      getOutputValue: vi.fn().mockReturnValue({ supportsJsonResponse: false }),
    };

    webAuthnMock.getCallbacks.mockReturnValue({ hiddenCallback, metadataCallback });
    webAuthnMock.createAuthenticationPublicKey.mockReturnValue({ challenge: 'x' });
    webAuthnMock.getAuthenticationOutcome.mockReturnValue('legacy-outcome');

    get.mockResolvedValue({ authenticatorAttachment: 'platform' });

    await authenticateWebAuthnStep(step, true, new AbortController());

    expect(hiddenCallback.setInputValue).toHaveBeenCalledWith('legacy-outcome');
  });
});

describe('setupPasskeyAutofill', () => {
  it('advances the journey when a step is eligible', async () => {
    const isConditionalMediationAvailable = vi.fn().mockResolvedValue(true);
    const get = vi.fn().mockResolvedValue({});

    stubWindow({
      PublicKeyCredential: { isConditionalMediationAvailable },
      navigator: { credentials: { get } },
    });

    webAuthnMock.getCallbacks.mockReturnValue({
      hiddenCallback: { setInputValue: vi.fn() },
      metadataCallback: { getOutputValue: vi.fn().mockReturnValue({}) },
    });
    webAuthnMock.createAuthenticationPublicKey.mockReturnValue({ challenge: 'x' });
    webAuthnMock.getAuthenticationOutcome.mockReturnValue('outcome');

    const { emitStep, journeyStore, nextSpy } = createMockJourneyStore();
    const step = createMixedLoginWebAuthnStep('auth-a');

    setupPasskeyAutofill(journeyStore);
    emitStep(step);

    await waitFor(() => nextSpy.mock.calls.length === 1);
    expect(nextSpy).toHaveBeenCalledWith(step);
  });

  it('does not re-attempt for the same authId', async () => {
    const isConditionalMediationAvailable = vi.fn().mockResolvedValue(true);
    const get = vi.fn().mockResolvedValue({});

    stubWindow({
      PublicKeyCredential: { isConditionalMediationAvailable },
      navigator: { credentials: { get } },
    });

    webAuthnMock.getCallbacks.mockReturnValue({
      hiddenCallback: { setInputValue: vi.fn() },
      metadataCallback: { getOutputValue: vi.fn().mockReturnValue({}) },
    });
    webAuthnMock.createAuthenticationPublicKey.mockReturnValue({ challenge: 'x' });
    webAuthnMock.getAuthenticationOutcome.mockReturnValue('outcome');

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

    webAuthnMock.getCallbacks.mockReturnValue({
      hiddenCallback: { setInputValue: vi.fn() },
      metadataCallback: { getOutputValue: vi.fn().mockReturnValue({}) },
    });
    webAuthnMock.createAuthenticationPublicKey.mockReturnValue({ challenge: 'x' });
    webAuthnMock.getAuthenticationOutcome.mockReturnValue('outcome');

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

    pending[1].resolve({});
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

    webAuthnMock.getCallbacks.mockReturnValue({
      hiddenCallback: { setInputValue: vi.fn() },
      metadataCallback: { getOutputValue: vi.fn().mockReturnValue({}) },
    });
    webAuthnMock.createAuthenticationPublicKey.mockReturnValue({ challenge: 'x' });
    webAuthnMock.getAuthenticationOutcome.mockReturnValue('outcome');

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
