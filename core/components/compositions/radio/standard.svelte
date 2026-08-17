<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import Message from '$components/primitives/message/input-message.svelte';
  import Radio from '$components/primitives/radio/radio.svelte';

  import type { Maybe } from '$core/interfaces';

  interface Props {
    defaultOption?: Maybe<string>;
    message?: string;
    groupLabel?: string;
    isFirstInvalidInput: boolean;
    isRequired?: boolean;
    isInvalid?: boolean;
    key: string;
    name: string;
    onChange: (event: Event) => void;
    options: { text: string; value: string | null }[];
    // Below needs to be `undefined` to be optional and allow default value in Message component
    showMessage?: Maybe<boolean>;
  }

  let {
    defaultOption = null,
    message = '',
    groupLabel = '',
    isFirstInvalidInput,
    isRequired = false,
    isInvalid = false,
    key,
    name,
    onChange,
    options,
    showMessage = undefined,
  }: Props = $props();
</script>

<fieldset>
  <legend class="tw_input-label dark:tw_input-label_dark tw_font-bold tw_mb-4">{groupLabel}</legend>
  {#each options as option}
    <div class="tw_input-spacing tw_grid tw_grid-cols-[1.5em_1fr]">
      <Radio
        checked={defaultOption === option.value}
        {isFirstInvalidInput}
        {isRequired}
        key={`${key}-${option.value}`}
        {name}
        {onChange}
        value={option.value}
      >
        {option.text}
      </Radio>
    </div>
  {/each}
  <!--
  NOTE: The below places the error message on the second row and in second
  column to match the label's layout.
 -->
  <span class="tw_col-start-2 tw_row-start-2">
    <Message dirtyMessage={message} {key} {showMessage} type={isInvalid ? 'error' : 'info'} />
  </span>
</fieldset>
