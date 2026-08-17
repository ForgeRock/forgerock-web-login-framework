<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    classes?: string;
    size?: string;
    children?: Snippet;
  }

  let { classes = '', size = '24px', children }: Props = $props();
</script>

<svg
  class={classes}
  height={size}
  width={size}
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M0 0h24v24H0z" fill="none" />
  <path d="M11.67 3.87L9.9 2.1 0 12l9.9 9.9 1.77-1.77L3.54 12z" />
  <title>{@render children?.()}</title>
</svg>
