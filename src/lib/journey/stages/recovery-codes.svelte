<script lang="ts">
  import { FRRecoveryCodes } from '@forgerock/javascript-sdk';
  import { afterUpdate } from 'svelte';

  // i18n
  import T from '$components/_utilities/locale-strings.svelte';

  // Import primitives
  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import ClipboardIcon from '$components/icons/shield-check-icon.svelte';

  // Types
  import type { FRStep } from '@forgerock/javascript-sdk';

  import type { StageFormObject, StageJourneyObject } from '$journey/journey.interfaces';

  export let componentStyle: 'app' | 'inline' | 'modal';
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let step: FRStep;

  const formFailureMessageId = 'genericStepFailureMessage';
  const formHeaderId = 'genericStepHeader';
  const formElementId = 'genericStepForm';
  let formAriaDescriptor = 'genericStepHeader';
  let formNeedsFocus = false;
  let codes: string[] = [];
  let name = 'New Security Key';

  afterUpdate(() => {
    if (form?.message) {
      formAriaDescriptor = formFailureMessageId;
      formNeedsFocus = false;
    } else {
      formAriaDescriptor = formHeaderId;
      formNeedsFocus = true;
    }
  });

  $: {
    codes = FRRecoveryCodes.getCodes(step);
    name = FRRecoveryCodes.getDeviceName(step);
  }
</script>

<Form
  bind:formEl
  ariaDescribedBy={formAriaDescriptor}
  id={formElementId}
  needsFocus={formNeedsFocus}
  onSubmitWhenValid={() => form.submit()}
>
  {#if form?.icon && componentStyle !== 'inline'}
    <div class="tw_flex tw_justify-center">
      <ClipboardIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
    </div>
  {/if}

  <header id={formHeaderId}>
    <h1 class="tw_primary-header dark:tw_primary-header_dark">
      <T key="yourMultiFactorAuthIsEnabled" />
    </h1>
    <p
      class="tw_-mt-5 tw_mb-2 tw_py-4 tw_text-sm tw_text-secondary-dark dark:tw_text-secondary-light"
    >
      <T key="useThisNewMfaToHelpVerifyYourIdentity" />
    </p>
  </header>

  <hr class="tw_border-collapse tw_border-secondary-light dark:tw_border-secondary-dark tw_mb-8" />

  <h2 class="tw_secondary-header dark:tw_secondary-header_dark tw_text-lg">
    <T key="dontGetLockedOut" />
  </h2>

  <p class="tw_text-sm tw_text-secondary-dark dark:tw_text-secondary-light tw_my-6">
    <T html={true} key="yourRecoveryCodesToAccessAccountForLostDevice" />
  </p>

  <ol
    class="tw_font-mono tw_border tw_border-secondary-light dark:tw_border-secondary-dark tw_bg-white dark:tw_bg-body-dark tw_list-decimal tw_text-secondary-light dark:tw_text-secondary-light tw_py-4 tw_list-inside tw_rounded-md tw_mb-4 tw_columns-2"
  >
    {#each codes as code}
      <li class="tw_text-center">
        <span class="tw_text-secondary-dark dark:tw_text-secondary-light">
          {code}
        </span>
      </li>
    {/each}
  </ol>
  <p class="tw_text-sm tw_text-secondary-dark dark:tw_text-secondary-light tw_my-6">
    <T html={true} key="useOneOfTheseCodes" values={{ name }}/>
  </p>

  <Button busy={journey?.loading} style="primary" type="submit" width="full">
    <T key="nextButton" />
  </Button>
</Form>
