<script lang="ts">
  import Label from "$components/primitives/label/label.svelte";

  export let isRequired = false;
  export let isInvalid: boolean = null;
  export let key: string;
  export let onChange: (event: Event) => void;
  export let value: boolean;
</script>

<div>
  <!-- TODO: Currently NOT using the primitive checkbox, but re-evaluate later -->
  <input
    aria-invalid={isInvalid}
    class=" tw_checkbox-animated dark:tw_checkbox-animated_dark tw_sr-only"
    checked={value}
    id={key}
    on:change={onChange}
    required={isRequired}
    type="checkbox"
    />
  <Label {key} classes="tw_input-spacing tw_grid tw_grid-cols-[2em_1fr] tw_relative">
    <span class="tw_animated-check dark:tw_animated-check_dark"></span>
    <slot />
  </Label>
</div>
