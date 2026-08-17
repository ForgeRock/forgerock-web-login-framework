<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { getValidationFailures } from '$journey/callbacks/_utilities/callback.utilities';
  import { isInputRequired } from '$journey/callbacks/_utilities/callback.utilities';
  import Policies from '$journey/callbacks/_utilities/policies.svelte';
  import Base from '$journey/callbacks/password/base.svelte';

  import type { ValidatedCreatePasswordCallback } from '@forgerock/journey-client/types';
  import type { z } from 'zod';

  import type { Maybe } from '$core/interfaces';
  import type { styleSchema } from '$core/style.store';
  import type { FailedPolicy } from '$journey/callbacks/_utilities/callback.utilities';
  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';

  // Unused props. Setting to const prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;

  interface Props {
    callback: ValidatedCreatePasswordCallback;
    callbackMetadata: Maybe<CallbackMetadata>;
    style?: z.infer<typeof styleSchema>;
  }

  let { callback, callbackMetadata, style = {} }: Props = $props();

  const isRequired = isInputRequired(callback);

  let inputName: string | undefined = $state();
  let isInvalid: boolean | undefined = $state();
  let prompt: string | undefined = $state();
  let validationFailures: FailedPolicy[] | undefined = $state();

  $effect.pre(() => {
    /**
     * We need to wrap this in a reactive block, so it reruns the function
     * on value changes within `callback`
     */
    inputName = callback?.payload?.input?.[0].name || `password-${callbackMetadata?.idx}`;
    prompt = callback.getPrompt();
    validationFailures = getValidationFailures(callback, prompt);
    isInvalid = !!validationFailures.length;
  });
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
