<script lang="ts">
  import Input from '$components/primitives/input/input.svelte';

  export let hasRightIcon = false;
  export let errorMessage = '';
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
  <Input
    inputClasses={`${hasRightIcon ? '!tw_border-r-0 !tw_rounded-r-none' : ''}`}
    {key}
    {onChange}
    {label}
    labelClasses="tw_input-stacked-label"
    labelOrder="first"
    {placeholder}
    {isRequired}
    {type}
    {value}
  />
  <slot />
  <p class="tw_input-error-message dark:tw_input-error-message_dark">{errorMessage}</p>
</div>
