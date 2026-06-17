<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { afterUpdate, onDestroy } from 'svelte';

  import T from '$components/_utilities/locale-strings.svelte';
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import { setupPasskeyAutofill } from '$core/journey/stages/_effects/webauthn.effects';
  import { mapStepToStage } from '$journey/_utilities/map-stage.utilities';
  import { stack } from '$journey/journey.store';

  import type { SvelteComponent } from 'svelte';

  import type { JourneyStore, StageRegistryEntry } from '$journey/journey.interfaces';

  export let componentStyle: 'app' | 'inline' | 'modal';
  export let displayIcon: boolean;
  export let formEl: HTMLFormElement | null = null;
  export let journeyStore: JourneyStore;
  export let externalStages: Record<string, StageRegistryEntry> = {};

  if (!$journeyStore) {
    console.error(
      'Widget missing configuration. Import and call `configuration()`, then use `set()` to configure.',
    );
  }

  let alertNeedsFocus = false;

  const passkeyAutofill = journeyStore ? setupPasskeyAutofill(journeyStore) : null;

  function submitForm() {
    // Abort any in-flight conditional mediation request; ignore failures.
    passkeyAutofill?.abort();
    // Get next step, passing previous step with new data
    const step = $journeyStore.step;
    if (step && step.type === 'Step') {
      journeyStore?.next(step);
    }
  }
  async function tryAgain() {
    journeyStore?.reset();

    try {
      const latest = await stack.latest();
      await journeyStore?.start(latest);
    } catch (err) {
      console.error('Unable to restart journey', err);
    }
  }

  afterUpdate(() => {
    alertNeedsFocus = $journeyStore && !$journeyStore.successful;
  });

  onDestroy(() => {
    passkeyAutofill?.destroy();
  });
</script>

{#if $journeyStore && !$journeyStore.completed}
  {#if $journeyStore && !$journeyStore.step}
    <div class="tw_text-center tw_w-full tw_py-4">
      <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-28 tw_w-28" />
    </div>
  {:else if $journeyStore.step?.type === 'Step'}
    <svelte:component
      this={mapStepToStage($journeyStore.step, externalStages) as typeof SvelteComponent}
      bind:formEl
      {componentStyle}
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
        redirect: journeyStore.redirect,
      }}
      metadata={$journeyStore.metadata}
      step={$journeyStore.step}
    />
  {/if}
{:else if $journeyStore && $journeyStore.successful}
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
