<script lang="ts">
  import Checkbox from '$components/primitives/checkbox/checkbox.svelte';
  import Error from '$components/primitives/message/error.svelte';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let errorMessage = '';
  export let firstInvalidInput: boolean;
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

<!--
  NOTE: The below wrapper is creating a grid, setting the first column to 1.5em
  and the second column as one flexible unit (1fr).
-->
<div class="tw_input-spacing tw_grid tw_grid-cols-[1.5em_1fr]">
  <Checkbox {firstInvalidInput} {isRequired} {isInvalid} {key} onChange={onChangeWrapper} {value}>
    <slot />
  </Checkbox>
  <!--
    NOTE: The below places the error message on the second row and in second
    column to match the label's layout.
   -->
  <span class="tw_col-start-2 tw_row-start-2">
    <Error {errorMessage} {key} showError={isInvalid} />
  </span>
</div>
