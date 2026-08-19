<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import T from '$components/_utilities/locale-strings.svelte';

  import type { Snippet } from 'svelte';

  interface Props {
    colorClass: string;
    layoutClasses: string;
    children?: Snippet;
  }

  let { colorClass, layoutClasses, children }: Props = $props();
</script>

<div
  class={`tw_spinner tw_animate-spin tw_border-4 tw_inline-block tw_rounded-full ${colorClass} ${layoutClasses}`}
  role="status"
>
  <span class="tw_sr-only"><T key="loading" /> </span>
</div>
{@render children?.()}
