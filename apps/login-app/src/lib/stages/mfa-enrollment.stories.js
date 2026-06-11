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

const frMfaSetupPrompt = createJourneyStep(mfaEnrollmentStep);
const frMfaDownloadApp = createJourneyStep(getAuthenticatorAppStep);
const frMfaAppStoreLinks = createJourneyStep(getAuthenticatorAppLinksStep);

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

export const SetupPrompt = {
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
    stage: 'MfaSetupPrompt',
    step: frMfaSetupPrompt,
  },
};

export const DownloadApp = {
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
    stage: 'MfaDownloadApp',
    step: frMfaDownloadApp,
  },
};

export const AppStoreLinks = {
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
    stage: 'MfaAppStoreLinks',
    step: frMfaAppStoreLinks,
  },
};

export const SetupPromptInteraction = {
  args: {
    ...SetupPrompt.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Set up 2-step verification')).toBeTruthy();
    await expect(canvas.queryByRole('button', { name: 'Set up' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Skip for now' })).toBeInTheDocument();
  },
};

export const DownloadAppInteraction = {
  args: {
    ...DownloadApp.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Set up the ForgeRock Authenticator')).toBeTruthy();
    await expect(canvas.queryByRole('button', { name: 'Next' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Download the app' })).toBeInTheDocument();
  },
};

export const AppStoreLinksInteraction = {
  args: {
    ...AppStoreLinks.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('link', { name: 'Apple App Store' })).toBeInTheDocument();
    await expect(canvas.queryByRole('link', { name: 'Google Play Store' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Continue' })).toBeInTheDocument();
  },
};

export const SetupPromptWithError = {
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
    stage: 'MfaSetupPrompt',
    step: frMfaSetupPrompt,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getAllByRole('alert')[0];
    await expect(alert).toBeInTheDocument();
    await expect(alert).toHaveTextContent(/something went wrong/i);
  },
};

export const DownloadAppWithError = {
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
    stage: 'MfaDownloadApp',
    step: frMfaDownloadApp,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toBeInTheDocument();
    await expect(alert).toHaveTextContent(/something went wrong/i);
  },
};

export const AppStoreLinksWithError = {
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
    stage: 'MfaAppStoreLinks',
    step: frMfaAppStoreLinks,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert).toBeInTheDocument();
    await expect(alert).toHaveTextContent(/something went wrong/i);
  },
};
