<script lang="ts">
  import T from '$components/_utilities/locale-strings.svelte';

  export let message: string;
  export let key: string;
  export let showMessage: boolean = true;
  export let type: 'info' | 'error' = 'info';

  function generateClassString(...args: string[]) {
    return args.reduce((prev, curr) => {
      switch (curr) {
        // Button style cases
        case 'error':
          return `${prev} tw_input-error-message dark:tw_input-error-message_dark`;
        default:
          return `${prev} tw_input-info-message dark:tw_input-info-message_dark`;
      }
    }, '');
  }
</script>

{#if showMessage}
  <p class={generateClassString(type)} id={`${key}-message`}>
    {#if message}
      {message}
    {:else}
      <T key="inputRequiredError" />
    {/if}
  </p>
{/if}
