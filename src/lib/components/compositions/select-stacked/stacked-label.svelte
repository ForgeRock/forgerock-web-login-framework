<script lang="ts">
  import Select from '$components/primitives/select/select.svelte';
  import Message from '$components/primitives/message/input-message.svelte';
  import type { Maybe } from '$lib/interfaces';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let defaultOption: string | null = null;
  export let message = '';
  export let firstInvalidInput: boolean;
  export let isRequired = false;
  export let isInvalid = false;
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let options: { value: string; text: string }[];

  // Below needs to be `undefined` to be optional and allow default value in Message component
  export let showMessage: Maybe<boolean> = undefined;

  function onChangeWrapper(event: Event) {
    if (checkValidity) {
      isInvalid = !checkValidity(event);
    }
    onChange(event);
  }
</script>

<div class="tw_input-spacing">
  <Select
    {defaultOption}
    {firstInvalidInput}
    {isRequired}
    {isInvalid}
    {key}
    {label}
    labelClasses="tw_input-stacked-label"
    labelOrder="first"
    onChange={onChangeWrapper}
    {options}
  />
  <Message {message} {key} {showMessage} type={isInvalid ? 'error' : 'info'} />
</div>
