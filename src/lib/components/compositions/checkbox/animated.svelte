<script lang="ts">
  import { afterUpdate } from 'svelte';

  import Message from '$components/primitives/message/input-message.svelte';
  import type { Maybe } from '$lib/interfaces';
  import Label from '$components/primitives/label/label.svelte';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let message = '';
  export let firstInvalidInput: boolean;
  export let isRequired = false;
  export let isInvalid = false;
  export let key: string;
  export let onChange: (event: Event) => void;
  export let showMessage: Maybe<boolean> = undefined;
  export let value: boolean;

  let inputEl: HTMLInputElement;

  function onChangeWrapper(event: Event) {
    if (checkValidity) {
      isInvalid = !checkValidity(event);
    }
    onChange(event);
  }

  afterUpdate(() => {
    if (firstInvalidInput) {
      inputEl.focus();
    }
  });
</script>

<div class="tw_input-spacing">
  <!--
    TODO: Currently NOT using the primitive checkbox component, but re-evaluate later
   -->
  <input
    aria-invalid={isInvalid}
    bind:this={inputEl}
    class="tw_checkbox-input_animated dark:tw_checkbox-input_animated_dark tw_sr-only"
    checked={value}
    data-message={`${key}-message`}
    id={key}
    on:change={onChangeWrapper}
    required={isRequired}
    type="checkbox"
  />
  <Label {key} classes="tw_grid tw_grid-cols-[2.5em_1fr] tw_relative">
    <span class="tw_animated-check dark:tw_animated-check_dark" />
    <slot />
  </Label>
  <!--
    NOTE: The below places the error message on the second row and in second
    column to match the label's layout.
   -->
  <div class="tw_ml-10">
    <Message {key} {message} {showMessage} type={isInvalid ? 'error' : 'info'} />
  </div>
</div>
