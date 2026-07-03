/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { WebAuthn } from '@forgerock/journey-client/webauthn';

import { isMixedLoginWebAuthnStep } from '../_utilities/webauthn.utilities';

import type { JourneyStep } from '@forgerock/journey-client/types';

import type { JourneyStore, StepTypes } from '$journey/journey.interfaces';

/**
 * @function setupPasskeyAutofill - subscribes to journey changes and attempts passkey autofill on eligible steps
 * @param {JourneyStore} journeyStore - The journey store to observe and advance
 * @returns {{ abort: () => void; destroy: () => void }} Controls to abort in-flight requests and cleanup subscription
 */
export function setupPasskeyAutofill(journeyStore: JourneyStore) {
  let lastAuthId: string | null = null;
  let inFlightAbortController: AbortController | null = null;

  async function update(step?: StepTypes): Promise<void> {
    if (!step || step.type !== 'Step') {
      return;
    }

    const authId = step.payload?.authId ?? null;

    if (!authId) {
      return;
    }

    /*
     * If the step changes while an autofill attempt is in-flight,
     * abort to prevent leaving an active WebAuthn request running.
     */
    if (inFlightAbortController && lastAuthId && authId !== lastAuthId) {
      abort();
    }

    if (lastAuthId === authId) {
      return;
    }

    lastAuthId = authId;

    if (!(await isConditionalMediationSupported(step))) {
      return;
    }

    const abortController = new AbortController();
    inFlightAbortController = abortController;
    try {
      const updatedStep = await WebAuthn.authenticate(step, abortController.signal);
      await journeyStore.next(updatedStep);
    } catch (error) {
      console.debug('Passkey autofill attempt did not complete', error);
    } finally {
      if (inFlightAbortController === abortController) {
        inFlightAbortController = null;
      }
    }
  }

  function abort(): void {
    inFlightAbortController?.abort();
    inFlightAbortController = null;
  }

  const unsubscribe = journeyStore.subscribe((value) => {
    update(value?.step).catch((err) => {
      console.debug('Passkey autofill update failed', err);
    });
  });

  return {
    abort,
    destroy() {
      unsubscribe();
      abort();
    },
  };
}

/**
 * @function authenticateWebAuthnManual - triggers an explicit passkey picker using mediation: 'required'
 * @param {JourneyStep} step - The WebAuthn journey step
 * @returns {Promise<JourneyStep>} The same step with the WebAuthn outcome written to the hidden callback
 * @throws {Error} If the step does not contain the expected WebAuthn callbacks
 */
export async function authenticateWebAuthnManual(step: JourneyStep): Promise<JourneyStep> {
  const { hiddenCallback, metadataCallback } = WebAuthn.getCallbacks(step);

  if (!hiddenCallback || !metadataCallback) {
    throw new Error('Incorrect callbacks for WebAuthn authentication');
  }

  const metadata = metadataCallback.getOutputValue('data') as Parameters<
    typeof WebAuthn.createAuthenticationPublicKey
  >[0] & { supportsJsonResponse?: boolean };

  const publicKey = WebAuthn.createAuthenticationPublicKey(metadata);
  const credential = await WebAuthn.getAuthenticationCredential(publicKey, 'required');
  const outcome = WebAuthn.getAuthenticationOutcome(credential);

  const hiddenValue =
    metadata?.supportsJsonResponse && credential && 'authenticatorAttachment' in credential
      ? JSON.stringify({
          authenticatorAttachment: credential.authenticatorAttachment,
          legacyData: outcome,
        })
      : outcome;

  hiddenCallback.setInputValue(hiddenValue);
  return step;
}

/**
 * @function isConditionalMediationSupported - determines if passkey autofill should be attempted for a step
 * @param {JourneyStep | null | undefined} step - The current journey step
 * @returns {Promise<boolean>} True if conditional mediation is available and the step is eligible
 */
export async function isConditionalMediationSupported(step?: JourneyStep | null): Promise<boolean> {
  if (typeof window === 'undefined' || !isMixedLoginWebAuthnStep(step)) {
    return false;
  }

  try {
    return await WebAuthn.isConditionalMediationSupported();
  } catch {
    return false;
  }
}
