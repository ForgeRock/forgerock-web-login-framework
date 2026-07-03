/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import {
  invisibleGrecaptchaEnterprise,
  visibleGrecaptchaEnterprise,
} from './recaptcha-enterprise.mock';
import RecaptchaEnterprise from './recaptcha-enterprise.story.svelte';

function mockGrecaptchaEnterprise() {
  window.grecaptcha = {
    enterprise: {
      ready: (cb) => cb(),
      render: (elementId) => {
        const el = document.getElementById(elementId);
        if (el) {
          el.innerHTML =
            '<div style="border:1px solid #ccc;border-radius:4px;padding:12px 16px;display:inline-flex;align-items:center;gap:12px;background:#f9f9f9"><input type="checkbox" id="rc-mock" /><label for="rc-mock" style="font-size:14px;color:#333">I\'m not a robot</label><img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" width="32" height="32" alt="reCAPTCHA" /></div>';
        }
        return 'widget-id';
      },
      execute: async () => 'enterprise-token',
      reset: () => undefined,
      getResponse: () => 'enterprise-token',
    },
  };
}

function makeCallbackMetadata(mode, recaptchaAction) {
  return {
    derived: {
      canForceUserInputOptionality: false,
      isFirstInvalidInput: false,
      isReadyForSubmission: false,
      isSelfSubmitting: false,
      isUserInputRequired: false,
    },
    idx: 0,
    initOptions: { mode, ...(recaptchaAction && { recaptchaAction }) },
  };
}

export default {
  argTypes: {
    callback: { control: false },
    callbackMetadata: { control: false },
  },
  component: RecaptchaEnterprise,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/ReCaptchaEnterprise',
};

export const VisibleEnterprise = {
  loaders: [async () => mockGrecaptchaEnterprise()],
  args: {
    callback: createJourneyStep(visibleGrecaptchaEnterprise).getCallbackOfType(
      callbackType.ReCaptchaEnterpriseCallback,
    ),
    callbackMetadata: makeCallbackMetadata('visible'),
  },
};

export const InvisibleEnterprise = {
  loaders: [async () => mockGrecaptchaEnterprise()],
  args: {
    callback: createJourneyStep(invisibleGrecaptchaEnterprise).getCallbackOfType(
      callbackType.ReCaptchaEnterpriseCallback,
    ),
    callbackMetadata: makeCallbackMetadata('invisible', 'LOGIN'),
  },
};
