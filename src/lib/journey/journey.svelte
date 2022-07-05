<script context="module" lang="ts">
  // TODO: Is this a bad pattern?
  export let initJourney;
</script>

<script lang="ts">
  import type { DispatchOptions } from 'svelte/internal';
  import type { Writable } from 'svelte/store';

  // Stores handling business logic and/or network orchestration
  import { initTree, type StepTypes } from '$journey/journey.store';
  import { email, fullName, isAuthenticated } from '$lib/user/user.store';

  import Step from '$journey/step.svelte';

  interface User {
    email: unknown;
    fullName: unknown;
    isAuthenticated: unknown;
  }

  export let closeModal: () => void = null;
  export let initObj: any = null;
  export let returnError: (failureMessage: string) => void = null;
  export let returnUser: (user: User) => void = null;
  export let widgetDispatch: <EventKey extends string>(
    type: EventKey,
    detail?: any,
    options?: DispatchOptions,
  ) => boolean = null;

  let failureMessage: Writable<string | null> = initObj.failureMessage;
  let getStep: (prevStep?: StepTypes) => Promise<void> = initObj.getStep;
  let step: Writable<StepTypes> = initObj.step;
  let submittingForm: Writable<boolean> = initObj.submittingForm;

  function submitForm() {
    // Get next step, passing previous step with new data
    getStep($step);
    // Set to true to indicate form is processing
    submittingForm.set(true);
  }

  if (!initObj) {
    // Assign function to variable initialized in module context above
    initJourney = async (tree) => {
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
     * Detect when user completes authentication and close modal
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
      widgetDispatch('journey-success', user);
    }
  }
</script>

<Step {submitForm} {step} />
