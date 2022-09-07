<script lang="ts">
  import Input from '$components/primitives/input/input.svelte';
  import Message from '$components/primitives/message/input-message.svelte';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let message = '';
  export let firstInvalidInput: boolean;
  export let hasRightIcon = false;
  export let isRequired = false;
  export let isInvalid: boolean | null = null;
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  // TODO: Placeholders don't reliably work with floating labels
  // export let placeholder: string;

  // Below needs to be `undefined` to be optional and allow default value in Message component
  export let showMessage: boolean | undefined = undefined;
  export let type: 'date' | 'email' | 'number' | 'password' | 'phone' | 'text' = 'text';
  export let value = '';

  function onChangeWrapper(event: Event) {
    if (checkValidity) {
      isInvalid = !checkValidity(event);
    }
    onChange(event);
  }
</script>

<div class={`tw_justify-items-stretch tw_flex tw_input-spacing tw_relative tw_flex-wrap`}>
  <!--
    TODO: Improve layout of floating label. Maybe use grid instead of Twitter's CSS?
    NOTE: `placeholder` for the input is required for Twitter Bootstrap's floating label
  -->
  <Input
    {firstInvalidInput}
    inputClasses={`tw_input-floating dark:tw_input-floating_dark ${
      hasRightIcon ? '!tw_border-r-0 !tw_rounded-r-none' : ''
    }`}
    {key}
    onChange={onChangeWrapper}
    {label}
    labelClasses="tw_absolute tw_border tw_border-transparent tw_input-floating-label"
    labelOrder="last"
    {isRequired}
    {isInvalid}
    {type}
    {value}
  />
  <slot />
  <Message {key} {message} {showMessage} type={isInvalid ? 'error' : 'info'} />
</div>
