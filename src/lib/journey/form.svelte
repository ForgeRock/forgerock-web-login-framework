<script context="module" lang="ts">
  // TODO: Is this a bad pattern?
  export let initForm;
</script>

<script lang="ts">
  import { CallbackType } from '@forgerock/javascript-sdk';
  import type { Writable } from 'svelte/store';

  // Stores handling business logic and/or network orchestration
  import { initTree, type StepTypes } from '$journey/journey.store';
  import { email, fullName, isAuthenticated } from '$lib/user/user.store';

  // Import primitives
  import Button from '$components/primitives/button/button.svelte';

  // Callback handler components
  import Boolean from '$journey/callbacks/boolean/boolean.svelte';
  import Choice from './callbacks/choice/choice.svelte';
  import Password from '$journey/callbacks/password/password.svelte';
  import CreatePassword from '$journey/callbacks/password/create-password.svelte';
  import Name from '$journey/callbacks/username/name.svelte';

  export let closeModal;
  export let returnError;
  export let returnUser;

  let failureMessage: Writable<string | null>;
  let getStep: (prevStep?: StepTypes) => Promise<void>;
  let step: Writable<StepTypes>;
  let submittingForm: Writable<boolean>;

  // Assign function to variable initialized in module context above
  initForm = async function () {
    let initObj = await initTree('Login');

    failureMessage = initObj.failureMessage;
    getStep = initObj.getStep;
    step = initObj.step;
    submittingForm = initObj.submittingForm;
  };

  /**
   * Iterate through callbacks received from AM and map the callback to the
   * appropriate callback component, pushing that component
   * the StepComponent's array.
   */
   function mapCallbackToComponent(cb: any) {
    /** *********************************************************************
     * SDK INTEGRATION POINT
     * Summary:SDK callback method for getting the callback type
     * ----------------------------------------------------------------------
     * Details: This method is helpful in quickly identifying the callback
     * when iterating through an unknown list of AM callbacks
     ********************************************************************* */
    switch (cb.getType()) {
      case CallbackType.BooleanAttributeInputCallback:
        return Boolean;
      case CallbackType.ChoiceCallback:
        return Choice;
      // case CallbackType.KbaCreateCallback:
      //   return Kba;
      case CallbackType.NameCallback:
        return Name;
      case CallbackType.PasswordCallback:
        return Password;
      // case CallbackType.StringAttributeInputCallback:
      //   return CreateTextAttribute;
      case CallbackType.ValidatedCreatePasswordCallback:
        return CreatePassword;
      // case CallbackType.ValidatedCreateUsernameCallback:
      //   return CreateUsername;
      // case CallbackType.TermsAndConditionsCallback:
      //   return TermsConditions;
      // default:
      //   return Unknown;
    }
  }

  $: {
    /**
     * Detect when user completes authentication and close modal
     */
    if ($isAuthenticated) {
      console.log('Form component recognises the user as authenticated');
      step?.set(null);


      closeModal && closeModal();
      returnUser && returnUser({
        email: $email,
        fullName: $fullName,
        isAuthenticated: $isAuthenticated,
      });
    }
  }
</script>

{#if !$step}
  <p>Loading ...</p>
{:else if $step.type === 'Step'}
  <form
    on:submit|preventDefault={() => {
      // Get next step, passing previous step with new data
      getStep($step);
      // Set to true to indicate form is processing
      submittingForm.set(true);
    }}
  >
    {#each $step?.callbacks as callback}
      <!--
        /**
         * Using @const to save off the inputName for easier readability.
         * Then, using the dynamic svelte component syntax to pull logic out of the
         * template and into the JS above for assigning the right component to the
         * callback.
         */
       -->
       {@const inputName = callback?.payload?.input?.[0].name}
       <svelte:component this={mapCallbackToComponent(callback)} {callback} {inputName} />
    {/each}
    <Button width="full" style="primary" type="submit">Submit</Button>
  </form>
{:else if $step.type === 'LoginSuccess'}
  <p>Login Success!</p>
{/if}
