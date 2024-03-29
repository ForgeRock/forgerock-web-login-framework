<script lang="ts">
  import type { KbaCreateCallback, NameValue } from '@forgerock/javascript-sdk';
  import { writable } from 'svelte/store';
  import type { z } from 'zod';

  import InputFloating from '$components/compositions/input-floating/floating-label.svelte';
  import InputStacked from '$components/compositions/input-stacked/stacked-label.svelte';
  import SelectFloating from '$components/compositions/select-floating/floating-label.svelte';
  import SelectStacked from '$components/compositions/select-stacked/stacked-label.svelte';
  import T from '$components/_utilities/locale-strings.svelte';
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import LockIcon from '$components/icons/lock-icon.svelte';

  import type {
    CallbackMetadata,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  // Unused props. Setting to const prevents errors in console
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;

  export let callback: KbaCreateCallback;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  export let style: z.infer<typeof styleSchema> = {};

  const Input = style.labels === 'stacked' ? InputStacked : InputFloating;
  const Select = style.labels === 'stacked' ? SelectStacked : SelectFloating;

  let customQuestionIndex: string | null = null;
  let displayCustomQuestionInput = false;
  let inputArr: NameValue[] | undefined;
  let inputName: string;
  let inputNameQuestion: string;
  let inputNameAnswer: string | false;
  let prompt: string;
  let questions: { text: string; value: string }[];
  let shouldAllowCustomQuestion: boolean | undefined;
  let value = writable('');

  /**
   * `getOutputValue` throws if it doesn't find this property. There _may_ be a context
   * in which the property doesn't exist, so I'm going to wrap it in a try-catch, just
   * in case
   */
  try {
    shouldAllowCustomQuestion = callback.getOutputValue('allowUserDefinedQuestions') as boolean;
  } catch (err) {
    console.error(
      '`allowUserDefinedQuestions` property is missing in callback `KbaCreateCallback`',
    );
  }

  /**
   * @function setAnswer - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setAnswer(event: Event) {
    callback.setAnswer((event.target as HTMLSelectElement).value);
  }

  /**
   * @function setQuestion - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function selectQuestion(event: Event) {
    const selectValue = (event.target as HTMLSelectElement).value;

    if (selectValue === customQuestionIndex) {
      displayCustomQuestionInput = true;
      value.set('');
      callback.setAnswer('');
    } else {
      displayCustomQuestionInput = false;
      callback.setQuestion(selectValue);
    }
  }

  /**
   * @function setQuestion - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setQuestion(event: Event) {
    const inputValue = (event.target as HTMLSelectElement).value;
    callback.setQuestion(inputValue);
  }

  $: {
    inputArr = callback?.payload?.input;
    inputName = callback?.payload?.input?.[0].name || `kba-${callbackMetadata?.idx}`;
    inputNameQuestion = inputName;
    inputNameAnswer = Array.isArray(inputArr) && inputArr[1].name;
    prompt = callback.getPrompt();
    questions = callback
      .getPredefinedQuestions()
      ?.map((label, idx) => ({ text: label, value: `${idx}` }));

    /**
     * `getOutputValue` throws if it doesn't find this property. There _may_ be a context
     * in which the property doesn't exist, so I'm going to wrap it in a try-catch, just
     * in case
     */
    try {
      shouldAllowCustomQuestion = callback.getOutputValue('allowUserDefinedQuestions') as boolean;
    } catch (err) {
      console.error(
        '`allowUserDefinedQuestions` property is missing in callback `KbaCreateCallback`',
      );
    }

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
  }
</script>

<fieldset class="tw_kba-fieldset tw_input-spacing dark:tw_kba-fieldset_dark">
  <!-- TODO: Remove hardcoded legend below -->
  <legend class="tw_sr-only">
    <T key="securityQuestions" />
  </legend>

  <h2 class="dark:tw_secondary-header_dark tw_font-semibold tw_mb-4">
    <T key="securityQuestionsPrompt" />
  </h2>

  <span class="tw_kba-lock-icon dark:tw_kba-lock-icon_dark">
    <LockIcon size="18" />
  </span>

  <Select
    isFirstInvalidInput={false}
    isRequired={true}
    key={inputNameQuestion}
    label={prompt}
    onChange={selectQuestion}
    options={questions}
  />

  {#if displayCustomQuestionInput}
    <Input
      isFirstInvalidInput={false}
      isRequired={true}
      key={`kba-custom-question-${callbackMetadata?.idx}`}
      label={interpolate('customSecurityQuestion')}
      showMessage={false}
      message={interpolate('inputRequiredError')}
      onChange={setQuestion}
      type="text"
    />
  {/if}

  <Input
    isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}
    isRequired={true}
    key={inputNameAnswer || `kba-answer-${callbackMetadata?.idx}`}
    label={interpolate('securityAnswer')}
    showMessage={false}
    message={interpolate('inputRequiredError')}
    onChange={setAnswer}
    type="text"
    bind:value={$value}
  />
</fieldset>
