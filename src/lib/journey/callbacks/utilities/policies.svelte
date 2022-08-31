<script lang="ts">
  import type {
    AttributeInputCallback,
    ValidatedCreateUsernameCallback,
    ValidatedCreatePasswordCallback,
  } from '@forgerock/javascript-sdk';

  import {
    getValidationFailures,
    getValidationPolicies,
    type RestructuredParam,
  } from '$journey/callbacks/utilities/callback.utilities';
  import T from '$components/i18n/locale-strings.svelte';

  type ValidatedCallbacks =
  | AttributeInputCallback<boolean | string>
  | ValidatedCreatePasswordCallback
  | ValidatedCreateUsernameCallback;

  export let callback: ValidatedCallbacks;
  export let label: string;
  export let messageKey: string;

  let validationFailures = getValidationFailures(callback, label);
  let validationRules = getValidationPolicies(callback.getPolicies(), label);
  let simplifiedFailures = validationFailures.reduce((prev, curr) => {
    prev = prev.concat(curr.restructured);
    return prev;
  }, [] as RestructuredParam[]);

  $: {
    validationFailures = getValidationFailures(callback, label);
    validationRules = getValidationPolicies(callback.getPolicies(), label);
    simplifiedFailures = validationFailures.reduce((prev, curr) => {
      prev = prev.concat(curr.restructured);
      return prev;
    }, [] as RestructuredParam[]);
  }
</script>

{#if simplifiedFailures.length || validationRules.length}
  <p class="tw_m-1 tw_text-base tw_text-error-dark dark:tw_text-error-light tw_w-full">
    <T key={messageKey}></T>
  </p>
{/if}
{#if simplifiedFailures.length}
  <ul class="tw_m-1 tw_text-base tw_text-error-dark dark:tw_text-error-light tw_w-full">
    {#each simplifiedFailures as failure}
      <li class="tw_list-disc tw_list-inside">{failure.message}</li>
    {/each}
  </ul>
{:else if validationRules.length}
  <ul class="tw_m-1 tw_text-base tw_text-white tw_w-full">
    {#each validationRules as rule}
      <li class="tw_list-disc tw_list-inside">{rule.message}</li>
    {/each}
  </ul>
{/if}
