<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    classes?: string;
    href: string;
    target?: '_blank' | '_parent' | '_self' | '_top';
    children?: Snippet;
  }

  let { classes = '', href, target = '_self', children }: Props = $props();
</script>

<a class={`${classes} tw_link dark:tw_link_dark`} {href} {target}>
  {@render children?.()}
</a>
