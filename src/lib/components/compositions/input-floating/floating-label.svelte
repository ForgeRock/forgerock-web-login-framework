<script lang="ts">
  import Input from '$components/primitives/input/input.svelte';

  export let errorMessage = '';
  export let hasRightIcon = false;
  export let isRequired = false;
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  // TODO: Placeholders don't reliably work with floating labels
  // export let placeholder: string;
  export let type: 'date' | 'email' | 'number' | 'password' | 'phone' | 'text' = 'text';
  export let value: string | null = null;
</script>

<div class={`tw_justify-items-stretch tw_flex tw_mb-4 tw_relative tw_flex-wrap`}>
  <!--
    TODO: Improve layout of floating label. Maybe use grid instead of Twitter's CSS?
    NOTE: `placeholder` for the input is required for Twitter Bootstrap's floating label
  -->
  <Input
    inputClasses={`tw_input-floating ${hasRightIcon ? '!tw_border-r-0 !tw_rounded-r-none' : ''}`}
    {key}
    {onChange}
    {label}
    labelClasses="tw_absolute tw_border tw_border-transparent tw_input-floating-label"
    labelOrder="last"
    {isRequired}
    {type}
    {value}
  />
  <slot />
  <p class="tw_input-error-message dark:tw_input-error-message_dark">{errorMessage}</p>
</div>
