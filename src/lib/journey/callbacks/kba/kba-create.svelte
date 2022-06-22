<script lang="ts">
  import type { KbaCreateCallback } from '@forgerock/javascript-sdk';

  import Input from '$components/compositions/input-floating/floating-label.svelte';
  import Select from '$components/compositions/select-floating/floating-label.svelte';


  export let callback: KbaCreateCallback;
  export let inputName = '';

  /** *************************************************************************
   * SDK INTEGRATION POINT
   * Summary: SDK callback methods for getting values
   * --------------------------------------------------------------------------
   * Details: Each callback is wrapped by the SDK to provide helper methods
   * for accessing values from the callbacks received from AM
   ************************************************************************* */
  const prompt = callback.getPrompt();
  const questions = callback.getPredefinedQuestions();
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

<fieldset class="tw_kba-fieldset dark:tw_kba-fieldset_dark">
  <!-- TODO: Remove hardcoded legend below -->
  <legend class="tw_kba-legend dark:tw_kba-legend_dark">Provide security question(s) & answer(s) below</legend>
  <Select defaultOption={0} key={inputNameQuestion} label={prompt} onChange={setQuestion} options={questions} />

  <Input key={inputNameAnswer || 'ka-answer-label'} label="Security Answer" onChange={setAnswer} isRequired={true} type="text" />
</fieldset>
