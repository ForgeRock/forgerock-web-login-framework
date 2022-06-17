<script lang="ts">
  export let hasRightIcon = false;
  export let isRequired = false;
  export let key: string;
  export let label: string;
  export let onChange: (event: Event) => void;
  export let placeholder: string;
  export let type: 'date' | 'email' | 'number' | 'password' | 'phone' | 'text' = 'text';
  export let value: string | null = null;
  export let width: 'full' | 'half' = 'full';
</script>

<div class="tw_mb-4">
  <label for={key} class="tw_input-label dark:tw_input-label_dark tw_input-stacked-label">{label}</label>
  <input
    class={`tw_input-base dark:tw_input-base_dark tw_focusable-element ${hasRightIcon ? 'tw_border-r-0' : ''} ${
      hasRightIcon ? 'tw_rounded-r-none' : ''
    } tw_w-full`}
    id={key}
    on:change={onChange}
    {placeholder}
    required={isRequired}
    {type}
    {value}
  />
  <slot />
</div>
