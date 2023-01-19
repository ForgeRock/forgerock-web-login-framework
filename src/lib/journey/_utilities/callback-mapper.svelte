<script lang="ts">
  /**
   * This component exists entirely to map callbacks to their proper component
   * and explicitly assign the appropriate callback type to the component's props.
   *
   * TODO: This could possibly be simplified if the `callback.getType` method in the SDK
   * returned a union of the possible types, rather than just a generic `string` type.
  */

  import { CallbackType } from '@forgerock/javascript-sdk';

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

  import type {
    AttributeInputCallback,
    ChoiceCallback,
    ConfirmationCallback,
    HiddenValueCallback,
    KbaCreateCallback,
    NameCallback,
    PasswordCallback,
    PollingWaitCallback,
    RedirectCallback,
    SelectIdPCallback,
    SuspendedTextOutputCallback,
    TermsAndConditionsCallback,
    TextOutputCallback,
    ValidatedCreatePasswordCallback,
    ValidatedCreateUsernameCallback,
    FRCallback,
  } from '@forgerock/javascript-sdk';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export let props: {
    callback: FRCallback;
    callbackMetadata: Maybe<CallbackMetadata>;
    selfSubmitFunction: SelfSubmitFunction;
    stepMetadata: Maybe<StepMetadata>;
    style: Style;
  };

  let cbType: string;

  let _BooleanAttributeInputCallback: AttributeInputCallback<boolean>;
  let _ChoiceCallback: ChoiceCallback;
  let _ConfirmationCallback: ConfirmationCallback;
  let _HiddenValueCallback: HiddenValueCallback;
  let _KbaCreateCallback: KbaCreateCallback;
  let _NameCallback: NameCallback;
  let _PasswordCallback: PasswordCallback;
  let _PollingWaitCallback: PollingWaitCallback;
  let _RedirectCallback: RedirectCallback;
  let _SelectIdPCallback: SelectIdPCallback;
  let _StringAttributeInputCallback: AttributeInputCallback<string>;
  let _ValidatedCreatePasswordCallback: ValidatedCreatePasswordCallback;
  let _ValidatedCreateUsernameCallback: ValidatedCreateUsernameCallback;
  let _TermsAndConditionsCallback: TermsAndConditionsCallback;
  let _TextOutputCallback: TextOutputCallback;
  let _SuspendedTextOutputCallback: SuspendedTextOutputCallback;
  let _FRCallback: FRCallback;

  $: {
    cbType = props.callback.getType();

    _BooleanAttributeInputCallback = props.callback as AttributeInputCallback<boolean>;
    _ChoiceCallback = props.callback as ChoiceCallback;
    _ConfirmationCallback = props.callback as ConfirmationCallback;
    _HiddenValueCallback = props.callback as HiddenValueCallback;
    _KbaCreateCallback = props.callback as KbaCreateCallback;
    _NameCallback = props.callback as NameCallback;
    _PasswordCallback = props.callback as PasswordCallback;
    _PollingWaitCallback = props.callback as PollingWaitCallback;
    _RedirectCallback = props.callback as RedirectCallback;
    _SelectIdPCallback = props.callback as SelectIdPCallback;
    _StringAttributeInputCallback = props.callback as AttributeInputCallback<string>;
    _ValidatedCreatePasswordCallback = props.callback as ValidatedCreatePasswordCallback;
    _ValidatedCreateUsernameCallback = props.callback as ValidatedCreateUsernameCallback;
    _TermsAndConditionsCallback = props.callback as TermsAndConditionsCallback;
    _TextOutputCallback = props.callback as TextOutputCallback;
    _SuspendedTextOutputCallback = props.callback as SuspendedTextOutputCallback;
    _FRCallback = props.callback as FRCallback;
  }
</script>

{#if cbType === CallbackType.BooleanAttributeInputCallback}
  {@const newProps = {
    ...props,
    callback: _BooleanAttributeInputCallback,
  }}
  <Boolean {...newProps} />
{:else if cbType === CallbackType.ChoiceCallback}
  {@const newProps = {
    ...props,
    callback: _ChoiceCallback,
  }}
  <Choice {...newProps} />
{:else if cbType === CallbackType.ConfirmationCallback}
  {@const newProps = {
    ...props,
    callback: _ConfirmationCallback,
  }}
  <Confirmation {...newProps} />
{:else if cbType === CallbackType.HiddenValueCallback}
  {@const newProps = {
    ...props,
    callback: _HiddenValueCallback,
  }}
  <HiddenValue {...newProps} />
{:else if cbType === CallbackType.KbaCreateCallback}
  {@const newProps = {
    ...props,
    callback: _KbaCreateCallback,
  }}
  <KbaCreate {...newProps} />
{:else if cbType === CallbackType.NameCallback}
  {@const newProps = {
    ...props,
    callback: _NameCallback,
  }}
  <Name {...newProps} />
{:else if cbType === CallbackType.PasswordCallback}
  {@const newProps = {
    ...props,
    callback: _PasswordCallback,
  }}
  <Password {...newProps} />
{:else if cbType === CallbackType.PollingWaitCallback}
  {@const newProps = {
    ...props,
    callback: _PollingWaitCallback,
  }}
  <PollingWait {...newProps} />
{:else if cbType === CallbackType.RedirectCallback}
  {@const newProps = {
    ...props,
    callback: _RedirectCallback,
  }}
  <Redirect {...newProps} />
{:else if cbType === CallbackType.SelectIdPCallback}
  {@const newProps = {
    ...props,
    callback: _SelectIdPCallback,
  }}
  <SelectIdp {...newProps} />
{:else if cbType === CallbackType.StringAttributeInputCallback}
  {@const newProps = {
    ...props,
    callback: _StringAttributeInputCallback,
  }}
  <StringAttributeInput {...newProps} />
{:else if cbType === CallbackType.ValidatedCreatePasswordCallback}
  {@const newProps = {
    ...props,
    callback: _ValidatedCreatePasswordCallback,
  }}
  <ValidatedCreatePassword {...newProps} />
{:else if cbType === CallbackType.ValidatedCreateUsernameCallback}
  {@const newProps = {
    ...props,
    callback: _ValidatedCreateUsernameCallback,
  }}
  <ValidatedCreateUsername {...newProps} />
{:else if cbType === CallbackType.TermsAndConditionsCallback}
  {@const newProps = {
    ...props,
    callback: _TermsAndConditionsCallback,
  }}
  <TermsConditions {...newProps} />
{:else if cbType === CallbackType.TextOutputCallback}
  {@const newProps = {
    ...props,
    callback: _TextOutputCallback,
  }}
  <TextOutput {...newProps} />
{:else if cbType === CallbackType.SuspendedTextOutputCallback}
  {@const newProps = {
    ...props,
    callback: _SuspendedTextOutputCallback,
  }}
  <TextOutput {...newProps} />
{:else}
  {@const newProps = {
    ...props,
    callback: _FRCallback,
  }}
  <Unknown {...newProps} />
{/if}
