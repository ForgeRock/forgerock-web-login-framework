/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { buildEnterpriseScriptSrc } from '../_utilities/recaptcha-enterprise.utilities';
import { loadCaptchaScript, resolveGrecaptcha } from './captcha.effects';

import type { ReCaptchaEnterpriseCallback } from '@forgerock/journey-client/types';

export function loadEnterpriseScript({
  apiUrl,
  siteKey,
  mode,
}: {
  apiUrl: string;
  siteKey: string;
  mode: 'invisible' | 'visible';
}): Promise<void> {
  const src = buildEnterpriseScriptSrc({ apiUrl, siteKey, mode });
  return loadCaptchaScript({ src, provider: 'grecaptcha' });
}

export function renderEnterpriseCaptcha({
  siteKey,
  elementId = 'fr-recaptcha-enterprise',
  onSuccess,
  onExpired,
  onError,
}: {
  siteKey: string;
  elementId?: string;
  onSuccess: (token: string) => void;
  onExpired: () => void;
  onError?: () => void;
}) {
  const grecaptcha = resolveGrecaptcha();
  if (grecaptcha) {
    return grecaptcha.render(elementId, {
      sitekey: siteKey,
      callback: onSuccess,
      'expired-callback': onExpired,
      'error-callback': onError,
    });
  }
}

export function executeEnterpriseCaptcha({
  siteKey,
  action,
  callback,
  onError,
}: {
  siteKey: string;
  action: string;
  callback: ReCaptchaEnterpriseCallback;
  onError?: () => void;
}) {
  if (!action.length) return;
  const grc = resolveGrecaptcha();
  if (!grc) {
    onError?.();
    return;
  }
  grc.ready(async function () {
    try {
      const token = await grc.execute(siteKey, { action });
      callback?.setResult(token);
      try {
        callback?.setAction(action);
      } catch {
        // AM node may not expose the action input — non-fatal, token already set
      }
    } catch (err) {
      callback?.setClientError('captcha_error');
      onError?.();
    }
  });
}
