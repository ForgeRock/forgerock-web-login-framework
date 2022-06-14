<script lang="ts">
  export let hasRightIcon = false;
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let placeholder: string;
  export let type: 'date' | 'email' | 'number' | 'password' | 'phone' | 'text' = 'text';
  export let value: string | null = null;
  export let width: 'full' | 'half' = 'full';
</script>

<div class="tw_mb-4">
  <label for={key} class="tw_input-stacked-label">{label}</label>
  <input
    id={key}
    {type}
    on:change={onChange}
    class={`tw_input-base tw_focusable-element ${hasRightIcon ? 'tw_border-r-0' : ''} ${
      hasRightIcon ? 'tw_rounded-r-none' : ''
    } width-${width}`}
    {placeholder}
    {value}
  />
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
