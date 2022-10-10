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
  const cb = step.getCallbacksOfType(CallbackType.ValidatedCreatePasswordCallback)[0]
  await userEvent.tab();
  const input = canvas.getByLabelText('Password');
  expect(input).toHaveFocus();
  await userEvent.type(input, 'myPassword')
  const button = canvas.getByRole('button');

  await userEvent.click(button)
  const text = canvas.getByLabelText('Password');

  expect(text.type).not.toEqual('password')
  expect(text.type).toEqual('text')
  expect(cb.payload.input[0].value).toBe('myPassword');
};

