<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import type { ValidatedCreatePasswordCallback } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';

  import { getValidationFailures } from '$journey/callbacks/_utilities/callback.utilities';
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
  import type { styleSchema } from '$core/style.store';
  import type { Maybe } from '$core/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;

  export let callback: ValidatedCreatePasswordCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let style: z.infer<typeof styleSchema> = {};

  const isRequired = isInputRequired(callback);

  let inputName: string;
  let isInvalid: boolean;
  let prompt: string;
  let validationFailures: FailedPolicy[];

  $: {
    /**
     * We need to wrap this in a reactive block, so it reruns the function
     * on value changes within `callback`
     */
    inputName = callback?.payload?.input?.[0].name || `password-${callbackMetadata?.idx}`;
    prompt = callback.getPrompt();
    validationFailures = getValidationFailures(callback, prompt);
    isInvalid = !!validationFailures.length;
  }
</script>

{#key callback}
  <Base
    {callback}
    {callbackMetadata}
    {isInvalid}
    {isRequired}
    key={inputName}
    showMessage={isInvalid}
    {style}
  >
    <Policies {callback} label={prompt} messageKey="passwordRequirements" showPolicies={true} />
  </Base>
{/key}
