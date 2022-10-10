import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { within, userEvent } from '@storybook/testing-library';
import { jest, expect } from '@storybook/jest';

import response from './string-attribute-input.mock';
import Input from './string-attribute-input.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/StringAttributeInput',
};

export const Base = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.StringAttributeInputCallback)[0],
  },
};

export const Email = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.StringAttributeInputCallback)[1],
  },
};

export const Error = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.StringAttributeInputCallback)[2],
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
  const cb = step.getCallbacksOfType(CallbackType.StringAttributeInputCallback)[0]
  const input = canvas.getByLabelText('First Name');

  await userEvent.tab()
  expect(input).toHaveFocus();

  await userEvent.type(input, 'username')
  await userEvent.tab()

  expect(cb.getInputValue()).toBe('username');
};
