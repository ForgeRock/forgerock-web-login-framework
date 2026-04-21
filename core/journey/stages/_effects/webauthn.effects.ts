/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import type { JourneyStep } from '@forgerock/journey-client/types';
import { WebAuthn } from '@forgerock/journey-client/webauthn';

import type { StepTypes } from '$journey/journey.interfaces';

import { isMixedLoginWebAuthnStep } from '../_utilities/webauthn.utilities';

type AuthenticateOptions = {
  useConditionalMediation?: boolean;
};
let activeAbortController: AbortController | null = null;

async function isConditionalMediationAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  const ctor = window.PublicKeyCredential;
  if (!ctor || typeof ctor.isConditionalMediationAvailable !== 'function') {
    return false;
  }

  try {
    return await ctor.isConditionalMediationAvailable();
  } catch {
    return false;
  }
}

async function authenticateWebAuthnWithConditionalMediation(
  step: JourneyStep,
): Promise<JourneyStep> {
  const { hiddenCallback, metadataCallback } = WebAuthn.getCallbacks(step);

  if (!hiddenCallback || !metadataCallback) {
    throw new Error('Incorrect callbacks for WebAuthn authentication');
  }

  const meta = metadataCallback.getOutputValue('data') as Parameters<
    typeof WebAuthn.createAuthenticationPublicKey
  >[0] & { supportsJsonResponse?: boolean };

  const publicKey = WebAuthn.createAuthenticationPublicKey(meta);

  const abortController = new AbortController();
  activeAbortController = abortController;

  try {
    const credential = (await window.navigator.credentials.get({
      publicKey,
      mediation: 'conditional',
      signal: abortController.signal,
    })) as PublicKeyCredential | null;

    const outcome = WebAuthn.getAuthenticationOutcome(credential);

    const hiddenValue =
      meta?.supportsJsonResponse && credential && 'authenticatorAttachment' in credential
        ? JSON.stringify({
            authenticatorAttachment: credential.authenticatorAttachment,
            legacyData: outcome,
          })
        : outcome;

    hiddenCallback.setInputValue(hiddenValue);
    return step;
  } finally {
    if (activeAbortController === abortController) {
      activeAbortController = null;
    }
  }
}

export async function shouldAttemptPasskeyAutofill(step?: JourneyStep | null): Promise<boolean> {
  if (!isMixedLoginWebAuthnStep(step)) {
    return false;
  }

  return isConditionalMediationAvailable();
}

export async function authenticateWebAuthnStep(
  step: JourneyStep,
  options: AuthenticateOptions = {},
): Promise<JourneyStep> {
  if (!options.useConditionalMediation) {
    return WebAuthn.authenticate(step);
  }

  return authenticateWebAuthnWithConditionalMediation(step);
}

export function abortWebAuthnOperation(): void {
  activeAbortController?.abort();
  activeAbortController = null;
}

export type PasskeyAutofillHandlerAction = 'update' | 'submit' | 'destroy';

type PasskeyAutofillHandlerOptions = {
  onSubmit: (step: JourneyStep) => void | Promise<void>;
};

function getStepAuthId(step: unknown): string | null {
  try {
    const maybeStep = step as {
      getAuthId?: () => string;
      payload?: { authId?: string };
      authId?: string;
    };

    return maybeStep?.getAuthId?.() ?? maybeStep?.payload?.authId ?? maybeStep?.authId ?? null;
  } catch {
    return null;
  }
}

/**
 * Creates a stage-independent handler for passkey autofill (conditional mediation).
 *
 * This should be wired once per widget instance (e.g. in `journey.svelte`) and invoked
 * on lifecycle events.
 */
export function createPasskeyAutofillHandler(options: PasskeyAutofillHandlerOptions) {
  let attemptedAuthId: string | null = null;
  let inFlightAuthId: string | null = null;

  return async function handlePasskeyAutofill(
    action: PasskeyAutofillHandlerAction,
    step?: StepTypes,
  ): Promise<void> {
    if (action === 'submit' || action === 'destroy') {
      abortWebAuthnOperation();
      inFlightAuthId = null;
      return;
    }

    // action === 'update'
    if (!step || step.type !== 'Step') {
      return;
    }

    const authId = getStepAuthId(step);

    // If the step changes while an autofill attempt is in-flight,
    // abort to prevent leaking an active WebAuthn request.
    if (inFlightAuthId && authId && authId !== inFlightAuthId) {
      abortWebAuthnOperation();
      inFlightAuthId = null;
    }

    if (!authId || attemptedAuthId === authId) {
      return;
    }

    attemptedAuthId = authId;

    if (!(await shouldAttemptPasskeyAutofill(step))) {
      return;
    }

    inFlightAuthId = authId;
    try {
      const updatedStep = await authenticateWebAuthnStep(step, { useConditionalMediation: true });
      await options.onSubmit(updatedStep);
    } catch (error) {
      console.debug('Passkey autofill attempt did not complete', error);
    } finally {
      if (inFlightAuthId === authId) {
        inFlightAuthId = null;
      }
    }
  };
}
