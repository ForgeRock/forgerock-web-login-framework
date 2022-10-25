<script lang="ts">
  import Radio from '$components/primitives/radio/radio.svelte';
  import Message from '$components/primitives/message/input-message.svelte';
  import type { Maybe } from '$lib/interfaces';

  export let defaultOption: Maybe<string> = null;
  export let message = '';
  export let groupLabel = '';
  export let isFirstInvalidInput: boolean;
  export let isRequired = false;
  export let isInvalid = false;
  export let key: string;
  export let name: string;
  export let onChange: (event: Event) => void;
  export let options: { text: string; value: string | null }[];

  // Below needs to be `undefined` to be optional and allow default value in Message component
  export let showMessage: Maybe<boolean> = undefined;
</script>

<fieldset>
  <legend class="tw_input-label dark:tw_input-label_dark tw_font-bold tw_mb-4">{groupLabel}</legend>
  {#each options as option}
    <div class="tw_input-spacing tw_grid tw_grid-cols-[1.5em_1fr]">
      <Radio
        checked={defaultOption === option.value}
        {isFirstInvalidInput}
        {isRequired}
        {isInvalid}
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
    <Message {message} {key} {showMessage} type={isInvalid ? 'error' : 'info'} />
  </span>
</fieldset>
