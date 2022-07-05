<script lang="ts">
  export let errorMessage: string = '';
  export let key: string;
  export let showError: boolean | null = true;
</script>

{#if errorMessage && showError}
  <p
    class="tw_input-error-message tw_s dark:tw_input-error-message_dark"
    id={`${key}-message`}
  >
    {errorMessage}
  </p>
{/if}
