<script lang="ts">
  import Error from "$components/primitives/message/error.svelte";
  import Label from "$components/primitives/label/label.svelte";

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let errorMessage: string = '';
  export let isRequired = false;
  export let isInvalid: boolean | null = null;
  export let key: string;
  export let onChange: (event: Event) => void;
  export let value: boolean;

  function onChangeWrapper(event: Event) {
    if (checkValidity) {
      isInvalid = !checkValidity(event);
    }
    onChange(event);
  }

  $: {
    isInvalid = !!errorMessage;
  }
</script>

<div>
  <!--
    TODO: Currently NOT using the primitive checkbox component, but re-evaluate later
   -->
  <input
    aria-invalid={isInvalid}
    class="tw_checkbox-input_animated dark:tw_checkbox-input_animated_dark tw_sr-only"
    checked={value}
    id={key}
    on:change={onChangeWrapper}
    required={isRequired}
    type="checkbox"
    />
  <Label {key} classes="tw_input-spacing tw_grid tw_grid-cols-[2.5em_1fr] tw_relative">
    <span class="tw_animated-check dark:tw_animated-check_dark"></span>
    <slot />
  </Label>
  <!--
    NOTE: The below places the error message on the second row and in second
    column to match the label's layout.
   -->
  <span class="tw_col-start-2 tw_row-start-2">
    <Error {errorMessage} {key} showError={isInvalid} />
  </span>
</div>
