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
import { WebAuthn } from '@forgerock/journey-client/webauthn';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import {
  createPasskeyAutofillStep,
  livePasskeyAutofillStep,
} from '$journey/stages/mfa-stages.mock';
import { usernamePasswordStep } from '$journey/stages/step.mock';
import { setupPasskeyAutofill } from './webauthn.effects';

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
    async restartCurrent() {
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

/**
 * Stub the browser WebAuthn surface the SDK reads: bare `PublicKeyCredential` (used by
 * WebAuthn.isConditionalMediationSupported), `window.PublicKeyCredential` (feature check in
 * getAuthenticationCredential), and `navigator.credentials.get` (both bare and on window).
 */
function stubBrowser(options: {
  get?: (input: { signal?: AbortSignal }) => unknown;
  isConditionalMediationAvailable?: () => Promise<boolean>;
  publicKeyCredential?: 'available' | 'noConditionalApi' | 'missing';
}): void {
  const mode = options.publicKeyCredential ?? 'available';
  const publicKeyCredential =
    mode === 'missing'
      ? undefined
      : mode === 'noConditionalApi'
      ? {}
      : { isConditionalMediationAvailable: options.isConditionalMediationAvailable };
  const navigatorStub = { credentials: { get: options.get } };

  vi.stubGlobal('PublicKeyCredential', publicKeyCredential);
  vi.stubGlobal('navigator', navigatorStub);
  vi.stubGlobal('window', { PublicKeyCredential: publicKeyCredential, navigator: navigatorStub });
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

describe('WebAuthn.isConditionalMediationSupported (SDK)', () => {
  it('returns false when PublicKeyCredential is undefined', async () => {
    stubBrowser({ publicKeyCredential: 'missing', get: vi.fn() });
    await expect(WebAuthn.isConditionalMediationSupported()).resolves.toBe(false);
  });

  it('returns false when the conditional mediation API is missing', async () => {
    stubBrowser({ publicKeyCredential: 'noConditionalApi', get: vi.fn() });
    await expect(WebAuthn.isConditionalMediationSupported()).resolves.toBe(false);
  });

  it('rejects when isConditionalMediationAvailable rejects', async () => {
    // The SDK does not swallow the rejection (unlike the former hand-rolled helper). The effect
    // tolerates this: the awaited support check runs outside its try/catch and is caught by the
    // subscription-level `.catch`, so a rejecting browser API cannot advance the journey.
    stubBrowser({
      isConditionalMediationAvailable: vi.fn().mockRejectedValue(new Error('nope')),
      get: vi.fn(),
    });
    await expect(WebAuthn.isConditionalMediationSupported()).rejects.toThrow('nope');
  });

  it('returns true when conditional mediation is available', async () => {
    stubBrowser({
      isConditionalMediationAvailable: vi.fn().mockResolvedValue(true),
      get: vi.fn(),
    });
    await expect(WebAuthn.isConditionalMediationSupported()).resolves.toBe(true);
  });
});

describe('WebAuthn.authenticate (SDK) — conditional mediation', () => {
  it('requests a credential using conditional mediation and writes an outcome', async () => {
    const get = vi.fn().mockResolvedValue(createMockCredential({ id: 'cred-auth' }));
    stubBrowser({ isConditionalMediationAvailable: vi.fn().mockResolvedValue(true), get });

    const step = createPasskeyAutofillStep();
    await expect(WebAuthn.authenticate(step)).resolves.toBe(step);

    expect(get).toHaveBeenCalledWith(
      expect.objectContaining({
        mediation: 'conditional',
        publicKey: expect.any(Object),
        signal: expect.any(Object),
      }),
    );

    expect(getWebAuthnOutcomeValue(step)).toContain('cred-auth');
  });

  it('creates its own AbortController when no signal is provided', async () => {
    // The SDK owns the AbortController for conditional mediation, so — unlike the former
    // authenticateWebAuthnAutofill helper — it does NOT require the caller to pass one.
    const get = vi.fn().mockResolvedValue(createMockCredential({ id: 'cred-nosignal' }));
    stubBrowser({ isConditionalMediationAvailable: vi.fn().mockResolvedValue(true), get });

    await WebAuthn.authenticate(createPasskeyAutofillStep());

    expect(get).toHaveBeenCalledWith(expect.objectContaining({ signal: expect.any(Object) }));
  });

  it('throws when WebAuthn callbacks are missing', async () => {
    stubBrowser({ isConditionalMediationAvailable: vi.fn().mockResolvedValue(true), get: vi.fn() });
    await expect(WebAuthn.authenticate(createJourneyStep(usernamePasswordStep))).rejects.toThrow(
      'Incorrect callbacks for WebAuthn authentication',
    );
  });

  it('writes a JSON payload when supportsJsonResponse is true and authenticatorAttachment exists', async () => {
    const get = vi
      .fn()
      .mockResolvedValue(
        createMockCredential({ id: 'cred-json', authenticatorAttachment: 'platform' }),
      );
    stubBrowser({ isConditionalMediationAvailable: vi.fn().mockResolvedValue(true), get });

    const step = createJourneyStep(livePasskeyAutofillStep);
    await WebAuthn.authenticate(step);

    const hiddenValue = getWebAuthnOutcomeValue(step);
    expect(hiddenValue).toBeTruthy();

    const parsed = JSON.parse(hiddenValue as string) as Record<string, unknown>;
    expect(parsed).toMatchObject({ authenticatorAttachment: 'platform' });
    expect(typeof parsed.legacyData).toBe('string');
  });
});

describe('setupPasskeyAutofill', () => {
  it('advances the journey when a step is eligible', async () => {
    const get = vi.fn().mockResolvedValue(createMockCredential({ id: 'cred-next' }));
    stubBrowser({ isConditionalMediationAvailable: vi.fn().mockResolvedValue(true), get });

    const { emitStep, journeyStore, nextSpy } = createMockJourneyStore();
    const step = createPasskeyAutofillStep('auth-a');

    setupPasskeyAutofill(journeyStore);
    emitStep(step);

    await waitFor(() => nextSpy.mock.calls.length === 1);
    expect(nextSpy).toHaveBeenCalledWith(step);
    expect(getWebAuthnOutcomeValue(step)).toContain('cred-next');
  });

  it('does not attempt autofill for an ineligible (non-conditional) step', async () => {
    const get = vi.fn().mockResolvedValue(createMockCredential());
    stubBrowser({ isConditionalMediationAvailable: vi.fn().mockResolvedValue(true), get });

    const { emitStep, journeyStore, nextSpy } = createMockJourneyStore();

    setupPasskeyAutofill(journeyStore);
    emitStep(createJourneyStep(usernamePasswordStep));
    await flushPromises();

    expect(get).not.toHaveBeenCalled();
    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('does not re-attempt for the same authId', async () => {
    const get = vi.fn().mockResolvedValue(createMockCredential({ id: 'cred-once' }));
    stubBrowser({ isConditionalMediationAvailable: vi.fn().mockResolvedValue(true), get });

    const { emitStep, journeyStore, nextSpy } = createMockJourneyStore();
    const step = createPasskeyAutofillStep('auth-a');

    setupPasskeyAutofill(journeyStore);

    emitStep(step);
    await waitFor(() => nextSpy.mock.calls.length === 1);

    emitStep(step);
    await flushPromises();

    expect(get).toHaveBeenCalledTimes(1);
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  it('aborts an in-flight request when authId changes', async () => {
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

    stubBrowser({ isConditionalMediationAvailable: vi.fn().mockResolvedValue(true), get });

    const { emitStep, journeyStore, nextSpy } = createMockJourneyStore();
    const stepA = createPasskeyAutofillStep('auth-a');
    const stepB = createPasskeyAutofillStep('auth-b');

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

  it('does not attempt autofill when browser does not support conditional mediation', async () => {
    const get = vi.fn();
    stubBrowser({ isConditionalMediationAvailable: vi.fn().mockResolvedValue(false), get });

    const { emitStep, journeyStore, nextSpy } = createMockJourneyStore();

    setupPasskeyAutofill(journeyStore);
    emitStep(createPasskeyAutofillStep('auth-a'));
    await flushPromises();

    expect(get).not.toHaveBeenCalled();
    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('abort cancels an in-flight request without unsubscribing', async () => {
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

    stubBrowser({ isConditionalMediationAvailable: vi.fn().mockResolvedValue(true), get });

    const { emitStep, journeyStore, nextSpy, unsubscribe } = createMockJourneyStore();
    const controls = setupPasskeyAutofill(journeyStore);

    emitStep(createPasskeyAutofillStep('auth-a'));
    await waitFor(() => pending.length === 1);

    controls.abort();
    await flushPromises();

    expect(pending[0].signal.aborted).toBe(true);
    expect(nextSpy).not.toHaveBeenCalled();
    expect(unsubscribe).not.toHaveBeenCalled();
  });

  it('does not advance the journey when authenticate throws a non-abort error', async () => {
    const get = vi.fn().mockRejectedValue(new Error('unexpected hardware error'));
    stubBrowser({ isConditionalMediationAvailable: vi.fn().mockResolvedValue(true), get });

    const { emitStep, journeyStore, nextSpy } = createMockJourneyStore();

    setupPasskeyAutofill(journeyStore);
    emitStep(createPasskeyAutofillStep('auth-a'));
    await flushPromises();

    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('destroy unsubscribes and aborts in-flight requests', async () => {
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

    stubBrowser({ isConditionalMediationAvailable: vi.fn().mockResolvedValue(true), get });

    const mockJourneyStore = createMockJourneyStore();
    const controls = setupPasskeyAutofill(mockJourneyStore.journeyStore);
    const step = createPasskeyAutofillStep('auth-a');

    mockJourneyStore.emitStep(step);

    await waitFor(() => pending.length === 1);

    controls.destroy();
    await flushPromises();

    expect(mockJourneyStore.unsubscribe).toHaveBeenCalledTimes(1);
    expect(pending[0].signal.aborted).toBe(true);
  });
});
