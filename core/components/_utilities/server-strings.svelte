<!--
 
 Copyright © 2025 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import sanitize from 'xss';

  export let html = false;
  export let string: string;

  let message: string;

  $: {
    message = sanitize(string);
  }
</script>

{#if html}
  <slot>{@html message}</slot>
{:else}
  <slot>{message}</slot>
{/if}
