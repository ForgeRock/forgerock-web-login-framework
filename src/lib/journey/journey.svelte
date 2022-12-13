<script lang="ts">
  import { afterUpdate } from 'svelte';

  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import { stack } from '$journey/journey.store';
  import T from '$components/_utilities/locale-strings.svelte';
  import { mapStepToStage } from '$journey/_utilities/map-stage.utilities';
  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import { StepType } from '@forgerock/javascript-sdk';

  import type { JourneyStore } from '$journey/journey.interfaces';

  export let displayIcon: boolean;
  export let formEl: HTMLFormElement | null = null;
  export let journeyStore: JourneyStore;

  let alertNeedsFocus = false;

  function submitForm() {
    // Get next step, passing previous step with new data
    journeyStore?.next($journeyStore.step);
  }
  function tryAgain() {
    journeyStore?.reset();
    journeyStore?.next();
  }

  afterUpdate(() => {
    alertNeedsFocus = !$journeyStore.successful;
  });
</script>

{#if !$journeyStore?.completed}
  {#if !$journeyStore.step}
    <div class="tw_text-center tw_w-full tw_py-4">
      <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-28 tw_w-28" />
    </div>
  {:else if $journeyStore.step.type === StepType.Step}
    <svelte:component
      this={mapStepToStage($journeyStore.step)}
      bind:formEl
      form={{
        icon: displayIcon,
        message: $journeyStore.error?.message || '',
        status: $journeyStore.error?.code ? 'error' : 'ok',
        submit: submitForm,
      }}
      journey={{
        loading: $journeyStore.loading,
        pop: journeyStore.pop,
        push: journeyStore.push,
        stack,
      }}
      step={$journeyStore.step}
    />
  {/if}
{:else if $journeyStore?.successful}
  <div class="tw_text-center tw_w-full tw_py-4">
    <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-28 tw_w-28" />
  </div>
{:else}
  <Alert id="unrecoverableStepError" needsFocus={alertNeedsFocus} type="error">
    <T html={true} key="unrecoverableError" />
  </Alert>
  <Button style="secondary" onClick={tryAgain}>
    <T key="tryAgain" />
  </Button>
{/if}
