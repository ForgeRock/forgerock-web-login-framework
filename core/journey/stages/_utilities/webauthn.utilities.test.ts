/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { CallbackType, FRStep, FRWebAuthn, type Step } from '@forgerock/javascript-sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
      type: CallbackType.NameCallback,
      output: [{ name: 'prompt', value: 'User Name' }],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
    {
      type: CallbackType.MetadataCallback,
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
      type: CallbackType.HiddenValueCallback,
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

function createMixedLoginWebAuthnStep(): FRStep {
  return new FRStep({
    ...usernamePasswordStep,
    callbacks: [
      ...(usernamePasswordStep.callbacks ?? []),
      ...(webAuthnAuthenticationStep.callbacks ?? []),
    ],
    stage: 'DefaultLogin',
  } as Step);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('WebAuthn helper utilities', () => {
  it('identifies a mixed login plus WebAuthn authentication step', () => {
    expect(isMixedLoginWebAuthnStep(createMixedLoginWebAuthnStep())).toBe(true);
  });

  it('does not treat a standard login step as passkey autofill eligible', () => {
    expect(isMixedLoginWebAuthnStep(new FRStep(usernamePasswordStep))).toBe(false);
  });

  it('does not treat a dedicated WebAuthn stage as a mixed login step', () => {
    expect(isMixedLoginWebAuthnStep(new FRStep(webAuthnAuthenticationStep as Step))).toBe(false);
  });

  it('treats the live DefaultLogin authentication payload as passkey autofill eligible', () => {
    expect(isMixedLoginWebAuthnStep(new FRStep(liveMixedLoginWebAuthnStep))).toBe(true);
  });

  it('checks conditional mediation support for mixed login steps only', async () => {
    const conditionalMediationSpy = vi
      .spyOn(FRWebAuthn, 'isConditionalMediationSupported')
      .mockResolvedValue(true);

    await expect(shouldAttemptPasskeyAutofill(createMixedLoginWebAuthnStep())).resolves.toBe(true);
    await expect(shouldAttemptPasskeyAutofill(new FRStep(usernamePasswordStep))).resolves.toBe(
      false,
    );

    expect(conditionalMediationSpy).toHaveBeenCalledTimes(1);
  });

  it('passes a conditional mediation transformer when requested', async () => {
    const step = createMixedLoginWebAuthnStep();
    const authenticateSpy = vi.spyOn(FRWebAuthn, 'authenticate').mockResolvedValue(step);

    await authenticateWebAuthnStep(step, { useConditionalMediation: true });

    expect(authenticateSpy).toHaveBeenCalledTimes(1);
    expect(authenticateSpy.mock.calls[0][0]).toBe(step);

    const transformer = authenticateSpy.mock.calls[0][1];
    expect(typeof transformer).toBe('function');
    expect(transformer?.({ publicKey: {} })).toEqual({
      publicKey: {},
      mediation: 'conditional',
    });
  });

  it('creates a stage-independent passkey autofill handler', async () => {
    const step = createMixedLoginWebAuthnStep();

    vi.spyOn(FRWebAuthn, 'isConditionalMediationSupported').mockResolvedValue(true);
    const authenticateSpy = vi.spyOn(FRWebAuthn, 'authenticate').mockResolvedValue(step);

    const onSubmit = vi.fn();
    const handle = createPasskeyAutofillHandler({
      onSubmit,
    });

    await handle('update', step);

    expect(authenticateSpy).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('aborts an in-flight passkey autofill attempt on submit', async () => {
    const step = createMixedLoginWebAuthnStep();

    vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    vi.spyOn(FRWebAuthn, 'isConditionalMediationSupported').mockResolvedValue(true);
    let rejectAuthenticate: ((reason?: unknown) => void) | null = null;
    vi.spyOn(FRWebAuthn, 'authenticate').mockImplementation(
      () =>
        new Promise<FRStep>((_resolve, reject) => {
          rejectAuthenticate = reject;
        }),
    );

    const abortSpy = vi.fn(() => {
      rejectAuthenticate?.(new Error('Abort'));
    });
    (globalThis as unknown as { window?: unknown }).window = {
      PingWebAuthnAbortController: { abort: abortSpy },
    };

    const handle = createPasskeyAutofillHandler({
      onSubmit: vi.fn(),
    });

    const updatePromise = handle('update', step);

    // Allow the handler to proceed into the in-flight authenticate call
    for (let i = 0; i < 10 && !rejectAuthenticate; i++) {
      await Promise.resolve();
    }

    await handle('submit');
    await updatePromise;

    expect(abortSpy).toHaveBeenCalledTimes(1);
  });
});
