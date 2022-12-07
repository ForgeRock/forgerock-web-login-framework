import { CallbackType, type FRCallback } from '@forgerock/javascript-sdk';

// Callback handler components
import Boolean from '$journey/callbacks/boolean/boolean.svelte';
import Choice from '$journey/callbacks/choice/choice.svelte';
import Confirmation from '$journey/callbacks/confirmation/confirmation.svelte';
import HiddenValue from '$journey/callbacks/hidden-value/hidden-value.svelte';
import KbaCreate from '$journey/callbacks/kba/kba-create.svelte';
import Name from '$journey/callbacks/username/name.svelte';
import Password from '$journey/callbacks/password/password.svelte';
import PollingWait from '$journey/callbacks/polling-wait/polling-wait.svelte';
import Redirect from '$journey/callbacks/redirect/redirect.svelte';
import SelectIdp from '$journey/callbacks/select-idp/select-idp.svelte';
import StringAttributeInput from '$journey/callbacks/string-attribute/string-attribute-input.svelte';
import TermsConditions from '$journey/callbacks/terms-and-conditions/terms-conditions.svelte';
import TextOutput from '$journey/callbacks/text-output/text-output.svelte';
import Unknown from '$journey/callbacks/unknown/unknown.svelte';
import ValidatedCreatePassword from '$journey/callbacks/password/validated-create-password.svelte';
import ValidatedCreateUsername from '$journey/callbacks/username/validated-create-username.svelte';

/**
 * Iterate through callbacks received from AM and map the callback to the
 * appropriate callback component, pushing that component
 * the StepComponent's array.
 */
export function mapCallbackToComponent(cb: FRCallback) {
  /** *********************************************************************
   * SDK INTEGRATION POINT
   * Summary:SDK callback method for getting the callback type
   * ----------------------------------------------------------------------
   * Details: This method is helpful in quickly identifying the callback
   * when iterating through an unknown list of AM callbacks
   ********************************************************************* */
  switch (cb.getType()) {
    case CallbackType.BooleanAttributeInputCallback:
      return Boolean;
    case CallbackType.ChoiceCallback:
      return Choice;
    case CallbackType.ConfirmationCallback:
      return Confirmation;
    case CallbackType.HiddenValueCallback:
      return HiddenValue;
    case CallbackType.KbaCreateCallback:
      return KbaCreate;
    case CallbackType.NameCallback:
      return Name;
    case CallbackType.PasswordCallback:
      return Password;
    case CallbackType.PollingWaitCallback:
      return PollingWait;
    case CallbackType.RedirectCallback:
      return Redirect;
    case CallbackType.SelectIdPCallback:
      return SelectIdp;
    case CallbackType.StringAttributeInputCallback:
      return StringAttributeInput;
    case CallbackType.ValidatedCreatePasswordCallback:
      return ValidatedCreatePassword;
    case CallbackType.ValidatedCreateUsernameCallback:
      return ValidatedCreateUsername;
    case CallbackType.TermsAndConditionsCallback:
      return TermsConditions;
    // Intentional fall-through
    case CallbackType.TextOutputCallback:
    case CallbackType.SuspendedTextOutputCallback:
      return TextOutput;
    default:
      return Unknown;
  }
}
