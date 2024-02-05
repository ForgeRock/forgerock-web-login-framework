import { FRStep } from '@forgerock/javascript-sdk';
import { expect, jest } from '@storybook/jest';
import { fireEvent, waitFor, within } from '@storybook/testing-library';
import { writable } from 'svelte/store';

import { initialize } from '../config.store';
import Step from './stages.story.svelte';
import {
  mfaRegistrationOptionsStep,
  oneTimePasswordStep,
  oathRegistrationStep,
  oathRegistrationErrorStep,
  pushRegistrationStep,
  recoveryCodes,
  recoveryCodesWithName,
  emailSuspendStep,
  webAuthnAuthenticationStep,
  webAuthnRegistrationStep,
} from './mfa-stages.mock.ts';
import { userEvent } from '@storybook/testing-library';

const frOneTimePassword = new FRStep(oneTimePasswordStep);
const frMfaRegistrationOptions = new FRStep(mfaRegistrationOptionsStep);
const frOathRegistration = new FRStep(oathRegistrationStep);
const frOathRegistrationError = new FRStep(oathRegistrationErrorStep);
const frPushRegistration = new FRStep(pushRegistrationStep);
const frRecoveryCodes = new FRStep(recoveryCodes);
const frRecoveryCodesWithName = new FRStep(recoveryCodesWithName);
const frSuspendEmail = new FRStep(emailSuspendStep);
const frWebAuthnAuthenticationStep = new FRStep(webAuthnAuthenticationStep);
const frWebAuthnRegistrationStep = new FRStep(webAuthnRegistrationStep);

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
  title: 'Journey/MFA Stages',
};

/**
 * Static Stories
 */
export const MfaRegistrationOptions = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: jest.fn(),
    },
    journey: {
      loading: false,
      pop: jest.fn(),
      push: jest.fn(),
      stack: writable([]),
    },
    stage: frMfaRegistrationOptions.getStage(),
    step: frMfaRegistrationOptions,
  },
};
export const OneTimePassword = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: jest.fn(),
    },
    journey: {
      loading: false,
      pop: jest.fn(),
      push: jest.fn(),
      stack: writable([]),
    },
    stage: frOneTimePassword.getStage(),
    step: frOneTimePassword,
  },
};
export const OathRegistration = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: jest.fn(),
    },
    journey: {
      loading: false,
      pop: jest.fn(),
      push: jest.fn(),
      stack: writable([]),
    },
    stage: frOathRegistration.getStage(),
    step: frOathRegistration,
  },
};
export const OathRegistrationError = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: jest.fn(),
    },
    journey: {
      loading: false,
      pop: jest.fn(),
      push: jest.fn(),
      stack: writable([]),
    },
    stage: frOathRegistrationError.getStage(),
    step: frOathRegistrationError,
  },
};
export const PushRegistration = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: jest.fn(),
    },
    journey: {
      loading: false,
      pop: jest.fn(),
      push: jest.fn(),
      stack: writable([]),
    },
    stage: frPushRegistration.getStage(),
    step: frPushRegistration,
  },
};

export const RecoveryCodes = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: jest.fn(),
    },
    journey: {
      loading: false,
      pop: jest.fn(),
      push: jest.fn(),
      stack: writable([]),
    },
    stage: 'RecoveryCodes',
    step: frRecoveryCodes,
  },
};

export const RecoveryCodesWithName = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: jest.fn(),
    },
    journey: {
      loading: false,
      pop: jest.fn(),
      push: jest.fn(),
      stack: writable([]),
    },
    stage: 'RecoveryCodes',
    step: frRecoveryCodesWithName,
  },
};

export const SuspendEmail = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: jest.fn(),
    },
    journey: {
      loading: false,
      pop: jest.fn(),
      push: jest.fn(),
      stack: writable([]),
    },
    stage: 'EmailSuspend',
    step: frSuspendEmail,
  },
};

export const WebAuthnAuthentication = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: jest.fn(),
    },
    journey: {
      loading: false,
      pop: jest.fn(),
      push: jest.fn(),
      stack: writable([]),
    },
    stage: 'WebAuthn',
    step: frWebAuthnAuthenticationStep,
  },
};

export const WebAuthnRegistration = {
  args: {
    form: {
      icon: true,
      message: '',
      status: '',
      submit: jest.fn(),
    },
    journey: {
      loading: false,
      pop: jest.fn(),
      push: jest.fn(),
      stack: writable([]),
    },
    stage: 'WebAuthn',
    step: frWebAuthnRegistrationStep,
  },
};

/**
 * Interaction Tests
 */
const Template = (args) => ({
  Component: Step,
  props: args,
});

export const OathRegistrationInteraction = Template.bind({});

OathRegistrationInteraction.args = {
  ...OathRegistration.argTypes,
  ...OathRegistration.args,
};

OathRegistrationInteraction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const detailsEl = canvas.queryByText('Not working or need an alternative method?');
  await expect(detailsEl).toBeInTheDocument();
  const linkEl = canvas.queryByRole('link', 'On mobile? Open link in Authenticator.');
  expect(linkEl).not.toBeVisible();

  const qrCode = canvas.queryByTestId('qr-code-canvas');
  await waitFor(async () => {
    await expect(qrCode.getAttribute('width')).toBe('400');
  });

  await fireEvent.click(detailsEl);
  await expect(linkEl).toBeVisible();

  const inputEl = canvas.queryByLabelText('URL:');
  await expect(inputEl).toBeVisible();
  await waitFor(async () => {
    await expect(inputEl).toHaveValue(
      'otpauth://totp/ForgeRock:jlowery?secret=QITSTC234FRIU8DD987DW3VPICFY======&issuer=ForgeRock&period=30&digits=6&b=032b75',
    );
  });

  const copyButton = canvas.queryByRole('button', { name: 'Copy URL' });
  await expect(copyButton).toBeInTheDocument();

  const nextBtn = canvas.queryByRole('button', { name: 'Next' });
  await expect(nextBtn).toBeInTheDocument();
};

export const OathRegistrationErrorInteraction = Template.bind({});

OathRegistrationErrorInteraction.args = {
  ...OathRegistrationError.argTypes,
  ...OathRegistrationError.args,
};

OathRegistrationErrorInteraction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const detailsEl = canvas.queryByText('Not working or need an alternative method?');
  await expect(detailsEl).toBeInTheDocument();
  const linkEl = canvas.queryByRole('link', 'On mobile? Open link in Authenticator.');
  expect(linkEl).not.toBeVisible();

  await waitFor(async () => {
    const alertEl = canvas.queryByRole('alert');
    await expect(alertEl).toHaveFocus();
    await expect(alertEl.innerText).toBe(
      'QR Code failed to render. Please notify your support administrator. You are welcome to use the alternative methods below.',
    );
  });

  const qrCode = canvas.queryByTestId('qr-code-canvas');
  await waitFor(() => {
    expect(qrCode.getAttribute('width')).not.toBe('400');
  });

  await fireEvent.click(detailsEl);
  await expect(linkEl).toBeVisible();

  const inputEl = canvas.queryByLabelText('URL:');
  await expect(inputEl).toBeVisible();
  await waitFor(async () => {
    await expect(inputEl).toHaveValue(
      'pushauth://push/forgerock:Justin%20Lowery?l=YW1sYmNvb2wMQ&issuer=Rm9yZ2VSb2Nr&m=REGISTER:53b85112-8ba9-4b7e-9107-ecbca2d65f7b1695151603616&s=FoxEr5uAzrys1yBmuygPbxrVjysElmzsmqifi6eO_AI&c=XXD-MxsK2sRGa7sUw7kinSKoUDf_eNYMZUV2f0z5kjgw&rD-MxsK2sRGa7sUw7kinSKoUDf_eNYMZUV2f0z5kjgw&r=aHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW0vanNvbi9hbHBoYS9wdXNoL3Nucy9tZXNzYWdlP19hY3Rpb249cmwVnaXN0aHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW0vanNvbi9hbHBoYS9wdXNoL3Nucy9tZXNzYWdlP19hY3Rpb249cmwVnaXN0ZXIaHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW0vanNvbi9hbHBoYS9wdXNoL3Nucy9tZXNzYWdlP19hY3Rpb249cmwVnaXN0ZXIaHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW0vanNvbi9hbHBoYS9wdXNoL3Nucy9tZXNzYWdlP19hY3Rpb249cmwVnaXN0ZXIaHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW0vanNvbi9hbHBoYS9wdXNoL3Nucy9tZXNzYWdlP19hY3Rpb249cmwVnaXN0ZXIZXI&a=aHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW019hY3Rpb249YXV0aGVudGljYXRl&b=032b75',
    );
  });

  const copyButton = canvas.queryByRole('button', { name: 'Copy URL' });
  await expect(copyButton).toBeInTheDocument();

  const nextBtn = canvas.queryByRole('button', { name: 'Next' });
  await expect(nextBtn).toBeInTheDocument();
};

export const PushRegistrationInteraction = Template.bind({});

PushRegistrationInteraction.args = {
  ...PushRegistration.argTypes,
  ...PushRegistration.args,
};

PushRegistrationInteraction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const detailsEl = canvas.queryByText('Not working or need an alternative method?');
  await expect(detailsEl).toBeInTheDocument();
  const linkEl = canvas.queryByRole('link', 'On mobile? Open link in Authenticator.');
  expect(linkEl).not.toBeVisible();

  const qrCode = canvas.queryByTestId('qr-code-canvas');
  await waitFor(async () => {
    await expect(qrCode.getAttribute('width')).toBe('400');
  });

  const waitingMsg = canvas.queryByText('Waiting for response...');
  await expect(waitingMsg).toBeInTheDocument();

  await fireEvent.click(detailsEl);
  await expect(linkEl).toBeVisible();

  const inputEl = canvas.queryByLabelText('URL:');
  await expect(inputEl).toBeVisible();
  await waitFor(async () => {
    await expect(inputEl).toHaveValue(
      'pushauth://push/forgerock:Justin%20Lowery?l=YW1sYmNvb2wMQ&issuer=Rm9yZ2VSb2Nr&m=REGISTER:53b85112-8ba9-4b7e-9107-ecbca2d65f7b1695151603616&s=FoxEr5uAzrys1yBmuygPbxrVjysElmzsmqifi6eO_AI&c=XD-MxsK2sRGa7sUw7kinSKoUDf_eNYMZUV2f0z5kjgw&r=aHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW0vanNvbi9hbHBoYS9wdXNoL3Nucy9tZXNzYWdlP19hY3Rpb249cmVnaXN0ZXI&a=aHR0cHM6Ly9vcGVuYW0tZm9yZ2Vycm9jay1zZGtzLmZvcmdlYmxvY2tzLmNvbTo0NDMvYW019hY3Rpb249YXV0aGVudGljYXRl&b=032b75',
    );
  });

  const copyButton = canvas.queryByRole('button', { name: 'Copy URL' });
  await expect(copyButton).toBeInTheDocument();

  const nextBtn = canvas.queryByRole('button', { name: 'Next' });
  expect(nextBtn).not.toBeInTheDocument();
};
export const OneTimePasswordInteraction = Template.bind({});

OneTimePasswordInteraction.args = {
  ...OneTimePassword.argTypes,
  ...OneTimePassword.args,
};

OneTimePasswordInteraction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.queryByRole('button', { name: 'Submit' })).toBeInTheDocument();
  expect(canvas.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
};

export const RecoveryCodesInteraction = Template.bind({});

RecoveryCodesInteraction.args = {
  ...RecoveryCodes.argTypes,
  ...RecoveryCodes.args,
};

RecoveryCodesInteraction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText('Your new device or MFA is enabled')).toBeTruthy();
  await expect(canvas.getByText(`Don't get locked out of your account!`)).toBeTruthy();
  await expect(canvas.getByText('CyFrHnLq2x')).toBeTruthy();
};

export const RecoveryCodesWithNameInteraction = Template.bind({});

RecoveryCodesWithNameInteraction.args = {
  ...RecoveryCodesWithName.argTypes,
  ...RecoveryCodesWithName.args,
};

RecoveryCodesWithNameInteraction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  console.log(canvasElement);
  await expect(canvas.getByText('Your new device or MFA is enabled')).toBeTruthy();
  await expect(canvas.getByText(`Don't get locked out of your account!`)).toBeTruthy();
  await expect(canvas.getByText('CyFrHnLq2x')).toBeTruthy();
  await expect(
    canvas.getByText(
      /Use one of these codes to authenticate if you lose your device, which has been named:/,
    ),
  ).toBeTruthy();
};

export const WebAuthnAuthenticationInteraction = Template.bind({});

WebAuthnAuthenticationInteraction.args = {
  ...WebAuthnAuthentication.argTypes,
  ...WebAuthnAuthentication.args,
};

WebAuthnAuthenticationInteraction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText('Verify your identity')).toBeTruthy();
  await expect(canvas.getByText('Use your device for identity verification.')).toBeTruthy();
};

export const WebAuthnRegistrationInteraction = Template.bind({});

WebAuthnRegistrationInteraction.args = {
  ...WebAuthnRegistration.argTypes,
  ...WebAuthnRegistration.args,
};

WebAuthnRegistrationInteraction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText('Name your device')).toBeTruthy();
  const textbox = canvas.getByRole('textbox');
  await userEvent.type(textbox, 'My Yubikey');
  await expect(textbox).toHaveValue('My Yubikey');
  await userEvent.click(canvas.getByRole('button', { name: 'Next' }));

  await expect(canvas.getByText('Register My Yubikey')).toBeTruthy();
  await expect(canvas.getByText('Choose your device for identity verification.')).toBeTruthy();
};
