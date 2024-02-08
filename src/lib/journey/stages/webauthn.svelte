<script lang="ts">
  import { FRWebAuthn, WebAuthnStepType } from '@forgerock/javascript-sdk';
  import { afterUpdate } from 'svelte';

  // i18n
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import T from '$components/_utilities/locale-strings.svelte';

  // Import primitives
  import Alert from '$components/primitives/alert/alert.svelte';
  import { convertStringToKey } from '$journey/stages/_utilities/step.utilities';
  import Form from '$components/primitives/form/form.svelte';
  import FingerprintIcon from '$components/icons/fingerprint-icon.svelte';

  // Types
  import type { FRStep } from '@forgerock/javascript-sdk';

  import type { StageFormObject } from '$journey/journey.interfaces';

  import Input from '$components/compositions/input-floating/floating-label.svelte';

  import Button from '$components/primitives/button/button.svelte';
  import Spinner from '$components/primitives/spinner/spinner.svelte';

  // TODO: refactor the map stage to component utility to allow passing in FRWebAuthn
  export let allowWebAuthn = true;
  export let componentStyle: 'app' | 'inline' | 'modal';
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let step: FRStep;

  const formFailureMessageId = 'genericStepFailureMessage';
  const formHeaderId = 'genericStepHeader';
  const formElementId = 'genericStepForm';

  let alertNeedsFocus = false;
  let deviceName = ''; 
  let noDeviceRegistered = false;
  let formMessageKey = '';
  let formAriaDescriptor = 'genericStepHeader';
  let formNeedsFocus = false;
  let requestsDeviceName = true;
  let waitingForWebAuthnAPI = false;
  let webAuthnType = FRWebAuthn.getWebAuthnStepType(step);

  function updateDeviceName (event: Event) {
    const target = event.target as unknown as { value: string } 
    deviceName = target.value;
  }

  afterUpdate(() => {
    if (form?.message) {
      formAriaDescriptor = formFailureMessageId;
      alertNeedsFocus = true;
      formNeedsFocus = false;
    } else {
      formAriaDescriptor = formHeaderId;
      alertNeedsFocus = false;
      formNeedsFocus = true;
    }
  });

  /**
   * Determine a WebAuthn step
   */
  async function callWebAuthnApi() {
    try {
      switch (webAuthnType) {
        case WebAuthnStepType.Registration: {
          try {
            await FRWebAuthn.register<typeof deviceName>(step, deviceName);
            noDeviceRegistered = true;
          } catch (err) {
            // TODO: handle error
          } 
          break;
        }
        case WebAuthnStepType.Authentication: {
          await FRWebAuthn.authenticate(step);
          break;
        }
        default:
          break;
      }
    } catch (err) {
      // TODO: handle error
    }
    form.submit();
  }

 
  $: {
    formMessageKey = convertStringToKey(form?.message);
    console.log(noDeviceRegistered, allowWebAuthn)
    // Call the WebAuthn API without await
    if (allowWebAuthn && !noDeviceRegistered) {
      console.log(requestsDeviceName)
        if ((WebAuthnStepType.Registration === webAuthnType && !requestsDeviceName) || WebAuthnStepType.Authentication === webAuthnType) {
          callWebAuthnApi();
        }
      }

  }
</script>

<Form
  bind:formEl
  ariaDescribedBy={formAriaDescriptor}
  id={formElementId}
  needsFocus={formNeedsFocus}
>
  {#if form?.icon && componentStyle !== 'inline'}
    <div class="tw_flex tw_justify-center">
      <FingerprintIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
    </div>
  {/if}

  {#if waitingForWebAuthnAPI}
  <div class="tw_text-center tw_w-full tw_py-4">
    <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-28 tw_w-28" />
  </div>
  {/if}
  {#if form?.message}
    <Alert id={formFailureMessageId} needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

  {#if webAuthnType === WebAuthnStepType.Authentication}
    <header id={formHeaderId}>
      <div class="tw_text-center tw_w-full tw_py-4">
        <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-28 tw_w-28" />
      </div>
      <h1 class="tw_primary-header dark:tw_primary-header_dark">
        <T key="verifyYourIdentity" />
      </h1>
      <p
        class="tw_text-center tw_-mt-5 tw_mb-2 tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
      >
        <T key="useDeviceForIdentityVerification" />
      </p>
    </header>
  {:else}
    <header class={`tw_input-spacing`} id={formHeaderId}>
      {#if requestsDeviceName}
      <h1 class="tw_primary-header dark:tw_primary-header_dark">
        <T key="nameYourDevice" />
      </h1>
        <Input type='text' isRequired={ false } isFirstInvalidInput={false} key="devicename" onChange={updateDeviceName} label={interpolate('optionallyNameDevice')} /> 
          <Button style="primary" type="submit" width="full" onClick={() => {
            requestsDeviceName = false; 
            waitingForWebAuthnAPI = true }
            }>
            <T key="nextButton" />
          </Button>
      {:else}
        <h1 class="tw_primary-header dark:tw_primary-header_dark">
          <T key="registerYourDevice" values={{name: deviceName.length > 0 ? deviceName : interpolate('yourDevice')}} />
        </h1>
        <p
          class="tw_text-center tw_-mt-5 tw_mb-2 tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
        >
          <T key="chooseYourDeviceForIdentityVerification" />
        </p>
      {/if}
    </header>
  {/if}
</Form>
