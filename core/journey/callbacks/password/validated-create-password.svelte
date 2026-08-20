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

  let inputName = $derived(
    callback?.payload?.input?.[0].name || `password-${callbackMetadata?.idx}`,
  );
  let prompt = $derived(callback.getPrompt());
  let validationFailures = $derived(getValidationFailures(callback, prompt));
  let isInvalid = $derived(validationFailures.length > 0);
  let isRequired = $derived(isInputRequired(callback));
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
