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
  expect(passwordField.value).toBe('');
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
