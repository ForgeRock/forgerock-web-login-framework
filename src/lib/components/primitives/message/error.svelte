<script lang="ts">
  export let errorMessage = '';
  export let key: string;
  export let showError: boolean = true;
</script>

{#if errorMessage && showError}
  <p
    class="tw_input-error-message tw_s dark:tw_input-error-message_dark"
    id={`${key}-message`}
  >
    {errorMessage}
  </p>
{/if}
