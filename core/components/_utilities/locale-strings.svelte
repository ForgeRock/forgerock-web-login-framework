<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { interpolate } from '$core/_utilities/i18n.utilities';

  import type { Maybe } from '$core/interfaces';

  interface Props {
    html?: boolean;
    key: string;
    values?: Maybe<Record<string, string>>;
    children?: import('svelte').Snippet;
  }

  let {
    html = false,
    key,
    values = undefined,
    children
  }: Props = $props();

  let message: string = $derived(interpolate(key, values));

  
</script>

{#if html}
  {#if children}{@render children()}{:else}{@html message}{/if}
{:else}
  {#if children}{@render children()}{:else}{message}{/if}
{/if}
