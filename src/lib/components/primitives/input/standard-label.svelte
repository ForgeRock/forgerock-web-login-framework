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
  <label
    for={key}
    class="tw_border tw_border-transparent tw_font-bold tw_inset-0 tw_leading-6 tw_text-gray-dark"
    >{label}</label
  >
  <input
    id={key}
    {type}
    on:change={onChange}
    class={`width-{width} tw_border tw_border-gray ${
      hasRightIcon ? 'tw_border-r-0' : ''
    } tw_bg-white tw_block tw_leading-6 tw_p-3 tw_rounded ${
      hasRightIcon ? 'tw_rounded-r-none' : ''
    } tw_text-base tw_text-gray-dark tw_w-full`}
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
