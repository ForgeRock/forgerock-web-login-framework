import { userEvent, within } from '@storybook/testing-library';
import { FRStep, CallbackType } from '@forgerock/javascript-sdk';

import response from './text-output.mock';
import TextOutput from './text-output.story.svelte';
import { expect } from '@storybook/jest';

const step = new FRStep(response);

export default {
  argTypes: {
    callback: { control: false },
    inputName: { control: false },
  },
  component: TextOutput,
  parameters: {
    layout: 'fullscreen',
  },
  title: 'Callbacks/TextOutput',
};

export const Base = {
  args: {
    callback: step.getCallbackOfType(CallbackType.TextOutputCallback),
    choice: step.getCallbackOfType(CallbackType.ConfirmationCallback),
  },

};

const Template = (args) => ({
  Component: TextOutput,
  props: args
});

export const Interaction = Template.bind({});

Interaction.args = Base.args;
Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await new Promise((resolve) => setTimeout(resolve, 100));
  const question = canvas.getByText("Had coffee?")
  await userEvent.tab();

  const yes = canvas.getByText('Yes');

  await userEvent.tab();

  await userEvent.click(yes);

  const no = canvas.getByText('No');

  await userEvent.click(no);

  await userEvent.tab();

  await expect(no).toBeVisible();
  await expect(yes).toBeVisible();
  await expect(question).toBeVisible();
};
