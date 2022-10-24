<script lang="ts">
  import { afterUpdate } from 'svelte';

  import Message from '$components/primitives/message/input-message.svelte';
  import type { Maybe } from '$lib/interfaces';
  import Label from '$components/primitives/label/label.svelte';

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

  let inputEl: HTMLInputElement;

  afterUpdate(() => {
    if (isFirstInvalidInput) {
      inputEl.focus();
    }
  });
</script>

<fieldset>
  <legend class="tw_input-label dark:tw_input-label_dark tw_font-bold tw_mb-4">{groupLabel}</legend>
  <div>
    {#each options as option}
      <div class="tw_input-spacing">
        <input
          aria-invalid={isInvalid}
          bind:this={inputEl}
          class="tw_radio-input_animated dark:tw_radio-input_animated_dark tw_sr-only"
          checked={defaultOption === option.value}
          id={`${key}-${option.value}`}
          {name}
          on:change={onChange}
          required={isRequired}
          type="radio"
          value={option.value}
        />
        <Label
          key={`${key}-${option.value}`}
          classes="tw_input-spacing tw_grid tw_grid-cols-[2.5em_1fr] tw_relative"
        >
          <span class="tw_animated-radio dark:tw_animated-radio_dark" />
          {option.text}
        </Label>
      </div>
    {/each}
    <!--
    NOTE: The below places the error message on the second row and in second
    column to match the label's layout.
   -->
    <span class="tw_col-start-2 tw_row-start-2">
      <Message {message} {key} {showMessage} type={isInvalid ? 'error' : 'info'} />
    </span>
  </div>
</fieldset>
