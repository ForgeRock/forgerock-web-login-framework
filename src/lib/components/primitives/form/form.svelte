<script lang="ts">
  export let formEl: HTMLFormElement | null = null;
  export let onSubmitWhenValid: (event: Event, isFormValid: boolean) => void;

  let isFormValid = false;

  /**
   * @function formSubmit - responsible for form validation prior to calling provided submit function
   * @param {Object} event - HTML form event
   * @return {undefined}
   */
  function formSubmit(event: Event) {
    /**
     * Reference for validation: https://www.aleksandrhovhannisyan.com/blog/html-input-validation-without-a-form/
     */
    const form = event.target as HTMLFormElement;

    let firstInvalidInput: number | null = null;

    isFormValid = false; // Restart with `false`

    if (form.checkValidity()) {
      isFormValid = true;
      // Since form is valid, call provided submit function and return early
      onSubmitWhenValid(event, isFormValid);
      return;
    }

    // Iterate over all children of the form, and pluck out the the inputs
    Array.from(form.children).forEach((el, idx) => {
      // First child will be a `div`, so query the actual form elements
      const inputs: NodeListOf<HTMLInputElement> | null = el.querySelectorAll('input, select, textarea');

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
        // Just check validity, but don't "report" it
        const isValid = input.checkValidity();

        // If input is invalid, mark it with error and message
        if (!isValid) {
          input.setAttribute('aria-invalid', 'true');
          let messageKey = input.getAttribute('data-message');
          input.setAttribute('aria-describedby', messageKey || '');

          // If there is no previous invalid input, this input is first and receives focus
          if (firstInvalidInput === null) {
            input.focus();
            firstInvalidInput = idx;
          }
        } else {
          input.setAttribute('aria-invalid', 'false');
          input.setAttribute('aria-describedby', '');
        }
        console.log(`Is element at index ${idx} valid ${isValid}`);
      });
    });

    // If there's no invalid input, submit form.
    if (firstInvalidInput === null) {
      onSubmitWhenValid(event, isFormValid);
    }
  }
</script>

<form
  bind:this={formEl}
  class={`tw_form-base ${isFormValid ? 'tw_form-valid' : 'tw_form-invalid'}`}
  novalidate
  on:submit|preventDefault={formSubmit}
>
  <slot />
</form>
