<script lang="ts">
  import type { KbaCreateCallback } from '@forgerock/javascript-sdk';

  import Input from '$components/compositions/input-floating/floating-label.svelte';
  import Select from '$components/compositions/select-floating/floating-label.svelte';
  import LockIcon from '$components/icons/lock-icon.svelte';

  export let callback: KbaCreateCallback;
  export let idx: number;

  /** *************************************************************************
   * SDK INTEGRATION POINT
   * Summary: SDK callback methods for getting values
   * --------------------------------------------------------------------------
   * Details: Each callback is wrapped by the SDK to provide helper methods
   * for accessing values from the callbacks received from AM
   ************************************************************************* */
  const prompt = callback.getPrompt();
  const questions = callback
    .getPredefinedQuestions()
    ?.map((label, idx) => ({ text: label, value: idx }));
  const inputName = callback?.payload?.input?.[0].name || `kba-${idx}`;
  const inputNameQuestion = inputName;
  const inputArr = callback?.payload?.input;
  const inputNameAnswer = Array.isArray(inputArr) && inputArr[1].name;


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
  function setQuestion(event: Event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setQuestion((event.target as HTMLSelectElement).value);
  }
</script>

<fieldset class="tw_kba-fieldset tw_input-spacing dark:tw_kba-fieldset_dark">
  <!-- TODO: Remove hardcoded legend below -->
  <legend class="tw_sr-only">
    Security question(s)
  </legend>

  <h2 class="tw_kba-header dark:tw_kba-header_dark">
    Provide security question(s) & answer(s) below
  </h2>

  <span class="tw_kba-lock-icon dark:tw_kba-lock-icon_dark">
    <LockIcon size="18" />
  </span>

  <Select
    defaultOption={0}
    isRequired={true}
    key={inputNameQuestion}
    label={prompt}
    onChange={setQuestion}
    options={questions}
  />

  <Input
    key={inputNameAnswer || 'ka-answer-label'}
    label="Security Answer"
    onChange={setAnswer}
    isRequired={true}
    type="text"
  />
</fieldset>
