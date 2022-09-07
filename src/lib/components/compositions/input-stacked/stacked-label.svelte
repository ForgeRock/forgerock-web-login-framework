<script lang="ts">
  import Input from '$components/primitives/input/input.svelte';
  import Message from '$components/primitives/message/input-message.svelte';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let firstInvalidInput: boolean;
  export let hasRightIcon = false;
  export let message = '';
  export let isRequired = false;
  export let isInvalid: boolean | null = null;
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let placeholder: string;
  export let type: 'date' | 'email' | 'number' | 'password' | 'phone' | 'text' = 'text';
  export let value = '';

  function onChangeWrapper(event: Event) {
    if (checkValidity) {
      isInvalid = !checkValidity(event);
    }
    onChange(event);
  }
</script>

<div class="tw_input-spacing">
  <Input
    {firstInvalidInput}
    inputClasses={`${hasRightIcon ? '!tw_border-r-0 !tw_rounded-r-none' : ''}`}
    {key}
    onChange={onChangeWrapper}
    {label}
    labelClasses="tw_input-stacked-label"
    labelOrder="first"
    {placeholder}
    {isRequired}
    {isInvalid}
    {type}
    {value}
  />
  <slot />
  <Message {message} {key} showMessage={isInvalid} type={isInvalid ? 'error' : 'info'} />
</div>
