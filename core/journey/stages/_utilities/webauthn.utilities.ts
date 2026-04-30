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
import type { JourneyStep } from '@forgerock/journey-client/types';

/**
 * @function isMixedLoginWebAuthnStep - determines if a step is a mixed-login WebAuthn authentication step
 * @param {JourneyStep | null | undefined} step - The current journey step
 * @returns {boolean} True if the step looks like a mixed-login WebAuthn authentication step
 */
export function isMixedLoginWebAuthnStep(step?: JourneyStep | null): boolean {
  if (!step) {
    return false;
  }

  const nameCallback = step.getCallbacksOfType(callbackType.NameCallback).length > 0;
  const metadataCallback = WebAuthn.getMetadataCallback(step);
  const outcomeCallback = WebAuthn.getOutcomeCallback(step);

  if (!nameCallback || !metadataCallback || !outcomeCallback) {
    return false;
  }

  return WebAuthn.getWebAuthnStepType(step) === WebAuthnStepType.Authentication;
}
