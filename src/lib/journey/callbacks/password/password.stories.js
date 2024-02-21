import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { expect } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';

import response from './password.mock';
import Input from './password.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/Password',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.PasswordCallback),
    style: {
      showPassword: 'button',
    },
  },
};

export const PasswordWithCheckbox = {
  args: {
    callback: step.getCallbackOfType(CallbackType.PasswordCallback),
    style: {
      showPassword: 'checkbox',
    },
  },
};

export const PasswordWithNone = {
  args: {
    callback: step.getCallbackOfType(CallbackType.PasswordCallback),
    style: {
      showPassword: 'none',
    },
  },
};

const Template = (args) => {
  return {
    Component: Input,
    props: args,
  };
};
export const Interaction = Template.bind({});

Interaction.args = { ...Base.args };

Interaction.play = async ({ canvasElement }) => {
  const cb = step.getCallbackOfType(CallbackType.PasswordCallback);
  const canvas = within(canvasElement);
  const passwordField = canvas.getByLabelText('Password');
  await userEvent.tab();
  expect(passwordField).toHaveFocus();

  await userEvent.keyboard('password');
  expect(passwordField.value).toBe('password');
  await userEvent.tab();
  const eye = canvas.getByRole('button');
  expect(eye).toHaveFocus();
  await userEvent.click(eye);
  expect(cb.getInputValue()).toBe('password');
};

export const InteractionWithCheckbox = Template.bind({});

InteractionWithCheckbox.args = { ...PasswordWithCheckbox.args };

InteractionWithCheckbox.play = async ({ canvasElement }) => {
  const cb = step.getCallbackOfType(CallbackType.PasswordCallback);
  const canvas = within(canvasElement);
  const passwordField = canvas.getByLabelText('Password');
  await userEvent.tab();
  expect(passwordField).toHaveFocus();

  await userEvent.keyboard('password1');
  await userEvent.tab();
  const checkbox = canvas.getByRole('checkbox');
  expect(checkbox).toHaveFocus();
  await userEvent.click(checkbox);
  expect(cb.getInputValue()).toBe('password1');
};

export const InteractionWithNone = Template.bind({});

InteractionWithNone.args = { ...PasswordWithNone.args };

InteractionWithNone.play = async ({ canvasElement }) => {
  const cb = step.getCallbackOfType(CallbackType.PasswordCallback);
  const canvas = within(canvasElement);
  const passwordField = canvas.getByLabelText('Password');
  await userEvent.tab();
  expect(passwordField).toHaveFocus();

  await userEvent.keyboard('password2');
  await userEvent.tab();
  expect(cb.getInputValue()).toBe('password2');
};
