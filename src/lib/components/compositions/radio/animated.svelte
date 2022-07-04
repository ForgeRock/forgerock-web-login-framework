<script lang="ts">
  import Error from "$components/primitives/message/error.svelte";
  import Label from '$components/primitives/label/label.svelte';

  export let defaultOption: number;
  export let errorMessage: string = '';
  export let isRequired = false;
  export let isInvalid: boolean = null;
  export let key: string;
  export let name: string;
  export let onChange: (event: Event) => void;
  export let options: { value: number | null; text: string }[];
</script>

<div>
  {#each options as option}
    <div class="tw_input-spacing tw_grid tw_grid-cols-[1.5em_1fr]">
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
      <Label key={`${key}-${option.value}`} classes="tw_input-spacing tw_grid tw_grid-cols-[2em_1fr] tw_relative">
        <!--
          TODO: Not a fan of the double span, but it's needed for centering
          the before psuedoelement. Try using a before and after
          psuedoelement may prevent this, maybe?
        -->
        <span class="tw_h-6 tw_relative tw_w-6">
          <span class='tw_animated-radio dark:tw_animated-radio_dark'></span>
        </span>
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
