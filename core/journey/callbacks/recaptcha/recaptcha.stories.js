/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';
import { expect } from 'storybook/test';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import { invisibleGrecaptcha, visibleGrecaptcha, visibleHcaptcha } from './recaptcha.mock';
import Recaptcha from './recaptcha.story.svelte';

function mockGrecaptcha() {
  window.grecaptcha = {
    ready: (cb) => cb(),
    render: (elementId) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.innerHTML =
          '<div style="border:1px solid #ccc;border-radius:4px;padding:12px 16px;display:inline-flex;align-items:center;gap:12px;background:#f9f9f9"><input type="checkbox" id="rc-mock" /><label for="rc-mock" style="font-size:14px;color:#333">I\'m not a robot</label><img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" width="32" height="32" alt="reCAPTCHA" /></div>';
      }
      return 'widget-id';
    },
    execute: () => 'token',
    reset: () => undefined,
    getResponse: () => 'token',
  };
}

function mockHcaptcha() {
  window.hcaptcha = {
    render: (elementId) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.innerHTML =
          '<div style="border:1px solid #ccc;border-radius:4px;padding:12px 16px;display:inline-flex;align-items:center;gap:12px;background:#f9f9f9"><input type="checkbox" id="hc-mock" /><label for="hc-mock" style="font-size:14px;color:#333">I\'m not a robot</label><span style="font-size:10px;color:#888;margin-left:4px">hCaptcha</span></div>';
      }
      return 'widget-id';
    },
    execute: () => undefined,
    reset: () => undefined,
    getResponse: () => 'token',
  };
}

function makeCallbackMetadata(mode) {
  return {
    derived: {
      canForceUserInputOptionality: false,
      isFirstInvalidInput: false,
      isReadyForSubmission: false,
      isSelfSubmitting: false,
      isUserInputRequired: false,
    },
    idx: 0,
    initOptions: { mode },
  };
}

export default {
  argTypes: {
    callback: { control: false },
    callbackMetadata: { control: false },
  },
  component: Recaptcha,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/ReCaptcha',
};

export const VisibleGoogle = {
  loaders: [async () => mockGrecaptcha()],
  args: {
    callback: createJourneyStep(visibleGrecaptcha).getCallbackOfType(
      callbackType.ReCaptchaCallback,
    ),
    callbackMetadata: makeCallbackMetadata('visible'),
  },
};

export const VisibleHCaptcha = {
  loaders: [async () => mockHcaptcha()],
  args: {
    callback: createJourneyStep(visibleHcaptcha).getCallbackOfType(callbackType.ReCaptchaCallback),
    callbackMetadata: makeCallbackMetadata('visible'),
  },
};

export const InvisibleGoogle = {
  loaders: [async () => mockGrecaptcha()],
  args: {
    callback: createJourneyStep(invisibleGrecaptcha).getCallbackOfType(
      callbackType.ReCaptchaCallback,
    ),
    callbackMetadata: makeCallbackMetadata('invisible'),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('#fr-recaptcha')).toBeTruthy();
  },
};
