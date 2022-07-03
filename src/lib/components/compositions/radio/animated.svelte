<script lang="ts">
  import Label from '$components/primitives/label/label.svelte';

  export let defaultOption: number;
  export let isRequired = false;
  export let isInvalid: boolean = null;
  export let key: string;
  export let name: string;
  export let onChange: (event: Event) => void;
  export let options: { value: number | null; text: string }[];
</script>

{#each options as option}
  <div class="tw_input-spacing tw_grid tw_grid-cols-[1.5em_1fr]">
    <input
      aria-invalid={isInvalid}
      class="tw_radio-animated dark:tw_radio-animated_dark tw_sr-only"
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
        the before psuedoelement. Using a before and after
        psuedoelement may prevent this?
      -->
      <span class="tw_h-6 tw_relative tw_w-6">
        <span class='tw_animated-radio dark:tw_animated-radio_dark'></span>
      </span>
      {option.text}
    </Label>
  </div>
{/each}
