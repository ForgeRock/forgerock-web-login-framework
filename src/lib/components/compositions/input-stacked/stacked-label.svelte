<script lang="ts">
  import Input from '$components/primitives/input/input.svelte';
  import Error from '$components/primitives/message/error.svelte';

  export let checkValidity: ((event: Event) => boolean) | null= null;
  export let firstInvalidInput: boolean;
  export let hasRightIcon = false;
  export let errorMessage = '';
  export let isRequired = false;
  export let isInvalid: boolean | null = null;
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let placeholder: string;
  export let type: 'date' | 'email' | 'number' | 'password' | 'phone' | 'text' = 'text';
  export let value: string = '';

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
  <Error {errorMessage} {key} showError={isInvalid} />
</div>
