/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, fn, within } from 'storybook/test';
import { writable } from 'svelte/store';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import { initialize } from '$journey/config.store';
import {
  getAuthenticatorAppLinksStep,
  getAuthenticatorAppStep,
  mfaEnrollmentStep,
} from '$journey/stages/mfa-stages.mock.ts';
import Step from './stages.story.svelte';

const frGetAuthenticatorAppLinks = createJourneyStep(getAuthenticatorAppLinksStep);
const frGetAuthenticatorApp = createJourneyStep(getAuthenticatorAppStep);
const frMfaEnrollment = createJourneyStep(mfaEnrollmentStep);

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
  title: 'Journey/MFA Enrollment Stages',
};

export const MfaEnrollment = {
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
    stage: 'MfaEnrollment',
    step: frMfaEnrollment,
  },
};

export const GetAuthenticatorApp = {
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
    stage: 'MfaEnrollment',
    step: frGetAuthenticatorApp,
  },
};

export const GetAuthenticatorAppLinks = {
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
    stage: 'MfaEnrollment',
    step: frGetAuthenticatorAppLinks,
  },
};

export const MfaEnrollmentInteraction = {
  args: {
    ...MfaEnrollment.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Set up 2-step verification')).toBeTruthy();
    await expect(canvas.queryByRole('button', { name: 'Set up' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Skip for now' })).toBeInTheDocument();
  },
};

export const GetAuthenticatorAppInteraction = {
  args: {
    ...GetAuthenticatorApp.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Set up the ForgeRock Authenticator')).toBeTruthy();
    await expect(canvas.queryByRole('button', { name: 'Next' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Download the app' })).toBeInTheDocument();
  },
};

export const GetAuthenticatorAppLinksInteraction = {
  args: {
    ...GetAuthenticatorAppLinks.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('link', { name: 'Apple App Store' })).toBeInTheDocument();
    await expect(canvas.queryByRole('link', { name: 'Google Play Store' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Continue' })).toBeInTheDocument();
  },
};
