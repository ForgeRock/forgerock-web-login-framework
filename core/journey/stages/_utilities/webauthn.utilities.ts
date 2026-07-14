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
import type { WebAuthnAuthenticationMetadata } from '@forgerock/journey-client/webauthn';

/**
 * @function isMixedLoginWebAuthnStep - determines if a step is a mixed-login WebAuthn authentication step
 * (has a NameCallback alongside WebAuthn auth metadata, regardless of autocomplete values)
 * @param {JourneyStep | null | undefined} step - The current journey step
 * @returns {boolean} True if the step has both a NameCallback and WebAuthn auth metadata
 */
export function isMixedLoginWebAuthnStep(step?: JourneyStep | null): boolean {
  if (!step) {
    return false;
  }

  const hasNameCallback = step.getCallbacksOfType(callbackType.NameCallback).length > 0;
  const metadataCallback = WebAuthn.getMetadataCallback(step);
  const outcomeCallback = WebAuthn.getOutcomeCallback(step);

  if (!hasNameCallback || !metadataCallback || !outcomeCallback) {
    return false;
  }

  return WebAuthn.getWebAuthnStepType(step) === WebAuthnStepType.Authentication;
}

/**
 * @function getAutocompleteValues - reads the autocomplete values AM sent on the NameCallback
 * @param {JourneyStep | null | undefined} step - The current journey step
 * @returns {string[]} The autocomplete values, or an empty array if absent
 */
export function getAutocompleteValues(step?: JourneyStep | null): string[] {
  const nameCallback = step?.getCallbacksOfType(callbackType.NameCallback)[0];
  return nameCallback?.getOutputByName<string[]>('autocompleteValues', []) ?? [];
}

/**
 * @function isPasskeyAutofillStep - determines whether AM has enabled passkey autofill for a step.
 * This is purely an AM-eligibility check — separate from {@link isMixedLoginWebAuthnStep} (which
 * decides stage routing). Requires BOTH the `username`/`webauthn` autocomplete values AND
 * AM-driven conditional mediation (`meta.mediation === 'conditional'`): autofill is only meaningful
 * when the field is marked autofillable and a conditional request is issued to populate it.
 *
 * TODO: promote this to journey-client (e.g. WebAuthn.isConditionalMediationRequested) once the SDK exposes it.
 * @param {JourneyStep | null | undefined} step - The current journey step
 * @returns {boolean} True if both autocomplete values and AM conditional mediation are enabled
 */
export function isPasskeyAutofillStep(step?: JourneyStep | null): boolean {
  if (!step) {
    return false;
  }

  const autocompleteValues = getAutocompleteValues(step);
  if (!autocompleteValues.includes('username') || !autocompleteValues.includes('webauthn')) {
    return false;
  }

  // TODO: extend WebAuthn.isConditionalMediationSupported in the Ping SDK to also accept a step
  // and check whether AM requested conditional mediation (meta.mediation === 'conditional'),
  // so this manual metadata extraction can be removed.
  const metadata = WebAuthn.getMetadataCallback(step)?.getOutputByName<
    Partial<WebAuthnAuthenticationMetadata>
  >('data', {});

  return metadata?.mediation === 'conditional';
}
