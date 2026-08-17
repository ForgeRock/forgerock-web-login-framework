<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { run } from 'svelte/legacy';

  import T from '$components/_utilities/locale-strings.svelte';
  import {
    getValidationFailures,
    getValidationPolicies,
  } from '$journey/callbacks/_utilities/callback.utilities';

  import type {
    AttributeInputCallback,
    ValidatedCreatePasswordCallback,
    ValidatedCreateUsernameCallback,
  } from '@forgerock/journey-client/types';

  import type { Maybe } from '$core/interfaces';
  import type { RestructuredParam } from '$journey/callbacks/_utilities/callback.utilities';

  type ValidatedCallbacks =
    | AttributeInputCallback<boolean | string>
    | ValidatedCreatePasswordCallback
    | ValidatedCreateUsernameCallback;

  interface Props {
    callback: ValidatedCallbacks;
    key?: Maybe<string>;
    label: string;
    messageKey: string;
    showPolicies?: boolean;
  }

  let {
    callback,
    key = undefined,
    label,
    messageKey,
    showPolicies = false
  }: Props = $props();

  let validationFailures = $state(getValidationFailures(callback, label));
  let validationRules = $state(getValidationPolicies(callback.getPolicies()));
  let simplifiedFailures = $state(validationFailures.reduce((prev, curr) => {
    prev = prev.concat(curr.restructured);
    return prev;
  }, [] as RestructuredParam[]));

  run(() => {
    validationFailures = getValidationFailures(callback, label);
    validationRules = getValidationPolicies(callback.getPolicies());
    simplifiedFailures = validationFailures.reduce((prev, curr) => {
      prev = prev.concat(curr.restructured);
      return prev;
    }, [] as RestructuredParam[]);
  });
</script>

{#if simplifiedFailures.length}
  <div class="tw_input-policies tw_w-full" id={`${key ? `${key}-message` : ''}`}>
    <p class="tw_text-error-dark dark:tw_text-error-light tw_w-full">
      <T key={messageKey} />
    </p>
    <ul class="tw_text-error-dark dark:tw_text-error-light tw_w-full">
      {#each simplifiedFailures as failure}
        <li class="tw_list-disc">{failure.message}</li>
      {/each}
    </ul>
  </div>
{:else if showPolicies && validationRules.length}
  <div class="tw_input-policies tw_w-full" id={`${key ? `${key}-message` : ''}`}>
    <p class="tw_text-secondary-dark dark:tw_text-secondary-light tw_w-full">
      <T key={messageKey} />
    </p>
    <ul class="tw_text-secondary-dark dark:tw_text-secondary-light tw_w-full">
      {#each validationRules as rule}
        <li class="tw_list-disc">{rule.message}</li>
      {/each}
    </ul>
  </div>
{/if}
