<script lang="ts">
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import type { Maybe } from '$lib/interfaces';

  export let html = false;
  export let key: string;
  export let values: Maybe<Record<string, string>> = undefined;

  let message = interpolate(key, values);
</script>

{#if html}
  <slot>{@html message}</slot>
{:else}
  <slot>{message}</slot>
{/if}
