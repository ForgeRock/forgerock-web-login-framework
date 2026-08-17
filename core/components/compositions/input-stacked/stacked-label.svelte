<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot (input-button to input_button) making the component unusable -->
<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Input from '$components/primitives/input/input.svelte';
  import Message from '$components/primitives/message/input-message.svelte';

  import type { FullAutoFill } from 'svelte/elements';

  import type { Maybe } from '$core/interfaces';

  export let autocomplete: FullAutoFill | undefined = undefined;
  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let forceValidityFailure = false;
  export let isFirstInvalidInput: boolean;
  export let hasRightIcon = false;
  export let message = '';
  export let isRequired = false;
  export let isInvalid = false;
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let placeholder: Maybe<string> = undefined;

  // Below needs to be `undefined` to be optional and allow default value in Message component
  export let showMessage: Maybe<boolean> = undefined;
  export let type: 'date' | 'email' | 'number' | 'password' | 'phone' | 'text' = 'text';
  export let value = '';

  function onChangeWrapper(event: Event) {
    if (checkValidity) {
      isInvalid = !checkValidity(event);
    }
    onChange(event);
  }
</script>

<div class="tw_input-spacing tw_flex tw_flex-wrap">
  <Input
    {autocomplete}
    {forceValidityFailure}
    {isFirstInvalidInput}
    inputClasses={`${hasRightIcon ? '!tw_border-r-0 !tw_rounded-r-none' : ''}`}
    {key}
    onChange={onChangeWrapper}
    {label}
    labelClasses="tw_input-stacked-label"
    labelOrder="first"
    {placeholder}
    {isRequired}
    {isInvalid}
    {type}
    bind:value
  />
  <slot name="input-button" />
  <div class="tw_w-full" id={`${key}-message`}>
    <Message {key} dirtyMessage={message} {showMessage} type={isInvalid ? 'error' : 'info'} />
    <slot />
  </div>
</div>
