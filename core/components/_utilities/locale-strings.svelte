<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { interpolate } from '$core/_utilities/i18n.utilities';
  import type { Maybe } from '$core/interfaces';

  export let html = false;
  export let key: string;
  export let values: Maybe<Record<string, string>> = undefined;

  let message: string;

  $: {
    message = interpolate(key, values);
  }
</script>

{#if html}
  <slot>{@html message}</slot>
{:else}
  <slot>{message}</slot>
{/if}
