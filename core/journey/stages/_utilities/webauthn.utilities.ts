/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';
import {
  WebAuthn,
  WebAuthnStepType,
  type WebAuthnAuthenticationMetadata,
} from '@forgerock/journey-client/webauthn';
import type {
  HiddenValueCallback,
  MetadataCallback,
  JourneyStep,
} from '@forgerock/journey-client/types';

type WebAuthnMetadataShape = Partial<WebAuthnAuthenticationMetadata> & {
  _action?: string;
  _type?: string;
  pubKeyCredParams?: unknown;
  relyingPartyId?: string;
  _relyingPartyId?: string;
};

export function isMixedLoginWebAuthnStep(step?: JourneyStep | null): boolean {
  if (!step || !isWebAuthnAuthenticationStep(step)) {
    return false;
  }

  const hasNameCallback = step.getCallbacksOfType(callbackType.NameCallback).length > 0;
  const hasMetadataCallback = !!getWebAuthnMetadataCallback(step);
  const hasOutcomeCallback = !!getWebAuthnOutcomeCallback(step);

  return hasNameCallback && hasMetadataCallback && hasOutcomeCallback;
}

export function isWebAuthnAuthenticationStep(step?: JourneyStep | null): boolean {
  if (!step) {
    return false;
  }

  let metadata = null;
  const metadataCallback = getWebAuthnMetadataCallback(step);
  if (metadataCallback) {
    metadata = metadataCallback.getData<WebAuthnAuthenticationMetadata>();
  }

  const outcomeCallback = getWebAuthnOutcomeCallback(step);

  if (metadata && outcomeCallback) {
    return !Object.prototype.hasOwnProperty.call(metadata, 'pubKeyCredParams');
  }

  return WebAuthn.getWebAuthnStepType(step) === WebAuthnStepType.Authentication;
}

function getWebAuthnMetadataCallback(step?: JourneyStep | null): MetadataCallback | undefined {
  if (!step) {
    return undefined;
  }

  return step
    .getCallbacksOfType(callbackType.MetadataCallback)
    .find((callback): callback is MetadataCallback => {
      const metadata = (callback as MetadataCallback).getData<WebAuthnMetadataShape>();

      if (!metadata || typeof metadata !== 'object') {
        return false;
      }

      return (
        metadata._action === 'webauthn_authentication' ||
        metadata._type === 'WebAuthn' ||
        Object.prototype.hasOwnProperty.call(metadata, 'relyingPartyId') ||
        Object.prototype.hasOwnProperty.call(metadata, '_relyingPartyId')
      );
    });
}

function getWebAuthnOutcomeCallback(step?: JourneyStep | null): HiddenValueCallback | undefined {
  if (!step) {
    return undefined;
  }

  return step
    .getCallbacksOfType(callbackType.HiddenValueCallback)
    .find(
      (callback): callback is HiddenValueCallback =>
        (callback as HiddenValueCallback).getOutputByName<string>('id', '') === 'webAuthnOutcome',
    );
}
