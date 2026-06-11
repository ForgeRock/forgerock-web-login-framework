/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, fn, userEvent, within } from 'storybook/test';
import { writable } from 'svelte/store';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import { initialize } from '$journey/config.store';
import {
  adminRegInvalidInviteStep,
  adminRegOtpErrorStep,
  adminRegOtpStep,
  adminRegPrivacyPolicyStep,
  adminRegWelcomeStep,
} from '$journey/stages/step.mock.ts';
import Step from './stages.story.svelte';

const frAdminInviteWelcome = createJourneyStep(adminRegWelcomeStep);
const frAdminInviteVerifyCode = createJourneyStep(adminRegOtpStep);
const frAdminInvitePrivacyPolicy = createJourneyStep(adminRegPrivacyPolicyStep);
const frAdminInviteInvalid = createJourneyStep(adminRegInvalidInviteStep);

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
  title: 'Journey/Admin Invite Stages',
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
    stage: 'AdminInviteWelcome',
    step: frAdminInviteWelcome,
  },
};

export const VerifyCode = {
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
    stage: 'AdminInviteVerifyCode',
    step: frAdminInviteVerifyCode,
  },
};

export const VerifyCodeError = {
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
    stage: 'AdminInviteVerifyCode',
    step: createJourneyStep(adminRegOtpErrorStep),
  },
};

export const VerifyCodeResend = {
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
    stage: 'AdminInviteVerifyCode',
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
    stage: 'AdminInvitePrivacyPolicy',
    step: frAdminInvitePrivacyPolicy,
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
    stage: 'AdminInvitePrivacyPolicy',
    step: frAdminInvitePrivacyPolicy,
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
    stage: 'AdminInviteInvalid',
    step: frAdminInviteInvalid,
  },
};

export const WelcomeWithError = {
  args: {
    form: {
      icon: true,
      message: 'Something went wrong',
      status: 'error',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    stage: 'AdminInviteWelcome',
    step: frAdminInviteWelcome,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toBeInTheDocument();
    await expect(alert).toHaveTextContent(/something went wrong/i);
  },
};

export const VerifyCodeWithError = {
  args: {
    form: {
      icon: true,
      message: 'Something went wrong',
      status: 'error',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    stage: 'AdminInviteVerifyCode',
    step: frAdminInviteVerifyCode,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toBeInTheDocument();
    await expect(alert).toHaveTextContent(/something went wrong/i);
  },
};

export const PrivacyPolicyWithError = {
  args: {
    form: {
      icon: true,
      message: 'Something went wrong',
      status: 'error',
      submit: fn(),
    },
    journey: {
      loading: false,
      pop: fn(),
      push: fn(),
      stack: writable([]),
    },
    stage: 'AdminInvitePrivacyPolicy',
    step: frAdminInvitePrivacyPolicy,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toBeInTheDocument();
    await expect(alert).toHaveTextContent(/something went wrong/i);
  },
};
