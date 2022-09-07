<script lang="ts">
  import Select from '$components/primitives/select/select.svelte';
  import Message from '$components/primitives/message/input-message.svelte';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let defaultOption: string | null = null;
  export let message = '';
  export let firstInvalidInput: boolean;
  export let isRequired: boolean;
  export let isInvalid: boolean | null = null;
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let options: { value: string; text: string }[];

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
  <Message {message} {key} showMessage={isInvalid} type={isInvalid ? 'error' : 'info'} />
</div>
