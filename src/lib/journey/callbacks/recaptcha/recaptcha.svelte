<script lang="ts">
  import type { ReCaptchaCallback } from '@forgerock/javascript-sdk';
  import type { z } from 'zod';
  import { onMount } from 'svelte';

  import type { SelfSubmitFunction, StepMetadata } from '$journey/journey.interfaces';
  import type { styleSchema } from '$lib/style.store';
  import type { Maybe } from '$lib/interfaces';

  export let callback: Maybe<ReCaptchaCallback>;
  export const selfSubmitFunction: Maybe<SelfSubmitFunction> = null;
  export const stepMetadata: Maybe<StepMetadata> = null;
  export const style: z.infer<typeof styleSchema> = {};

  const siteKey = callback?.getSiteKey() ?? '';
  let recaptchaApi = `${callback?.getOutputByName<string>('captchaApiUri', '') ?? ''}`;
  /**
   * AM defaults the class name to g-captcha which is wrong
   * I dont think we should be manipulating the class here,
   * but the classname should be g-recaptcha for google
   */
  const recaptchaClass: string =
    callback?.getOutputByName<string>('captchaDivClass', 'h-captcha') ?? 'h-captcha';

  onMount(() => {
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
  });
</script>

{#if recaptchaApi.length}
  <script src={recaptchaApi} async defer></script>
{/if}
<div
  id="fr-recaptcha"
  class={`${recaptchaClass} tw_flex-1 tw_w-full tw_input-spacing`}
  data-sitekey={siteKey}
  data-expired-callback="frHandleExpiredCallback"
  data-chalexpired-callback="frHandleExpiredCallback"
  data-error-callback="frHandleErrorCallback"
  data-callback="frHandleCaptcha"
/>
