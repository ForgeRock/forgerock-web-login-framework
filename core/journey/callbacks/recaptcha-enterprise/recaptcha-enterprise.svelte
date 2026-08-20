<!--

 Copyright © 2026 Ping Identity Corporation. All right reserved.

 This software may be modified and distributed under the terms
 of the MIT license. See the LICENSE file for details.

 -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { run } from 'svelte/legacy';

  import Alert from '$components/primitives/alert/alert.svelte';
  import { interpolate } from '$core/_utilities/i18n.utilities';
  import {
    executeEnterpriseCaptcha,
    loadEnterpriseScript,
    renderEnterpriseCaptcha,
  } from '$journey/callbacks/_effects/recaptcha-enterprise.effects';

  import type { ReCaptchaEnterpriseCallback } from '@forgerock/journey-client/types';
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
  interface Props {
    callback: Maybe<ReCaptchaEnterpriseCallback>;
    callbackMetadata: Maybe<CallbackMetadata>;
  }

  let { callback, callbackMetadata }: Props = $props();

  let captchaError = $state('');
  let executed = false;
  let scriptReady = $state(false);

  const siteKey = callback?.getSiteKey() ?? '';
  const apiUrl = callback?.getApiUrl() || 'https://www.google.com/recaptcha/enterprise.js';

  let captchaMode: CaptchaMode = $state('visible');
  run(() => {
    captchaMode = callbackMetadata?.initOptions?.mode === 'invisible' ? 'invisible' : 'visible';
  });
  let recaptchaAction = $derived(
    (callbackMetadata?.initOptions?.recaptchaAction as string | undefined) ?? '',
  );

  onMount(async () => {
    if (!callback) return;

    try {
      await loadEnterpriseScript({
        apiUrl,
        siteKey,
        mode: captchaMode,
      });
    } catch (err) {
      captchaError = 'captchaError';
      return;
    }

    scriptReady = true;

    const onSuccess = (token: string) => {
      callback?.setResult(token);
      if (recaptchaAction) {
        callback?.setAction(recaptchaAction);
      }
    };

    if (captchaMode !== 'invisible') {
      const onError = () => {
        captchaError = 'captchaError';
      };
      const onExpired = () => {
        callback?.setResult('');
        captchaError = '';
        renderEnterpriseCaptcha({ siteKey, onSuccess, onExpired: () => {}, onError });
      };
      renderEnterpriseCaptcha({ siteKey, onSuccess, onExpired, onError });
    }
  });

  function runInvisibleExecute() {
    if (!recaptchaAction || captchaMode !== 'invisible' || !callback || executed || !scriptReady) {
      return;
    }
    executed = true;
    executeEnterpriseCaptcha({
      siteKey,
      action: recaptchaAction,
      callback,
      onError: () => {
        captchaError = 'captchaError';
      },
    });
  }

  run(() => {
    if (recaptchaAction && scriptReady) {
      runInvisibleExecute();
    }
  });
</script>

{#if captchaMode === 'invisible'}
  <div id="fr-recaptcha-enterprise" class="tw_hidden"></div>
  {#if captchaError}
    <Alert id="captchaError" type="error">
      {interpolate(captchaError, null, 'CAPTCHA verification failed. Please try again.')}
    </Alert>
  {/if}
{:else}
  <div id="fr-recaptcha-enterprise" class="tw_flex-1 tw_w-full tw_input-spacing"></div>
  {#if captchaError}
    <Alert id="captchaError" type="error">
      {interpolate(captchaError, null, 'CAPTCHA verification failed. Please try again.')}
    </Alert>
  {/if}
{/if}
