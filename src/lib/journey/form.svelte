<script context="module" lang="ts">
  // TODO: Is this a bad pattern?
  export let initForm;
</script>

<script lang="ts">
  import type { Writable } from 'svelte/store';

  // Stores handling business logic and/or network orchestration
  import { initTree, type StepTypes } from '$journey/journey.store';
  import { email, fullName, isAuthenticated } from '$lib/user/user.store';

  import Step from '$journey/step.svelte';

  export let closeModal;
  export let returnError;
  export let returnUser;
  export let widgetDispatch;

  let failureMessage: Writable<string | null>;
  let getStep: (prevStep?: StepTypes) => Promise<void>;
  let step: Writable<StepTypes>;
  let submitForm = () => {
    // Get next step, passing previous step with new data
    getStep($step);
    // Set to true to indicate form is processing
    submittingForm.set(true);
  };
  let submittingForm: Writable<boolean>;

  // Assign function to variable initialized in module context above
  initForm = async (tree) => {
    let initObj = await initTree(tree);

    failureMessage = initObj.failureMessage;
    getStep = initObj.getStep;
    step = initObj.step;
    submittingForm = initObj.submittingForm;

    if (failureMessage) {
      returnError && returnError(failureMessage);
    }
  };

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
      widgetDispatch('journey-success', user)
    }
  }
</script>

<Step {submitForm} {step} />
