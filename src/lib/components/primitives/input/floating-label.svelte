<script lang="ts">
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
  <input
    class={`tw_input-base dark:tw_input-base_dark tw_focusable-element tw_input-floating ${hasRightIcon ? '!tw_border-r-0' : ''} tw_flex-1 ${
      hasRightIcon ? '!tw_rounded-r-none' : ''
    } tw_w-full`}
    id={key}
    on:change={onChange}
    placeholder={label}
    required={isRequired}
    {type}
    {value}
  />
  <label for={key} class="tw_absolute tw_border tw_border-transparent tw_input-floating-label tw_input-label dark:tw_input-label_dark"
    >{label}</label
  >
  <slot />
</div>
