<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Message from '$components/primitives/message/input-message.svelte';
  import Select from '$components/primitives/select/select.svelte';

  import type { Maybe } from '$core/interfaces';


  
  interface Props {
    checkValidity?: ((event: Event) => boolean) | null;
    defaultOption?: string | null;
    message?: string;
    isFirstInvalidInput: boolean;
    isRequired?: boolean;
    isInvalid?: boolean;
    key: string;
    label: string;
    onChange: (event: Event) => void;
    options: { value: string; text: string }[];
    // Below needs to be `undefined` to be optional and allow default value in Message component
    showMessage?: Maybe<boolean>;
  }

  let {
    checkValidity = null,
    defaultOption = null,
    message = '',
    isFirstInvalidInput,
    isRequired = false,
    isInvalid = $bindable(false),
    key,
    label,
    onChange,
    options,
    showMessage = undefined
  }: Props = $props();

  function onChangeWrapper(event: Event) {
    if (checkValidity) {
      isInvalid = !checkValidity(event);
    }
    onChange(event);
  }
</script>

<div class="tw_input-spacing tw_relative">
  <Select
    {defaultOption}
    {isFirstInvalidInput}
    {isRequired}
    {isInvalid}
    {key}
    {label}
    labelClasses="tw_absolute tw_input-floating-label tw_select-floating-label"
    labelOrder="last"
    onChange={onChangeWrapper}
    {options}
    selectClasses="tw_select-floating"
  />
  <Message dirtyMessage={message} {key} {showMessage} type={isInvalid ? 'error' : 'info'} />
</div>
