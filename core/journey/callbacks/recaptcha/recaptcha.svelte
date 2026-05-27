<!--

 Copyright © 2025-2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import { onMount } from 'svelte';

  import Alert from '$components/primitives/alert/alert.svelte';
  import { interpolate } from '$core/_utilities/i18n.utilities';
  import {
    loadCaptchaScript,
    renderCaptcha,
    renderCaptchaInvisible,
    resolveGrecaptcha,
  } from '$journey/callbacks/_effects/captcha.effects';

  import type { ReCaptchaCallback } from '@forgerock/journey-client/types';
  import type { z } from 'zod';

  import type { Maybe } from '$core/interfaces';
  import type { styleSchema } from '$core/style.store';
  import type {
    CallbackMetadata,
    CaptchaMode,
    SelfSubmitFunction,
    StepMetadata,
  } from '$journey/journey.interfaces';

  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const style: z.infer<typeof styleSchema> = {};
  export let callback: Maybe<ReCaptchaCallback>;
  export let callbackMetadata: Maybe<CallbackMetadata>;
  let captchaError = '';

  const siteKey = callback?.getSiteKey() ?? '';
  let isV3 = callback?.getOutputByName('reCaptchaV3', false);
  /**
   * AM defaults the class name to g-captcha which is wrong
   * I dont think we should be manipulating the class here,
   * but the classname should be g-recaptcha for google
   */
  const recaptchaClass: string =
    callback?.getOutputByName<string>('captchaDivClass', 'h-captcha') ?? 'h-captcha';

  const captchaProvider: 'hcaptcha' | 'grecaptcha' =
    recaptchaClass === 'g-recaptcha' ? 'grecaptcha' : 'hcaptcha';

  const CAPTCHA_SCRIPT_URLS: Record<'grecaptcha' | 'hcaptcha', string> = {
    grecaptcha: 'https://www.google.com/recaptcha/api.js',
    hcaptcha: 'https://js.hcaptcha.com/1/api.js',
  };

  const CAPTCHA_ELEMENT_IDS: Record<'grecaptcha' | 'hcaptcha', string> = {
    grecaptcha: 'fr-recaptcha',
    hcaptcha: 'fr-hcaptcha',
  };

  // v3 is always Google; v2 provider is derived from captchaDivClass
  const scriptProvider: 'grecaptcha' | 'hcaptcha' = isV3 ? 'grecaptcha' : captchaProvider;
  const scriptSrc = CAPTCHA_SCRIPT_URLS[scriptProvider];
  const captchaElementId = CAPTCHA_ELEMENT_IDS[captchaProvider];

  let scriptReady = false;

  let captchaMode: CaptchaMode = 'visible';
  $: captchaMode = callbackMetadata?.initOptions?.mode === 'invisible' ? 'invisible' : 'visible';
  $: recaptchaAction = (callbackMetadata?.initOptions?.recaptchaAction as string | undefined) ?? '';

  onMount(async () => {
    if (!callback) {
      return;
    }

    try {
      await loadCaptchaScript({ src: scriptSrc, provider: scriptProvider });
      scriptReady = true;
    } catch (err) {
      captchaError = 'captchaError';
      return;
    }

    if (isV3) {
      return;
    }

    const onSuccess = (token: string) => callback?.setResult(token);

    if (captchaMode === 'invisible') {
      const onError = () => {
        captchaError = 'captchaError';
      };
      const onExpired = () => {
        callback?.setResult('');
        captchaError = '';
        renderCaptchaInvisible({
          nameOfCaptcha: captchaProvider,
          siteKey,
          elementId: captchaElementId,
          onSuccess,
          onExpired: () => {},
          onError,
        });
      };
      renderCaptchaInvisible({
        nameOfCaptcha: captchaProvider,
        siteKey,
        elementId: captchaElementId,
        onSuccess,
        onExpired,
        onError,
      });
    } else {
      const onError = () => {
        captchaError = 'captchaError';
      };
      const onExpired = () => {
        callback?.setResult('');
        captchaError = '';
        renderCaptcha({
          nameOfCaptcha: captchaProvider,
          siteKey,
          elementId: captchaElementId,
          onSuccess,
          onExpired: () => {},
          onError,
        });
      };
      renderCaptcha({
        nameOfCaptcha: captchaProvider,
        siteKey,
        elementId: captchaElementId,
        onSuccess,
        onExpired,
        onError,
      });
    }
  });

  function executeV3Captcha() {
    if (isV3 && scriptReady && recaptchaAction.length) {
      const grc = resolveGrecaptcha();
      if (!grc) {
        captchaError = 'captchaError';
        return;
      }
      grc.ready(async function () {
        try {
          const value = await grc.execute(siteKey, {
            action: recaptchaAction,
          });
          callback?.setResult(value);
        } catch {
          captchaError = 'captchaError';
        }
      });
    }
  }
  $: {
    if (recaptchaAction.length && scriptReady) {
      executeV3Captcha();
    }
  }
</script>

{#if isV3 === false}
  {#if captchaMode === 'invisible'}
    <div id={captchaElementId} class="tw_hidden"></div>
    {#if captchaError}
      <Alert id="captchaError" type="error">
        {interpolate(captchaError, null, 'CAPTCHA verification failed. Please try again.')}
      </Alert>
    {/if}
  {:else}
    <div
      id={captchaElementId}
      class={`${recaptchaClass} tw_flex-1 tw_w-full tw_input-spacing`}
      data-sitekey={siteKey}
    ></div>
    {#if captchaError}
      <Alert id="captchaError" type="error">
        {interpolate(captchaError, null, 'CAPTCHA verification failed. Please try again.')}
      </Alert>
    {/if}
  {/if}
{:else if captchaError}
  <Alert id="captchaError" type="error">
    {interpolate(captchaError, null, 'CAPTCHA verification failed. Please try again.')}
  </Alert>
{/if}
