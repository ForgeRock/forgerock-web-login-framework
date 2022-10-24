<script lang="ts">
  import type { ValidatedCreatePasswordCallback } from '@forgerock/javascript-sdk';

  import {
    getValidationPolicies,
    getValidationFailures,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import Base from '$journey/callbacks/password/base.svelte';
  import {
    type FailedPolicy,
    isInputRequired,
    type Policy,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import Policies from '$journey/callbacks/_utilities/policies.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export let callback: ValidatedCreatePasswordCallback;
  export let callbackMetadata: CallbackMetadata;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: StepMetadata;
  export let style: Style = {};

  /**
   * At the time of this writing, this callback is never marked as required,
   * but I'm adding this here as that could change.
   */
  const isRequired = isInputRequired(callback);

  let inputName: string;
  let prompt: string;
  let validationRules: Policy[];
  let validationFailures: FailedPolicy[];
  let isInvalid: boolean;

  $: {
    /**
     * We need to wrap this in a reactive block, so it reruns the function
     * on value changes within `callback`
     */
    inputName = callback?.payload?.input?.[0].name || `password-${callbackMetadata.idx}`;
    prompt = callback.getPrompt();
    validationRules = getValidationPolicies(callback.getPolicies());
    validationFailures = getValidationFailures(callback, prompt);
    isInvalid = !!validationFailures.length;
  }
</script>

<Base
  {callback}
  {callbackMetadata}
  {isInvalid}
  {isRequired}
  key={inputName}
  {selfSubmitFunction}
  showMessage={isInvalid}
  {stepMetadata}
  {style}
>
  <Policies {callback} label={prompt} messageKey="passwordRequirements" />
</Base>
