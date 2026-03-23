/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import {
  CallbackType,
  FRWebAuthn,
  WebAuthnStepType,
  type FRStep,
  type HiddenValueCallback,
  type MetadataCallback,
  type WebAuthnAuthenticationMetadata,
} from '@forgerock/javascript-sdk';

type WebAuthnMetadataShape = Partial<WebAuthnAuthenticationMetadata> & {
  _action?: string;
  _type?: string;
  pubKeyCredParams?: unknown;
  relyingPartyId?: string;
  _relyingPartyId?: string;
};

export function isMixedLoginWebAuthnStep(step?: FRStep | null): boolean {
  if (!step || !isWebAuthnAuthenticationStep(step)) {
    return false;
  }

  const hasNameCallback = step.getCallbacksOfType(CallbackType.NameCallback).length > 0;
  const hasMetadataCallback = !!getWebAuthnMetadataCallback(step);
  const hasOutcomeCallback = !!getWebAuthnOutcomeCallback(step);

  return hasNameCallback && hasMetadataCallback && hasOutcomeCallback;
}

export function isWebAuthnAuthenticationStep(step?: FRStep | null): boolean {
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

  return FRWebAuthn.getWebAuthnStepType(step) === WebAuthnStepType.Authentication;
}

function getWebAuthnMetadataCallback(step?: FRStep | null): MetadataCallback | undefined {
  if (!step) {
    return undefined;
  }

  return step
    .getCallbacksOfType(CallbackType.MetadataCallback)
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

function getWebAuthnOutcomeCallback(step?: FRStep | null): HiddenValueCallback | undefined {
  if (!step) {
    return undefined;
  }

  return step
    .getCallbacksOfType(CallbackType.HiddenValueCallback)
    .find(
      (callback): callback is HiddenValueCallback =>
        (callback as HiddenValueCallback).getOutputByName<string>('id', '') === 'webAuthnOutcome',
    );
}
