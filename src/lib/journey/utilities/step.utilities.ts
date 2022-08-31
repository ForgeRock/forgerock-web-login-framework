import {
  FRCallback,
  FRStep,
  FRLoginFailure,
  FRLoginSuccess,
  StepType,
} from '@forgerock/javascript-sdk';

export const authIdTimeoutErrorCode = '110';
export const constrainedViolationMessage = 'constraint violation';

export function convertStringToKey(string?: string | null): string {
  if (!string) {
    return '';
  }

  const replaceFunction = (_: string, char: string): string => `${char.toLowerCase()}`;

  const normalizedString = string
    .replace(/^([A-Z])/g, replaceFunction)
    .replace(/\s([a-z])/g, (_, char) => `${char.toUpperCase()}`);
  const key = normalizedString.replace(/\W/g, '');
  return key;
}

export function shouldPopulateWithPreviousCallbacks(
  nextStep: FRLoginFailure,
  previousCallbacks: FRCallback[] | undefined,
  restartedStep: FRStep | FRLoginSuccess | FRLoginFailure,
  stepNumber: number,
) {
  if (!Array.isArray(previousCallbacks)) {
    return false;
  }
  if (restartedStep.type !== StepType.Step) {
    return false;
  }

  if (stepNumber !== 1) {
    return false;
  }

  const details = nextStep.payload.detail as { errorCode: string } | null;
  const message = nextStep.payload.message?.toLowerCase() as string | null;

  /**
   * Now that we know we have previous callbacks, this is of type "Step",
   * it has payload detail or payload message, and it's just the first step,
   * we can populate the new step with old callbacks.
   */
  if (
    details?.errorCode === authIdTimeoutErrorCode ||
    message?.includes(constrainedViolationMessage)
  ) {
    return true;
  }

  // Fallback to false
  return false;
}
