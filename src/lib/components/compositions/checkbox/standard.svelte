<script lang="ts">
  import Checkbox from '$components/primitives/checkbox/checkbox.svelte';
  import Message from '$components/primitives/message/input-message.svelte';
  import type { Maybe } from '$lib/interfaces';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let message = '';
  export let isFirstInvalidInput: boolean;
  export let isRequired = false;
  export let isInvalid = false;
  export let key: string;
  export let onChange: (event: Event) => void;
  export let showMessage: Maybe<boolean> = undefined;
  export let value: boolean;

  function onChangeWrapper(event: Event) {
    if (checkValidity) {
      isInvalid = !checkValidity(event);
    }
    onChange(event);
  }
</script>

<!--
  NOTE: The below wrapper is creating a grid, setting the first column to 1.5em
  and the second column as one flexible unit (1fr).
-->
<div class="tw_input-spacing tw_grid tw_grid-cols-[1.5em_1fr]">
  <Checkbox {isFirstInvalidInput} {isRequired} {isInvalid} {key} onChange={onChangeWrapper} {value}>
    <slot />
  </Checkbox>
  <!--
    NOTE: The below places the error message on the second row and in second
    column to match the label's layout.
   -->
  <span class="tw_col-start-2 tw_row-start-2">
    <Message dirtyMessage={message} {key} {showMessage} type={isInvalid ? 'error' : 'info'} />
  </span>
</div>
