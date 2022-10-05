import { FRStep, CallbackType } from '@forgerock/javascript-sdk';
import { expect } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';

import response from './confirmation.mock';
import Confirmation from './confirmation.story.svelte';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
    inputName: { control: false },
  },
  component: Confirmation,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/Confirmation',
};

export const Base = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ConfirmationCallback)[0],
  },
};

export const SingleOption = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.ConfirmationCallback)[1],
  },
};

const Template = (args) => ({
  Component: Confirmation,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = { ...Base.args };

Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const cb = step.getCallbacksOfType(CallbackType.ConfirmationCallback)[0];
  const select = canvas.getByLabelText('Please Confirm');

  await userEvent.selectOptions(select, '0');
  await expect(cb.getInputValue()).toBe(0);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await userEvent.selectOptions(select, '1');
  await expect(cb.getInputValue()).toBe(1);
};
