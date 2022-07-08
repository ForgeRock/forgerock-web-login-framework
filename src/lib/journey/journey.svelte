<script context="module" lang="ts">
  // TODO: Is this a bad pattern?
  export let initJourney: (tree?: string | null) => void;
</script>

<script lang="ts">
  import type { DispatchOptions } from 'svelte/internal';
  import type { Writable } from 'svelte/store';

  import type { User } from '$journey/interfaces';
  import { initTree, type StepTypes } from '$journey/journey.store';
  import { email, fullName, isAuthenticated } from '$lib/user/user.store';
  import { mapStepToStage } from '$journey/utilities/map-stage.utilities';

  export const formEl: HTMLFormElement | null = null;

  export let closeModal: (() => void) | null = null;
  export let initObj: any = null;
  export let returnError: ((failureMessage: string | null) => void) | null = null;
  export let returnUser: ((user: User) => void) | null = null;
  export let widgetDispatch: (<EventKey extends string>(
    type: EventKey,
    detail?: any,
    options?: DispatchOptions,
  ) => boolean) | null = null;

  let failureMessage: Writable<string | null>;
  let getStep: (prevStep?: StepTypes) => Promise<void>;
  let step: Writable<StepTypes>;
  let submittingForm: Writable<boolean>;

  function submitForm() {
    // Get next step, passing previous step with new data
    getStep($step);
    // Set to true to indicate form is processing
    submittingForm.set(true);
  }

  if (!initObj) {
    // Assign function to variable initialized in module context above
    initJourney = async (tree: string | null = null) => {
      let initObj = await initTree(tree);

      failureMessage = initObj.failureMessage;
      getStep = initObj.getStep;
      step = initObj.step;
      submittingForm = initObj.submittingForm;

      if (failureMessage) {
        returnError && returnError($failureMessage);
      }
    };
  }

  $: {
    /**
     * Detect when user completes authentication,
     * return user information and close modal.
     */
    if ($isAuthenticated) {
      console.log('Form component recognises the user as authenticated');
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

<svelte:component this={mapStepToStage($step)} {submitForm} {step} />
