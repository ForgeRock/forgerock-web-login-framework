<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  /**
   * This component exists entirely to map callbacks to their proper component
   * and explicitly assign the appropriate callback type to the component's props.
   *
   * TODO: This could possibly be simplified if the `callback.getType` method in the SDK
   * returned a union of the possible types, rather than just a generic `string` type.
   */

  import { callbackType } from '@forgerock/journey-client';

  // Callback handler components
  import Boolean from '$journey/callbacks/boolean/boolean.svelte';
  import Choice from '$journey/callbacks/choice/choice.svelte';
  import Confirmation from '$journey/callbacks/confirmation/confirmation.svelte';
  import DeviceProfile from '$journey/callbacks/device-profile/device-profile.svelte';
  import HiddenValue from '$journey/callbacks/hidden-value/hidden-value.svelte';
  import KbaCreate from '$journey/callbacks/kba/kba-create.svelte';
  import Metadata from '$journey/callbacks/metadata/metadata.svelte';
  import Password from '$journey/callbacks/password/password.svelte';
  import ValidatedCreatePassword from '$journey/callbacks/password/validated-create-password.svelte';
  import PingProtectEvaluation from '$journey/callbacks/ping-protect-evaluation/ping-protect-evaluation.svelte';
  import PingProtectInitialize from '$journey/callbacks/ping-protect-initialize/ping-protect-initialize.svelte';
  import PollingWait from '$journey/callbacks/polling-wait/polling-wait.svelte';
  import Recaptcha from '$journey/callbacks/recaptcha/recaptcha.svelte';
  import Redirect from '$journey/callbacks/redirect/redirect.svelte';
  import SelectIdp from '$journey/callbacks/select-idp/select-idp.svelte';
  import StringAttributeInput from '$journey/callbacks/string-attribute/string-attribute-input.svelte';
  import TermsConditions from '$journey/callbacks/terms-and-conditions/terms-conditions.svelte';
  import TextInput from '$journey/callbacks/text-input/text-input.svelte';
  import TextOutput from '$journey/callbacks/text-output/text-output.svelte';
  import Unknown from '$journey/callbacks/unknown/unknown.svelte';
  import Name from '$journey/callbacks/username/name.svelte';
  import ValidatedCreateUsername from '$journey/callbacks/username/validated-create-username.svelte';
  import { customCallbackRegistry } from './custom-registry';

  import type {
    AttributeInputCallback,
    BaseCallback,
    ChoiceCallback,
    ConfirmationCallback,
    DeviceProfileCallback,
    HiddenValueCallback,
    KbaCreateCallback,
    MetadataCallback,
    NameCallback,
    PasswordCallback,
    PingOneProtectEvaluationCallback,
    PingOneProtectInitializeCallback,
    PollingWaitCallback,
    ReCaptchaCallback,
    RedirectCallback,
    SelectIdPCallback,
    SuspendedTextOutputCallback,
    TermsAndConditionsCallback,
    TextInputCallback,
    TextOutputCallback,
    ValidatedCreatePasswordCallback,
    ValidatedCreateUsernameCallback,
  } from '@forgerock/journey-client/types';
  import type { WebAuthnStepType } from '@forgerock/journey-client/webauthn';
  import type { z } from 'zod';

  import type { CustomRegistryEntry } from './custom-registry';
  import type { Maybe } from '$core/interfaces';
  import type { styleSchema } from '$core/style.store';
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';

  type Props = {
    callback: BaseCallback;
    callbackMetadata: Maybe<CallbackMetadata>;
    selfSubmitFunction: SelfSubmitFunction;
    stepMetadata: Maybe<StepMetadata>;
    style: z.infer<typeof styleSchema>;
  };
  export let props:
    | Props
    | (Props & { recoveryCodes: Array<string> })
    | (Props & { webAuthnValue: WebAuthnStepType });

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
  let _TextInputCallback: TextInputCallback;
  let _TextOutputCallback: TextOutputCallback;
  let _SuspendedTextOutputCallback: SuspendedTextOutputCallback;
  let _MetadataCallback: MetadataCallback;
  let _DeviceProfileCallback: DeviceProfileCallback;
  let _RecaptchaCallback: ReCaptchaCallback;
  let _PingProtectEvaluation: PingOneProtectEvaluationCallback;
  let _PingProtectInitialize: PingOneProtectInitializeCallback;
  let _BaseCallback: BaseCallback;

  $: {
    cbType = props.callback.getType();

    switch (cbType) {
      case callbackType.BooleanAttributeInputCallback:
        _BooleanAttributeInputCallback = props.callback as AttributeInputCallback<boolean>;
        break;
      case callbackType.ChoiceCallback:
        _ChoiceCallback = props.callback as ChoiceCallback;
        break;
      case callbackType.ConfirmationCallback:
        _ConfirmationCallback = props.callback as ConfirmationCallback;
        break;
      case callbackType.HiddenValueCallback:
        _HiddenValueCallback = props.callback as HiddenValueCallback;
        break;
      case callbackType.KbaCreateCallback:
        _KbaCreateCallback = props.callback as KbaCreateCallback;
        break;
      case callbackType.NameCallback:
        _NameCallback = props.callback as NameCallback;
        break;
      case callbackType.ReCaptchaCallback:
        _RecaptchaCallback = props.callback as ReCaptchaCallback;
        break;
      case callbackType.PasswordCallback:
        _PasswordCallback = props.callback as PasswordCallback;
        break;
      case callbackType.PollingWaitCallback:
        _PollingWaitCallback = props.callback as PollingWaitCallback;
        break;
      case callbackType.RedirectCallback:
        _RedirectCallback = props.callback as RedirectCallback;
        break;
      case callbackType.SelectIdPCallback:
        _SelectIdPCallback = props.callback as SelectIdPCallback;
        break;
      case callbackType.StringAttributeInputCallback:
        _StringAttributeInputCallback = props.callback as AttributeInputCallback<string>;
        break;
      case callbackType.ValidatedCreatePasswordCallback:
        _ValidatedCreatePasswordCallback = props.callback as ValidatedCreatePasswordCallback;
        break;
      case callbackType.ValidatedCreateUsernameCallback:
        _ValidatedCreateUsernameCallback = props.callback as ValidatedCreateUsernameCallback;
        break;
      case callbackType.TermsAndConditionsCallback:
        _TermsAndConditionsCallback = props.callback as TermsAndConditionsCallback;
        break;
      case callbackType.TextInputCallback:
        _TextInputCallback = props.callback as TextInputCallback;
        break;
      case callbackType.TextOutputCallback:
        _TextOutputCallback = props.callback as TextOutputCallback;
        break;
      case callbackType.SuspendedTextOutputCallback:
        _SuspendedTextOutputCallback = props.callback as SuspendedTextOutputCallback;
        break;
      case callbackType.DeviceProfileCallback:
        _DeviceProfileCallback = props.callback as DeviceProfileCallback;
        break;
      case callbackType.MetadataCallback:
        _MetadataCallback = props.callback as MetadataCallback;
        break;
      case callbackType.PingOneProtectEvaluationCallback:
        _PingProtectEvaluation = props.callback as PingOneProtectEvaluationCallback;
        break;
      case callbackType.PingOneProtectInitializeCallback:
        _PingProtectInitialize = props.callback as PingOneProtectInitializeCallback;
        break;
      default:
        _BaseCallback = props.callback as BaseCallback;
    }
  }
</script>

{#if customCallbackRegistry[cbType]}
  {@const _entry = customCallbackRegistry[cbType] as CustomRegistryEntry}
  {@const _filteredProps = Object.fromEntries(
    Object.entries(props).filter(([k]) => _entry.acceptedProps.includes(k)),
  )}
  <svelte:component this={_entry.component} {..._filteredProps} />
{:else if cbType === callbackType.BooleanAttributeInputCallback}
  {@const newProps = {
    ...props,
    callback: _BooleanAttributeInputCallback,
  }}
  <Boolean {...newProps} />
{:else if cbType === callbackType.ChoiceCallback}
  {@const newProps = {
    ...props,
    callback: _ChoiceCallback,
  }}
  <Choice {...newProps} />
{:else if cbType === callbackType.ConfirmationCallback}
  {@const newProps = {
    ...props,
    callback: _ConfirmationCallback,
  }}
  <Confirmation {...newProps} />
{:else if cbType === callbackType.HiddenValueCallback}
  {@const newProps = {
    ...props,
    callback: _HiddenValueCallback,
  }}
  <HiddenValue {...newProps} />
{:else if cbType === callbackType.KbaCreateCallback}
  {@const newProps = {
    ...props,
    callback: _KbaCreateCallback,
  }}
  <KbaCreate {...newProps} />
{:else if cbType === callbackType.NameCallback}
  {@const newProps = {
    ...props,
    callback: _NameCallback,
  }}
  <Name {...newProps} />
{:else if cbType === callbackType.PasswordCallback}
  {@const newProps = {
    ...props,
    callback: _PasswordCallback,
  }}
  <Password {...newProps} />
{:else if cbType === callbackType.PollingWaitCallback}
  {@const newProps = {
    ...props,
    callback: _PollingWaitCallback,
  }}
  <PollingWait {...newProps} />
{:else if cbType === callbackType.RedirectCallback}
  {@const newProps = {
    ...props,
    callback: _RedirectCallback,
  }}
  <Redirect {...newProps} />
{:else if cbType === callbackType.SelectIdPCallback}
  {@const newProps = {
    ...props,
    callback: _SelectIdPCallback,
  }}
  <SelectIdp {...newProps} />
{:else if cbType === callbackType.StringAttributeInputCallback}
  {@const newProps = {
    ...props,
    callback: _StringAttributeInputCallback,
  }}
  <StringAttributeInput {...newProps} />
{:else if cbType === callbackType.ValidatedCreatePasswordCallback}
  {@const newProps = {
    ...props,
    callback: _ValidatedCreatePasswordCallback,
  }}
  <ValidatedCreatePassword {...newProps} />
{:else if cbType === callbackType.ValidatedCreateUsernameCallback}
  {@const newProps = {
    ...props,
    callback: _ValidatedCreateUsernameCallback,
  }}
  <ValidatedCreateUsername {...newProps} />
{:else if cbType === callbackType.TermsAndConditionsCallback}
  {@const newProps = {
    ...props,
    callback: _TermsAndConditionsCallback,
  }}
  <TermsConditions {...newProps} />
{:else if cbType === callbackType.TextInputCallback}
  {@const newProps = {
    ...props,
    callback: _TextInputCallback,
  }}
  <TextInput {...newProps} />
{:else if cbType === callbackType.TextOutputCallback}
  {@const newProps = {
    ...props,
    callback: _TextOutputCallback,
  }}
  <TextOutput {...newProps} />
{:else if cbType === callbackType.SuspendedTextOutputCallback}
  {@const newProps = {
    ...props,
    callback: _SuspendedTextOutputCallback,
  }}
  <TextOutput {...newProps} />
{:else if cbType === callbackType.DeviceProfileCallback}
  {@const newProps = {
    ...props,
    callback: _DeviceProfileCallback,
  }}
  <DeviceProfile {...newProps} />
{:else if cbType === callbackType.MetadataCallback}
  {@const newProps = {
    ...props,
    callback: _MetadataCallback,
  }}
  <Metadata {...newProps} />
{:else if cbType === callbackType.ReCaptchaCallback}
  {@const newProps = {
    ...props,
    callback: _RecaptchaCallback,
  }}
  <Recaptcha {...newProps} />
{:else if cbType === callbackType.PingOneProtectEvaluationCallback}
  {@const newProps = {
    ...props,
    callback: _PingProtectEvaluation,
  }}
  <PingProtectEvaluation {...newProps} />
{:else if cbType === callbackType.PingOneProtectInitializeCallback}
  {@const newProps = {
    ...props,
    callback: _PingProtectInitialize,
  }}
  <PingProtectInitialize {...newProps} />
{:else}
  {@const newProps = {
    ...props,
    callback: _BaseCallback,
  }}
  <Unknown {...newProps} />
{/if}
