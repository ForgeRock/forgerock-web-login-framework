<script lang="ts">
  export let ariaDescribedBy: string;
  export let formEl: HTMLFormElement | null = null;
  export let id = 'formId';
  export let needsFocus = false;
  export let onSubmitWhenValid: ((event: SubmitEvent, isFormValid: boolean) => void) | undefined = undefined;

  let isFormValid = false;

  /**
   * @function formSubmit - responsible for form validation prior to calling provided submit function
   * @param {Object} event - HTML form event
   * @return {undefined}
   */
  // TODO: Using an `any` to give us time to figure out these weird event types that just changed
  function formSubmit(event: any) {
    /**
     * Reference for validation: https://www.aleksandrhovhannisyan.com/blog/html-input-validation-without-a-form/
     */
    const form = event.target as HTMLFormElement;

    let isFirstInvalidInput: number | null = null;

    isFormValid = false; // Restart with `false`

    // Iterate over all children of the form, and pluck out the inputs
    Array.from(form.children).forEach((el, idx) => {
      // First child will be a `div`, so query the actual form elements
      // eslint-disable-next-line no-undef
      const inputs: NodeListOf<HTMLInputElement> | null =
        el.querySelectorAll('input, select, textarea');

      // If element has no form input, return early
      if (!inputs?.length) {
        return;
      }

      // Reports input's value validity and triggers native error handling
      // const isValid = input.reportValidity();

      /**
       * Not the most efficient thing to do, but fieldsets contain more than one input
       * The vast majority of these will be a list of one
       */
      Array.from(inputs).forEach((input) => {
        /**
         * Just check validity, but don't "report" it
         * The data attribute is a string of 'true', 'false', OR the value undefined
         */
        const isValid = input.checkValidity() && input.dataset.forceValidityFailure !== 'true';
        // debugger;

        // Grab the associated elements to this input
        const messageKey = input.getAttribute('aria-describedby') || '';
        const messageContainer = document.getElementById(messageKey);
        const messageEl = messageContainer?.querySelector('.__input-message');

        // If input is invalid, mark it with error and message
        if (!isValid) {
          input.setAttribute('aria-invalid', 'true');

          if (messageKey) {
            messageEl?.classList.add('tw_isInvalid');
            messageEl?.classList.remove('tw_hidden');
          }

          // If there is no previous invalid input, this input is first and receives focus
          if (isFirstInvalidInput === null) {
            input.focus();
            isFirstInvalidInput = idx;
          }
        } else {
          input.setAttribute('aria-invalid', 'false');
          messageEl?.classList.remove('tw_isInvalid');
          messageEl?.classList.add('tw_hidden');
        }
      });
    });

    // If there's no invalid input, submit form.
    if (isFirstInvalidInput === null) {
      isFormValid = true;
      onSubmitWhenValid && onSubmitWhenValid(event, isFormValid);
    }
  }

  $: {
    if (needsFocus) {
      formEl && formEl.focus();
    }
  }
</script>

<form
  bind:this={formEl}
  aria-describedby={ariaDescribedBy}
  {id}
  class={`tw_form-base ${isFormValid ? 'tw_form-valid' : 'tw_form-invalid'} tw_outline-none`}
  novalidate
  on:submit|preventDefault={formSubmit}
  tabindex="-1"
>
  <slot />
</form>
