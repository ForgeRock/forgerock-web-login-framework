<script lang="ts">
  import { afterUpdate, onMount } from 'svelte';

  // i18n
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import T from '$components/_utilities/locale-strings.svelte';

  // Import primitives
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import { convertStringToKey } from '$journey/stages/_utilities/step.utilities';
  import Form from '$components/primitives/form/form.svelte';
  import NewUserIcon from '$components/icons/new-user-icon.svelte';
  import { mapCallbackToComponent } from '$journey/_utilities/map-callback.utilities';
  import { style } from '$lib/style.store';

  import type {
    CallbackMetadata,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
    WidgetStep,
  } from '$journey/journey.interfaces';
  import { captureLinks } from './_utilities/stage.utilities';
  import type { Maybe } from '$lib/interfaces';

  // New API
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{
    callbacks: CallbackMetadata[];
    step: StepMetadata;
  }>;
  export let step: WidgetStep;

  let alertNeedsFocus = false;
  let formMessageKey = '';
  let linkWrapper: HTMLElement;

  function determineSubmission() {
    // TODO: the below is more strict; all self-submitting cbs have to complete before submitting
    // if (stepMetadata.isStepSelfSubmittable && isStepReadyToSubmit(callbackMetadataArray)) {

    // The below variation is more liberal first self-submittable cb to call this wins.
    if (metadata?.step?.isStepSelfSubmittable) {
      form?.submit();
    }
  }
  function returnCallback(callback: any) {
    return callback as never;
  }

  afterUpdate(() => {
    alertNeedsFocus = !!form?.message;
  });

  onMount(() => captureLinks(linkWrapper, journey));

  $: {
    formMessageKey = convertStringToKey(form?.message);
  }
</script>

<Form bind:formEl ariaDescribedBy="formFailureMessageAlert" onSubmitWhenValid={form?.submit}>
  {#if form?.icon}
    <div class="tw_flex tw_justify-center">
      <NewUserIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
    </div>
  {/if}
  <h1 class="tw_primary-header dark:tw_primary-header_dark">
    <T key="registerHeader" />
  </h1>
  <p
    bind:this={linkWrapper}
    class="tw_text-base tw_text-center tw_-mt-5 tw_mb-2 tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
  >
    <T key="alreadyHaveAnAccount" html={true} />
  </p>

  {#if form.message}
    <Alert id="formFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

  {#each step?.callbacks as callback, idx}
    <svelte:component
      this={mapCallbackToComponent(callback)}
      callback={returnCallback(callback)}
      callbackMetadata={metadata?.callbacks[idx]}
      selfSubmitFunction={determineSubmission}
      stepMetadata={metadata?.step && { ...metadata?.step }}
      style={$style}
    />
  {/each}

  {#if metadata?.step?.isUserInputOptional || !metadata?.step?.isStepSelfSubmittable}
    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      <T key="registerButton" />
    </Button>
  {/if}
</Form>
