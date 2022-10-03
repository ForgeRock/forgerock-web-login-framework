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
