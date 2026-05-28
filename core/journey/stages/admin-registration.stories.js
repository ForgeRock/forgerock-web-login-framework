/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, fn, userEvent, within } from 'storybook/test';
import { writable } from 'svelte/store';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import { initialize } from '../config.store';
import Step from './stages.story.svelte';
import {
  adminRegInvalidInviteStep,
  adminRegOtpErrorStep,
  adminRegOtpStep,
  adminRegPrivacyPolicyStep,
  adminRegWelcomeStep,
} from './step.mock.ts';

const frAdminRegWelcome = createJourneyStep(adminRegWelcomeStep);
const frAdminRegOtp = createJourneyStep(adminRegOtpStep);
const frAdminRegPrivacyPolicy = createJourneyStep(adminRegPrivacyPolicyStep);
const frAdminRegInvalidInvite = createJourneyStep(adminRegInvalidInviteStep);

initialize();

export default {
  argTypes: {
    form: { control: false },
    journey: { control: false },
    stage: { control: false },
    step: { control: false },
  },
  component: Step,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Journey/Admin Registration Stages',
};

export const Welcome = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    stage: 'AdminRegistration',
    step: frAdminRegWelcome,
  },
};

export const OtpVerify = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    stage: 'AdminRegistration',
    step: frAdminRegOtp,
  },
};

export const OtpVerifyError = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    stage: 'AdminRegistration',
    step: createJourneyStep(adminRegOtpErrorStep),
  },
};

export const OtpResend = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    stage: 'AdminRegistration',
    step: createJourneyStep(adminRegOtpStep),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    const resendButton = canvas.getByRole('button', { name: /resend/i });
    await userEvent.click(resendButton);

    const otpCallback = args.step.getCallbacksOfType('HiddenValueCallback')[0];
    await expect(otpCallback.getInputValue()).toBe('resend');
    await expect(args.form.submit).toHaveBeenCalled();
  },
};

export const PrivacyPolicy = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    stage: 'AdminRegistration',
    step: frAdminRegPrivacyPolicy,
  },
};

export const PrivacyPolicyReady = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    stage: 'AdminRegistration',
    step: frAdminRegPrivacyPolicy,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const select = canvas.getByRole('combobox');
    await userEvent.selectOptions(select, 'Canada');

    const checkbox = canvas.getByRole('checkbox');
    await userEvent.click(checkbox);

    const button = canvas.getByRole('button', { name: /continue/i });
    await expect(button).not.toHaveClass('tw_pointer-events-none');
  },
};

export const InvalidInvite = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    stage: 'AdminRegistration',
    step: frAdminRegInvalidInvite,
  },
};
