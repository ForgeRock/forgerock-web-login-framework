<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import { run } from 'svelte/legacy';

  import Floating from '$components/compositions/input-floating/floating-label.svelte';
  import Stacked from '$components/compositions/input-stacked/stacked-label.svelte';
  import { interpolate, textToKey } from '$core/_utilities/i18n.utilities';

  import type { TextInputCallback } from '@forgerock/journey-client/types';
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
    callback: TextInputCallback;
    callbackMetadata: Maybe<CallbackMetadata>;
    style?: z.infer<typeof styleSchema>;
  }

  let { callback, callbackMetadata, style = {} }: Props = $props();

  const Input = style.labels === 'stacked' ? Stacked : Floating;

  let callbackType = $state('');
  let inputName = $state('');
  let textInputLabel = $state('');
  let value = $state<unknown>();

  function setValue(event: Event) {
    callback.setInput((event.target as HTMLInputElement).value);
  }

  run(() => {
    callbackType = callback.getType();
    inputName = callback?.payload?.input?.[0].name || `text-input-${callbackMetadata?.idx}`;
    textInputLabel = callback.getPrompt();
    value = callback?.getInputValue();
  });
</script>

{#key callback}
  <Input
    isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
    key={inputName}
    label={interpolate(textToKey(textInputLabel || callbackType), null, textInputLabel)}
    onChange={setValue}
    type="text"
    showMessage={false}
    value={typeof value === 'string' ? value : ''}
  />
{/key}
