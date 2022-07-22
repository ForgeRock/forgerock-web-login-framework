<script lang="ts">
  import Input from '$components/primitives/input/input.svelte';
  import Error from '$components/primitives/message/error.svelte';

  export let checkValidity: ((event: Event) => boolean) | null = null;
  export let errorMessage: string = '';
  export let hasRightIcon = false;
  export let isRequired = false;
  export let isInvalid: boolean | null = null;
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  // TODO: Placeholders don't reliably work with floating labels
  // export let placeholder: string;
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

<div class={`tw_justify-items-stretch tw_flex tw_input-spacing tw_relative tw_flex-wrap`}>
  <!--
    TODO: Improve layout of floating label. Maybe use grid instead of Twitter's CSS?
    NOTE: `placeholder` for the input is required for Twitter Bootstrap's floating label
  -->
  <Input
    inputClasses={`tw_input-floating dark:tw_input-floating_dark ${hasRightIcon ? '!tw_border-r-0 !tw_rounded-r-none' : ''}`}
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
  <Error {errorMessage} {key} showError={isInvalid} />
</div>
