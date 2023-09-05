import { expect } from '@storybook/jest';
import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { within } from '@storybook/testing-library';

import response from './boolean.mock';
import Checkbox from './boolean.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Checkbox,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/BooleanAttributeInput',
};

export const Base = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.BooleanAttributeInputCallback)[0],
  },
};

export const Error = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.BooleanAttributeInputCallback)[1],
  },
};
const Template = (args) => ({
  Component: Checkbox,
  props: args,
});
export const Interaction = Template.bind({});

Interaction.args = {
  ...Base.args,
};

Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const check = canvas.getByRole('checkbox');

  const cb = step.getCallbacksOfType(CallbackType.BooleanAttributeInputCallback)[0];

  expect(check).not.toBeChecked();
  check.click();
  expect(check).toBeChecked();
  expect(cb.getInputValue()).toBe(true);
};
