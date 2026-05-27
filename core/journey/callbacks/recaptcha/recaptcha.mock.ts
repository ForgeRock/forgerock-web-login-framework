/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';

export const visibleGrecaptcha = {
  authId: 'test-auth-id',
  callbacks: [
    {
      type: callbackType.ReCaptchaCallback,
      output: [
        { name: 'recaptchaSiteKey', value: 'site-key-visible-g' },
        { name: 'captchaDivClass', value: 'g-recaptcha' },
        { name: 'reCaptchaV3', value: false },
      ],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
  ],
  stage: 'DefaultLogin',
};

export const visibleHcaptcha = {
  authId: 'test-auth-id',
  callbacks: [
    {
      type: callbackType.ReCaptchaCallback,
      output: [
        { name: 'recaptchaSiteKey', value: 'site-key-visible-h' },
        { name: 'captchaDivClass', value: 'h-captcha' },
        { name: 'reCaptchaV3', value: false },
      ],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
  ],
  stage: 'DefaultLogin',
};

// Intentionally identical to visible fixtures — AM does not signal invisible mode in the
// callback payload (no captchaDivClass or reCaptchaV3 difference). Mode is set via
// callbackMetadata.initOptions.mode at the widget configuration layer, not in the step data.
export const invisibleGrecaptcha = visibleGrecaptcha;
export const invisibleHcaptcha = visibleHcaptcha;

export const v3Grecaptcha = {
  authId: 'test-auth-id',
  callbacks: [
    {
      type: callbackType.ReCaptchaCallback,
      output: [
        { name: 'recaptchaSiteKey', value: 'site-key-v3' },
        { name: 'captchaDivClass', value: 'g-recaptcha' },
        { name: 'reCaptchaV3', value: true },
      ],
      input: [{ name: 'IDToken1', value: '' }],
      _id: 0,
    },
  ],
  stage: 'DefaultLogin',
};

export default visibleGrecaptcha;
