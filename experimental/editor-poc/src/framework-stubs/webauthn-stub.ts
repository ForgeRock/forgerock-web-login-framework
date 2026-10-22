// WebAuthn stub — browser platform-authenticator ceremonies (conditional
// mediation, credential get/create) cannot run meaningfully inside the editor
// preview, so the three ceremony methods throw at call time. Everything else
// on the real class is PURE STEP INSPECTION (no browser API), so it is
// mirrored here with the same behavior: getWebAuthnStepType,
// getMetadataCallback, getOutcomeCallback, getTextOutputCallback, getCallbacks.
// The webauthn.utilities.ts isMixedLoginWebAuthnStep check runs during the
// journey store's metadata build for EVERY step, so these statics must work —
// the task-1 version (throw-only) broke map-stage tests once the runtime
// started driving the real journey store (IAM-12011 task 5).
//
// Mirrors @forgerock/journey-client/dist/src/lib/webauthn/webauthn.js
// (journey-client 2.1.1) + enums.js values.
export const WebAuthnStepType = {
  None: 0,
  Authentication: 1,
  Registration: 2,
} as const;

export const WebAuthnOutcome = {
  Error: 'ERROR',
  Unsupported: 'unsupported',
} as const;

export const WebAuthnOutcomeType = {
  AbortError: 'AbortError',
  DataError: 'DataError',
  ConstraintError: 'ConstraintError',
  EncodingError: 'EncodingError',
  InvalidError: 'InvalidError',
  NetworkError: 'NetworkError',
  NotAllowedError: 'NotAllowedError',
  NotSupportedError: 'NotSupportedError',
  SecurityError: 'SecurityError',
  TimeoutError: 'TimeoutError',
  UnknownError: 'UnknownError',
} as const;

// Minimal structural types for what the inspection statics consume — the real
// signature is JourneyStep, but this stub cannot import the package it
// replaces. Only getCallbacksOfType + factory-built callback accessors are
// touched.
interface InspectableCallback {
  getOutputValue?: (name: string) => unknown;
  getMessage?: () => unknown;
  getOutputByName: (name: string, fallback?: unknown) => unknown;
}
interface InspectableStep {
  getCallbacksOfType: (type: string) => InspectableCallback[];
}

export class WebAuthn {
  static async isConditionalMediationSupported(): Promise<boolean> {
    throw new Error(
      'WebAuthn is not available in the editor preview: the AM journey is mocked (IAM-12011).',
    );
  }

  static async authenticate(): Promise<never> {
    throw new Error(
      'WebAuthn.authenticate is not available in the editor preview: the AM journey is mocked (IAM-12011).',
    );
  }

  static async register(): Promise<never> {
    throw new Error(
      'WebAuthn.register is not available in the editor preview: the AM journey is mocked (IAM-12011).',
    );
  }

  static getWebAuthnStepType(
    step: InspectableStep,
  ): (typeof WebAuthnStepType)[keyof typeof WebAuthnStepType] {
    const outcomeCallback = this.getOutcomeCallback(step);
    const metadataCallback = this.getMetadataCallback(step);
    const textOutputCallback = this.getTextOutputCallback(step);

    if (outcomeCallback && metadataCallback?.getOutputValue) {
      const metadata = metadataCallback.getOutputValue('data');
      if (metadata && typeof metadata === 'object' && 'pubKeyCredParams' in metadata) {
        return WebAuthnStepType.Registration;
      }
      return WebAuthnStepType.Authentication;
    }
    if (outcomeCallback && textOutputCallback?.getMessage) {
      const message = textOutputCallback.getMessage();
      if (typeof message === 'string' && message.includes('pubKeyCredParams')) {
        return WebAuthnStepType.Registration;
      }
      return WebAuthnStepType.Authentication;
    }
    return WebAuthnStepType.None;
  }

  static getCallbacks(step: InspectableStep): {
    hiddenCallback?: InspectableCallback;
    metadataCallback?: InspectableCallback;
    textOutputCallback?: InspectableCallback;
  } {
    const hiddenCallback = this.getOutcomeCallback(step);
    const metadataCallback = this.getMetadataCallback(step);
    const textOutputCallback = this.getTextOutputCallback(step);
    const returnObj: ReturnType<typeof WebAuthn.getCallbacks> = { hiddenCallback };
    if (metadataCallback) {
      returnObj.metadataCallback = metadataCallback;
    } else if (textOutputCallback) {
      returnObj.textOutputCallback = textOutputCallback;
    }
    return returnObj;
  }

  static getMetadataCallback(step: InspectableStep): InspectableCallback | undefined {
    return step.getCallbacksOfType('MetadataCallback').find((callback) => {
      const data = callback.getOutputByName('data', undefined);
      return Boolean(data) && typeof data === 'object' && data !== null && 'relyingPartyId' in data;
    });
  }

  static getOutcomeCallback(step: InspectableStep): InspectableCallback | undefined {
    return step
      .getCallbacksOfType('HiddenValueCallback')
      .find((callback) => callback.getOutputByName('id', '') === 'webAuthnOutcome');
  }

  static getTextOutputCallback(step: InspectableStep): InspectableCallback | undefined {
    return step.getCallbacksOfType('TextOutputCallback').find((callback) => {
      const message = callback.getOutputByName('message', undefined);
      return typeof message === 'string' && message.includes('webAuthnOutcome');
    });
  }
}
