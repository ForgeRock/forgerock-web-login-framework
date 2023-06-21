import { FRStep, CallbackType, WebAuthnStepType } from '@forgerock/javascript-sdk';
import { expect } from '@storybook/jest';
import { within } from '@storybook/testing-library';

import response from './text-output.mock';
import TextOutput from './text-output.story.svelte';

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
    callback: step.getCallbacksOfType(CallbackType.TextOutputCallback)[0],
  },
};

export const WithHTML = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.TextOutputCallback)[1],
  },
};

export const WithScript = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.TextOutputCallback)[2],
  },
};

export const Suspended = {
  args: {
    callback: step.getCallbacksOfType(CallbackType.SuspendedTextOutputCallback)[0],
  },
};

const Template = (args) => ({
  Component: TextOutput,
  props: args,
});

export const Interaction = Template.bind({});

Interaction.args = { ...WithHTML.args };

Interaction.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  // This essentially just tests whether the HTML renders the link as a valid element
  await expect(canvas.getByText('privacy policy')).toBeTruthy();
};
