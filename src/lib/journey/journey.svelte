<script lang="ts">
  import type { DispatchOptions } from 'svelte/internal';
  import type { Writable } from 'svelte/store';

  import type { User } from '$journey/interfaces';
  import T from '$components/i18n/index.svelte';
  import { initialize, type StepTypes } from '$journey/journey.store';
  import { email, fullName, isAuthenticated } from '$lib/user/user.store';
  import { mapStepToStage } from '$journey/utilities/map-stage.utilities';

  interface InitObj {
    failureMessage: Writable<string | null>;
    getStep: (prevStep?: StepTypes) => Promise<void>;
    step: Writable<StepTypes>;
    submittingForm: Writable<boolean>;
  }

  export const formEl: HTMLFormElement | null = null;

  export let closeModal: (() => void) | null = null;
  export let initObj: InitObj | null = null;
  export let returnError: ((failureMessage: string | null) => void) | null = null;
  export let returnUser: ((user: User) => void) | null = null;
  export let widgetDispatch:
    | (<EventKey extends string>(
        type: EventKey,
        detail?: any,
        options?: DispatchOptions,
      ) => boolean)
    | null = null;

  export async function initJourney(journey?: string) {
    let initObj = await initialize(journey);

    failureMessage = initObj.failureMessage;
    getStep = initObj.getStep;
    step = initObj.step;
    submittingForm = initObj.submittingForm;

    if ($failureMessage) {
      returnError && returnError($failureMessage);
    }
  }

  let failureMessage: Writable<string | null> | undefined;
  let getStep: ((prevStep?: StepTypes) => Promise<void>) | undefined;
  let step: Writable<StepTypes> | undefined;
  let submittingForm: Writable<boolean> | undefined;

  function submitForm() {
    // Get next step, passing previous step with new data
    getStep && getStep($step);
    // Empty current step to ensure it rerenders when it gets back the same step but with errors
    // step?.set(null);
    // Set to true to indicate form is processing
    submittingForm && submittingForm.set(true);
  }

  /**
   * Keeping the below as separate reactive blocks. Merging them creates issues.
   */
  $: {
    /**
     * Wrap in reactive block in order to listen for changes from parent's `initObj`
     */
    failureMessage = initObj?.failureMessage;
    getStep = initObj?.getStep;
    step = initObj?.step;
    submittingForm = initObj?.submittingForm;
  }

  $: {
    /**
     * Detect when user completes authentication.
     * Return user information and close modal.
     */
    if ($isAuthenticated) {
      step?.set(null);

      let user = {
        email: $email,
        fullName: $fullName,
        isAuthenticated: $isAuthenticated,
      };

      closeModal && closeModal();
      returnUser && returnUser(user);
      widgetDispatch && widgetDispatch('journey-success', user);
    }
  }
</script>

{#if !$isAuthenticated}
  <svelte:component
    this={mapStepToStage($step)}
    failureMessage={$failureMessage}
    {submitForm}
    step={$step}
  />
{:else}
  <T key="successMessage" />
{/if}
