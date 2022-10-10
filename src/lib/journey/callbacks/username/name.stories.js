import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { userEvent, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

import response from './name.mock';
import Input from './name.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
  },
  component: Input,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/Name',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.NameCallback),
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
  const cb = step.getCallbackOfType(CallbackType.NameCallback)
  const element = canvas.getByRole('textbox');
  await userEvent.type(element, 'input here')
  await userEvent.tab();
  expect(cb.getInputValue()).toBe('input here')

};

