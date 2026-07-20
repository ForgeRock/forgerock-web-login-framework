/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { WebAuthn } from '@forgerock/journey-client/webauthn';

import { isPasskeyAutofillStep } from '../_utilities/webauthn.utilities';

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

    if (!isPasskeyAutofillStep(step) || !(await WebAuthn.isConditionalMediationSupported())) {
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
