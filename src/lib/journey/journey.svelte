<script lang="ts">
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import T from '$components/i18n/index.svelte';
  import type { JourneyStore } from '$journey/journey.store';
  import { mapStepToStage } from '$journey/utilities/map-stage.utilities';

  export let formEl: HTMLFormElement | null = null;

  export let journeyStore: JourneyStore;

  function submitForm() {
    // Get next step, passing previous step with new data
    journeyStore?.next($journeyStore.step);
  }
  function tryAgain() {
    journeyStore?.reset();
    journeyStore?.next();
  }
</script>

{#if !$journeyStore.completed}
  <svelte:component
    this={mapStepToStage($journeyStore?.step)}
    failureMessage={$journeyStore?.error?.message}
    bind:formEl
    {submitForm}
    step={$journeyStore?.step}
  />
{:else if $journeyStore.successful}
  <Alert type="success">
    <T key="successMessage" />
  </Alert>
{:else}
  <Alert type="error">
    <T html={true} key="unrecoverableError" />
  </Alert>
  <Button style="secondary" onClick={tryAgain}>
    <T key="tryAgain" />
  </Button>
{/if}
