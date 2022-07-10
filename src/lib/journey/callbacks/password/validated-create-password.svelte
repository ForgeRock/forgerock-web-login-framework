<script lang="ts">
  import type { ValidatedCreatePasswordCallback } from '@forgerock/javascript-sdk';

  import Base from '$journey/callbacks/password/base.svelte';
  import { getPasswordValidationFailureText, isInputRequired } from '$journey/utilities/callback.utilities';

  export let callback: ValidatedCreatePasswordCallback;
  export let idx: number;

  const isRequired = isInputRequired(callback);
  const label = callback.getPrompt();
  const validationFailure = getPasswordValidationFailureText(callback, label);
</script>

<Base {callback} {idx} {isRequired} {validationFailure} />
