<script lang="ts">
  export let hasRightIcon = false;
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let isRequired = false;
  // TODO: Placeholders don't reliably work with floating labels
  // export let placeholder: string;
  export let type: 'date' | 'email' | 'number' | 'password' | 'phone' | 'text' = 'text';
  export let value: string | null = null;
  export let width: 'full' | 'half' = 'full';
</script>

<div class={`tw_justify-items-stretch tw_flex tw_mb-4 tw_relative tw_flex-wrap width-${width}`}>
  <!--
    TODO: Improve layout of floating label. Maybe use grid instead of Twitter's CSS?
    NOTE: `placeholder` for the input is required for Twitter Bootstrap's floating label
  -->
  <input
    class={`tw_input-base tw_focusable-element tw_input-floating ${hasRightIcon ? '!tw_border-r-0' : ''} tw_flex-1 ${
      hasRightIcon ? '!tw_rounded-r-none' : ''
    }`}
    id={key}
    on:change={onChange}
    placeholder={label}
    {type}
    required={isRequired}
    {value}
  />
  <label for={key} class="tw_absolute tw_border tw_border-transparent tw_input-floating-label"
    >{label}</label
  >
  <slot />
</div>

<style>
  .width-full {
    @apply tw_w-full;
  }
  .width-half {
    @apply tw_w-1/2;
  }
</style>
