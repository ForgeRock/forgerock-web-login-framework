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
  getAuthenticatorAppLinksStep,
  getAuthenticatorAppStep,
  mfaEnrollmentStep,
} from './stages.mock.ts';
import Step from './stages.story.svelte';

const frAdminInviteWelcome = createJourneyStep(adminRegWelcomeStep);
const frAdminInviteVerifyCode = createJourneyStep(adminRegOtpStep);
const frAdminInvitePrivacyPolicy = createJourneyStep(adminRegPrivacyPolicyStep);
const frAdminInviteInvalid = createJourneyStep(adminRegInvalidInviteStep);
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
  title: 'Journey/App Stages',
};

// Admin invite

export const Welcome = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
    stage: 'AdminInviteWelcome',
    step: frAdminInviteWelcome,
  },
};

export const WelcomeWithError = {
  args: {
    form: { icon: true, message: 'Something went wrong', status: 'error', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
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

export const VerifyCode = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
    stage: 'AdminInviteVerifyCode',
    step: frAdminInviteVerifyCode,
  },
};

export const VerifyCodeError = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
    stage: 'AdminInviteVerifyCode',
    step: createJourneyStep(adminRegOtpErrorStep),
  },
};

export const VerifyCodeResend = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
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

export const VerifyCodeWithError = {
  args: {
    form: { icon: true, message: 'Something went wrong', status: 'error', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
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

export const PrivacyPolicy = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
    stage: 'AdminInvitePrivacyPolicy',
    step: frAdminInvitePrivacyPolicy,
  },
};

export const PrivacyPolicyReady = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
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

export const PrivacyPolicyWithError = {
  args: {
    form: { icon: true, message: 'Something went wrong', status: 'error', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
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

export const InvalidInvite = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
    stage: 'AdminInviteInvalid',
    step: frAdminInviteInvalid,
  },
};

// MFA enrollment

export const SetupPrompt = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
    stage: 'MfaSetupPrompt',
    step: frMfaSetupPrompt,
  },
};

export const SetupPromptInteraction = {
  args: { ...SetupPrompt.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Set up 2-step verification')).toBeTruthy();
    await expect(canvas.queryByRole('button', { name: 'Set up' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Skip for now' })).toBeInTheDocument();
  },
};

export const SetupPromptWithError = {
  args: {
    form: { icon: true, message: 'Something went wrong', status: 'error', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
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

export const DownloadApp = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
    stage: 'MfaDownloadApp',
    step: frMfaDownloadApp,
  },
};

export const DownloadAppInteraction = {
  args: { ...DownloadApp.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Set up the ForgeRock Authenticator')).toBeTruthy();
    await expect(canvas.queryByRole('button', { name: 'Next' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Download the app' })).toBeInTheDocument();
  },
};

export const DownloadAppWithError = {
  args: {
    form: { icon: true, message: 'Something went wrong', status: 'error', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
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

export const AppStoreLinks = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
    stage: 'MfaAppStoreLinks',
    step: frMfaAppStoreLinks,
  },
};

export const AppStoreLinksInteraction = {
  args: { ...AppStoreLinks.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('link', { name: 'Apple App Store' })).toBeInTheDocument();
    await expect(canvas.queryByRole('link', { name: 'Google Play Store' })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Continue' })).toBeInTheDocument();
  },
};

export const AppStoreLinksWithError = {
  args: {
    form: { icon: true, message: 'Something went wrong', status: 'error', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), stack: writable([]) },
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
