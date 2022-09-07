<script lang="ts">
  import type { ValidatedCreatePasswordCallback } from '@forgerock/javascript-sdk';

  import { getValidationFailures } from '$journey/callbacks/_utilities/callback.utilities';
  import Base from '$journey/callbacks/password/base.svelte';
  import { isInputRequired } from '$journey/callbacks/_utilities/callback.utilities';
  import Policies from '$journey/callbacks/_utilities/policies.svelte';

  export let callback: ValidatedCreatePasswordCallback;
  export let firstInvalidInput: boolean;
  export let idx: number;

  /**
   * At the time of this writing, this callback is never marked as required,
   * but I'm adding this here as that could easily change.
   */
  const isRequired = isInputRequired(callback);

  let inputName = callback?.payload?.input?.[0].name || `password-${idx}`;
  let prompt = callback.getPrompt();

  let validationFailures = getValidationFailures(callback, prompt);
  let isInvalid = !!validationFailures.length;

  $: {
    /**
     * We need to wrap this in a reactive block, so it reruns the function
     * on value changes within `callback`
     */
    inputName = callback?.payload?.input?.[0].name || `password-${idx}`;
    prompt = callback.getPrompt();

    validationFailures = getValidationFailures(callback, prompt);
    isInvalid = !!validationFailures.length;
  }
</script>

<Base
  {callback}
  {firstInvalidInput}
  {idx}
  {isInvalid}
  {isRequired}
  key={inputName}
  showMessage={!validationFailures.length}
>
  <Policies {callback} key={inputName} label={prompt} messageKey="passwordRequirements" />
</Base>
