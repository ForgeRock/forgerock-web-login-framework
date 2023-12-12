<script lang="ts">
  import type { ReCaptchaCallback } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';
  import { onMount } from 'svelte';
  import { journeyStore } from '$journey/journey.store';

  import type { SelfSubmitFunction, StepMetadata } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';
  import {
    handleCaptchaError,
    handleCaptchaToken,
    renderCaptcha,
  } from '$journey/stages/_utilities/recaptcha.utilities';

  export let callback: Maybe<ReCaptchaCallback>;
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const style: z.infer<typeof styleSchema> = {};
  /**
   * This is a component level variable that is set from the journey store
   * If it isn't passed in via journey.start, we
   * default to the journey.tree value. However, journey.tree won't
   * necessarily be set on mount. It is async, so we
   * have to wait for it to resolve. Therefore, defaulting to
   * an empty string so its falsey.
   */
  let recaptchaAction = '';

  const siteKey = callback?.getSiteKey() ?? '';
  let isV3 = callback?.getOutputByName('reCaptchaV3', false);
  /**
   * AM defaults the class name to g-captcha which is wrong
   * I dont think we should be manipulating the class here,
   * but the classname should be g-recaptcha for google
   */
  const recaptchaClass: string =
    callback?.getOutputByName<string>('captchaDivClass', 'h-captcha') ?? 'h-captcha';

  onMount(() => {
    if (isV3) {
      // If ReCaptcha v3, do nothing and return early
      return;
    }
    if (callback) {
      window.frHandleCaptchaError = handleCaptchaError(callback);
      window.frHandleCaptcha = handleCaptchaToken(callback);
      window.frHandleExpiredCallback = function handleExpiredCallback() {
        callback?.setResult('');
        renderCaptcha({ nameOfCaptcha: 'hcaptcha', siteKey });
      };
      renderCaptcha({
        nameOfCaptcha: recaptchaClass === 'g-recaptcha' ? 'grecaptcha' : 'hcaptcha',
        siteKey,
      });
    }
  });
  // defining this outside of the reactive block and guarding it with a isV3 check so it only runs when v3
  // is defined as true and we have a recaptcha action to assign.
  function executeV3Captcha() {
    if (isV3 && recaptchaAction.length) {
      try {
        window.grecaptcha.ready(async function () {
          const value = await window.grecaptcha.execute(siteKey, {
            action: recaptchaAction,
          });
          callback?.setResult(value);
        });
      } catch (err) {
        throw new Error(
          `Error executing recaptcha. Please make sure you have passed a siteKey and you have loaded the google recaptcha script in your app prior to this Error: ${err}`,
        );
      }
    }
  }
  journeyStore.subscribe((value) => {
    recaptchaAction = value?.recaptchaAction ?? '';
  });
  $: {
    if (recaptchaAction.length) {
      executeV3Captcha();
    }
  }
</script>

{#if isV3 === false}
  <div
    id="fr-recaptcha"
    class={`${recaptchaClass} tw_flex-1 tw_w-full tw_input-spacing`}
    data-sitekey={siteKey}
    data-expired-callback="frHandleExpiredCallback"
    data-chalexpired-callback="frHandleExpiredCallback"
    data-error-callback="frHandleErrorCallback"
    data-callback="frHandleCaptcha"
  />
{/if}
