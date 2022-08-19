<script lang="ts">
  import { interpolate } from '$lib/utilities/i18n.utilities';

  export let html = false;
  export let key: string;
  export let values: Record<string, string> | undefined = undefined

  let message = interpolate(key, values);
</script>

{#if html}
  <slot>{@html message}</slot>
{:else}
  <slot>{message}</slot>
{/if}
