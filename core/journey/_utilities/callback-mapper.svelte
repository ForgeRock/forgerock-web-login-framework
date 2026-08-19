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
  import RecaptchaEnterprise from '$journey/callbacks/recaptcha-enterprise/recaptcha-enterprise.svelte';
  import Redirect from '$journey/callbacks/redirect/redirect.svelte';
  import SelectIdp from '$journey/callbacks/select-idp/select-idp.svelte';
  import StringAttributeInput from '$journey/callbacks/string-attribute/string-attribute-input.svelte';
  import TermsConditions from '$journey/callbacks/terms-and-conditions/terms-conditions.svelte';
  import TextInput from '$journey/callbacks/text-input/text-input.svelte';
  import TextOutput from '$journey/callbacks/text-output/text-output.svelte';
  import Unknown from '$journey/callbacks/unknown/unknown.svelte';
  import Name from '$journey/callbacks/username/name.svelte';
  import ValidatedCreateUsername from '$journey/callbacks/username/validated-create-username.svelte';
  import { customCallbackRegistry } from './registry/custom-registry';

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
    ReCaptchaEnterpriseCallback,
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

  import type { CustomRegistryEntry } from './registry/custom-registry';
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
  type CallbackProps =
    | Props
    | (Props & { recoveryCodes: Array<string> })
    | (Props & { webAuthnValue: WebAuthnStepType });

  let { props }: { props: CallbackProps } = $props();

  let cbType = $derived(props.callback.getType());

  let _BooleanAttributeInputCallback = $derived(props.callback as AttributeInputCallback<boolean>);
  let _ChoiceCallback = $derived(
    cbType === callbackType.ChoiceCallback ? (props.callback as ChoiceCallback) : undefined,
  );
  let _ConfirmationCallback = $derived(
    cbType === callbackType.ConfirmationCallback
      ? (props.callback as ConfirmationCallback)
      : undefined,
  );
  let _HiddenValueCallback = $derived(
    cbType === callbackType.HiddenValueCallback
      ? (props.callback as HiddenValueCallback)
      : undefined,
  );
  let _KbaCreateCallback = $derived(
    cbType === callbackType.KbaCreateCallback ? (props.callback as KbaCreateCallback) : undefined,
  );
  let _NameCallback = $derived(
    cbType === callbackType.NameCallback ? (props.callback as NameCallback) : undefined,
  );
  let _PasswordCallback = $derived(
    cbType === callbackType.PasswordCallback ? (props.callback as PasswordCallback) : undefined,
  );
  let _PollingWaitCallback = $derived(
    cbType === callbackType.PollingWaitCallback
      ? (props.callback as PollingWaitCallback)
      : undefined,
  );
  let _RedirectCallback = $derived(
    cbType === callbackType.RedirectCallback ? (props.callback as RedirectCallback) : undefined,
  );
  let _SelectIdPCallback = $derived(
    cbType === callbackType.SelectIdPCallback ? (props.callback as SelectIdPCallback) : undefined,
  );
  let _StringAttributeInputCallback = $derived(
    cbType === callbackType.StringAttributeInputCallback
      ? (props.callback as AttributeInputCallback<string>)
      : undefined,
  );
  let _ValidatedCreatePasswordCallback = $derived(
    cbType === callbackType.ValidatedCreatePasswordCallback
      ? (props.callback as ValidatedCreatePasswordCallback)
      : undefined,
  );
  let _ValidatedCreateUsernameCallback = $derived(
    cbType === callbackType.ValidatedCreateUsernameCallback
      ? (props.callback as ValidatedCreateUsernameCallback)
      : undefined,
  );
  let _TermsAndConditionsCallback = $derived(
    cbType === callbackType.TermsAndConditionsCallback
      ? (props.callback as TermsAndConditionsCallback)
      : undefined,
  );
  let _TextInputCallback = $derived(
    cbType === callbackType.TextInputCallback ? (props.callback as TextInputCallback) : undefined,
  );
  let _TextOutputCallback = $derived(
    cbType === callbackType.TextOutputCallback ? (props.callback as TextOutputCallback) : undefined,
  );
  let _SuspendedTextOutputCallback = $derived(
    cbType === callbackType.SuspendedTextOutputCallback
      ? (props.callback as SuspendedTextOutputCallback)
      : undefined,
  );
  let _MetadataCallback = $derived(
    cbType === callbackType.MetadataCallback ? (props.callback as MetadataCallback) : undefined,
  );
  let _DeviceProfileCallback = $derived(
    cbType === callbackType.DeviceProfileCallback
      ? (props.callback as DeviceProfileCallback)
      : undefined,
  );
  let _RecaptchaCallback = $derived(
    cbType === callbackType.ReCaptchaCallback ? (props.callback as ReCaptchaCallback) : undefined,
  );
  let _RecaptchaEnterpriseCallback = $derived(
    cbType === callbackType.ReCaptchaEnterpriseCallback
      ? (props.callback as ReCaptchaEnterpriseCallback)
      : undefined,
  );
  let _PingProtectEvaluation = $derived(
    cbType === callbackType.PingOneProtectEvaluationCallback
      ? (props.callback as PingOneProtectEvaluationCallback)
      : undefined,
  );
  let _PingProtectInitialize = $derived(
    cbType === callbackType.PingOneProtectInitializeCallback
      ? (props.callback as PingOneProtectInitializeCallback)
      : undefined,
  );
  let _BaseCallback = $derived(
    !Object.values(callbackType).includes(cbType as callbackType)
      ? (props.callback as BaseCallback)
      : undefined,
  );
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
{:else if cbType === callbackType.ReCaptchaEnterpriseCallback}
  {@const newProps = {
    ...props,
    callback: _RecaptchaEnterpriseCallback,
  }}
  <RecaptchaEnterprise {...newProps} />
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
