<script lang="ts">
  import Error from "$components/primitives/message/error.svelte";
  import Label from '$components/primitives/label/label.svelte';

  export let defaultOption: number;
  export let errorMessage: string = '';
  export let isRequired = false;
  export let isInvalid: boolean | null = null;
  export let key: string;
  export let name: string;
  export let onChange: (event: Event) => void;
  export let options: { value: number | null; text: string }[];
</script>

<div>
  {#each options as option}
    <div class="tw_input-spacing">
      <input
        aria-invalid={isInvalid}
        class="tw_radio-input_animated dark:tw_radio-input_animated_dark tw_sr-only"
        checked={defaultOption === option.value}
        id={`${key}-${option.value}`}
        {name}
        on:change={onChange}
        required={isRequired}
        type="radio"
        value={option.value}
      />
      <Label key={`${key}-${option.value}`} classes="tw_input-spacing tw_grid tw_grid-cols-[2.5em_1fr] tw_relative">
        <span class='tw_animated-radio dark:tw_animated-radio_dark'></span>
        {option.text}
      </Label>
    </div>
  {/each}
  <!--
    NOTE: The below places the error message on the second row and in second
    column to match the label's layout.
   -->
   <span class="tw_col-start-2 tw_row-start-2">
    <Error {errorMessage} {key} showError={isInvalid} />
  </span>
</div>
