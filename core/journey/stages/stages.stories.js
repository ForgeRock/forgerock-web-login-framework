/**
 *
 * Copyright © 2025-2026 Ping Identity Corporation. All right reserved.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 *
 **/

import { callbackType } from '@forgerock/journey-client';
import { expect, fn } from 'storybook/test';
import { fireEvent, userEvent, within } from 'storybook/test';
import { writable } from 'svelte/store';

import { createJourneyStep } from '$journey/_utilities/step.mock';
import {
  multipleProvidersLocalAuthFormStep,
  multipleProvidersLocalAuthNoFormStep,
  multipleProvidersNoLocalAuthStep,
  singleProviderLocalAuthFormStep,
  singleProviderLocalAuthNoFormStep,
} from '../callbacks/select-idp/select-idp.mock';
import { initialize } from '../config.store';
import { createPasskeyAutofillStep } from './mfa-stages.mock';
import Step from './stages.story.svelte';
import {
  confirmPasswordStep,
  deviceProfileAloneData,
  deviceProfileComposition,
  failureMessagesRenderingStep,
  loginStep,
  registrationStep,
  registrationStepWithTwoKBAs,
  successMessagesRenderingStep,
  usernameDisplay,
  usernamePasswordStep,
} from './step.mock';

const deviceProfileComposed = createJourneyStep(deviceProfileComposition);
const deviceProfileAlone = createJourneyStep(deviceProfileAloneData);
const frConfirmPassword = createJourneyStep(confirmPasswordStep);
const frRegistrationStep = createJourneyStep(registrationStep);
const frRegistrationStepWithTwoKBAs = createJourneyStep(registrationStepWithTwoKBAs);
const frLoginStep = createJourneyStep(loginStep);
const frUsernameDisplay = createJourneyStep(usernameDisplay);
const frUsernamePasswordStep = createJourneyStep(usernamePasswordStep);
const frPasskeyAutofillStep = createPasskeyAutofillStep();

const frSocialMultipleProvidersLocalAuthFormStep = createJourneyStep(
  multipleProvidersLocalAuthFormStep,
);
const frSocialMultipleProvidersLocalAuthNoFormStep = createJourneyStep(
  multipleProvidersLocalAuthNoFormStep,
);
const frSocialMultipleProvidersNoLocalAuthStep = createJourneyStep(
  multipleProvidersNoLocalAuthStep,
);
const frSocialSingleProviderLocalAuthFormStep = createJourneyStep(singleProviderLocalAuthFormStep);
const frSocialSingleProviderLocalAuthNoFormStep = createJourneyStep(
  singleProviderLocalAuthNoFormStep,
);
const frSuccessMessagesRendering = createJourneyStep(successMessagesRenderingStep);
const frFailureMessagesRendering = createJourneyStep(failureMessagesRenderingStep);

initialize();

export default {
  argTypes: {
    form: { control: false },
    journey: { control: false },
    stage: { control: false },
    labelType: { control: false },
    step: { control: false },
    submitForm: { control: false },
  },
  component: Step,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Journey/Step',
};

export const Generic = {
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
    stage: frLoginStep.getStage(),
    step: frLoginStep,
  },
};
export const Registration = {
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
    stage: frRegistrationStep.getStage(),
    step: frRegistrationStep,
  },
};
export const UsernameDisplay = {
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
      stack: writable([{ journey: 'Login' }]),
    },
    labelType: 'stacked',
    stage: frUsernameDisplay.getStage(),
    step: frUsernameDisplay,
  },
};
export const UsernamePassword = {
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
      stack: writable([{ journey: 'Login' }]),
    },
    labelType: 'stacked',
    stage: frUsernamePasswordStep.getStage(),
    step: frUsernamePasswordStep,
  },
};
export const UsernamePasswordPasskey = {
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
      stack: writable([{ tree: 'Login' }]),
    },
    labelType: 'stacked',
    stage: frPasskeyAutofillStep.getStage(),
    step: frPasskeyAutofillStep,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const usernameInput = canvas.getByRole('textbox', { name: /user\s*name/i });
    await expect(usernameInput).toHaveAttribute('autocomplete', 'username webauthn');
  },
};
export const DeviceProfilePageNode = {
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
      stack: writable([{ journey: 'Login' }]),
    },
    labelType: 'stacked',
    stage: deviceProfileComposed.getStage(),
    step: deviceProfileComposed,
  },
};
export const DeviceProfileAlone = {
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
      stack: writable([{ journey: 'Login' }]),
    },
    labelType: 'stacked',
    stage: deviceProfileAlone.getStage(),
    step: deviceProfileAlone,
  },
};
export const ConfirmPassword = {
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
    stage: frConfirmPassword.getStage(),
    step: frConfirmPassword,
  },
};

export const SocialMultipleProvidersLocalAuthForm = {
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
    stage: frSocialMultipleProvidersLocalAuthFormStep.getStage(),
    step: frSocialMultipleProvidersLocalAuthFormStep,
  },
};

export const SocialMultipleProvidersLocalAuthNoForm = {
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
    stage: frSocialMultipleProvidersLocalAuthNoFormStep.getStage(),
    step: frSocialMultipleProvidersLocalAuthNoFormStep,
  },
};

export const SocialMultipleProvidersNoLocalAuth = {
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
    stage: frSocialMultipleProvidersNoLocalAuthStep.getStage(),
    step: frSocialMultipleProvidersNoLocalAuthStep,
  },
};

export const SocialSingleProviderLocalAuthForm = {
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
    stage: frSocialSingleProviderLocalAuthFormStep.getStage(),
    step: frSocialSingleProviderLocalAuthFormStep,
  },
};

export const SocialSingleProviderLocalAuthNoForm = {
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
    stage: frSocialSingleProviderLocalAuthNoFormStep.getStage(),
    step: frSocialSingleProviderLocalAuthNoFormStep,
  },
};

export const TwoKBAQuestionSets = {
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
    stage: frRegistrationStepWithTwoKBAs.getStage(),
    step: frRegistrationStepWithTwoKBAs,
  },
};

export const SuccessMessagesRenderingStep = {
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
    stage: '',
    step: frSuccessMessagesRendering,
  },
};

export const FailureMessagesRenderingStep = {
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
    stage: '',
    step: frFailureMessagesRendering,
  },
};

export const ConfirmPasswordInteraction = {
  args: {
    ...ConfirmPassword.argTypes,
    ...ConfirmPassword.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();

    const nameCb = frConfirmPassword.getCallbacksOfType(
      callbackType.ValidatedCreateUsernameCallback,
    )[0];
    const passwordCb = frConfirmPassword.getCallbacksOfType(
      callbackType.ValidatedCreatePasswordCallback,
    )[0];

    const username = canvas.getByLabelText('Username');
    const password1 = canvas.getByLabelText('Password');
    const password2 = canvas.getByLabelText('Confirm password');

    await userEvent.type(username, 'username01');
    await userEvent.type(password1, 'Password123');
    await userEvent.type(password2, 'PasswordABC');

    await password2.blur();

    const submitBtn = canvas.getByRole('button', { name: 'Next' });
    await fireEvent.click(submitBtn);

    // Expecting the form NOT to be submitted due to mismatched passwords
    await expect(ConfirmPassword.args.form.submit).not.toHaveBeenCalled();
    await expect(password2.getAttribute('aria-invalid')).toBe('true');
    const errorMessage1 = canvas.getByText('Passwords do not match');
    await expect(errorMessage1).toBeVisible();

    await userEvent.clear(password2);
    await userEvent.type(password2, 'Password123');
    await password2.blur();

    await fireEvent.click(submitBtn);
    await expect(ConfirmPassword.args.form.submit).toHaveBeenCalled();

    await expect(password2.getAttribute('aria-invalid')).toBe('false');
    const errorMessage2 = canvas.queryByText('Passwords do not match');
    await expect(errorMessage2).toBe(null);

    await expect(nameCb.getInputValue()).toBe('username01');
    await expect(passwordCb.getInputValue()).toBe('Password123');
  },
};

export const LoginInteraction = {
  args: {
    ...UsernamePassword.argTypes,
    ...UsernamePassword.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();

    const nameCb = frUsernamePasswordStep.getCallbacksOfType(callbackType.NameCallback)[0];
    const passwordCb = frUsernamePasswordStep.getCallbacksOfType(callbackType.PasswordCallback)[0];

    const username = canvas.getByLabelText('Username');
    const password = canvas.getByLabelText('Password');
    await expect(username).toHaveFocus();
    await userEvent.type(username, 'username01');
    await expect(canvas.getByLabelText('Username').value).toEqual('username01');

    await userEvent.tab();

    await expect(password).toHaveFocus();
    await userEvent.type(password, 'Password123');

    await expect(canvas.getByLabelText('Password').value).toEqual('Password123');

    await userEvent.tab();
    await userEvent.tab();
    const signin = canvas.getByRole('button', { name: 'Sign in' });
    await expect(signin).toHaveFocus();
    await fireEvent.click(signin);

    await expect(UsernamePassword.args.form.submit).toHaveBeenCalled();

    await expect(nameCb.getInputValue()).toBe('username01');
    await expect(passwordCb.getInputValue()).toBe('Password123');
  },
};

export const RegistrationInteraction = {
  args: {
    ...Registration.argTypes,
    ...Registration.args,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.tab();

    const username = canvas.getByLabelText('Username');
    const password = canvas.getByLabelText('Password');
    const firstName = canvas.getByLabelText('First name');
    const lastName = canvas.getByLabelText('Last name');
    const email = canvas.getByLabelText('Email address');
    const specialOffers = canvas.getByRole('checkbox', { name: /special/ });
    const securityQuestion = canvas.getByLabelText('Select a security question');
    const securityAnswer = canvas.getByLabelText('Security answer');
    const tocLink = canvas.getByRole('link', { name: 'View full Terms & Conditions' });
    const toc = canvas.getByRole('checkbox', { name: 'Please accept our Terms & Conditions' });

    const usernameCb = frRegistrationStep.getCallbacksOfType(
      callbackType.ValidatedCreateUsernameCallback,
    )[0];
    const passwordCb = frRegistrationStep.getCallbacksOfType(
      callbackType.ValidatedCreatePasswordCallback,
    )[0];
    const firstNameCb = frRegistrationStep.getCallbacksOfType(
      callbackType.StringAttributeInputCallback,
    )[0];
    const lastNameCb = frRegistrationStep.getCallbacksOfType(
      callbackType.StringAttributeInputCallback,
    )[1];
    const emailCb = frRegistrationStep.getCallbacksOfType(
      callbackType.StringAttributeInputCallback,
    )[2];
    const specialOffersCb = frRegistrationStep.getCallbacksOfType(
      callbackType.BooleanAttributeInputCallback,
    )[0];
    const securityQuestions = frRegistrationStep.getCallbacksOfType(
      callbackType.KbaCreateCallback,
    )[0];
    const tocCb = frRegistrationStep.getCallbacksOfType(callbackType.TermsAndConditionsCallback)[0];

    await expect(username).toHaveFocus();
    await userEvent.type(username, 'user');

    await userEvent.tab();
    await expect(firstName).toHaveFocus();
    await userEvent.type(firstName, 'my-name');

    await userEvent.tab();
    await expect(lastName).toHaveFocus();
    await userEvent.type(lastName, 'last-name');

    await userEvent.tab();
    await expect(email).toHaveFocus();
    await userEvent.type(email, 'myemail@email.com');

    await userEvent.tab();

    await expect(specialOffers).toHaveFocus();
    await userEvent.click(specialOffers);
    await userEvent.tab();

    await userEvent.type(password, 'password');
    await expect(password).toHaveFocus();
    await userEvent.tab();
    await userEvent.tab();

    await expect(securityQuestion).toHaveFocus();
    await userEvent.selectOptions(securityQuestion, '0');
    await userEvent.tab();

    await expect(securityAnswer).toHaveFocus();
    await userEvent.type(securityAnswer, 'blue');
    await userEvent.tab();

    await expect(tocLink).toHaveFocus();
    await userEvent.tab();

    await expect(toc).toHaveFocus();
    await userEvent.click(toc);
    await userEvent.tab();

    const submit = canvas.getByRole('button', { name: 'Register' });
    await userEvent.click(submit);
    await expect(Registration.args.form.submit).toHaveBeenCalled();

    await expect(usernameCb.getInputValue()).toBe('user');
    await expect(passwordCb.getInputValue()).toBe('password');
    await expect(firstNameCb.getInputValue()).toBe('my-name');
    await expect(lastNameCb.getInputValue()).toBe('last-name');
    await expect(emailCb.getInputValue()).toBe('myemail@email.com');
    await expect(specialOffersCb.getInputValue()).toBe(true);
    await expect(securityQuestions.payload.input[0].value).toBe('0');
    await expect(securityQuestions.payload.input[1].value).toBe('blue');
    await expect(tocCb.getInputValue()).toBe(true);
  },
};
