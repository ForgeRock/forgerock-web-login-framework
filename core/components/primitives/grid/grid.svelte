<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    num?: number;
    children?: Snippet;
  }

  let { num = 2, children }: Props = $props();

  function generateClassString(...args: Array<number | string>) {
    return args.reduce((prev, curr) => {
      switch (curr) {
        case 4:
          return `${prev} md:tw_grid-cols-4`;
        case 3:
          return `${prev} md:tw_grid-cols-3`;
        case 2:
          return `${prev} md:tw_grid-cols-2`;
        default:
          return `${prev} md:tw_grid-cols-1`;
      }
    }, '');
  }
</script>

<div class={`${generateClassString(num)} tw_gap-4 tw_grid tw_grid-cols-1 tw_input-spacing`}>
  {@render children?.()}
</div>
