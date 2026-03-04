import { Effect, Schema, pipe } from 'effect';
import { UrlParams } from '@effect/platform';

import type { AmCallbackInput, StepCookieData } from '$server/cookie-crypto';
import { StepMappingError } from '$server/errors';

/** Result of merging form data into a step — includes any warnings for structured logging. */
export interface MergeResult {
  readonly step: StepCookieData;
  readonly warnings: readonly string[];
}

/**
 * Merge FormData values into AM step callbacks by matching IDToken names.
 *
 * AM callbacks have `input` arrays with entries like `{ name: "IDToken1", value: "" }`.
 * HTML forms submit `IDToken1=jsmith`, `IDToken2=s3cret`, etc.
 * This function walks each callback's inputs and fills in the matching FormData values.
 *
 * Returns the merged step data alongside any warnings (e.g., unexpected File values,
 * non-numeric values for numeric callbacks). The caller logs warnings via Effect.
 *
 * Special cases:
 * - **Boolean/checkbox callbacks**: Unchecked HTML checkboxes are absent from FormData.
 *   If an input name is missing from FormData and the callback type suggests a boolean
 *   (TermsAndConditionsCallback, BooleanAttributeInputCallback), the value defaults to `false`.
 * - **Multi-value callbacks**: Some callbacks (KBA) have multiple inputs per callback.
 *   Each input has a unique name, so the standard matching works.
 * - **Hidden/auto-submit callbacks**: DeviceProfileCallback, PollingWaitCallback, etc.
 *   have inputs but don't render visible form fields. Their values stay as-is from the
 *   step cookie (they were set by client-side JS in Tier 2, or remain empty in Tier 1).
 */
export const mergeFormDataIntoStep = (
  stepData: StepCookieData,
  formData: FormData,
): MergeResult => {
  const warnings: string[] = [];

  const callbacks = stepData.callbacks.map((callback) => ({
    ...callback,
    input: callback.input.map((input) => {
      const { input: merged, warning } = mergeInput(input, callback.type, formData);
      if (warning) warnings.push(warning);
      return merged;
    }),
  }));

  return {
    step: { ...stepData, callbacks },
    warnings,
  };
};

/**
 * Merge a single callback input with the corresponding FormData value.
 */
const mergeInput = (
  input: AmCallbackInput,
  callbackType: string,
  formData: FormData,
): { readonly input: AmCallbackInput; readonly warning?: string } => {
  const formValue = formData.get(input.name);

  if (formValue === null) {
    // Checkbox/boolean inputs: unchecked = absent from FormData → false
    if (isBooleanCallback(callbackType)) {
      return { input: { ...input, value: false } };
    }
    // Non-boolean input missing from FormData → keep existing value
    // This handles auto-submit callbacks (DeviceProfile, PollingWait) and
    // hidden values that don't have form fields
    return { input };
  }

  // FormData.get() returns string | File. We only expect string values.
  if (typeof formValue !== 'string') {
    return {
      input,
      warning: `Unexpected File value for input "${input.name}" (callback: ${callbackType}) — keeping original value`,
    };
  }

  // Coerce string values to appropriate types based on callback type
  const { value, warning } = coerceValue(formValue, callbackType);
  return { input: { ...input, value }, warning };
};

// ─── Callback Type Categories ─────────────────────────────────────────────

/**
 * Callback types where absence from FormData means `false` (unchecked checkbox).
 * ConfirmationCallback appears here because unsubmitted confirmations default to false.
 */
const BooleanCallbackType = Schema.Literal(
  'TermsAndConditionsCallback',
  'BooleanAttributeInputCallback',
  'ConfirmationCallback',
);

/**
 * Callback types whose FormData values should be coerced to numbers (selected index).
 * ConfirmationCallback also appears here — when *submitted*, the value is a numeric index.
 */
const NumericCallbackType = Schema.Literal('ChoiceCallback', 'ConfirmationCallback');

const isBooleanCallback = Schema.is(BooleanCallbackType);
const isNumericCallback = Schema.is(NumericCallbackType);

/**
 * Coerce a FormData string value to the appropriate type for AM.
 *
 * AM expects specific types in callback input values:
 * - ChoiceCallback, ConfirmationCallback: number (selected index)
 * - BooleanAttributeInputCallback, TermsAndConditionsCallback: boolean
 * - Everything else: string
 */
const coerceValue = (
  formValue: string,
  callbackType: string,
): { readonly value: unknown; readonly warning?: string } => {
  if (isNumericCallback(callbackType)) {
    const num = Number(formValue);
    if (Number.isNaN(num)) {
      return {
        value: formValue,
        warning: `Non-numeric value "${formValue}" for numeric callback ${callbackType} — passing raw string to AM`,
      };
    }
    return { value: num };
  }
  if (isBooleanCallback(callbackType)) {
    return { value: formValue === 'true' || formValue === 'on' || formValue === '1' };
  }
  return { value: formValue };
};

/**
 * Build the AM authenticate request body from step data.
 * Combines the authId with the merged callbacks into the format AM expects.
 */
export const buildAmRequestBody = (
  authId: string,
  stepData: StepCookieData,
): Effect.Effect<string, StepMappingError> =>
  Effect.try({
    try: () => JSON.stringify({ authId, callbacks: stepData.callbacks }),
    catch: (cause) =>
      new StepMappingError({ message: `Failed to serialize request body: ${cause}` }),
  });

/**
 * Extract the query string for AM authenticate requests from step data.
 * Preserves authIndexType and authIndexValue across multi-step flows.
 */
export const buildAmQueryString = (stepData: StepCookieData): string =>
  pipe(
    UrlParams.fromInput({
      ...(stepData.authIndexType ? { authIndexType: stepData.authIndexType } : {}),
      ...(stepData.authIndexValue ? { authIndexValue: stepData.authIndexValue } : {}),
    }),
    UrlParams.toString,
  );
