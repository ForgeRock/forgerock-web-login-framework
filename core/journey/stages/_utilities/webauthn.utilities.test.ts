/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';
import type { JourneyStep, Step } from '@forgerock/journey-client/types';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import { usernamePasswordStep } from '$journey/stages/step.mock';
import { webAuthnAuthenticationStep } from '$journey/stages/mfa-stages.mock';

import { isMixedLoginWebAuthnStep } from './webauthn.utilities';

import {
  authenticateWebAuthnStep,
  createPasskeyAutofillHandler,
  shouldAttemptPasskeyAutofill,
} from '../_effects/webauthn.effects';

const liveMixedLoginWebAuthnStep: Step = {
  authId: 'x',
  callbacks: [
    {
      type: callbackType.NameCallback,
      output: [{ name: 'prompt', value: 'User Name' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
    {
      type: callbackType.MetadataCallback,
      output: [
        {
          name: 'data',
          value: {
            _action: 'webauthn_authentication',
            challenge: 'Ya8applUsry8oFtAlB9zrOzrx21MSQ6NUaJYWjAR8j0=',
            allowCredentials: '',
            _allowCredentials: [],
            timeout: '60000',
            userVerification: 'required',
            conditional: false,
            relyingPartyId: '',
            _relyingPartyId: '',
            extensions: {},
            _type: 'WebAuthn',
            supportsJsonResponse: true,
          },
        },
      ],
      _id: 1,
    },
    {
      type: callbackType.HiddenValueCallback,
      output: [
        { name: 'value', value: 'false' },
        { name: 'id', value: 'webAuthnOutcome' },
      ],
      input: [{ name: 'IDToken3', value: 'webAuthnOutcome' }],
      _id: 2,
    },
  ],
  stage: 'DefaultLogin',
};

function createMixedLoginWebAuthnStep(): JourneyStep {
  return createJourneyStep({
    ...(usernamePasswordStep as Step),
    callbacks: [
      ...((usernamePasswordStep.callbacks ?? []) as NonNullable<Step['callbacks']>),
      ...((webAuthnAuthenticationStep.callbacks ?? []) as NonNullable<Step['callbacks']>),
    ],
    stage: 'DefaultLogin',
  } as Step);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('WebAuthn helper utilities', () => {
  function setupBrowserForWebAuthn(options: {
    conditionalMediationAvailable?: boolean;
    credentialsGetImpl: (requestOptions: unknown) => Promise<unknown>;
  }) {
    const win = {
      navigator: {
        credentials: {
          get: vi.fn(options.credentialsGetImpl),
        },
      },
      PublicKeyCredential: {
        isConditionalMediationAvailable: vi
          .fn()
          .mockResolvedValue(!!options.conditionalMediationAvailable),
      },
    } as unknown as Window & {
      PublicKeyCredential: {
        isConditionalMediationAvailable: ReturnType<typeof vi.fn>;
      };
    };

    (globalThis as unknown as { window?: Window }).window = win;
    return {
      win,
      credentialsGet: win.navigator.credentials.get as unknown as ReturnType<typeof vi.fn>,
      conditionalMediationSpy: win.PublicKeyCredential.isConditionalMediationAvailable,
    };
  }

  function createMockPublicKeyCredential(): PublicKeyCredential {
    const encoder = new TextEncoder();

    const clientDataJSON = encoder.encode(JSON.stringify({ type: 'webauthn.get' })).buffer;
    const authenticatorData = new Uint8Array([1, 2, 3, 4]).buffer;
    const signature = new Uint8Array([5, 6, 7, 8]).buffer;
    const userHandle = new Uint8Array([9, 10]).buffer;

    return {
      id: 'credential-id',
      rawId: new Uint8Array([1]).buffer,
      type: 'public-key',
      response: {
        clientDataJSON,
        authenticatorData,
        signature,
        userHandle,
      } as unknown as AuthenticatorAssertionResponse,
      authenticatorAttachment: 'platform',
      getClientExtensionResults: () => ({}),
    } as unknown as PublicKeyCredential;
  }

  it('identifies a mixed login plus WebAuthn authentication step', () => {
    expect(isMixedLoginWebAuthnStep(createMixedLoginWebAuthnStep())).toBe(true);
  });

  it('does not treat a standard login step as passkey autofill eligible', () => {
    expect(isMixedLoginWebAuthnStep(createJourneyStep(usernamePasswordStep))).toBe(false);
  });

  it('does not treat a dedicated WebAuthn stage as a mixed login step', () => {
    expect(isMixedLoginWebAuthnStep(createJourneyStep(webAuthnAuthenticationStep as Step))).toBe(
      false,
    );
  });

  it('treats the live DefaultLogin authentication payload as passkey autofill eligible', () => {
    expect(isMixedLoginWebAuthnStep(createJourneyStep(liveMixedLoginWebAuthnStep))).toBe(true);
  });

  it('checks conditional mediation support for mixed login steps only', async () => {
    const { conditionalMediationSpy } = setupBrowserForWebAuthn({
      conditionalMediationAvailable: true,
      credentialsGetImpl: async () => createMockPublicKeyCredential(),
    });

    await expect(shouldAttemptPasskeyAutofill(createMixedLoginWebAuthnStep())).resolves.toBe(true);
    await expect(
      shouldAttemptPasskeyAutofill(createJourneyStep(usernamePasswordStep)),
    ).resolves.toBe(false);

    expect(conditionalMediationSpy).toHaveBeenCalledTimes(1);
  });

  it('passes a conditional mediation transformer when requested', async () => {
    const step = createMixedLoginWebAuthnStep();

    const { credentialsGet } = setupBrowserForWebAuthn({
      conditionalMediationAvailable: true,
      credentialsGetImpl: async () => createMockPublicKeyCredential(),
    });

    await authenticateWebAuthnStep(step, { useConditionalMediation: true });

    expect(credentialsGet).toHaveBeenCalledTimes(1);

    const requestOptions = credentialsGet.mock.calls[0]?.[0] as
      | { publicKey?: unknown; mediation?: unknown }
      | undefined;
    expect(requestOptions?.publicKey).toBeTruthy();
    expect(requestOptions?.mediation).toBe('conditional');
  });

  it('creates a stage-independent passkey autofill handler', async () => {
    const step = createMixedLoginWebAuthnStep();

    const { credentialsGet } = setupBrowserForWebAuthn({
      conditionalMediationAvailable: true,
      credentialsGetImpl: async () => createMockPublicKeyCredential(),
    });

    const onSubmit = vi.fn();
    const handle = createPasskeyAutofillHandler({
      onSubmit,
    });

    await handle('update', step);

    expect(credentialsGet).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('aborts an in-flight passkey autofill attempt on submit', async () => {
    const step = createMixedLoginWebAuthnStep();

    vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    let abortObserved = false;

    const pending = {
      resolve: null as ((value: unknown) => void) | null,
      reject: null as ((reason?: unknown) => void) | null,
    };

    setupBrowserForWebAuthn({
      conditionalMediationAvailable: true,
      credentialsGetImpl: async (requestOptions) => {
        const signal = (requestOptions as { signal?: AbortSignal | undefined })?.signal;
        return await new Promise((resolve, reject) => {
          pending.resolve = resolve;
          pending.reject = reject;

          signal?.addEventListener('abort', () => {
            abortObserved = true;
            const e = new Error('Abort');
            (e as unknown as { name: string }).name = 'AbortError';
            reject(e);
          });
        });
      },
    });

    const handle = createPasskeyAutofillHandler({
      onSubmit: vi.fn(),
    });

    const updatePromise = handle('update', step);

    // Allow the handler to proceed into the in-flight credentials.get call
    for (let i = 0; i < 10 && !pending.reject; i++) {
      await Promise.resolve();
    }

    await handle('submit');
    await updatePromise;

    expect(abortObserved).toBe(true);
  });
});
