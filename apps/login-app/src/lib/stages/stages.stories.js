/**
 *
 * Copyright © 2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
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
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
    stage: 'AdminInviteWelcome',
    step: frAdminInviteWelcome,
  },
};

export const WelcomeWithError = {
  args: {
    form: { icon: true, message: 'Something went wrong', status: 'error', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
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
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
    stage: 'AdminInviteVerifyCode',
    step: frAdminInviteVerifyCode,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('button', { name: 'Next', exact: true });
    const digits = canvas.getAllByRole('textbox');
    await expect(digits).toHaveLength(6);
    await expect(next).not.toHaveAttribute('aria-disabled');
    await expect(next).not.toHaveAttribute('disabled');
    digits[5].focus();
    await userEvent.tab();
    await expect(next).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(digits[0]).toHaveFocus();
    await expect(digits[0]).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByText('Value is required', { exact: true })).toBeVisible();
    next.focus();
    await userEvent.keyboard(' ');
    await expect(digits[0]).toHaveFocus();
    await userEvent.click(next);
    await fireEvent.submit(canvasElement.querySelector('form'));
    await expect(args.form.submit).not.toHaveBeenCalled();
    for (const [index, input] of digits.entries()) {
      await userEvent.type(input, String(index + 1));
    }
    await waitFor(() => expect(next).not.toHaveAttribute('aria-disabled'));
    await expect(canvas.queryByText('Value is required', { exact: true })).toBe(null);
    next.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(args.form.submit).toHaveBeenCalledTimes(1));
    await expect(args.step.getCallbacksOfType('HiddenValueCallback')[0].getInputValue()).toBe(
      '123456',
    );
  },
};

export const VerifyCodeBusy = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: true, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
    stage: 'AdminInviteVerifyCode',
    step: createJourneyStep(adminRegOtpStep),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('button', { name: /Next$/ });
    const digits = canvas.getAllByRole('textbox');
    const originalAnswer = args.step.getCallbacksOfType('HiddenValueCallback')[0].getInputValue();
    for (const [index, input] of digits.entries()) {
      await userEvent.type(input, String(index + 1));
    }
    next.focus();
    await expect(next).toHaveFocus();
    await expect(next.querySelector('.tw_spinner')).toBeVisible();
    await expect(next).not.toHaveAttribute('aria-disabled');
    await expect(next).not.toHaveAttribute('disabled');
    await userEvent.keyboard('{Enter} ');
    await userEvent.click(next);
    await fireEvent.submit(canvasElement.querySelector('form'));
    await userEvent.click(canvas.getByRole('button', { name: /resend/i }));
    await expect(args.form.submit).not.toHaveBeenCalled();
    await expect(args.step.getCallbacksOfType('HiddenValueCallback')[0].getInputValue()).toBe(
      originalAnswer,
    );
  },
};

export const VerifyCodeError = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
    stage: 'AdminInviteVerifyCode',
    step: createJourneyStep(adminRegOtpErrorStep),
  },
};

export const VerifyCodeResend = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
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
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
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
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
    stage: 'AdminInvitePrivacyPolicy',
    step: frAdminInvitePrivacyPolicy,
  },
};

export const PrivacyPolicyReady = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
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
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
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
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
    stage: 'AdminInviteInvalid',
    step: frAdminInviteInvalid,
  },
};

// MFA enrollment

export const SetupPrompt = {
  args: {
    form: { icon: true, message: '', status: '', submit: fn() },
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
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
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
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
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
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
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
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
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
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
    journey: { loading: false, pop: fn(), push: fn(), restart: fn(), stack: writable([]) },
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
