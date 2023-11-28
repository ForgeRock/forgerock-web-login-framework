<script lang="ts">
  import type { ReCaptchaCallback } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';
  import { onMount } from 'svelte';

  import type { SelfSubmitFunction, StepMetadata } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';
  import type { StepOptions } from '@forgerock/javascript-sdk/src/auth/interfaces';

  export let callback: Maybe<ReCaptchaCallback>;
  export let journey: Maybe<StepOptions> = null;
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const style: z.infer<typeof styleSchema> = {};
  // This is the action that the user can pass into the component
  // if it isn't passed we default to the journey.tree value
  // journey.tree won't necessarily be set on mount, we have to wait for it
  // to be passed down so defaulting to an empty string so its falsey
  export let recaptchaAction = journey?.tree ?? '';

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
    if (!isV3) {
      window.frHandleCaptchaError = function handleCaptchaError() {
        callback?.setResult('');
        if (recaptchaClass.startsWith('h')) {
          window.hcaptcha.render(recaptchaClass, {
            sitekey: siteKey,
            callback: 'frHandleCaptcha',
            'expired-callback': 'frHandleExpiredCallback',
            'chalexpired-callback': 'frHandleExpiredCallback',
            'error-callback': 'frHandleErrorCallback',
          });
        } else {
          window.grecaptcha.render(recaptchaClass, {
            sitekey: siteKey,
            callback: window.frHandleCaptcha, // grecaptcha uses different types so passing real function here
            'expired-callback': window.frHandleExpiredCallback,
          });
        }
      };
      window.frHandleCaptcha = function handleCaptchaToken(token: string) {
        callback?.setResult(token);
      };
      window.frHandleExpiredCallback = function handleExpiredCallback() {
        callback?.setResult('');
        if (recaptchaClass.startsWith('h')) {
          window.hcaptcha.render(recaptchaClass, {
            sitekey: siteKey,
            callback: 'frHandleCaptcha',
            'expired-callback': 'frHandleExpiredCallback',
            'chalexpired-callback': 'frHandleExpiredCallback',
            'error-callback': 'frHandleErrorCallback',
          });
        } else {
          window.grecaptcha.render(recaptchaClass, {
            sitekey: siteKey,
            callback: window.frHandleCaptcha, // grecaptcha uses different types so passing real function here
            'expired-callback': window.frHandleExpiredCallback,
          });
        }
      };
    }
  });
  // defining this outside of the reactive block and guarding it with a isV3 check so it only runs when v3
  // is defined as true and we have a recaptcha action to assign.
  function executeCaptcha() {
    if (isV3 && recaptchaAction.length) {
      window.grecaptcha.ready(async function () {
        const value = await window.grecaptcha.execute(siteKey, {
          action: recaptchaAction,
        });
        callback?.setResult(value);
      });
    }
  }
  $: {
    // if recaptcha Action is 0 length, then it has not been passed in as a prop
    // and we should use the journey tree value which we may have to wait for since
    // it is not going to be available on mount immediatly due to be an async function
    recaptchaAction = recaptchaAction.length === 0 ? journey?.tree ?? '' : recaptchaAction;
    if (recaptchaAction.length) {
      executeCaptcha();
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
