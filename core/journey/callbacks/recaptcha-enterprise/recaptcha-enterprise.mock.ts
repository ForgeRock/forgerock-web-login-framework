/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';

export const visibleGrecaptchaEnterprise = {
  authId: 'test-auth-id',
  callbacks: [
    {
      type: callbackType.ReCaptchaEnterpriseCallback,
      output: [
        { name: 'recaptchaSiteKey', value: 'enterprise-site-key' },
        { name: 'captchaApiUri', value: 'https://www.google.com/recaptcha/enterprise.js' },
        { name: 'captchaDivClass', value: 'g-recaptcha' },
      ],
      input: [
        { name: 'IDToken1token', value: '' },
        { name: 'IDToken1action', value: '' },
        { name: 'IDToken1clientError', value: '' },
        { name: 'IDToken1payload', value: '' },
      ],
      _id: 0,
    },
  ],
  stage: 'DefaultLogin',
};

export const invisibleGrecaptchaEnterprise = visibleGrecaptchaEnterprise;

export default visibleGrecaptchaEnterprise;
