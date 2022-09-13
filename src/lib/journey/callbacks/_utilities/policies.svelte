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
  } from '$journey/callbacks/_utilities/callback.utilities';
  import type { Maybe } from '$lib/interfaces';
  import T from '$components/_utilities/locale-strings.svelte';

  type ValidatedCallbacks =
    | AttributeInputCallback<boolean | string>
    | ValidatedCreatePasswordCallback
    | ValidatedCreateUsernameCallback;

  export let callback: ValidatedCallbacks;
  export let key: Maybe<string> = undefined;
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

{#if simplifiedFailures.length}
  <div class="tw_input-policies tw_w-full" id={`${key ? `${key}-message` : ''}`}>
    <p
      class="tw_m-1 tw_text-base tw_font-bold tw_text-error-dark dark:tw_text-error-light tw_w-full"
    >
      <T key={messageKey} />
    </p>
    <ul class="tw_m-1 tw_text-base tw_text-error-dark dark:tw_text-error-light tw_w-full">
      {#each simplifiedFailures as failure}
        <li class="tw_list-disc">{failure.message}</li>
      {/each}
    </ul>
  </div>
{:else if validationRules.length}
  <div class="tw_w-full" id={`${key ? `${key}-message` : ''}`}>
    <p
      class="tw_m-1 tw_text-base tw_font-bold tw_text-secondary-dark dark:tw_text-secondary-light tw_w-full"
    >
      <T key={messageKey} />
    </p>
    <ul class="tw_m-1 tw_text-base tw_text-secondary-dark dark:tw_text-secondary-light tw_w-full">
      {#each validationRules as rule}
        <li class="tw_list-disc">{rule.message}</li>
      {/each}
    </ul>
  </div>
{/if}
