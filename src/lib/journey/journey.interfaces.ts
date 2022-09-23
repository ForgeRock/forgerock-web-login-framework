import type { FRStep, FRLoginFailure, FRLoginSuccess } from '@forgerock/javascript-sdk';
import type { Step, StepOptions } from '@forgerock/javascript-sdk/lib/auth/interfaces';
import type { Writable } from 'svelte/store';

import type { Maybe } from '$lib/interfaces';

// type Callbacks = CallbackType.BooleanAttributeInputCallback
// | CallbackType.ChoiceCallback
// | CallbackType.ConfirmationCallback
// | CallbackType.DeviceProfileCallback
// | CallbackType.HiddenValueCallback
// | CallbackType.KbaCreateCallback
// | CallbackType.MetadataCallback
// | CallbackType.NameCallback
// | CallbackType.NumberAttributeInputCallback
// | CallbackType.PasswordCallback
// | CallbackType.PollingWaitCallback
// | CallbackType.ReCaptchaCallback
// | CallbackType.RedirectCallback
// | CallbackType.SelectIdPCallback
// | CallbackType.StringAttributeInputCallback
// | CallbackType.SuspendedTextOutputCallback
// | CallbackType.TermsAndConditionsCallback
// | CallbackType.TextOutputCallback
// | CallbackType.ValidatedCreatePasswordCallback
// | CallbackType.ValidatedCreateUsernameCallback;

export interface JourneyStore extends Pick<Writable<JourneyStoreValue>, 'subscribe'> {
  next: (prevStep?: StepTypes, nextOptions?: StepOptions) => void;
  reset: () => void;
}
export interface JourneyStoreValue {
  completed: boolean;
  error: Maybe<{
    code: Maybe<number>;
    message: Maybe<string>;
    step: Maybe<Step>;
  }>;
  loading: boolean;
  step: StepTypes;
  successful: boolean;
  response: Maybe<Step>;
}
export type StepTypes = WidgetStep | FRLoginSuccess | FRLoginFailure | null;
export interface WidgetStep extends FRStep {
  /**
   * TODO: It's complicated, but this `any` is needed for `callback` compatibility with
   * the `mapCallbackToComponent`. FRStep types this callback array as `FRCallback[]`
   * which is not _exactly_ correct as it's an array of various types of callbacks, all
   * which extend FRCallback. So, there are heterogeneous types within the array.
   */
  callbacks: any[];
}
