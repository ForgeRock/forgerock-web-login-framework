<script lang="ts">
  import type { ValidatedCreatePasswordCallback } from '@forgerock/javascript-sdk';

  import {
    getValidationFailures,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import Base from '$journey/callbacks/password/base.svelte';
  import {
    type FailedPolicy,
    isInputRequired,
  } from '$journey/callbacks/_utilities/callback.utilities';
  import Policies from '$journey/callbacks/_utilities/policies.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Style } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export let callback: never;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export let stepMetadata: Maybe<StepMetadata>;
  export let style: Style = {};

  /**
   * At the time of this writing, this callback is never marked as required,
   * but I'm adding this here as that could change.
   */
  let typedCallback = callback as ValidatedCreatePasswordCallback;

  const isRequired = isInputRequired(typedCallback);

  let inputName: string;
  let isInvalid: boolean;
  let prompt: string;
  let validationFailures: FailedPolicy[];

  $: {
    /**
     * We need to wrap this in a reactive block, so it reruns the function
     * on value changes within `callback`
     */
    typedCallback = callback as ValidatedCreatePasswordCallback;
    inputName = typedCallback?.payload?.input?.[0].name || `password-${callbackMetadata?.idx}`;
    prompt = typedCallback.getPrompt();
    validationFailures = getValidationFailures(typedCallback, prompt);
    isInvalid = !!validationFailures.length;
  }
</script>

<Base
  callback={typedCallback}
  {callbackMetadata}
  {isInvalid}
  {isRequired}
  key={inputName}
  {selfSubmitFunction}
  showMessage={isInvalid}
  {stepMetadata}
  {style}
>
  <Policies callback={typedCallback} label={prompt} messageKey="passwordRequirements" />
</Base>
