<script lang="ts">
  import { CallbackType, FRLoginFailure, FRLoginSuccess, FRStep } from '@forgerock/javascript-sdk';
  import type { Writable } from 'svelte/store';

  // Import primitives
  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';

  // Callback handler components
  import Boolean from '$journey/callbacks/boolean/boolean.svelte';
  import ValidatedCreatePassword from '$journey/callbacks/password/validated-create-password.svelte';
  import ValidatedCreateUsername from '$journey/callbacks/username/validated-create-username.svelte';
  import Choice from '$journey/callbacks/choice/choice.svelte';
  import KbaCreate from '$journey/callbacks/kba/kba-create.svelte';
  import Name from '$journey/callbacks/username/name.svelte';
  import Password from '$journey/callbacks/password/password.svelte';
  import StringAttributeInput from '$journey/callbacks/string-attribute/string-attribute-input.svelte';
  import TermsConditions from '$journey/callbacks/terms-and-conditions/terms-conditions.svelte';

  type StepTypes = FRStep | FRLoginSuccess | FRLoginFailure | null;

  export let formEl: HTMLFormElement | null = null;
  export let step: Writable<StepTypes>;
  export let submitForm: () => void;

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
      case CallbackType.KbaCreateCallback:
        return KbaCreate;
      case CallbackType.NameCallback:
        return Name;
      case CallbackType.PasswordCallback:
        return Password;
      case CallbackType.StringAttributeInputCallback:
        return StringAttributeInput;
      case CallbackType.ValidatedCreatePasswordCallback:
        return ValidatedCreatePassword;
      case CallbackType.ValidatedCreateUsernameCallback:
        return ValidatedCreateUsername;
      case CallbackType.TermsAndConditionsCallback:
        return TermsConditions;
      // default:
      //   return Unknown;
    }
  }
</script>

{#if !$step}
  <p>Loading ...</p>
{:else if $step.type === 'Step'}
  <Form bind:formEl onSubmitWhenValid={submitForm}>
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
  </Form>
  <p class="tw_text-center tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light">
    Don’t have an account?
    <a class="tw_text-blue-600 dark:tw_text-blue-400 tw_underline" href="/register">
      Sign up here!
    </a>
  </p>
{:else if $step.type === 'LoginSuccess'}
  <p>Login Success!</p>
{/if}
