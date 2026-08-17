<!-- @migration-task Error while migrating Svelte code: Can't migrate code with afterUpdate. Please migrate by hand. -->
<!--
 
 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 
 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.
 
 -->

<script lang="ts">
  import { WebAuthn, WebAuthnStepType } from '@forgerock/journey-client/webauthn';
  import { afterUpdate } from 'svelte';

  import T from '$components/_utilities/locale-strings.svelte';
  import Input from '$components/compositions/input-floating/floating-label.svelte';
  import FingerprintIcon from '$components/icons/fingerprint-icon.svelte';
  // Import primitives
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import Spinner from '$components/primitives/spinner/spinner.svelte';
  // i18n
  import { interpolate } from '$core/_utilities/i18n.utilities';
  import { convertStringToKey } from '$journey/stages/_utilities/step.utilities';

  // Types
  import type { JourneyStep } from '@forgerock/journey-client/types';

  import type { StageFormObject } from '$journey/journey.interfaces';

  // TODO: refactor the map stage to component utility to allow passing in FRWebAuthn
  export let allowWebAuthn = true;
  export let componentStyle: 'app' | 'inline' | 'modal';
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let step: JourneyStep;

  const formFailureMessageId = 'genericStepFailureMessage';
  const formHeaderId = 'genericStepHeader';
  const formElementId = 'genericStepForm';

  let alertNeedsFocus = false;
  let deviceName = '';
  let formMessageKey = '';
  let formAriaDescriptor = 'genericStepHeader';
  let formNeedsFocus = false;
  let requestsDeviceName = true;
  let waitingForWebAuthnAPI = false;
  let webAuthnApiCalled = false;
  let webAuthnType = WebAuthn.getWebAuthnStepType(step);

  function updateDeviceName(event: Event) {
    const target = event.target as unknown as { value: string };
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

    // Call the WebAuthn API without await, but only once per component lifecycle
    if (allowWebAuthn && !webAuthnApiCalled) {
      if (
        (WebAuthnStepType.Registration === webAuthnType && !requestsDeviceName) ||
        WebAuthnStepType.Authentication === webAuthnType
      ) {
        webAuthnApiCalled = true;
        void callWebAuthnApi();
      }
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
            await WebAuthn.register<typeof deviceName>(step, deviceName);
          } catch (err) {
            // TODO: handle error
          }
          break;
        }
        case WebAuthnStepType.Authentication: {
          await WebAuthn.authenticate(step);
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.debug('Passkey autofill attempt did not complete', err);
    }
    form.submit();
  }

  $: formMessageKey = convertStringToKey(form?.message);
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
    <header class="tw_input-spacing" id={formHeaderId}>
      {#if requestsDeviceName}
        <h1 class="tw_primary-header dark:tw_primary-header_dark">
          <T key="nameYourDevice" />
        </h1>
        <Input
          type="text"
          isRequired={false}
          isFirstInvalidInput={false}
          key="devicename"
          onChange={updateDeviceName}
          label={interpolate('optionallyNameDevice')}
        />
        <Button
          style="primary"
          type="submit"
          width="full"
          onClick={() => {
            requestsDeviceName = false;
            waitingForWebAuthnAPI = true;
          }}
        >
          <T key="nextButton" />
        </Button>
      {:else}
        <h1 class="tw_primary-header dark:tw_primary-header_dark">
          <T
            key="registerYourDevice"
            values={{ name: deviceName.length > 0 ? deviceName : interpolate('yourDevice') }}
          />
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
