/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';
import { WebAuthn, WebAuthnStepType } from '@forgerock/journey-client/webauthn';
import type {
  HiddenValueCallback,
  MetadataCallback,
  JourneyStep,
} from '@forgerock/journey-client/types';

/**
 * @function isMixedLoginWebAuthnStep - determines if a step is a mixed-login WebAuthn authentication step
 * @param {JourneyStep | null | undefined} step - The current journey step
 * @returns {boolean} True if the step looks like a mixed-login WebAuthn authentication step
 */
export function isMixedLoginWebAuthnStep(step?: JourneyStep | null): boolean {
  if (!isWebAuthnAuthenticationStep(step)) {
    return false;
  }

  const definedStep = step as JourneyStep;

  const hasNameCallback = definedStep.getCallbacksOfType(callbackType.NameCallback).length > 0;
  const hasMetadataCallback = !!getWebAuthnMetadataCallback(definedStep);
  const hasOutcomeCallback = hasWebAuthnOutcomeCallback(definedStep);

  return hasNameCallback && hasMetadataCallback && hasOutcomeCallback;
}

/**
 * @function isWebAuthnAuthenticationStep - determines if a step is a WebAuthn authentication step (not registration)
 * @param {JourneyStep | null | undefined} step - The current journey step
 * @returns {boolean} True if the step is a WebAuthn authentication step
 */
function isWebAuthnAuthenticationStep(step?: JourneyStep | null): boolean {
  if (!step) {
    return false;
  }

  const metadataCallback = getWebAuthnMetadataCallback(step);
  const hasOutcomeCallback = hasWebAuthnOutcomeCallback(step);

  if (metadataCallback && hasOutcomeCallback) {
    const data = metadataCallback.getOutputByName<object | null>('data', null);
    /**
     * Registration steps typically include `pubKeyCredParams` in the metadata payload
     * which helps determine if this is a registration step
     */
    const hasPubKeyCredParams =
      !!data &&
      typeof data === 'object' &&
      Object.prototype.hasOwnProperty.call(data, 'pubKeyCredParams');

    /* Return false if this is a WebAuthn registration step. */
    return !hasPubKeyCredParams;
  }

  return WebAuthn.getWebAuthnStepType(step) === WebAuthnStepType.Authentication;
}

/**
 * @function getWebAuthnMetadataCallback - gets the WebAuthn MetadataCallback from a step
 * @param {JourneyStep} step - The current journey step
 * @returns {MetadataCallback | undefined} The WebAuthn metadata callback, if present
 */
function getWebAuthnMetadataCallback(step: JourneyStep): MetadataCallback | undefined {
  return step
    .getCallbacksOfType(callbackType.MetadataCallback)
    .find((callback): callback is MetadataCallback => {
      const data = (callback as MetadataCallback).getOutputByName<object | null>('data', null);

      if (!data || typeof data !== 'object') {
        return false;
      }

      return Object.prototype.hasOwnProperty.call(data, 'relyingPartyId');
    });
}

/**
 * @function hasWebAuthnOutcomeCallback - checks if the step includes the WebAuthn outcome callback
 * @param {JourneyStep} step - The current journey step
 * @returns {boolean} True if a HiddenValueCallback with id "webAuthnOutcome" exists
 */
function hasWebAuthnOutcomeCallback(step: JourneyStep): boolean {
  return step.getCallbacksOfType(callbackType.HiddenValueCallback).some((callback) => {
    return (
      (callback as HiddenValueCallback).getOutputByName<string>('id', '') === 'webAuthnOutcome'
    );
  });
}
