import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { expect } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';

import response from './validated-create-password.mock';
import Input from './validated-create-password.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/ValidatedCreatePassword',
};

export const Base = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ValidatedCreatePasswordCallback)[0],
  },
};

export const ConfirmPassword = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ValidatedCreatePasswordCallback)[0],
    callbackMetadata: {
      platform: { id: 'db09cd18-65a7-424a-9c9e-84c528c3e560', confirmPassword: true },
    },
  },
};

export const Policies = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ValidatedCreatePasswordCallback)[1],
  },
};

export const PolicyErrors = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ValidatedCreatePasswordCallback)[2],
  },
};

const Template = (args) => ({
  Component: Input,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = { ...Base.args };

Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const cb = step.getCallbacksOfType(CallbackType.ValidatedCreatePasswordCallback)[0];
  await userEvent.tab();

  const input = canvas.getByLabelText('Password');

  expect(input).toHaveFocus();

  await userEvent.clear(input);
  await userEvent.type(input, 'myPassword');
  const button = canvas.getByRole('button');

  await userEvent.click(button);
  const text = canvas.getByLabelText('Password');

  expect(text.type).not.toEqual('password');
  expect(text.type).toEqual('text');
  expect(cb.payload.input[0].value).toBe('myPassword');
};

export const ConfirmInteraction = Template.bind({});

ConfirmInteraction.args = { ...ConfirmPassword.args };

ConfirmInteraction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  const password1 = canvas.getByLabelText('Password');
  await userEvent.clear(password1);
  await userEvent.type(password1, 'myPassword');

  const password2 = canvas.getByLabelText('Confirm password');
  await userEvent.clear(password2);
  await userEvent.type(password2, 'wrongPassword');

  await password2.blur();
  await expect(password2.getAttribute('aria-invalid')).toBe('true');
  const errorMessage1 = canvas.getByText('Passwords do not match');
  await expect(errorMessage1).toBeVisible();

  await userEvent.clear(password2);
  await userEvent.type(password2, 'myPassword');
  await password2.blur();

  await expect(password2.getAttribute('aria-invalid')).toBe('false');
  const errorMessage2 = canvas.queryByText('Passwords do not match');
  await expect(errorMessage2).toBe(null);
};
