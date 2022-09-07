<script lang="ts">
  import type { KbaCreateCallback } from '@forgerock/javascript-sdk';

  import Input from '$components/compositions/input-floating/floating-label.svelte';
  import Select from '$components/compositions/select-floating/floating-label.svelte';
  import T from '$components/_utilities/locale-strings.svelte';
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import LockIcon from '$components/icons/lock-icon.svelte';

  export let callback: KbaCreateCallback;
  export let firstInvalidInput: boolean;
  export let idx: number;

  /** *************************************************************************
   * SDK INTEGRATION POINT
   * Summary: SDK callback methods for getting values
   * --------------------------------------------------------------------------
   * Details: Each callback is wrapped by the SDK to provide helper methods
   * for accessing values from the callbacks received from AM
   ************************************************************************* */
  const inputArr = callback?.payload?.input;
  const inputName = callback?.payload?.input?.[0].name || `kba-${idx}`;
  const inputNameQuestion = inputName;
  const inputNameAnswer = Array.isArray(inputArr) && inputArr[1].name;
  const prompt = callback.getPrompt();
  const questions = callback
    .getPredefinedQuestions()
    ?.map(
      (label, idx) => ({ text: label, value: `${idx}` }),
    );

  let customQuestionIndex: string | null = null;
  let displayCustomQuestionInput = false;
  let shouldAllowCustomQuestion = callback.getOutputValue('allowUserDefinedQuestions');
  let value = '';

  questions.unshift({ text: prompt, value: '' });

  /**
   * Uncomment the below `setQuestion` if you remove the `unshift` above.
   * The `unshift` defaults the UI to a non-question, but if you remove it,
   * you will default to a question, which needs to be set in the callback.
   *
   * callback.setQuestion(questions[0].text);
   */

  if (shouldAllowCustomQuestion) {
    customQuestionIndex = `${questions.length - 1}`;
    questions.push({ text: interpolate('provideCustomQuestion'), value: customQuestionIndex });
  }

  /**
   * @function setAnswer - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setAnswer(event: Event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setAnswer((event.target as HTMLSelectElement).value);
  }

  /**
   * @function setQuestion - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function selectQuestion(event: Event) {
    const value = (event.target as HTMLSelectElement).value;

    if (value === customQuestionIndex) {
      displayCustomQuestionInput = true;
    } else {
      displayCustomQuestionInput = false;
      /** ***********************************************************************
       * SDK INTEGRATION POINT
       * Summary: SDK callback methods for setting values
       * ------------------------------------------------------------------------
       * Details: Each callback is wrapped by the SDK to provide helper methods
       * for writing values to the callbacks received from AM
       *********************************************************************** */
      callback.setQuestion(value);
    }
  }

  /**
   * @function setQuestion - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setQuestion(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setQuestion(value);
  }

  $: {
    shouldAllowCustomQuestion = callback.getOutputValue('allowUserDefinedQuestions');
  }
</script>

<fieldset class="tw_kba-fieldset tw_input-spacing dark:tw_kba-fieldset_dark">
  <!-- TODO: Remove hardcoded legend below -->
  <legend class="tw_sr-only">
    <T key="securityQuestions" />
  </legend>

  <h2 class="tw_kba-header dark:tw_kba-header_dark">
    <T key="securityQuestionsPrompt" />
  </h2>

  <span class="tw_kba-lock-icon dark:tw_kba-lock-icon_dark">
    <LockIcon size="18" />
  </span>

  <Select
    firstInvalidInput={false}
    isRequired={true}
    key={inputNameQuestion}
    label={prompt}
    onChange={selectQuestion}
    options={questions}
  />

  {#if displayCustomQuestionInput}
    <Input
      firstInvalidInput={false}
      isRequired={true}
      key={inputNameAnswer || 'ka-question-label'}
      label={interpolate('customSecurityQuestion')}
      onChange={setQuestion}
      type="text"
      {value}
    />
  {/if}

  <Input
    {firstInvalidInput}
    isRequired={true}
    key={inputNameAnswer || 'ka-answer-label'}
    label={interpolate('securityAnswer')}
    onChange={setAnswer}
    type="text"
    {value}
  />
</fieldset>
