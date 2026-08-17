<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  interface Props {
    classes?: string;
    size?: string;
    children?: import('svelte').Snippet;
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
  <path
    d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
  />
  <title>{@render children?.()}</title>
</svg>
