<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import sanitize from 'xss';

  import type { Snippet } from 'svelte';

  interface Props {
    html?: boolean;
    string: string;
    children?: Snippet;
  }

  let { html = false, string, children }: Props = $props();

  let message: string = $derived(sanitize(string));
</script>

{#if html}
  {#if children}{@render children()}{:else}{@html message}{/if}
{:else if children}{@render children()}{:else}{message}{/if}
