/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { FRWebAuthn, StepType, type FRStep } from '@forgerock/javascript-sdk';

import type { StepTypes } from '$journey/journey.interfaces';

import { isMixedLoginWebAuthnStep } from '../_utilities/webauthn.utilities';

type AuthenticateOptions = {
  useConditionalMediation?: boolean;
};

export async function shouldAttemptPasskeyAutofill(step?: FRStep | null): Promise<boolean> {
  if (!isMixedLoginWebAuthnStep(step)) {
    return false;
  }

  return FRWebAuthn.isConditionalMediationSupported();
}

export async function authenticateWebAuthnStep(
  step: FRStep,
  options: AuthenticateOptions = {},
): Promise<FRStep> {
  if (!options.useConditionalMediation) {
    return FRWebAuthn.authenticate(step);
  }

  return FRWebAuthn.authenticate(step, (requestOptions) => ({
    ...requestOptions,
    mediation: 'conditional',
  }));
}

export function abortWebAuthnOperation(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.PingWebAuthnAbortController?.abort();
}

export type PasskeyAutofillHandlerAction = 'update' | 'submit' | 'destroy';

type PasskeyAutofillHandlerOptions = {
  onSubmit: (step: FRStep) => void | Promise<void>;
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
  let passkeyAutofillPending = false;
  let passkeyAutofillRequestedForAuthId: string | null = null;
  let passkeyAutofillPendingAuthId: string | null = null;

  return async function handlePasskeyAutofill(
    action: PasskeyAutofillHandlerAction,
    step?: StepTypes,
  ): Promise<void> {
    if (action === 'submit' || action === 'destroy') {
      if (passkeyAutofillPending) {
        abortWebAuthnOperation();
        passkeyAutofillPending = false;
        passkeyAutofillPendingAuthId = null;
      }
      return;
    }

    // action === 'update'
    if (!step || step.type !== StepType.Step) {
      return;
    }

    const authId = getStepAuthId(step);

    // If the step changes while an autofill attempt is in-flight,
    // abort to prevent leaking an active WebAuthn request.
    if (
      passkeyAutofillPending &&
      passkeyAutofillPendingAuthId &&
      authId &&
      authId !== passkeyAutofillPendingAuthId
    ) {
      abortWebAuthnOperation();
      passkeyAutofillPending = false;
      passkeyAutofillPendingAuthId = null;
    }

    if (!authId || passkeyAutofillRequestedForAuthId === authId) {
      return;
    }

    passkeyAutofillRequestedForAuthId = authId;

    if (!(await shouldAttemptPasskeyAutofill(step))) {
      return;
    }

    try {
      passkeyAutofillPending = true;
      passkeyAutofillPendingAuthId = authId;

      const updatedStep = await authenticateWebAuthnStep(step, { useConditionalMediation: true });

      passkeyAutofillPending = false;
      passkeyAutofillPendingAuthId = null;

      await options.onSubmit(updatedStep);
    } catch (error) {
      passkeyAutofillPending = false;
      passkeyAutofillPendingAuthId = null;
      console.debug('Passkey autofill attempt did not complete', error);
    }
  };
}
