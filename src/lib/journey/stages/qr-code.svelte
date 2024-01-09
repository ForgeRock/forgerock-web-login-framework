<script lang="ts">
  import { CallbackType, FRQRCode } from '@forgerock/javascript-sdk';
  import { afterUpdate, onMount } from 'svelte';

  import type {
    ConfirmationCallback,
    FRCallback,
    FRStep,
    PollingWaitCallback,
  } from '@forgerock/javascript-sdk';

  // i18n
  import { interpolate } from '$lib/_utilities/i18n.utilities';
  import T from '$components/_utilities/locale-strings.svelte';

  // Import callback components
  import PollingWait from '$journey/callbacks/polling-wait/polling-wait.svelte';

  // Import components
  import Alert from '$components/primitives/alert/alert.svelte';
  import Button from '$components/primitives/button/button.svelte';
  import Form from '$components/primitives/form/form.svelte';
  import ClipboardIcon from '$components/icons/clipboard-icon.svelte';
  import MobileIcon from '$components/icons/mobile-icon.svelte';
  import Link from '$components/primitives/link/link.svelte';
  import Spinner from '$components/primitives/spinner/spinner.svelte';
  import { convertStringToKey } from '$journey/stages/_utilities/step.utilities';
  import { styleStore as style } from '$lib/style.store';

  // Types
  import type {
    CallbackMetadata,
    StageFormObject,
    StageJourneyObject,
    StepMetadata,
  } from '$journey/journey.interfaces';
  import type { Maybe } from '$lib/interfaces';
  import CallbackMapper from '$journey/_utilities/callback-mapper.svelte';

  export let componentStyle: 'app' | 'inline' | 'modal';
  export let form: StageFormObject;
  export let formEl: HTMLFormElement | null = null;
  export let journey: StageJourneyObject;
  export let metadata: Maybe<{
    callbacks: CallbackMetadata[];
    step: StepMetadata;
  }>;
  export let step: FRStep;

  let alertNeedsFocus = false;
  let buttons: { value: string; text: string }[];
  let formMessageKey = '';
  let modifiedCallbacks: FRCallback[] = [];
  let moduleLoaded = false;
  let pollingWaitCb: PollingWaitCallback;
  let pollingWaitIdx: number;
  let qrCodeCanvas: HTMLCanvasElement;
  let qrCodeUrl: string = '';
  let qrCodeEl: HTMLInputElement;

  function determineSubmission() {
    // TODO: the below is more strict; all self-submitting cbs have to complete before submitting
    // if (stepMetadata.isStepSelfSubmittable && isStepReadyToSubmit(callbackMetadataArray)) {

    // The below variation is more liberal first self-submittable cb to call this wins.
    if (metadata?.step?.derived.isStepSelfSubmittable()) {
      form?.submit();
    }
  }

  async function copyUrl() {
    qrCodeEl.select();
    document.execCommand('copy');
  }

  afterUpdate(() => {
    alertNeedsFocus = !!form?.message;
  });

  onMount(() => {
    async function renderQrCodeImage() {
      try {
        // Dynamically import QR Code module to reduce initial load when not needed
        const qrCodeModule = await import('qrcode');

        moduleLoaded = true;

        qrCodeUrl = FRQRCode.getQRCodeData(step).uri;

        qrCodeModule.toCanvas(
          qrCodeCanvas,
          qrCodeUrl,
          // Properties required for ForgeRock QR Codes
          { errorCorrectionLevel: 'L', version: 20, width: 400 },
          function (error) {
            if (error) {
              form.message = interpolate('qrCodeFailedToRender');
              console.error(error);
            }
          },
        );
      } catch (err) {
        form.message = interpolate('qrCodeImportFailure');
        console.error('Failed to import QR Code library');
      }
    }

    renderQrCodeImage();
  });

  $: {
    // Assign stage value to `QRCode`
    if (metadata) {
      metadata.step.derived.stageName = 'QRCode';
    }

    const confirmationCallbacks = step.getCallbacksOfType(CallbackType.ConfirmationCallback);
    if (confirmationCallbacks.length) {
      const confirmationCb = confirmationCallbacks[0] as ConfirmationCallback;
      buttons = confirmationCb
        .getOptions()
        .map((option, index) => ({ value: `${index}`, text: option }));
    }

    step.callbacks.forEach((callback, idx) => {
      if (callback.getType() === CallbackType.PollingWaitCallback) {
        pollingWaitCb = callback as PollingWaitCallback;
        pollingWaitIdx === idx;
      }
    });

    formMessageKey = convertStringToKey(form?.message);

    /**
     * Filter out ConfirmationCallbacks; we'll use them seperately.
     * Also, we'll filter out TextOutputCallbacks as we won't use the script
     * text for rendering the QR Code, but our own QR Code module.
     * Lastly, filter out PollingWaitCallback as we'll call that separately.
     */
    modifiedCallbacks = step.callbacks.filter((callback) => {
      if (callback.getType() === CallbackType.TextOutputCallback) {
        return false;
      } else if (callback.getType() === CallbackType.ConfirmationCallback) {
        return false;
      } else if (callback.getType() === CallbackType.PollingWaitCallback) {
        return false;
      }
      return true;
    });
  }
</script>

<Form bind:formEl ariaDescribedBy="formFailureMessageAlert" onSubmitWhenValid={form?.submit}>
  {#if componentStyle !== 'inline'}
    {#if form?.icon}
      <div class="tw_flex tw_justify-center tw_mb-6">
        <MobileIcon classes="tw_text-gray-400 tw_fill-current" size="72px" />
      </div>
    {/if}
    <h1 class="tw_primary-header dark:tw_primary-header_dark">
      <T key="twoFactorAuthentication" />
    </h1>
    <p
      class="tw_text-center tw_text-sm tw_-mt-5 tw_mb-2 tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light"
    >
      <T key="scanQrCodeWithAuthenticator" />
    </p>
  {/if}

  {#if form?.message}
    <Alert id="formFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
      {interpolate(formMessageKey, null, form?.message)}
    </Alert>
  {/if}

  {#if !moduleLoaded}
    <div class="tw_text-center">
      <Spinner colorClass="tw_text-primary-light" layoutClasses="tw_h-24 tw_my-6 tw_w-24" />
      <p class="tw_text-secondary-dark dark:tw_text-secondary-light"><T key="loading" /></p>
    </div>
  {/if}
  <canvas bind:this={qrCodeCanvas} class="tw_m-auto tw_mb-6" data-testid="qr-code-canvas" />

  {#each modifiedCallbacks as callback, idx}
    <CallbackMapper
      props={{
        callback,
        callbackMetadata: metadata?.callbacks[idx],
        selfSubmitFunction: determineSubmission,
        stepMetadata: metadata?.step && { ...metadata.step },
        style: $style,
      }}
    />
  {/each}

  {#if pollingWaitCb}
    {@const newProps = {
      callback: pollingWaitCb,
      callbackMetadata: metadata?.callbacks[pollingWaitIdx],
      options: { inline: true },
      selfSubmitFunction: determineSubmission,
      style: $style,
    }}
    <PollingWait {...newProps} />
  {/if}

  <details class="tw_my-6 tw_text-secondary-dark dark:tw_text-secondary-light">
    <summary><T key="qrCodeNotWorking" /></summary>
    <div class="tw_overflow-hidden">
      <Link href={qrCodeUrl} classes="tw_block tw_my-6" target="_self">
        <T key="onMobileOpenInAuthenticator" />
      </Link>

      <p class="tw_text-base tw_my-6"><T key="copyAndPasteUrlBelow" /></p>
      <div class="tw_relative tw_overflow-hidden">
        <label for="mfa-registration-url"><T key="url" /></label>
        <button
          class="tw_absolute tw_h-4 tw_bg-background-dark tw_right-1 tw_top-1 tw_shadow-[0_0_1rem_2rem_black] tw_shadow-background-light dark:tw_shadow-background-dark tw_text-secondary-dark dark:tw_text-secondary-light"
          on:click={copyUrl}
        >
          <ClipboardIcon classes="tw_fill-current tw_inline-block tw_align-top" size="16">
            <T key="copyUrl" />
          </ClipboardIcon>
        </button>
        <input
          bind:this={qrCodeEl}
          class="tw_bg-transparent tw_border-none focus-visible:tw_outline-none tw_font-mono tw_w-full"
          id="mfa-registration-url"
          value={qrCodeUrl}
        />
      </div>
    </div>
  </details>

  {#if buttons?.length}
    <Button busy={journey?.loading} style="primary" type="submit" width="full">
      <T key={buttons[0].text} />
    </Button>
  {/if}
</Form>
